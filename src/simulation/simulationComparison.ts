/**
 * Simulation comparison mode per M10-T08.
 *
 * Compares simulation results side-by-side, highlighting differences
 * in outputs, parameters, and validation results.
 */

import type { SimulationResult } from './types';

export interface ComparisonEntry {
  name: string;
  valueA: unknown;
  valueB: unknown;
  difference: number | string;
  significant: boolean;
}

export interface SimulationComparison {
  results: ComparisonEntry[];
  parameterDifferences: ComparisonEntry[];
  outputDifferences: ComparisonEntry[];
  validationDifferences: ComparisonEntry[];
  summary: {
    totalParameters: number;
    changedParameters: number;
    totalOutputs: number;
    changedOutputs: number;
    bothPassed: boolean;
  };
}

const SIGNIFICANCE_THRESHOLD = 0.05; // 5% difference is significant

/**
 * Compares two simulation results.
 */
export function compareSimulations(
  resultA: SimulationResult,
  resultB: SimulationResult,
): SimulationComparison {
  const parameterDifferences = compareParameters(resultA, resultB);
  const outputDifferences = compareOutputs(resultA, resultB);
  const validationDifferences = compareValidation(resultA, resultB);

  const changedParams = parameterDifferences.filter((d) => d.significant).length;
  const changedOutputs = outputDifferences.filter((d) => d.significant).length;

  return {
    results: [...parameterDifferences, ...outputDifferences],
    parameterDifferences,
    outputDifferences,
    validationDifferences,
    summary: {
      totalParameters: parameterDifferences.length,
      changedParameters: changedParams,
      totalOutputs: outputDifferences.length,
      changedOutputs: changedOutputs,
      bothPassed: resultA.validation.passed && resultB.validation.passed,
    },
  };
}

function compareParameters(a: SimulationResult, b: SimulationResult): ComparisonEntry[] {
  const entries: ComparisonEntry[] = [];
  const paramsA = new Map(a.metadata.parameters.parameters.map((p) => [p.name, p]));
  const paramsB = new Map(b.metadata.parameters.parameters.map((p) => [p.name, p]));

  const allNames = new Set([...paramsA.keys(), ...paramsB.keys()]);

  for (const name of allNames) {
    const pa = paramsA.get(name);
    const pb = paramsB.get(name);

    if (!pa || !pb) {
      entries.push({
        name,
        valueA: pa?.value ?? 'missing',
        valueB: pb?.value ?? 'missing',
        difference: 'added/removed',
        significant: true,
      });
      continue;
    }

    const valA = typeof pa.value === 'number' ? pa.value : Number(pa.value);
    const valB = typeof pb.value === 'number' ? pb.value : Number(pb.value);

    if (!isNaN(valA) && !isNaN(valB)) {
      const diff = valB - valA;
      const relDiff = valA !== 0 ? Math.abs(diff / valA) : Math.abs(diff);
      entries.push({
        name,
        valueA: valA,
        valueB: valB,
        difference: diff,
        significant: relDiff > SIGNIFICANCE_THRESHOLD,
      });
    } else {
      entries.push({
        name,
        valueA: pa.value,
        valueB: pb.value,
        difference: pa.value === pb.value ? 'same' : 'different',
        significant: pa.value !== pb.value,
      });
    }
  }

  return entries;
}

function compareOutputs(a: SimulationResult, b: SimulationResult): ComparisonEntry[] {
  const entries: ComparisonEntry[] = [];
  const keysA = Object.keys(a.outputs);
  const keysB = Object.keys(b.outputs);
  const allKeys = new Set([...keysA, ...keysB]);

  for (const key of allKeys) {
    const valA = a.outputs[key];
    const valB = b.outputs[key];

    if (valA === undefined || valB === undefined) {
      entries.push({
        name: key,
        valueA: valA ?? 'missing',
        valueB: valB ?? 'missing',
        difference: 'added/removed',
        significant: true,
      });
      continue;
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      const diff = valB - valA;
      const relDiff = valA !== 0 ? Math.abs(diff / valA) : Math.abs(diff);
      entries.push({
        name: key,
        valueA: valA,
        valueB: valB,
        difference: diff,
        significant: relDiff > SIGNIFICANCE_THRESHOLD,
      });
    } else {
      entries.push({
        name: key,
        valueA: valA,
        valueB: valB,
        difference: JSON.stringify(valA) === JSON.stringify(valB) ? 'same' : 'different',
        significant: JSON.stringify(valA) !== JSON.stringify(valB),
      });
    }
  }

  return entries;
}

function compareValidation(a: SimulationResult, b: SimulationResult): ComparisonEntry[] {
  const entries: ComparisonEntry[] = [];

  entries.push({
    name: 'overall-passed',
    valueA: a.validation.passed,
    valueB: b.validation.passed,
    difference: a.validation.passed === b.validation.passed ? 'same' : 'different',
    significant: a.validation.passed !== b.validation.passed,
  });

  const checksA = new Map(a.validation.checks.map((c) => [c.name, c]));
  const checksB = new Map(b.validation.checks.map((c) => [c.name, c]));
  const allNames = new Set([...checksA.keys(), ...checksB.keys()]);

  for (const name of allNames) {
    const ca = checksA.get(name);
    const cb = checksB.get(name);

    if (!ca || !cb) {
      entries.push({
        name: `check:${name}`,
        valueA: ca?.passed ?? 'missing',
        valueB: cb?.passed ?? 'missing',
        difference: 'added/removed',
        significant: true,
      });
      continue;
    }

    entries.push({
      name: `check:${name}`,
      valueA: ca.passed,
      valueB: cb.passed,
      difference: ca.passed === cb.passed ? 'same' : 'different',
      significant: ca.passed !== cb.passed,
    });
  }

  return entries;
}

/**
 * Formats a comparison as a human-readable table.
 */
export function formatComparisonTable(comparison: SimulationComparison): string {
  const lines: string[] = [];

  lines.push('=== Simulation Comparison ===');
  lines.push('');
  lines.push('Parameters:');
  lines.push('  Name | A | B | Diff | Significant');
  for (const entry of comparison.parameterDifferences) {
    lines.push(
      `  ${entry.name} | ${String(entry.valueA)} | ${String(entry.valueB)} | ${String(entry.difference)} | ${entry.significant ? 'YES' : 'no'}`,
    );
  }

  lines.push('');
  lines.push('Outputs:');
  lines.push('  Name | A | B | Diff | Significant');
  for (const entry of comparison.outputDifferences) {
    lines.push(
      `  ${entry.name} | ${String(entry.valueA)} | ${String(entry.valueB)} | ${String(entry.difference)} | ${entry.significant ? 'YES' : 'no'}`,
    );
  }

  lines.push('');
  lines.push('Summary:');
  lines.push(
    `  Parameters: ${comparison.summary.changedParameters}/${comparison.summary.totalParameters} changed`,
  );
  lines.push(
    `  Outputs: ${comparison.summary.changedOutputs}/${comparison.summary.totalOutputs} changed`,
  );
  lines.push(`  Both passed: ${comparison.summary.bothPassed}`);

  return lines.join('\n');
}
