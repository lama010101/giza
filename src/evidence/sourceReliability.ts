/**
 * Default reliability table by source type per M03-T05.
 *
 * Provides default reliability scores based on source type, following
 * the hierarchy defined in GIZA - 09 Sources & Bibliography Standard §5.
 */

export interface ReliabilityDefault {
  sourceType: string;
  defaultReliability: number; // 0-100
  rationale: string;
}

/**
 * Default reliability scores by source type.
 * Scores are integers 0-100 per the confidence schema.
 */
export const DEFAULT_RELIABILITY_TABLE: ReliabilityDefault[] = [
  {
    sourceType: 'Peer-Reviewed Journal Article',
    defaultReliability: 90,
    rationale: 'Peer-reviewed publications have undergone independent verification',
  },
  {
    sourceType: 'Archaeological Report',
    defaultReliability: 85,
    rationale: 'Professional archaeological reports from field work',
  },
  {
    sourceType: 'Survey',
    defaultReliability: 80,
    rationale: 'Systematic surveys with documented methodology',
  },
  {
    sourceType: 'Book',
    defaultReliability: 75,
    rationale: 'Published books, often edited but not always peer-reviewed',
  },
  {
    sourceType: 'Conference Paper',
    defaultReliability: 70,
    rationale: 'Conference papers may have lighter review than journals',
  },
  {
    sourceType: 'Book Chapter',
    defaultReliability: 70,
    rationale: 'Book chapters, typically edited but variable review',
  },
  {
    sourceType: 'Thesis',
    defaultReliability: 65,
    rationale: 'Academic theses, reviewed by committee but not independently',
  },
  {
    sourceType: 'Museum Catalog',
    defaultReliability: 75,
    rationale: 'Museum catalogs with curatorial oversight',
  },
  {
    sourceType: 'Website',
    defaultReliability: 40,
    rationale: 'Websites have variable quality and no standard review',
  },
  {
    sourceType: 'Newspaper Article',
    defaultReliability: 35,
    rationale: 'Newspaper articles lack scientific review',
  },
  {
    sourceType: 'Personal Communication',
    defaultReliability: 30,
    rationale: 'Unverified personal communications',
  },
  {
    sourceType: 'Photograph',
    defaultReliability: 60,
    rationale: 'Photographs are primary evidence but context-dependent',
  },
  {
    sourceType: 'Scan',
    defaultReliability: 85,
    rationale: '3D scans are direct measurements with high fidelity',
  },
];

const reliabilityMap = new Map(DEFAULT_RELIABILITY_TABLE.map((r) => [r.sourceType, r]));

/**
 * Returns the default reliability for a source type.
 * Falls back to 50 (neutral) for unknown source types.
 */
export function getDefaultReliability(sourceType: string): number {
  return reliabilityMap.get(sourceType)?.defaultReliability ?? 50;
}

/**
 * Returns the rationale for a default reliability score.
 */
export function getReliabilityRationale(sourceType: string): string {
  return reliabilityMap.get(sourceType)?.rationale ?? 'Unknown source type — neutral default';
}

/**
 * Returns the full reliability entry for a source type.
 */
export function getReliabilityEntry(sourceType: string): ReliabilityDefault | undefined {
  return reliabilityMap.get(sourceType);
}

/**
 * Returns all reliability defaults.
 */
export function getAllReliabilityDefaults(): ReliabilityDefault[] {
  return [...DEFAULT_RELIABILITY_TABLE];
}
