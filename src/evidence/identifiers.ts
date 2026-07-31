/**
 * Identifier normalization and validation utilities per
 * GIZA - 09 Sources & Bibliography Standard §9 (DOI), §10 (ISBN), §11 (ORCID).
 */

// --- DOI ------------------------------------------------------------------

/**
 * Normalizes a DOI to its canonical URL form: `https://doi.org/10.xxxx/...`
 * Per §9: DOIs are never manually edited after validation.
 */
export function normalizeDOI(doi: string): string {
  const trimmed = doi.trim();

  // Already a URL — extract the DOI part
  if (trimmed.startsWith('https://doi.org/')) {
    return trimmed.slice('https://doi.org/'.length);
  }
  if (trimmed.startsWith('http://doi.org/')) {
    return trimmed.slice('http://doi.org/'.length);
  }
  if (trimmed.startsWith('doi:')) {
    return trimmed.slice(4);
  }
  if (trimmed.startsWith('DOI:')) {
    return trimmed.slice(4);
  }

  return trimmed;
}

/**
 * Validates a DOI format. Per §9: validated against resolver on import.
 * Format check only here — resolver validation is an async operation
 * deferred to the import workflow.
 */
export function isValidDOI(doi: string): boolean {
  const normalized = normalizeDOI(doi);
  // DOI pattern: 10.NNNN/... where NNNN is 4+ digits
  return /^10\.\d{4,}/.test(normalized);
}

/**
 * Returns the full DOI URL for display/linking.
 */
export function doiURL(doi: string): string {
  return `https://doi.org/${normalizeDOI(doi)}`;
}

// --- ISBN -----------------------------------------------------------------

/**
 * Normalizes an ISBN-10 or ISBN-13 to canonical ISBN-13 form.
 * Per §10: both formats accepted, normalized to ISBN-13, checksum validated.
 */
export function normalizeISBN(isbn: string): string {
  const cleaned = isbn.replace(/[-\s]/g, '').replace(/^ISBN[:\s]*/i, '');

  if (cleaned.length === 10) {
    return isbn10To13(cleaned);
  }
  if (cleaned.length === 13) {
    return cleaned;
  }

  throw new Error(`Invalid ISBN length: ${isbn} (expected 10 or 13 digits)`);
}

/**
 * Converts an ISBN-10 to ISBN-13 by prepending 978 and recalculating the checksum.
 */
function isbn10To13(isbn10: string): string {
  // Validate ISBN-10 checksum first
  if (!isValidISBN10(isbn10)) {
    throw new Error(`Invalid ISBN-10 checksum: ${isbn10}`);
  }

  const body = `978${isbn10.slice(0, 9)}`;
  const checksum = isbn13Checksum(body);
  return `${body}${checksum}`;
}

/**
 * Validates an ISBN-10 checksum.
 */
function isValidISBN10(isbn10: string): boolean {
  if (isbn10.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(isbn10[i], 10);
    if (isNaN(digit)) return false;
    sum += digit * (10 - i);
  }
  const last = isbn10[9].toUpperCase();
  const lastVal = last === 'X' ? 10 : parseInt(last, 10);
  if (isNaN(lastVal)) return false;
  sum += lastVal;
  return sum % 11 === 0;
}

/**
 * Computes the ISBN-13 checksum digit.
 */
function isbn13Checksum(body12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(body12[i], 10);
    if (isNaN(digit)) throw new Error(`Invalid ISBN digit at position ${i}: ${body12[i]}`);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  const remainder = sum % 10;
  const checksum = remainder === 0 ? 0 : 10 - remainder;
  return String(checksum);
}

/**
 * Validates an ISBN (10 or 13) with checksum verification.
 */
export function isValidISBN(isbn: string): boolean {
  try {
    const normalized = normalizeISBN(isbn);
    if (normalized.length !== 13) return false;
    const body = normalized.slice(0, 12);
    const expected = isbn13Checksum(body);
    return normalized[12] === expected;
  } catch {
    return false;
  }
}

// --- ORCID ----------------------------------------------------------------

/**
 * Normalizes an ORCID to its canonical URI form: `https://orcid.org/0000-...`
 * Per §11: normalized to URI form, checksum validated, optional but encouraged.
 */
export function normalizeORCID(orcid: string): string {
  const trimmed = orcid.trim();

  if (trimmed.startsWith('https://orcid.org/')) {
    return trimmed.slice('https://orcid.org/'.length);
  }
  if (trimmed.startsWith('http://orcid.org/')) {
    return trimmed.slice('http://orcid.org/'.length);
  }

  return trimmed;
}

/**
 * Validates an ORCID ID format and checksum.
 * ORCID IDs are 16-digit numbers in the format XXXX-XXXX-XXXX-XXXX.
 * The last digit is a checksum (0-9 or X) using ISO 7064 11,2.
 */
export function isValidORCID(orcid: string): boolean {
  const normalized = normalizeORCID(orcid);
  const cleaned = normalized.replace(/-/g, '');

  if (!/^\d{15}[\dX]$/.test(cleaned)) return false;

  // ISO 7064 11,2 checksum verification
  let total = 0;
  for (let i = 0; i < 15; i++) {
    const digit = parseInt(cleaned[i], 10);
    total = (total + digit) * 2;
  }
  const remainder = total % 11;
  const expected = (12 - remainder) % 11;
  const checkChar = cleaned[15];
  const checkVal = checkChar === 'X' ? 10 : parseInt(checkChar, 10);

  return expected === checkVal;
}

/**
 * Returns the full ORCID URI for display/linking.
 */
export function orcidURI(orcid: string): string {
  return `https://orcid.org/${normalizeORCID(orcid)}`;
}
