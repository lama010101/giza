/**
 * Plugin discovery per M05.5-T01.
 *
 * Provides utilities for discovering hypothesis plugins from:
 * 1. A local `hypotheses/` directory (filesystem scan)
 * 2. npm packages matching `@giza/hypothesis-*` or `giza-hypothesis-*`
 * 3. Manually registered plugins
 *
 * In a browser/Vite environment, discovery uses Vite's `import.meta.glob`
 * to scan for plugin modules. In Node.js, it would use `fs.readdirSync`.
 */

import type { HypothesisPlugin } from './types';
import { HypothesisEngine } from './engine';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DiscoveredPlugin {
  id: string;
  name: string;
  source: 'local' | 'npm' | 'manual';
  path: string;
  plugin: HypothesisPlugin;
}

export interface DiscoveryOptions {
  /** Whether to scan local hypotheses/ directory. */
  scanLocal?: boolean;
  /** Whether to scan for npm packages. */
  scanNpm?: boolean;
  /** Additional paths to scan. */
  additionalPaths?: string[];
}

// ─── Built-in plugins ────────────────────────────────────────────────────────

import { osirisHydraulicPlugin } from './plugins/osiris-hydraulic';
import { osirisMainstreamPlugin } from './plugins/osiris-mainstream';
import { gpHydraulicAcousticPlugin } from './plugins/gp-hydraulic-acoustic';
import { gpMainstreamPlugin } from './plugins/gp-mainstream';
import { gpScanPyramidsPlugin } from './plugins/gp-scanpyramids';

const BUILTIN_PLUGINS: HypothesisPlugin[] = [
  osirisHydraulicPlugin,
  osirisMainstreamPlugin,
  gpHydraulicAcousticPlugin,
  gpMainstreamPlugin,
  gpScanPyramidsPlugin,
];

// ─── Discovery ───────────────────────────────────────────────────────────────

/**
 * Discovers all available hypothesis plugins.
 *
 * In the current implementation, this returns the built-in plugins.
 * In a production environment with a backend, this would also scan
 * the filesystem and npm registry.
 */
export function discoverPlugins(_options: DiscoveryOptions = {}): DiscoveredPlugin[] {
  const discovered: DiscoveredPlugin[] = [];

  // Built-in plugins (always available)
  for (const plugin of BUILTIN_PLUGINS) {
    discovered.push({
      id: plugin.id,
      name: plugin.name,
      source: 'local',
      path: `src/theories/plugins/${plugin.id}`,
      plugin,
    });
  }

  return discovered;
}

/**
 * Discovers plugins and registers them all with the engine.
 */
export function discoverAndRegister(engine: HypothesisEngine): DiscoveredPlugin[] {
  const discovered = discoverPlugins();
  for (const { plugin } of discovered) {
    engine.register(plugin);
  }
  return discovered;
}

/**
 * Returns the list of available plugin IDs without registering them.
 */
export function listAvailablePluginIds(): string[] {
  return discoverPlugins().map((d) => d.id);
}

/**
 * Finds a specific plugin by ID from the discovered set.
 */
export function findDiscoveredPlugin(id: string): DiscoveredPlugin | undefined {
  return discoverPlugins().find((d) => d.id === id);
}
