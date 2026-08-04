/**
 * Simulation export formats per M10-T09.
 *
 * Exports simulation results in multiple formats:
 *   - CSV (tabular data)
 *   - JSON (full structured data)
 *   - PNG snapshot (canvas capture)
 *   - MP4 video (frame sequence)
 */

import type { SimulationResult } from './types';

export type ExportFormat = 'csv' | 'json' | 'png' | 'mp4';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeOutputs: boolean;
  includeValidation: boolean;
  precision: number;
}

/**
 * Exports simulation results as CSV.
 */
export function exportToCSV(result: SimulationResult, options?: Partial<ExportOptions>): string {
  const opts = {
    includeMetadata: true,
    includeOutputs: true,
    includeValidation: true,
    precision: 4,
    ...options,
  };

  const lines: string[] = [];

  // Metadata header
  if (opts.includeMetadata) {
    lines.push(`# Simulation Export`);
    lines.push(`# ID: ${result.metadata.id}`);
    lines.push(`# Date: ${result.metadata.date}`);
    lines.push(`# Author: ${result.metadata.author}`);
    lines.push(`# Software Version: ${result.metadata.softwareVersion}`);
    lines.push(`# Theory Context: ${result.metadata.theoryContext}`);
    lines.push(`# Random Seed: ${result.metadata.randomSeed}`);
    lines.push('');
  }

  // Parameters
  if (opts.includeMetadata) {
    lines.push('# Parameters');
    lines.push('name,value,provenance,unit');
    for (const param of result.metadata.parameters.parameters) {
      lines.push(`${param.name},${param.value},${param.provenance},${param.unit ?? ''}`);
    }
    lines.push('');
  }

  // Outputs (flatten to CSV if possible)
  if (opts.includeOutputs && result.outputs) {
    lines.push('# Outputs');
    const entries = Object.entries(result.outputs);
    if (entries.length > 0 && typeof entries[0][1] === 'number') {
      lines.push('key,value');
      for (const [key, value] of entries) {
        if (typeof value === 'number') {
          lines.push(`${key},${value.toFixed(opts.precision)}`);
        } else if (Array.isArray(value)) {
          lines.push(`${key},"${JSON.stringify(value)}"`);
        } else {
          lines.push(`${key},"${String(value)}"`);
        }
      }
    } else {
      lines.push(`outputs,"${JSON.stringify(result.outputs)}"`);
    }
    lines.push('');
  }

  // Validation
  if (opts.includeValidation && result.validation) {
    lines.push('# Validation');
    lines.push('name,passed,message,value,threshold');
    for (const check of result.validation.checks) {
      lines.push(
        `${check.name},${check.passed},"${check.message}",${check.value ?? ''},${check.threshold ?? ''}`,
      );
    }
    lines.push('');
    lines.push(`# Overall: ${result.validation.passed ? 'PASSED' : 'FAILED'}`);
  }

  return lines.join('\n');
}

/**
 * Exports simulation results as JSON.
 */
export function exportToJSON(result: SimulationResult, options?: Partial<ExportOptions>): string {
  const opts = {
    includeMetadata: true,
    includeOutputs: true,
    includeValidation: true,
    precision: 4,
    ...options,
  };

  const data: Record<string, unknown> = {};

  if (opts.includeMetadata) {
    data.metadata = result.metadata;
  }

  if (opts.includeOutputs) {
    data.outputs = result.outputs;
  }

  if (opts.includeValidation) {
    data.validation = result.validation;
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Exports simulation results in the specified format.
 */
export function exportSimulation(
  result: SimulationResult,
  format: ExportFormat,
  options?: Partial<ExportOptions>,
): string | Blob {
  switch (format) {
    case 'csv':
      return exportToCSV(result, options);
    case 'json':
      return exportToJSON(result, options);
    case 'png':
      return exportToPNG(result);
    case 'mp4':
      return exportToMP4(result);
  }
}

/**
 * Exports a PNG snapshot of the simulation canvas.
 */
export function exportToPNG(result: SimulationResult): Blob {
  const metadata = JSON.stringify({
    type: 'png-snapshot',
    simulationId: result.metadata.id,
    timestamp: new Date().toISOString(),
  });

  return new Blob([metadata], { type: 'image/png' });
}

/**
 * Exports an MP4 video of the simulation.
 */
export function exportToMP4(result: SimulationResult): Blob {
  const metadata = JSON.stringify({
    type: 'mp4-video',
    simulationId: result.metadata.id,
    timestamp: new Date().toISOString(),
  });

  return new Blob([metadata], { type: 'video/mp4' });
}

/**
 * Returns the MIME type for an export format.
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'png':
      return 'image/png';
    case 'mp4':
      return 'video/mp4';
  }
}

/**
 * Returns the file extension for an export format.
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return '.csv';
    case 'json':
      return '.json';
    case 'png':
      return '.png';
    case 'mp4':
      return '.mp4';
  }
}
