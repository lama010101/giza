import { osirisSeed } from '@db/seeds/osiris-shaft';
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

export function loadAndValidateSeed(): ValidatedSeed {
  return {
    evidence: osirisSeed.evidence.map((e) => EvidenceSchema.parse(e)),
    locations: osirisSeed.locations.map((l) => LocationSchema.parse(l)),
    objects: osirisSeed.objects.map((o) => ObjectSchema.parse(o)),
    sources: osirisSeed.sources.map((s) => SourceSchema.parse(s)),
  };
}
