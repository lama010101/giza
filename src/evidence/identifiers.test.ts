import { describe, it, expect } from 'vitest';
import {
  normalizeDOI,
  isValidDOI,
  doiURL,
  normalizeISBN,
  isValidISBN,
  normalizeORCID,
  isValidORCID,
  orcidURI,
} from './identifiers';

describe('DOI normalization and validation', () => {
  it('normalizes a bare DOI', () => {
    expect(normalizeDOI('10.1000/182')).toBe('10.1000/182');
  });

  it('normalizes a DOI URL to bare form', () => {
    expect(normalizeDOI('https://doi.org/10.1000/182')).toBe('10.1000/182');
    expect(normalizeDOI('http://doi.org/10.1000/182')).toBe('10.1000/182');
  });

  it('normalizes a doi: prefix', () => {
    expect(normalizeDOI('doi:10.1000/182')).toBe('10.1000/182');
  });

  it('validates a correct DOI', () => {
    expect(isValidDOI('10.1000/182')).toBe(true);
    expect(isValidDOI('10.1016/j.jas.2023.01.001')).toBe(true);
  });

  it('rejects an invalid DOI', () => {
    expect(isValidDOI('not-a-doi')).toBe(false);
    expect(isValidDOI('1000/182')).toBe(false);
  });

  it('returns the full DOI URL', () => {
    expect(doiURL('10.1000/182')).toBe('https://doi.org/10.1000/182');
    expect(doiURL('https://doi.org/10.1000/182')).toBe('https://doi.org/10.1000/182');
  });
});

describe('ISBN normalization and validation', () => {
  it('normalizes ISBN-10 to ISBN-13', () => {
    // ISBN-10: 0-306-40615-2 → ISBN-13: 978-0-306-40615-7
    expect(normalizeISBN('0-306-40615-2')).toBe('9780306406157');
  });

  it('normalizes ISBN-13 (already 13 digits)', () => {
    expect(normalizeISBN('978-0-306-40615-7')).toBe('9780306406157');
  });

  it('validates a correct ISBN-13', () => {
    expect(isValidISBN('978-0-306-40615-7')).toBe(true);
  });

  it('validates a correct ISBN-10 (converts then validates)', () => {
    expect(isValidISBN('0-306-40615-2')).toBe(true);
  });

  it('rejects an invalid ISBN (wrong checksum)', () => {
    expect(isValidISBN('978-0-306-40615-2')).toBe(false);
  });

  it('rejects an invalid ISBN-10 (wrong checksum)', () => {
    expect(isValidISBN('0-306-40615-3')).toBe(false);
  });

  it('rejects an ISBN with wrong length', () => {
    expect(() => normalizeISBN('12345')).toThrow(/Invalid ISBN length/);
  });
});

describe('ORCID normalization and validation', () => {
  // Using a real ORCID format: 0000-0001-2345-6789 (checksum may not be valid)
  // Valid ORCID: 0000-0002-1825-0097 (Josiah Carberry)
  it('normalizes an ORCID URI to bare form', () => {
    expect(normalizeORCID('https://orcid.org/0000-0002-1825-0097')).toBe('0000-0002-1825-0097');
  });

  it('normalizes a bare ORCID', () => {
    expect(normalizeORCID('0000-0002-1825-0097')).toBe('0000-0002-1825-0097');
  });

  it('validates a correct ORCID (Josiah Carberry)', () => {
    expect(isValidORCID('0000-0002-1825-0097')).toBe(true);
    expect(isValidORCID('https://orcid.org/0000-0002-1825-0097')).toBe(true);
  });

  it('rejects an invalid ORCID (wrong checksum)', () => {
    // 0000-0001-2345-6789 is actually valid per ISO 7064 11,2
    // Use 0000-0001-2345-6780 which has a wrong check digit
    expect(isValidORCID('0000-0001-2345-6780')).toBe(false);
  });

  it('rejects an ORCID with wrong length', () => {
    expect(isValidORCID('0000-0001-2345')).toBe(false);
  });

  it('returns the full ORCID URI', () => {
    expect(orcidURI('0000-0002-1825-0097')).toBe('https://orcid.org/0000-0002-1825-0097');
  });
});
