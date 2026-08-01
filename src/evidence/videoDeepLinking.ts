/**
 * Video timestamp deep-linking per M03-T11.
 *
 * Provides utilities for creating and parsing timestamped deep links
 * to video media. Supports `#t=MM:SS` and `#t=SS` URL fragments per
 * the W3C Media Fragments URI 1.0 spec.
 */

import type { Media } from '@/schemas/media';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VideoTimestamp {
  /** Time in seconds from the start of the video. */
  seconds: number;
  /** Optional end time in seconds (for range links). */
  endSeconds?: number;
}

export interface DeepLinkOptions {
  /** Whether to include the media ID in the fragment. */
  includeMediaId?: boolean;
  /** Optional label for the timestamp. */
  label?: string;
}

// ─── Timestamp parsing ───────────────────────────────────────────────────────

/**
 * Parses a time string in MM:SS or HH:MM:SS format to seconds.
 */
export function parseTimeString(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

/**
 * Formats seconds as MM:SS or HH:MM:SS.
 */
export function formatTimeString(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Parses a `#t=` fragment from a URL to extract the timestamp.
 */
export function parseTimestampFragment(url: string): VideoTimestamp | null {
  const match = url.match(/#t=([\d:]+)(?:,([\d:]+))?/);
  if (!match) return null;
  const seconds = parseTimeString(match[1]);
  const endSeconds = match[2] ? parseTimeString(match[2]) : undefined;
  return { seconds, endSeconds };
}

/**
 * Builds a `#t=` fragment string from a timestamp.
 */
export function buildTimestampFragment(timestamp: VideoTimestamp): string {
  const start = formatTimeString(timestamp.seconds);
  if (timestamp.endSeconds !== undefined) {
    const end = formatTimeString(timestamp.endSeconds);
    return `#t=${start},${end}`;
  }
  return `#t=${start}`;
}

// ─── Deep link generation ────────────────────────────────────────────────────

/**
 * Creates a deep link to a specific timestamp in a video.
 */
export function createVideoDeepLink(
  media: Media,
  timestamp: VideoTimestamp,
  _options: DeepLinkOptions = {},
): string {
  const fragment = buildTimestampFragment(timestamp);
  const baseUrl = media.url || `media://${media.id}`;
  const separator = baseUrl.includes('#') ? '&' : '#';
  return `${baseUrl}${separator}t=${fragment.replace('#t=', '')}`;
}

/**
 * Creates a deep link with a label (for display in UI).
 */
export function createLabeledDeepLink(
  media: Media,
  timestamp: VideoTimestamp,
  label: string,
): { url: string; label: string; displayTime: string } {
  return {
    url: createVideoDeepLink(media, timestamp),
    label,
    displayTime: formatTimeString(timestamp.seconds),
  };
}

/**
 * Extracts all timestamp deep links from a video's URL.
 */
export function extractTimestampFromMedia(media: Media): VideoTimestamp | null {
  if (media.type !== 'Video') return null;
  return parseTimestampFragment(media.url);
}

/**
 * Validates that a timestamp is within a valid range (0 to maxDuration).
 */
export function isValidTimestamp(timestamp: VideoTimestamp, maxDuration?: number): boolean {
  if (timestamp.seconds < 0) return false;
  if (timestamp.endSeconds !== undefined) {
    if (timestamp.endSeconds <= timestamp.seconds) return false;
    if (maxDuration !== undefined && timestamp.endSeconds > maxDuration) return false;
  }
  if (maxDuration !== undefined && timestamp.seconds > maxDuration) return false;
  return true;
}

/**
 * Generates a table of contents from a list of timestamps.
 */
export interface TocEntry {
  timestamp: VideoTimestamp;
  label: string;
  url: string;
}

export function generateVideoToc(
  media: Media,
  entries: { seconds: number; label: string }[],
): TocEntry[] {
  return entries.map((entry) => ({
    timestamp: { seconds: entry.seconds },
    label: entry.label,
    url: createVideoDeepLink(media, { seconds: entry.seconds }),
  }));
}
