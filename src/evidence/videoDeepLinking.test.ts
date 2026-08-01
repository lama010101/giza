import { describe, it, expect } from 'vitest';
import {
  parseTimeString,
  formatTimeString,
  parseTimestampFragment,
  buildTimestampFragment,
  createVideoDeepLink,
  createLabeledDeepLink,
  extractTimestampFromMedia,
  isValidTimestamp,
  generateVideoToc,
} from './videoDeepLinking';
import type { Media } from '@/schemas/media';

function makeVideo(overrides: Partial<Media> = {}): Media {
  return {
    id: 'MED-0001',
    type: 'Video',
    url: 'https://example.com/video.mp4',
    license: 'CC-BY-4.0',
    credit: 'Test',
    capturedDate: '2024-01-01',
    capturedBy: 'Test',
    evidenceIds: [],
    ...overrides,
  } as Media;
}

describe('Video Deep Linking (M03-T11)', () => {
  describe('parseTimeString', () => {
    it('parses SS format', () => {
      expect(parseTimeString('45')).toBe(45);
    });
    it('parses MM:SS format', () => {
      expect(parseTimeString('5:30')).toBe(330);
    });
    it('parses HH:MM:SS format', () => {
      expect(parseTimeString('1:30:45')).toBe(5445);
    });
    it('returns 0 for invalid', () => {
      expect(parseTimeString('abc')).toBe(0);
    });
  });

  describe('formatTimeString', () => {
    it('formats seconds as MM:SS', () => {
      expect(formatTimeString(330)).toBe('5:30');
    });
    it('formats seconds as HH:MM:SS', () => {
      expect(formatTimeString(5445)).toBe('1:30:45');
    });
  });

  describe('parseTimestampFragment', () => {
    it('parses #t=MM:SS', () => {
      expect(parseTimestampFragment('https://example.com/v.mp4#t=5:30')).toEqual({
        seconds: 330,
        endSeconds: undefined,
      });
    });
    it('parses #t=SS', () => {
      expect(parseTimestampFragment('https://example.com/v.mp4#t=45')).toEqual({
        seconds: 45,
        endSeconds: undefined,
      });
    });
    it('parses range #t=start,end', () => {
      expect(parseTimestampFragment('https://example.com/v.mp4#t=30,60')).toEqual({
        seconds: 30,
        endSeconds: 60,
      });
    });
    it('returns null for no fragment', () => {
      expect(parseTimestampFragment('https://example.com/v.mp4')).toBeNull();
    });
  });

  describe('buildTimestampFragment', () => {
    it('builds fragment from timestamp', () => {
      expect(buildTimestampFragment({ seconds: 330 })).toBe('#t=5:30');
    });
    it('builds range fragment', () => {
      expect(buildTimestampFragment({ seconds: 30, endSeconds: 60 })).toBe('#t=0:30,1:00');
    });
  });

  describe('createVideoDeepLink', () => {
    it('creates a deep link', () => {
      const media = makeVideo();
      const link = createVideoDeepLink(media, { seconds: 330 });
      expect(link).toContain('#t=5:30');
      expect(link).toContain('video.mp4');
    });
  });

  describe('createLabeledDeepLink', () => {
    it('creates a labeled deep link', () => {
      const media = makeVideo();
      const result = createLabeledDeepLink(media, { seconds: 30 }, 'Key moment');
      expect(result.label).toBe('Key moment');
      expect(result.displayTime).toBe('0:30');
      expect(result.url).toContain('#t=0:30');
    });
  });

  describe('extractTimestampFromMedia', () => {
    it('extracts timestamp from video media', () => {
      const media = makeVideo({ url: 'https://example.com/v.mp4#t=2:30' });
      const ts = extractTimestampFromMedia(media);
      expect(ts).toEqual({ seconds: 150, endSeconds: undefined });
    });
    it('returns null for non-video media', () => {
      const media = makeVideo({ type: 'Photograph' });
      expect(extractTimestampFromMedia(media)).toBeNull();
    });
  });

  describe('isValidTimestamp', () => {
    it('validates positive timestamps', () => {
      expect(isValidTimestamp({ seconds: 30 })).toBe(true);
    });
    it('rejects negative timestamps', () => {
      expect(isValidTimestamp({ seconds: -1 })).toBe(false);
    });
    it('rejects end before start', () => {
      expect(isValidTimestamp({ seconds: 60, endSeconds: 30 })).toBe(false);
    });
    it('validates against max duration', () => {
      expect(isValidTimestamp({ seconds: 120 }, 60)).toBe(false);
    });
  });

  describe('generateVideoToc', () => {
    it('generates a table of contents', () => {
      const media = makeVideo();
      const toc = generateVideoToc(media, [
        { seconds: 0, label: 'Introduction' },
        { seconds: 60, label: 'Main content' },
        { seconds: 300, label: 'Conclusion' },
      ]);
      expect(toc).toHaveLength(3);
      expect(toc[0].label).toBe('Introduction');
      expect(toc[1].url).toContain('#t=1:00');
    });
  });
});
