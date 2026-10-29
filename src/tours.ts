// Screenshot tours for the projects shown as stills rather than interactive demos.
// Images live in public/shots and are captures of the synthetic-data mock-ups.

export interface Shot {
  src: string
  width: number
  height: number
  title: string
  caption: string
  alt: string
}

export interface Tour {
  slug: string
  name: string
  subtitle: string
  intro: string
  shots: Shot[]
}

export const shot = (file: string) => `${import.meta.env.BASE_URL}shots/${file}`

export const tours: Tour[] = [
  {
    slug: 'aivalidator',
    name: 'AIValidator',
    subtitle: 'training-data readiness',
    intro:
      'AIValidator checks whether a dataset or document repository is ready to train or ground a model: it profiles the data, explains what is wrong, ' +
      'and proposes a fix a person signs off on before anything changes.',
    shots: [
      {
        src: shot('aiv-dataset-report.webp'),
        width: 1034,
        height: 614,
        title: 'Profile a tabular dataset',
        caption:
          'Each upload is profiled into a quality score built from completeness, consistency and the share of variables raising alerts. ' +
          'This 1,217-row customer-churn table scores 79%: 119 missing cells, 37 duplicate rows and 8 alerts, each linking through to the evidence.',
        alt: 'Dataset analysis report showing a 79% quality score with completeness, consistency and concern breakdowns',
      },
      {
        src: shot('aiv-cleaning-plan.webp'),
        width: 1029,
        height: 811,
        title: 'Approve a cleaning plan before anything runs',
        caption:
          'A sanitizer agent drafts a plan from the validation alerts: remove duplicate rows, impute and winsorize skewed columns, and drop columns ' +
          'that are redundant or constant. Every action maps to a deterministic operation from an allowlisted catalog, and nothing executes until a person approves it.',
        alt: 'Data cleaning plan listing key findings, columns to drop and per-column cleaning actions',
      },
      {
        src: shot('aiv-doc-clusters.webp'),
        width: 1025,
        height: 1120,
        title: 'Map a document repository',
        caption:
          'For document collections, every page is embedded, clustered and projected into two dimensions. Clusters get a name and an exemplar page, ' +
          'and pages far from their cluster center are flagged as outliers to review: here 13 of 234 pages across 25 documents.',
        alt: 'UMAP scatter plot of document pages coloured by cluster, with outliers ringed in red and cluster exemplar cards below',
      },
    ],
  },
  {
    slug: 'ragen',
    name: 'RAGen',
    subtitle: 'retrieval benchmark builder',
    intro:
      'RAGen builds retrieval benchmarks from an organization’s own sources: documents, SQL databases and graph databases. ' +
      'The document workflow goes on to generate questions with golden contexts and distractors, annotate them, run systems against them and score risk.',
    shots: [
      {
        src: shot('ragen-concepts.webp'),
        width: 787,
        height: 403,
        title: 'Choose the concepts to test',
        caption:
          'Documents are chunked and indexed, then key phrases are extracted per chunk, de-duplicated and merged across synonyms: 241 raw extractions become 48 concepts. ' +
          'Boilerplate such as revision history, contact pages and disclaimers is flagged so the benchmark tests what matters.',
        alt: 'Concept selection step showing 47 chunks, 241 raw extractions, 84 unique phrases and 48 fused concepts, with a boilerplate warning',
      },
      {
        src: shot('ragen-bloom-mix.webp'),
        width: 781,
        height: 492,
        title: 'Set the difficulty mix',
        caption:
          'Questions are spread across Bloom’s taxonomy, from recalling a fact to creating something new. Each level gets a share of the benchmark, ' +
          'and the higher levels are built from stems that combine several concepts.',
        alt: 'Sliders setting the share of questions for each Bloom level: Remember, Understand, Apply, Analyze, Evaluate and Create',
      },
      {
        src: shot('ragen-sql-introspect.webp'),
        width: 1027,
        height: 714,
        title: 'Benchmarks from SQL tables',
        caption:
          'Pointed at a live database, RAGen introspects tables, keys, row counts and sample rows, then generates question and SQL pairs. ' +
          'A pair only makes it into the benchmark once it has been proven to run, return data and sit at the difficulty it claims.',
        alt: 'Text-to-SQL walk-through showing four introspected tables with their columns, keys and row counts',
      },
      {
        src: shot('ragen-graph-introspect.webp'),
        width: 1033,
        height: 833,
        title: 'Benchmarks from a graph database',
        caption:
          'The same approach works on property graphs. RAGen discovers node labels, relationship types, counts and how many edges a node typically has, ' +
          'then produces question and Cypher pairs held to the same checks, with difficulty judged from the shape of the query as well as its syntax.',
        alt: 'Text-to-Cypher walk-through showing a schema diagram of Researcher, Paper, Institution and Topic nodes and their relationships',
      },
    ],
  },
]
