import { describe, it, expect } from 'vitest';
import {
  exportToJSON,
  exportToCSV,
  exportToBibTeX,
  exportToRIS,
  exportToGraphML,
  importFromJSON,
  importFromCSV,
  generateCitationCFF,
} from './importExport';
import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: 'EV-000001',
    title: 'Test Evidence',
    description: 'A test evidence record',
    category: 'Survey',
    primaryClass: 'E2',
    secondaryClasses: [],
    confidence: 80,
    confidenceBasis: 'Direct measurement',
    measurementQuality: 90,
    consensus: 70,
    directObservation: 85,
    status: 'Draft',
    sourceIds: ['SRC-0001'],
    locationId: 'LOC-001',
    objectIds: ['OBJ-0001'],
    geometryRefs: [],
    mediaIds: [],
    dependencyIds: [],
    conflictIds: [],
    chronologyTags: [],
    tags: ['test'],
    reviewLog: [],
    version: 1,
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
    createdBy: 'user1',
    updatedBy: '',
    ...overrides,
  };
}

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 'SRC-0001',
    type: 'Journal',
    title: 'The Osiris Shaft: A Reassessment',
    authors: [{ name: 'Jane Doe', orcid: '0000-0000-0000-0000' }],
    year: 2020,
    publication: 'Journal of Egyptian Archaeology',
    doi: '10.1234/example',
    url: 'https://example.com',
    reliability: 90,
    license: 'CC-BY',
    ...overrides,
  } as unknown as Source;
}

describe('Import/Export (M02-T12/T13)', () => {
  describe('exportToJSON', () => {
    it('exports evidence as valid JSON', () => {
      const evidence = [makeEvidence()];
      const json = exportToJSON(evidence);
      const parsed = JSON.parse(json) as Evidence[];
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('EV-000001');
    });
  });

  describe('exportToCSV', () => {
    it('exports evidence as CSV with headers', () => {
      const evidence = [makeEvidence()];
      const csv = exportToCSV(evidence);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('id');
      expect(lines[0]).toContain('title');
      expect(lines[0]).toContain('confidence');
      expect(lines[1]).toContain('EV-000001');
    });

    it('escapes commas in values', () => {
      const evidence = [makeEvidence({ title: 'Title, with comma' })];
      const csv = exportToCSV(evidence);
      expect(csv).toContain('"Title, with comma"');
    });
  });

  describe('exportToBibTeX', () => {
    it('exports sources as BibTeX entries', () => {
      const sources = [makeSource()];
      const bibtex = exportToBibTeX(sources);
      expect(bibtex).toContain('@article');
      expect(bibtex).toContain('title = {The Osiris Shaft: A Reassessment}');
      expect(bibtex).toContain('author = {Jane Doe}');
      expect(bibtex).toContain('year = {2020}');
      expect(bibtex).toContain('doi = {10.1234/example}');
    });

    it('generates BibTeX keys from author and year', () => {
      const sources = [makeSource()];
      const bibtex = exportToBibTeX(sources);
      expect(bibtex).toContain('Doe2020the');
    });
  });

  describe('exportToRIS', () => {
    it('exports sources as RIS entries', () => {
      const sources = [makeSource()];
      const ris = exportToRIS(sources);
      expect(ris).toContain('TY  - JOUR');
      expect(ris).toContain('AU  - Jane Doe');
      expect(ris).toContain('TI  - The Osiris Shaft: A Reassessment');
      expect(ris).toContain('ER  - ');
    });
  });

  describe('exportToGraphML', () => {
    it('exports graph as GraphML XML', () => {
      const evidence = [makeEvidence()];
      const edges = [{ from: 'EV-000001', to: 'EV-000002', relation: 'supports' }];
      const graphml = exportToGraphML(evidence, edges);
      expect(graphml).toContain('<?xml');
      expect(graphml).toContain('<graphml');
      expect(graphml).toContain('EV-000001');
      expect(graphml).toContain('supports');
    });
  });

  describe('importFromJSON', () => {
    it('imports valid JSON evidence', () => {
      const evidence = makeEvidence();
      const json = JSON.stringify(evidence);
      const result = importFromJSON(json);
      expect(result.success).toBe(true);
      expect(result.imported).toHaveLength(1);
      expect(result.imported[0].id).toBe('EV-000001');
    });

    it('returns errors for invalid JSON', () => {
      const result = importFromJSON('not valid json');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns errors for schema validation failures', () => {
      const json = JSON.stringify({ id: 'bad', title: 'missing fields' });
      const result = importFromJSON(json);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('importFromCSV', () => {
    it('imports valid CSV evidence', () => {
      const csv = `id,title,description,category,primaryClass,confidence,status,version,created,updated,sourceIds,objectIds,locationId,tags
EV-000001,Test Evidence,A test,Survey,E2,80,Draft,1,2026-01-01T00:00:00Z,2026-01-01T00:00:00Z,SRC-0001,OBJ-0001,LOC-001,test`;
      const result = importFromCSV(csv);
      expect(result.imported.length).toBeGreaterThan(0);
    });

    it('returns error for empty CSV', () => {
      const result = importFromCSV('');
      expect(result.success).toBe(false);
    });
  });

  describe('generateCitationCFF', () => {
    it('generates CITATION.cff content', () => {
      const sources = [makeSource()];
      const cff = generateCitationCFF(sources);
      expect(cff).toContain('cff-version');
      expect(cff).toContain('GIZA');
    });
  });
});
