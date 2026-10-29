// Everything personal about the site lives here, so it can be edited in one place.

export const site = {
  name: 'Justin Howard',
  handle: 'randomseed-42',
  tagline: 'I build AI systems that check, remember and explain.',
  intro:
    'Data validation, retrieval benchmarks, agent memory and voice-first knowledge graphs. ' +
    'Memento and Remember When are interactive mock-ups that run entirely in your browser; AIValidator and RAGen are shown as screenshot tours. ' +
    'Everything uses synthetic data, and no proprietary code or customer data is included.',
  githubAccounts: ['randomseed-42', 'juhoward'],
  /** Repos to hide from the activity feed, as owner/name. */
  hiddenRepos: ['randomseed-42/example', 'juhoward/example'] as string[],
}

export type ProjectStatus = 'live' | 'soon'
/** Interactive mock-up, or a screenshot tour (see tours.ts). */
export type ProjectFormat = 'demo' | 'tour'

export interface Project {
  slug: string
  name: string
  summary: string
  tags: string[]
  status: ProjectStatus
  format: ProjectFormat
  /** Card image under public/shots. */
  cover: string
}

export const projects: Project[] = [
  {
    slug: 'aivalidator',
    format: 'tour',
    cover: 'aiv-dataset-report.webp',
    name: 'AIValidator',
    summary:
      'Training-data readiness checks for tabular datasets and document repositories, with a sanitizer agent and a conversational analyst (VeriTalk).',
    tags: ['Data quality', 'EDA', 'Embeddings', 'Agents'],
    status: 'live',
  },
  {
    slug: 'ragen',
    format: 'tour',
    cover: 'ragen-graph-introspect.webp',
    name: 'RAGen',
    summary:
      "Builds RAG benchmarks from your documents: pick the concepts that matter, generate Bloom's-taxonomy questions with golden contexts and distractors, annotate them, then score systems for risk. It also builds text-to-SQL and text-to-Cypher benchmarks from live databases.",
    tags: ['RAG', 'Benchmarks', 'Text-to-SQL', 'Text-to-Cypher'],
    status: 'live',
  },
  {
    slug: 'memento',
    format: 'demo',
    cover: 'memento-cover.webp',
    name: 'Memento',
    summary:
      'Memory for multi-agent systems. Inspect how a token budget is split across trust tiers, what each agent can see, and how team observations consolidate into org-level insight.',
    tags: ['Agent memory', 'Retrieval', 'Context engineering'],
    status: 'live',
  },
  {
    slug: 'remember-when',
    format: 'demo',
    cover: 'remember-when-cover.webp',
    name: 'Remember When',
    summary:
      'Voice-first biographical memory for senior living. Phone calls with an AI companion become a permissioned memory graph, a caregiver biosketch and a community care console.',
    tags: ['Voice AI', 'Knowledge graphs', 'Permissions'],
    status: 'live',
  },
]
