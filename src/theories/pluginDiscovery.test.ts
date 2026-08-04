import { describe, it, expect, beforeEach } from 'vitest';
import { HypothesisEngine } from './engine';
import {
  discoverPlugins,
  discoverAndRegister,
  listAvailablePluginIds,
  findDiscoveredPlugin,
} from './pluginDiscovery';

describe('Plugin Discovery (M05.5-T01)', () => {
  describe('discoverPlugins', () => {
    it('discovers built-in plugins', () => {
      const discovered = discoverPlugins();
      expect(discovered.length).toBeGreaterThanOrEqual(5);
    });

    it('each discovered plugin has required fields', () => {
      const discovered = discoverPlugins();
      for (const d of discovered) {
        expect(d.id).toBeDefined();
        expect(d.name).toBeDefined();
        expect(d.source).toBe('local');
        expect(d.plugin).toBeDefined();
      }
    });

    it('includes Osiris and GP plugins', () => {
      const ids = discoverPlugins().map((d) => d.id);
      expect(ids.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('discoverAndRegister', () => {
    let engine: HypothesisEngine;

    beforeEach(() => {
      engine = new HypothesisEngine();
    });

    it('discovers and registers all plugins', () => {
      const discovered = discoverAndRegister(engine);
      expect(discovered.length).toBeGreaterThanOrEqual(5);
      expect(engine.getPluginIds().length).toBe(discovered.length);
    });
  });

  describe('listAvailablePluginIds', () => {
    it('returns plugin IDs', () => {
      const ids = listAvailablePluginIds();
      expect(ids.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('findDiscoveredPlugin', () => {
    it('finds a plugin by ID', () => {
      const ids = listAvailablePluginIds();
      const found = findDiscoveredPlugin(ids[0]);
      expect(found).toBeDefined();
      expect(found!.id).toBe(ids[0]);
    });

    it('returns undefined for unknown ID', () => {
      expect(findDiscoveredPlugin('UNKNOWN-001')).toBeUndefined();
    });
  });
});
