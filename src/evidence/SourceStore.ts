import { SourceSchema, type Source } from '@/schemas/source';
import { evidenceStore } from './EvidenceStore';

export interface CreateSourceInput {
  authors: { name: string; orcid?: string }[];
  title: string;
  publication?: string;
  year?: number;
  doi?: string;
  isbn?: string;
  url?: string;
  license?: string;
  type: Source['type'];
  reliability?: number;
}

export interface UpdateSourceInput {
  authors?: { name: string; orcid?: string }[];
  title?: string;
  publication?: string;
  year?: number;
  doi?: string;
  isbn?: string;
  url?: string;
  license?: string;
  type?: Source['type'];
  reliability?: number;
}

function generateSourceId(existing: Source[]): string {
  let max = 0;
  for (const src of existing) {
    const match = src.id.match(/^SRC-(\d{4})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return `SRC-${String(max + 1).padStart(4, '0')}`;
}

export class SourceStore {
  private sources: Source[];

  constructor(initial?: Source[]) {
    this.sources = initial ?? evidenceStore.getSources();
  }

  create(input: CreateSourceInput): Source {
    const id = generateSourceId(this.sources);

    const raw: Record<string, unknown> = {
      id,
      authors: input.authors,
      title: input.title,
      publication: input.publication,
      year: input.year,
      doi: input.doi,
      isbn: input.isbn,
      url: input.url,
      license: input.license,
      type: input.type,
      reliability: input.reliability,
    };

    const parsed = SourceSchema.parse(raw);
    this.sources.push(parsed);
    return parsed;
  }

  update(id: string, updates: UpdateSourceInput): Source | undefined {
    const index = this.sources.findIndex((s) => s.id === id);
    if (index === -1) return undefined;

    const current = this.sources[index];
    const merged: Record<string, unknown> = {
      ...current,
      ...updates,
    };

    const parsed = SourceSchema.parse(merged);
    this.sources[index] = parsed;
    return parsed;
  }

  delete(id: string): boolean {
    const index = this.sources.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.sources.splice(index, 1);
    return true;
  }

  getById(id: string): Source | undefined {
    return this.sources.find((s) => s.id === id);
  }

  getAll(): Source[] {
    return [...this.sources];
  }

  search(query: string): Source[] {
    const normalized = query.toLowerCase();
    return this.sources.filter(
      (s) =>
        s.title.toLowerCase().includes(normalized) ||
        s.authors.some((a) => a.name.toLowerCase().includes(normalized)) ||
        (s.publication?.toLowerCase().includes(normalized) ?? false),
    );
  }
}

export const sourceStore = new SourceStore();
