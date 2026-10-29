// Memento's retrieval and context-assembly pipeline, re-implemented for the browser so
// every stage can be traced. The rules mirror the library:
//   visibility  ownership → access grant → visibility tier
//   scope       cumulative: AGENT ⊂ TEAM ⊂ CROSS_TEAM ⊂ ORGANIZATION ⊂ ALL_VISIBLE
//   modality    one hyphenated/underscored/ALL-CAPS word or a quoted phrase → keyword;
//               3+ words (with embeddings) → hybrid; otherwise keyword
//   keyword     share of query tokens present in the memory's indexed text
//   hybrid      reciprocal rank fusion of keyword and vector lists
//   assembly    retrieve → merge & dedup → tiered budget (greedy per tier) →
//               trust-aware positioning → optional truncation
// The vector search uses a toy embedding (synonym-expanded bag of words); the library
// plugs in OpenAI or sentence-transformers here.

import { AGENTS, MEMORIES, type Memory, type Visibility } from '../data/memories'

export type Scope = 'AGENT' | 'TEAM' | 'CROSS_TEAM' | 'ORGANIZATION' | 'ALL_VISIBLE'
export const SCOPES: Scope[] = ['AGENT', 'TEAM', 'CROSS_TEAM', 'ORGANIZATION', 'ALL_VISIBLE']
export type Modality = 'auto' | 'keyword' | 'vector' | 'hybrid'
export type Tier = 'self' | 'team' | 'cross_team' | 'org'
export const TIERS: Tier[] = ['self', 'team', 'cross_team', 'org']

export const TIER_INFO: Record<Tier, { label: string; color: string }> = {
  self: { label: 'Self', color: '#ff5577' },
  team: { label: 'Team', color: '#56B4E9' },
  cross_team: { label: 'Cross-team', color: '#E69F00' },
  org: { label: 'Org', color: '#CC79A7' },
}

export interface TierShares {
  self: number
  team: number
  cross_team: number
  org: number
  reserve: number
}

export const SHARE_PRESETS: { id: string; label: string; shares: TierShares | null }[] = [
  { id: 'single', label: 'Single-agent (no tiers)', shares: null },
  { id: 'team', label: 'Team default 60/30/–/–/10', shares: { self: 0.6, team: 0.3, cross_team: 0, org: 0, reserve: 0.1 } },
  { id: 'federated', label: 'Federated 40/25/15/15/5', shares: { self: 0.4, team: 0.25, cross_team: 0.15, org: 0.15, reserve: 0.05 } },
]

// ------------------------------------------------------------------ memory text

export function indexFields(m: Memory): [string, string][] {
  if (m.type === 'episodic') return [['summary', m.summary ?? ''], ['details', m.details ?? '']]
  if (m.type === 'semantic') return [['subject', m.subject ?? ''], ['predicate', m.predicate ?? ''], ['object', m.object ?? '']]
  return [['instruction', m.instruction ?? '']]
}

export function indexText(m: Memory) {
  return indexFields(m).map(([, v]) => v).join(' ')
}

/** TokenCountStrategy: whitespace-separated words. */
export function cost(m: Memory) {
  return indexText(m).split(/\s+/).filter(Boolean).length
}

export function title(m: Memory) {
  if (m.type === 'episodic') return m.summary!
  if (m.type === 'semantic') return `${m.subject} ${m.predicate?.replace(/_/g, ' ')} ${m.object}`
  return m.instruction!
}

// ------------------------------------------------------------------ visibility & scope

export function viewer(agentId: string) {
  return AGENTS.find((a) => a.id === agentId)!
}

const VIS_ORDER: Visibility[] = ['PRIVATE', 'TEAM', 'CROSS_TEAM', 'ORGANIZATION', 'PUBLIC']

/** Returns null when visible, otherwise why not. First match wins, as in the library. */
export function hiddenReason(m: Memory, agentId: string): string | null {
  const v = viewer(agentId)
  if (m.agent_id === agentId) return null
  if (m.access_grants?.some((g) => (g.kind === 'agent' && g.id === agentId) || (g.kind === 'team' && g.id === v.team_id))) return null
  switch (m.visibility) {
    case 'PRIVATE':
      return `PRIVATE to ${m.agent_id}`
    case 'TEAM':
      return m.team_id === v.team_id ? null : `TEAM-visible to ${m.team_id} only`
    case 'CROSS_TEAM':
    case 'ORGANIZATION':
      return m.org_id === 'acme' ? null : 'Different organization'
    case 'PUBLIC':
      return null
  }
}

/** Which scope level first includes this memory for the viewer. */
export function relation(m: Memory, agentId: string): Scope {
  const v = viewer(agentId)
  if (m.agent_id === agentId) return 'AGENT'
  if (m.team_id === v.team_id) return 'TEAM'
  if (m.visibility === 'CROSS_TEAM') return 'CROSS_TEAM'
  return 'ORGANIZATION'
}

export function inScope(m: Memory, agentId: string, scope: Scope) {
  return !hiddenReason(m, agentId) && SCOPES.indexOf(relation(m, agentId)) <= SCOPES.indexOf(scope)
}

/** TieredBudgetAllocator's tier rule. */
export function tierOf(m: Memory, agentId: string): Tier {
  const v = viewer(agentId)
  if (m.agent_id === agentId) return 'self'
  if (m.team_id === v.team_id) return 'team'
  if (m.consolidation_level === 'ORGANIZATION') return 'org'
  return 'cross_team'
}

export function visRank(v: Visibility) {
  return VIS_ORDER.indexOf(v)
}

// ------------------------------------------------------------------ search

export function classify(text: string): { modality: Exclude<Modality, 'auto'>; reason: string } {
  const stripped = text.trim().replace(/^["']|["']$/g, '')
  const words = stripped.split(/\s+/).filter(Boolean)
  if (words.length === 1 && (/[-_]/.test(stripped) || (stripped === stripped.toUpperCase() && /[A-Z]/.test(stripped))))
    return { modality: 'keyword', reason: 'single token that looks like an ID or error code' }
  if (/^".*"$/.test(text.trim())) return { modality: 'keyword', reason: 'quoted phrase: exact-match intent' }
  if (words.length >= 3) return { modality: 'hybrid', reason: 'natural-language query (3+ words) with embeddings available' }
  return { modality: 'keyword', reason: 'fallback for short queries' }
}

const strip = (t: string) => t.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '')

/** In-memory keyword score: proportion of query tokens found in the document. */
function keywordScore(query: string, m: Memory) {
  const q = new Set(query.split(/\s+/).map(strip).filter(Boolean))
  const doc = new Set(indexText(m).split(/\s+/).map(strip))
  const hits = [...q].filter((t) => doc.has(t))
  return { score: q.size ? hits.length / q.size : 0, hits }
}

const GROUPS: string[][] = [
  ['checkout', 'payment', 'pay', 'purchase', 'order', 'orders'],
  ['fail', 'failure', 'failures', 'failing', 'failed', 'error', 'errors', 'err-4071', 'declined', 'decline', 'declining', 'timeout', 'timeouts', 'abort'],
  ['cause', 'caused', 'root', 'why', 'reason', 'because', 'root-cause'],
  ['refund', 'refunds', 'chargeback', 'reimburse', 'credit', 'return', 'charge', 'charged'],
  ['policy', 'window', 'rule', 'days', 'extend', 'waive'],
  ['customer', 'customers', 'shopper', 'user', 'affected'],
  ['prefer', 'prefers', 'preference', 'preferences', 'email', 'phone', 'call', 'contact', 'follow-up', 'updates'],
  ['release', 'deploy', 'deployed', 'deployment', 'v2.1', 'change', 'changed', 'config', 'rollback', 'rolled', 'hotfix', 'shipped'],
  ['gateway', 'bank', 'issuer', 'issuers', 'card', 'visa', 'mastercard', 'amex', 'discover', 'authorization'],
  ['shipping', 'dispatch', 'delay', 'delayed', 'delays', 'warehouse'],
  ['incident', 'inc-2207', 'outage', 'paged', 'page', 'on-call'],
]
const STOP = new Set('a an the and or of to in on at by for with from is are was were be it its this that what which who how did does do our we i'.split(' '))

function embed(text: string) {
  const v = new Map<string, number>()
  for (const raw of text.split(/\s+/)) {
    const t = strip(raw)
    if (!t || STOP.has(t)) continue
    v.set(t, (v.get(t) ?? 0) + 1)
    GROUPS.forEach((g, i) => g.includes(t) && v.set(`#${i}`, (v.get(`#${i}`) ?? 0) + 0.8))
  }
  return v
}

function cosine(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0
  a.forEach((x, k) => (dot += x * (b.get(k) ?? 0)))
  const n = (m: Map<string, number>) => Math.sqrt([...m.values()].reduce((s, x) => s + x * x, 0))
  return dot ? dot / (n(a) * n(b)) : 0
}

export interface Scored {
  memory: Memory
  score: number
  match: 'keyword' | 'vector' | 'hybrid' | 'recency'
  components: { keyword?: number; vector?: number; keywordRank?: number; vectorRank?: number; rrf?: number; recency?: number }
  hits?: string[]
}

export interface RetrieveOptions {
  query: string
  agentId: string
  scope: Scope
  modality: Modality
  rrfK: number
  limit: number
  /** Leave matching memories out of the store entirely (e.g. to show "before consolidation"). */
  exclude?: (m: Memory) => boolean
}

export function retrieve(o: RetrieveOptions) {
  const pool = MEMORIES.filter((m) => inScope(m, o.agentId, o.scope) && !o.exclude?.(m))
  const chosen = o.modality === 'auto' ? classify(o.query) : { modality: o.modality, reason: 'set explicitly' }
  const qv = embed(o.query)
  const kw = pool
    .map((m) => ({ m, ...keywordScore(o.query, m) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  const vec = pool
    .map((m) => ({ m, score: cosine(qv, embed(indexText(m))) }))
    .filter((x) => x.score > 0.08)
    .sort((a, b) => b.score - a.score)

  let results: Scored[]
  if (chosen.modality === 'keyword') results = kw.map((x, i) => ({ memory: x.m, score: x.score, match: 'keyword', hits: x.hits, components: { keyword: x.score, keywordRank: i + 1 } }))
  else if (chosen.modality === 'vector') results = vec.map((x, i) => ({ memory: x.m, score: x.score, match: 'vector', components: { vector: x.score, vectorRank: i + 1 } }))
  else {
    const over = 50
    const k = o.rrfK
    const map = new Map<string, Scored>()
    kw.slice(0, over).forEach((x, i) => map.set(x.m.id, { memory: x.m, score: 0, match: 'hybrid', hits: x.hits, components: { keyword: x.score, keywordRank: i + 1, rrf: 1 / (k + i + 1) } }))
    vec.slice(0, over).forEach((x, i) => {
      const e = map.get(x.m.id) ?? { memory: x.m, score: 0, match: 'hybrid' as const, components: { rrf: 0 } }
      e.components = { ...e.components, vector: x.score, vectorRank: i + 1, rrf: (e.components.rrf ?? 0) + 1 / (k + i + 1) }
      map.set(x.m.id, e)
    })
    // Normalise so the best possible score (rank 1 in both lists) is 1.0.
    results = [...map.values()].map((s) => ({ ...s, score: (s.components.rrf ?? 0) / (2 / (k + 1)) })).sort((a, b) => b.score - a.score)
  }
  return {
    modality: chosen.modality,
    reason: chosen.reason,
    results: results.slice(0, o.limit),
    keywordList: kw,
    vectorList: vec,
    poolSize: pool.length,
  }
}

// ------------------------------------------------------------------ assembly

export interface AssembleOptions extends RetrieveOptions {
  budget: number
  shares: TierShares | null
  recency: boolean
  maxContextTokens: number | null
  includeMetadata: boolean
}

export interface TierTrace {
  tier: Tier | 'all'
  budget: number
  used: number
  included: { s: Scored; cost: number; remainingAfter: number }[]
  dropped: { s: Scored; cost: number; remaining: number }[]
}

export interface Block {
  s: Scored
  tier: Tier
  position: number
  segment: 'self_start' | 'team' | 'cross_team' | 'org' | 'self_end' | 'all'
  text: string
  words: number
}

export function assemble(o: AssembleOptions) {
  const r = retrieve(o)
  // Optional SelectByRecency task: the 5 most recent visible memories.
  const recent: Scored[] = o.recency
    ? MEMORIES.filter((m) => inScope(m, o.agentId, o.scope) && m.t_obs && !o.exclude?.(m))
        .sort((a, b) => b.t_obs!.localeCompare(a.t_obs!))
        .slice(0, 5)
        .map((m, i) => ({ memory: m, score: 1 - i * 0.1, match: 'recency', components: { recency: 1 - i * 0.1 } }))
    : []

  // MergeAndDeduplicate: by id, keep the highest score, cap at 50.
  const merged = new Map<string, Scored>()
  let duplicates = 0
  for (const s of [...r.results, ...recent]) {
    const e = merged.get(s.memory.id)
    if (e) {
      duplicates++
      if (s.score > e.score) merged.set(s.memory.id, { ...s, components: { ...e.components, ...s.components } })
      else e.components = { ...s.components, ...e.components }
    } else merged.set(s.memory.id, s)
  }
  const candidates = [...merged.values()].sort((a, b) => b.score - a.score).slice(0, 50)

  // TieredBudgetAllocator.
  const byTier: Record<string, Scored[]> = o.shares ? { self: [], team: [], cross_team: [], org: [] } : { all: [] }
  for (const s of candidates) (o.shares ? byTier[tierOf(s.memory, o.agentId)] : byTier.all).push(s)
  const traces: TierTrace[] = Object.entries(byTier).map(([tier, list]) => {
    const budget = o.shares ? Math.floor(o.budget * o.shares[tier as Tier]) : o.budget
    let remaining = budget
    const t: TierTrace = { tier: tier as Tier | 'all', budget, used: 0, included: [], dropped: [] }
    for (const s of [...list].sort((a, b) => b.score - a.score)) {
      const c = cost(s.memory)
      if (c <= remaining) {
        remaining -= c
        t.included.push({ s, cost: c, remainingAfter: remaining })
      } else t.dropped.push({ s, cost: c, remaining })
    }
    t.used = budget - remaining
    return t
  })

  // TrustAwarePositioner: [self top half, team, cross_team, org, self bottom half].
  const tierList = (t: string) => traces.find((x) => x.tier === t)?.included.map((i) => i.s) ?? []
  let segments: [Block['segment'], Scored[]][]
  if (o.shares) {
    const self = tierList('self')
    const mid = Math.ceil(self.length / 2)
    segments = [
      ['self_start', self.slice(0, mid)],
      ['team', tierList('team')],
      ['cross_team', tierList('cross_team')],
      ['org', tierList('org')],
      ['self_end', self.slice(mid)],
    ]
  } else segments = [['all', tierList('all')]]
  const blocks: Block[] = []
  for (const [segment, list] of segments)
    for (const s of list) {
      let text = indexFields(s.memory)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
      if (o.includeMetadata) text = `[type=${s.memory.type}${s.memory.t_obs ? ` t_obs=${s.memory.t_obs}` : ''} score=${s.score.toFixed(2)}]\n${text}`
      blocks.push({ s, tier: tierOf(s.memory, o.agentId), position: blocks.length + 1, segment, text, words: text.split(/\s+/).filter(Boolean).length })
    }
  const SEP = '\n---\n'
  const full = blocks.map((b) => b.text).join(SEP)
  const fullWords = full.split(/\s+/).filter(Boolean).length

  // CondensationTask (truncate strategy) when a hard limit is set.
  let output = full
  let truncatedWords = 0
  if (o.maxContextTokens !== null && fullWords > o.maxContextTokens) {
    const words = full.split(/(\s+)/)
    let count = 0
    let out = ''
    for (const w of words) {
      if (/\S/.test(w)) {
        if (count >= o.maxContextTokens) break
        count++
      }
      out += w
    }
    output = out.trimEnd()
    truncatedWords = fullWords - o.maxContextTokens
  }

  return { retrieval: r, recent, duplicates, candidates, traces, blocks, output, fullWords, truncatedWords }
}

export type AssemblyResult = ReturnType<typeof assemble>
