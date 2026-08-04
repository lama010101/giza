/**
 * Simulation parameter capture per M03.5-T07.
 *
 * Extracts candidate simulation parameters from scholarly text, classifies them
 * by provenance per GIZA - 06 §1.6, and links them to the evidence record(s)
 * from which they were captured. Captured parameters are plain data — they do
 * not alter a running simulation until a researcher explicitly imports them.
 *
 * Related: `docs/architecture/content-pipeline.md`, `src/schemas/simulation.ts`
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type ParameterProvenance =
  | 'Measured'
  | 'Published'
  | 'Estimated'
  | 'User-defined'
  | 'Experimental';

export interface SimulationParameter {
  /** Stable parameter identifier. */
  id: string;
  /** Target simulation identifier (SIM-NNN). */
  simulationId: string;
  /** Human-readable parameter name. */
  name: string;
  /** Numeric or string value. */
  value: number | string;
  /** Unit, if derivable from the text. */
  unit?: string;
  /** Provenance classification per 06 §1.6. */
  provenance: ParameterProvenance;
  /** Evidence record(s) this parameter was captured from. */
  evidenceIds: string[];
  /** Notes about extraction context. */
  notes?: string;
  /** ISO capture timestamp. */
  capturedAt: string;
}

export interface CaptureOptions {
  simulationId: string;
  /** Evidence IDs to attach as provenance. */
  evidenceIds?: string[];
  /** Default provenance when the text does not declare one. */
  provenance?: ParameterProvenance;
  /** Optional notes appended to every captured parameter. */
  notes?: string;
}

interface ParameterPattern {
  name: string;
  regex: RegExp;
  defaultUnit?: string;
  valueType: 'number' | 'string';
  provenance?: ParameterProvenance;
}

// ─── Patterns ───────────────────────────────────────────────────────────────

const patterns: ParameterPattern[] = [
  {
    name: 'water level',
    regex: /(?:water level|water elevation|head)[^\d\n]{0,40}(\d+(?:\.\d+)?)\s*(m|cm|mm|ft)?\b/gi,
    defaultUnit: 'm',
    valueType: 'number',
  },
  {
    name: 'flow rate',
    regex:
      /(?:flow rate|discharge)[^\d\n]{0,40}(\d+(?:\.\d+)?)\s*(m³\/s|m3\/s|l\/s|L\/s|m\/s)?\b/gi,
    defaultUnit: 'm³/s',
    valueType: 'number',
  },
  {
    name: 'temperature',
    regex: /(?:temperature)[^\d\n]{0,40}(-?\d+(?:\.\d+)?)\s*(°C|C|°F|F|K)?\b/gi,
    defaultUnit: '°C',
    valueType: 'number',
  },
  {
    name: 'density',
    regex:
      /(?:density|specific gravity)[^\d\n]{0,40}(\d+(?:\.\d+)?)\s*(kg\/m³|kg\/m3|g\/cm³|g\/cm3)?\b/gi,
    defaultUnit: 'kg/m³',
    valueType: 'number',
  },
  {
    name: 'viscosity',
    regex:
      /(?:viscosity|dynamic viscosity)[^\d\n]{0,40}(\d+(?:\.\d+)?(?:[eE][-+]?(\d+))?)\s*(Pa·s|Pa s|Pa\\.s|cP)?\b/gi,
    defaultUnit: 'Pa·s',
    valueType: 'number',
  },
  {
    name: 'gravity',
    regex:
      /(?:gravity|gravitational acceleration|g\s*=)[^\d\n]{0,40}(-?\d+(?:\.\d+)?)\s*(m\/s²|m\/s2)?\b/gi,
    defaultUnit: 'm/s²',
    valueType: 'number',
  },
  {
    name: 'conduit diameter',
    regex:
      /(?:conduit diameter|shaft diameter|pipe diameter|diameter)[^\d\n]{0,40}(\d+(?:\.\d+)?)\s*(m|cm|mm|cubits?)?\b/gi,
    defaultUnit: 'm',
    valueType: 'number',
  },
  {
    name: 'length',
    regex:
      /(?:length|conduit length|shaft length)[^\d\n]{0,40}(\d+(?:\.\d+)?)\s*(m|cm|mm|cubits?)?\b/gi,
    defaultUnit: 'm',
    valueType: 'number',
  },
  {
    name: 'slope',
    regex:
      /(?:slope|incline|angle|gradient)[^\d\n]{0,40}(\d+(?:\.\d+)?)\s*(°|degrees|percent|%)?\b/gi,
    valueType: 'number',
  },
  {
    name: 'roughness coefficient',
    regex:
      /(?:roughness|manning[\s-]?n|friction factor|darcy[-\s]?weisbach f)[^\d\n]{0,40}(\d+(?:\.\d+)?(?:e-?\d+)?)\s*(\w+)?/gi,
    valueType: 'number',
  },
  {
    name: 'pressure',
    regex: /(?:pressure|static pressure)[^\d\n]{0,40}(\d+(?:\.\d+)?)\s*(Pa|kPa|MPa|bar|atm)?\b/gi,
    defaultUnit: 'Pa',
    valueType: 'number',
  },
  {
    name: 'water temperature',
    regex: /(?:water temperature)[^\d\n]{0,40}(-?\d+(?:\.\d+)?)\s*(°C|C|K)?\b/gi,
    defaultUnit: '°C',
    valueType: 'number',
  },
];

let parameterCounter = 0;

function nextParameterId(): string {
  parameterCounter += 1;
  return `SP-${String(parameterCounter).padStart(4, '0')}`;
}

/** Resets the internal parameter counter. Intended for test isolation only. */
export function _resetParameterCounterForTests(): void {
  parameterCounter = 0;
}

function parseNumber(raw: string): number | string {
  const trimmed = raw.replace(/\s+/g, '').replace(/,/g, '');
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : raw;
}

function provenanceFromText(text: string): ParameterProvenance | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('measured') || lower.includes('survey')) return 'Measured';
  if (lower.includes('published') || lower.includes('literature')) return 'Published';
  if (lower.includes('estimated') || lower.includes('assumed') || lower.includes('rough'))
    return 'Estimated';
  if (lower.includes('experimental') || lower.includes('tested')) return 'Experimental';
  if (lower.includes('user-defined') || lower.includes('set to')) return 'User-defined';
  return undefined;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Extracts candidate simulation parameters from a text. Each match is
 * classified by provenance when the surrounding text declares it, otherwise
 * the provided default provenance is used.
 *
 * Returns parameters in the order they appear in the text.
 */
export function captureSimulationParameters(
  text: string,
  options: CaptureOptions,
): SimulationParameter[] {
  if (!text || text.trim().length === 0) return [];

  const results: SimulationParameter[] = [];
  const captured = new Set<string>();
  const defaultProvenance = options.provenance ?? 'Estimated';

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags.replace('g', '') + 'g');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const rawValue = match[1]?.trim();
      if (!rawValue) continue;

      const rawUnit = match[2]?.trim();
      const value = pattern.valueType === 'number' ? parseNumber(rawValue) : rawValue;
      const unit = rawUnit || pattern.defaultUnit;

      const contextStart = Math.max(0, match.index - 80);
      const contextEnd = Math.min(text.length, match.index + match[0].length + 80);
      const context = text.slice(contextStart, contextEnd);

      const provenance = pattern.provenance ?? provenanceFromText(context) ?? defaultProvenance;

      const key = `${pattern.name}-${value}-${unit ?? ''}`;
      if (captured.has(key)) continue;
      captured.add(key);

      results.push({
        id: nextParameterId(),
        simulationId: options.simulationId,
        name: pattern.name,
        value,
        unit,
        provenance,
        evidenceIds: options.evidenceIds ? [...options.evidenceIds] : [],
        notes: options.notes ? `Context: ${context}; ${options.notes}` : `Context: ${context}`,
        capturedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

/**
 * Attaches an evidence provenance ID to a captured parameter.
 */
export function linkParameterToEvidence(
  parameter: SimulationParameter,
  evidenceId: string,
): SimulationParameter {
  if (parameter.evidenceIds.includes(evidenceId)) return parameter;
  return { ...parameter, evidenceIds: [...parameter.evidenceIds, evidenceId] };
}
