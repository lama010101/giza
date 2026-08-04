import { osirisSeed } from '@db/seeds/osiris-shaft';
import { greatPyramidSeed } from '@db/seeds/great-pyramid';
import { supplementarySeed } from '@db/seeds/giza-plateau-supplementary';
import { EvidenceSchema, type Evidence } from '@/schemas/evidence';
import { LocationSchema, type Location } from '@/schemas/location';
import { ObjectSchema, type SceneObject } from '@/schemas/object';
import { SourceSchema, type Source } from '@/schemas/source';

export interface ValidatedSeed {
  evidence: Evidence[];
  locations: Location[];
  objects: SceneObject[];
  sources: Source[];
}

export type Monument = 'osiris' | 'great-pyramid';

function validateSeed(raw: {
  evidence: unknown[];
  locations: unknown[];
  objects: unknown[];
  sources: unknown[];
}): ValidatedSeed {
  return {
    evidence: raw.evidence.map((e) => EvidenceSchema.parse(e)),
    locations: raw.locations.map((l) => LocationSchema.parse(l)),
    objects: raw.objects.map((o) => ObjectSchema.parse(o)),
    sources: raw.sources.map((s) => SourceSchema.parse(s)),
  };
}

export function loadAndValidateSeed(): ValidatedSeed {
  const osiris = validateSeed(osirisSeed);
  const gp = validateSeed(greatPyramidSeed);
  const supp = validateSeed(supplementarySeed);
  return {
    evidence: [...osiris.evidence, ...gp.evidence, ...supp.evidence],
    locations: [...osiris.locations, ...gp.locations, ...supp.locations],
    objects: [...osiris.objects, ...gp.objects, ...supp.objects],
    sources: [...osiris.sources, ...gp.sources, ...supp.sources],
  };
}

export function loadSeedByMonument(monument: Monument): ValidatedSeed {
  switch (monument) {
    case 'osiris':
      return validateSeed(osirisSeed);
    case 'great-pyramid':
      return validateSeed(greatPyramidSeed);
  }
}
