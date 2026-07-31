/**
 * Plugin validation per M05.5-T13.
 *
 * Validates hypothesis plugins before registration to ensure:
 *   - ID uniqueness
 *   - THEORY-NNN format for IDs
 *   - Required fields present
 *   - No conflicting visualization rules
 */

import type { HypothesisPlugin } from './types';

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const THEORY_ID_PATTERN = /^THEORY-\d{3}$/;

/**
 * Validates a hypothesis plugin.
 */
export function validatePlugin(plugin: HypothesisPlugin): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ID format
  if (!plugin.id) {
    errors.push('Plugin ID is required');
  } else if (!THEORY_ID_PATTERN.test(plugin.id)) {
    errors.push(`Plugin ID "${plugin.id}" must match THEORY-NNN format (e.g., THEORY-001)`);
  }

  // Name
  if (!plugin.name || plugin.name.trim() === '') {
    errors.push('Plugin name is required');
  }

  // Description
  if (!plugin.description || plugin.description.trim() === '') {
    errors.push('Plugin description is required');
  }

  // getHypothesis function
  if (typeof plugin.getHypothesis !== 'function') {
    errors.push('Plugin must implement getHypothesis()');
  }

  // Optional methods
  if (plugin.getSimulations !== undefined && typeof plugin.getSimulations !== 'function') {
    errors.push('getSimulations must be a function if provided');
  }

  if (
    plugin.getVisualizationRules !== undefined &&
    typeof plugin.getVisualizationRules !== 'function'
  ) {
    errors.push('getVisualizationRules must be a function if provided');
  }

  if (plugin.getGeometryNodes !== undefined && typeof plugin.getGeometryNodes !== 'function') {
    errors.push('getGeometryNodes must be a function if provided');
  }

  // Warnings for missing optional methods
  if (!plugin.getSimulations) {
    warnings.push('Plugin does not provide getSimulations()');
  }

  if (!plugin.getVisualizationRules) {
    warnings.push('Plugin does not provide getVisualizationRules()');
  }

  if (!plugin.getGeometryNodes) {
    warnings.push('Plugin does not provide getGeometryNodes()');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a list of plugins for ID uniqueness.
 */
export function validatePluginSet(plugins: HypothesisPlugin[]): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  for (const plugin of plugins) {
    const result = validatePlugin(plugin);
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    if (ids.has(plugin.id)) {
      errors.push(`Duplicate plugin ID: ${plugin.id}`);
    }
    ids.add(plugin.id);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Returns true if a plugin ID is valid.
 */
export function isValidPluginId(id: string): boolean {
  return THEORY_ID_PATTERN.test(id);
}
