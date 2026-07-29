import type { ParameterEntry, ParameterProvenance, ParameterSet } from './types';

const VALID_PROVENANCE: ParameterProvenance[] = [
  'Measured',
  'Published',
  'Estimated',
  'User-defined',
  'Experimental',
];

export class ParameterStore {
  private sets = new Map<string, ParameterSet>();
  private versions = new Map<string, number>();

  create(simulationType: string, parameters: ParameterEntry[]): ParameterSet {
    const version = (this.versions.get(simulationType) ?? 0) + 1;
    this.versions.set(simulationType, version);

    const set: ParameterSet = {
      simulationType,
      version,
      parameters: parameters.map((p) => ({ ...p })),
    };

    const key = `${simulationType}-v${version}`;
    this.sets.set(key, set);
    return set;
  }

  get(key: string): ParameterSet | undefined {
    const set = this.sets.get(key);
    return set ? { ...set, parameters: set.parameters.map((p) => ({ ...p })) } : undefined;
  }

  getLatest(simulationType: string): ParameterSet | undefined {
    const version = this.versions.get(simulationType);
    if (!version) return undefined;
    return this.get(`${simulationType}-v${version}`);
  }

  validateParameters(parameters: ParameterEntry[]): string[] {
    const errors: string[] = [];

    for (const param of parameters) {
      if (!VALID_PROVENANCE.includes(param.provenance)) {
        errors.push(
          `Parameter "${param.name}" has invalid provenance "${param.provenance}". Valid: ${VALID_PROVENANCE.join(', ')}`,
        );
      }
      if (param.name.trim() === '') {
        errors.push('Parameter name cannot be empty');
      }
    }

    return errors;
  }

  toJSON(key: string): string | null {
    const set = this.sets.get(key);
    if (!set) return null;
    return JSON.stringify(set, null, 2);
  }

  fromJSON(json: string): ParameterSet {
    const parsed = JSON.parse(json) as ParameterSet;
    const key = `${parsed.simulationType}-v${parsed.version}`;
    this.sets.set(key, parsed);
    this.versions.set(parsed.simulationType, parsed.version);
    return parsed;
  }
}
