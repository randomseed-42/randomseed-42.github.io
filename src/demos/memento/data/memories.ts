// Synthetic memory store for a fictional retailer, "Acme Outfitters". Two teams of agents
// (support, engineering) handled a checkout incident in October 2026; consolidation turned
// their raw observations into team patterns and one organisation-level insight.
// Modelled on Memento's "incident to insight" walkthrough; all content is invented.

export type Visibility = 'PRIVATE' | 'TEAM' | 'CROSS_TEAM' | 'ORGANIZATION' | 'PUBLIC'
export type Level = 'AGENT' | 'TEAM' | 'CROSS_TEAM' | 'ORGANIZATION'
export type MemType = 'episodic' | 'semantic' | 'procedural'

export interface Memory {
  id: string
  type: MemType
  agent_id: string
  team_id: string
  org_id: string
  visibility: Visibility
  access_grants?: { kind: 'agent' | 'team'; id: string }[]
  t_obs?: string
  // episodic
  summary?: string
  details?: string
  // semantic
  subject?: string
  predicate?: string
  object?: string
  // procedural
  instruction?: string
  tags: string[]
  source_pipeline: 'formation' | 'consolidation'
  consolidation_level?: Level
  specialist?: 'deduplication' | 'abstraction' | 'pattern'
  source_ids?: string[]
  times_derived: number
}

export interface Agent {
  id: string
  name: string
  team_id: string
  role: string
}

export const ORG = 'acme'

export const AGENTS: Agent[] = [
  { id: 'ava', name: 'Ava', team_id: 'support', role: 'Support agent · billing queue' },
  { id: 'ben', name: 'Ben', team_id: 'support', role: 'Support agent · orders queue' },
  { id: 'cara', name: 'Cara', team_id: 'support', role: 'Support agent · escalations' },
  { id: 'eli', name: 'Eli', team_id: 'engineering', role: 'On-call SRE agent' },
  { id: 'fay', name: 'Fay', team_id: 'engineering', role: 'Release engineering agent' },
]

export const TEAMS: Record<string, { label: string; color: string }> = {
  support: { label: 'Support', color: '#56B4E9' },
  engineering: { label: 'Engineering', color: '#E69F00' },
  acme: { label: 'Organization', color: '#CC79A7' },
}

const D = (day: number, hh = 10, mm = 0) => `2026-10-${String(day).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00Z`

type Spec = Omit<Memory, 'org_id' | 'tags' | 'source_pipeline' | 'times_derived'> & Partial<Pick<Memory, 'tags' | 'source_pipeline' | 'times_derived'>>
const m = (s: Spec): Memory => ({ org_id: ORG, tags: [], source_pipeline: 'formation', times_derived: 0, ...s })

export const MEMORIES: Memory[] = [
  // ---------------------------------------------------------------- support · Ava (billing)
  m({ id: 'ava-01', type: 'episodic', agent_id: 'ava', team_id: 'support', visibility: 'TEAM', t_obs: D(6, 14, 12), summary: 'Customer card declined at checkout with ERR-4071', details: 'Order A-55120. Visa card, sufficient funds confirmed by customer. Retried twice, same ERR-4071. Suggested PayPal as a workaround.', tags: ['ticket', 'checkout'] }),
  m({ id: 'ava-02', type: 'episodic', agent_id: 'ava', team_id: 'support', visibility: 'TEAM', t_obs: D(6, 16, 40), summary: 'Second checkout failure, ERR-4071, Mastercard', details: 'Order A-55188. Customer charged nothing. Error appeared after about two seconds of spinner. Logged for engineering.', tags: ['ticket', 'checkout'] }),
  m({ id: 'ava-03', type: 'episodic', agent_id: 'ava', team_id: 'support', visibility: 'PRIVATE', t_obs: D(6, 16, 55), summary: 'Checkout failure ERR-4071 on Mastercard order', details: 'Duplicate note for order A-55188 written before the ticket was merged.', tags: ['ticket', 'checkout'] }),
  m({ id: 'ava-04', type: 'episodic', agent_id: 'ava', team_id: 'support', visibility: 'TEAM', t_obs: D(7, 9, 20), summary: 'Refund requested for order delayed by failed payments', details: 'Customer placed the order three times; one eventually succeeded. Asked for refund of shipping. Approved $8.95 courtesy credit.', tags: ['ticket', 'refund'] }),
  m({ id: 'ava-05', type: 'procedural', agent_id: 'ava', team_id: 'support', visibility: 'PRIVATE', instruction: 'Before issuing any refund, confirm the order number and the last four digits of the card with the customer.', tags: ['refund', 'policy'] }),
  m({ id: 'ava-06', type: 'episodic', agent_id: 'ava', team_id: 'support', visibility: 'PRIVATE', t_obs: D(8, 11, 5), summary: 'Customer prefers email over phone follow-up', details: 'J. Moreno (order A-55120) asked that all updates come by email; do not call.', tags: ['preference'] }),
  // ---------------------------------------------------------------- support · Ben (orders)
  m({ id: 'ben-01', type: 'episodic', agent_id: 'ben', team_id: 'support', visibility: 'TEAM', t_obs: D(6, 15, 2), summary: 'Checkout spinner then ERR-4071 on mobile app', details: 'Order A-55141. iOS app 6.2. Payment page hangs about two seconds then shows ERR-4071. Desktop checkout also failed for the same customer.', tags: ['ticket', 'checkout'] }),
  m({ id: 'ben-02', type: 'episodic', agent_id: 'ben', team_id: 'support', visibility: 'TEAM', t_obs: D(7, 10, 30), summary: 'Customer says bank shows no declined authorization', details: 'Order A-55203. Bank confirmed no authorization attempt was received, which suggests the request never reached the card network.', tags: ['ticket', 'checkout'] }),
  m({ id: 'ben-03', type: 'episodic', agent_id: 'ben', team_id: 'support', visibility: 'TEAM', t_obs: D(7, 13, 15), summary: 'Three ERR-4071 tickets in one hour from the west region', details: 'Orders A-55230, A-55234, A-55241. All failed at payment. Card issuers vary: Visa, Amex, Discover.', tags: ['ticket', 'checkout'] }),
  m({ id: 'ben-04', type: 'semantic', agent_id: 'ben', team_id: 'support', visibility: 'TEAM', t_obs: D(7, 13, 30), subject: 'ERR-4071', predicate: 'is_believed_caused_by', object: 'card issuer declining the transaction', tags: ['hypothesis'] }),
  m({ id: 'ben-05', type: 'episodic', agent_id: 'ben', team_id: 'support', visibility: 'TEAM', t_obs: D(9, 9, 45), summary: 'Shipping delayed for orders retried during payment failures', details: 'Warehouse held orders with multiple payment attempts for manual fraud review, adding two days to dispatch.', tags: ['ticket', 'shipping'] }),
  // ---------------------------------------------------------------- support · Cara (escalations)
  m({ id: 'cara-01', type: 'episodic', agent_id: 'cara', team_id: 'support', visibility: 'TEAM', t_obs: D(6, 17, 30), summary: 'Escalated ERR-4071 cluster to engineering on-call', details: 'Eleven checkout failures since 14:00. Opened incident INC-2207 and paged engineering.', tags: ['escalation', 'checkout'] }),
  m({ id: 'cara-02', type: 'episodic', agent_id: 'cara', team_id: 'support', visibility: 'TEAM', t_obs: D(8, 12, 0), summary: 'Angry customer threatened chargeback over duplicate charge', details: 'Order A-55301 was charged twice when the customer retried after ERR-4071. Reversed the duplicate charge and apologised.', tags: ['escalation', 'refund'] }),
  m({ id: 'cara-03', type: 'procedural', agent_id: 'cara', team_id: 'support', visibility: 'TEAM', t_obs: D(1, 9, 0), instruction: 'Refund window for standard orders is 30 days from delivery.', tags: ['refund', 'policy'] }),
  m({ id: 'cara-04', type: 'procedural', agent_id: 'cara', team_id: 'support', visibility: 'TEAM', t_obs: D(10, 15, 0), instruction: 'For orders affected by incident INC-2207, extend the refund window to 45 days and waive return shipping.', tags: ['refund', 'policy', 'incident'] }),
  // ---------------------------------------------------------------- engineering · Eli (SRE)
  m({ id: 'eli-01', type: 'episodic', agent_id: 'eli', team_id: 'engineering', visibility: 'TEAM', t_obs: D(6, 17, 45), summary: 'Paged for INC-2207: elevated checkout errors', details: 'Payment service error rate 6.8% versus a 0.2% baseline. Errors are client-side timeouts calling the payment gateway.', tags: ['incident', 'checkout'] }),
  m({ id: 'eli-02', type: 'episodic', agent_id: 'eli', team_id: 'engineering', visibility: 'TEAM', t_obs: D(6, 18, 20), summary: 'Gateway timeout lowered from 8s to 2s in release v2.1', details: 'Config diff in v2.1 reduced PAYMENT_GATEWAY_TIMEOUT to 2000 ms. Gateway p95 latency is 2.4 s, so most slow requests now abort with ERR-4071.', tags: ['incident', 'root-cause'] }),
  m({ id: 'eli-03', type: 'episodic', agent_id: 'eli', team_id: 'engineering', visibility: 'TEAM', t_obs: D(6, 19, 5), summary: 'Rolled back gateway timeout to 8s; errors recovered', details: 'Hotfix v2.1.1 restored the 8000 ms timeout. Error rate back to 0.3% within 20 minutes.', tags: ['incident', 'mitigation'] }),
  m({ id: 'eli-04', type: 'semantic', agent_id: 'eli', team_id: 'engineering', visibility: 'CROSS_TEAM', t_obs: D(6, 19, 30), subject: 'ERR-4071', predicate: 'is_caused_by', object: 'payment gateway client timeout (2s) in release v2.1', tags: ['root-cause'] }),
  m({ id: 'eli-05', type: 'procedural', agent_id: 'eli', team_id: 'engineering', visibility: 'PRIVATE', instruction: 'Page the payments owner if gateway error rate exceeds 2% for five minutes.', tags: ['runbook'] }),
  // ---------------------------------------------------------------- engineering · Fay (release)
  m({ id: 'fay-01', type: 'episodic', agent_id: 'fay', team_id: 'engineering', visibility: 'TEAM', t_obs: D(6, 13, 50), summary: 'Deployed release v2.1 to production', details: 'Release v2.1 shipped new checkout UI and consolidated service timeouts. Canary passed at 5% traffic for 30 minutes.', tags: ['deploy'] }),
  m({ id: 'fay-02', type: 'episodic', agent_id: 'fay', team_id: 'engineering', visibility: 'TEAM', t_obs: D(7, 11, 0), summary: 'Canary missed timeout regression because traffic was low', details: 'Canary window ran during a quiet period; slow gateway responses were too rare to trip the error budget.', tags: ['postmortem'] }),
  m({ id: 'fay-03', type: 'procedural', agent_id: 'fay', team_id: 'engineering', visibility: 'CROSS_TEAM', instruction: 'Any change to an external-call timeout requires a load test at peak traffic before release.', tags: ['policy', 'deploy'] }),
  m({ id: 'fay-04', type: 'semantic', agent_id: 'fay', team_id: 'engineering', visibility: 'TEAM', t_obs: D(6, 14, 0), subject: 'release v2.1', predicate: 'changed', object: 'PAYMENT_GATEWAY_TIMEOUT from 8000 ms to 2000 ms', tags: ['deploy'] }),

  // ================================================================ consolidation outputs
  m({ id: 'ava-c1', type: 'episodic', agent_id: 'ava', team_id: 'support', visibility: 'PRIVATE', t_obs: D(9, 2, 0), summary: 'Merged duplicate notes on Mastercard checkout failure A-55188', details: 'One ticket with ERR-4071 after a two-second spinner; no charge made.', tags: ['checkout'], source_pipeline: 'consolidation', consolidation_level: 'AGENT', specialist: 'deduplication', source_ids: ['ava-02', 'ava-03'] }),
  m({ id: 'team-sup-1', type: 'episodic', agent_id: 'system:team:support', team_id: 'support', visibility: 'TEAM', t_obs: D(9, 3, 0), summary: 'Pattern: ERR-4071 checkout failures began Oct 6 across all card brands', details: 'Seven tickets from three agents. Failures span Visa, Mastercard, Amex and Discover, on web and mobile, starting around 14:00 on Oct 6. Banks report no authorization attempts.', tags: ['pattern', 'checkout'], source_pipeline: 'consolidation', consolidation_level: 'TEAM', specialist: 'pattern', source_ids: ['ava-01', 'ava-c1', 'ben-01', 'ben-02', 'ben-03', 'cara-01'] }),
  m({ id: 'team-sup-2', type: 'episodic', agent_id: 'system:team:support', team_id: 'support', visibility: 'TEAM', t_obs: D(9, 3, 5), summary: 'Pattern: payment retries caused duplicate charges and shipping delays', details: 'Customers who retried after ERR-4071 saw duplicate charges or fraud-review holds that delayed dispatch by two days.', tags: ['pattern', 'refund'], source_pipeline: 'consolidation', consolidation_level: 'TEAM', specialist: 'pattern', source_ids: ['ava-04', 'ben-05', 'cara-02'] }),
  m({ id: 'team-sup-3', type: 'episodic', agent_id: 'system:team:support', team_id: 'support', visibility: 'CROSS_TEAM', t_obs: D(9, 4, 0), summary: 'Published to engineering: customer impact of the ERR-4071 incident', details: 'About 40 affected orders, 6 duplicate charges, 2-day shipping delays. Customers were told it was a card issuer problem until Oct 8.', tags: ['published', 'impact'], source_pipeline: 'consolidation', consolidation_level: 'CROSS_TEAM', specialist: 'abstraction', source_ids: ['team-sup-1', 'team-sup-2'] }),
  m({ id: 'team-eng-1', type: 'episodic', agent_id: 'system:team:engineering', team_id: 'engineering', visibility: 'CROSS_TEAM', t_obs: D(9, 3, 10), summary: 'Pattern: v2.1 timeout change caused INC-2207; canary did not catch it', details: 'Timeout cut to 2 s below gateway p95 of 2.4 s. Low-traffic canary hid the regression. Rolled back in v2.1.1.', tags: ['pattern', 'root-cause'], source_pipeline: 'consolidation', consolidation_level: 'TEAM', specialist: 'pattern', source_ids: ['eli-01', 'eli-02', 'eli-03', 'fay-01', 'fay-02', 'fay-04'] }),
  m({ id: 'org-1', type: 'episodic', agent_id: 'system:org:acme', team_id: 'acme', visibility: 'ORGANIZATION', t_obs: D(11, 6, 0), summary: 'Insight: ERR-4071 was our gateway timeout, not card issuers', details: 'Release v2.1 set a 2 s payment gateway timeout, below real latency, failing about 40 orders on Oct 6. Support told customers it was their bank. Affected orders get a 45-day refund window. Timeout changes now need a peak-traffic load test.', tags: ['insight', 'incident'], source_pipeline: 'consolidation', consolidation_level: 'ORGANIZATION', specialist: 'abstraction', source_ids: ['team-sup-3', 'team-eng-1', 'eli-04', 'cara-04', 'fay-03'] }),
]

// Each source memory's derivation count is the number of memories that cite it.
for (const mem of MEMORIES) mem.times_derived = MEMORIES.filter((x) => x.source_ids?.includes(mem.id)).length

export const PRESET_QUERIES = [
  'Why is checkout failing with ERR-4071?',
  'What is the refund policy for affected customers?',
  'ERR-4071',
  'customer follow-up preferences',
  'What changed in release v2.1?',
]
