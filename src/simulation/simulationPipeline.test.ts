import { describe, it, expect } from 'vitest';
import {
  runStage,
  runSimulationPipeline,
  getStageDefinition,
  getPipelineStageOrder,
  PIPELINE_STAGES,
} from './simulationPipeline';
import type { SimulationMetadata } from './types';

function makeMetadata(): SimulationMetadata {
  return {
    id: 'sim-001',
    softwareVersion: '1.0.0',
    date: new Date().toISOString(),
    parameters: { simulationType: 'Acoustic', version: 1, parameters: [] },
    author: 'test',
    geometryVersion: '1.0',
    theoryContext: 'test',
    randomSeed: 42,
  };
}

describe('Simulation Pipeline (M10-T01)', () => {
  describe('PIPELINE_STAGES', () => {
    it('defines 6 stages in order', () => {
      expect(PIPELINE_STAGES).toHaveLength(6);
      expect(PIPELINE_STAGES.map((s) => s.id)).toEqual([
        'evidence',
        'geometry',
        'materials',
        'simulation',
        'visualization',
        'analysis',
      ]);
    });
  });

  describe('runStage', () => {
    it('runs the evidence stage', () => {
      const output = runStage({
        stage: 'evidence',
        metadata: makeMetadata(),
        evidenceIds: ['EV-001', 'EV-002'],
      });
      expect(output.status).toBe('completed');
      expect(output.artifacts.evidenceSet).toEqual(['EV-001', 'EV-002']);
    });

    it('runs the geometry stage', () => {
      const output = runStage({
        stage: 'geometry',
        metadata: makeMetadata(),
        geometryVersion: '2.0',
      });
      expect(output.status).toBe('completed');
      expect(output.artifacts.geometryVersion).toBe('2.0');
    });

    it('runs the materials stage', () => {
      const output = runStage({
        stage: 'materials',
        metadata: makeMetadata(),
        materialAssignments: { obj1: 'MAT_TuraLimestone' },
      });
      expect(output.status).toBe('completed');
      expect(output.artifacts.materialCount).toBe(1);
    });

    it('fails for unknown stage', () => {
      const output = runStage({
        stage: 'unknown' as never,
        metadata: makeMetadata(),
      });
      expect(output.status).toBe('failed');
      expect(output.errors[0]).toContain('Unknown stage');
    });
  });

  describe('runSimulationPipeline', () => {
    it('runs all stages to completion', () => {
      const result = runSimulationPipeline(makeMetadata(), {
        evidenceIds: ['EV-001'],
        geometryVersion: '1.0',
        materialAssignments: { obj1: 'MAT_TuraLimestone' },
      });
      expect(result.success).toBe(true);
      expect(result.stages).toHaveLength(6);
      expect(result.finalResult).toBeDefined();
      expect(result.finalResult!.validation.passed).toBe(true);
    });

    it('produces artifacts for each stage', () => {
      const result = runSimulationPipeline(makeMetadata());
      for (const stage of result.stages) {
        expect(stage.status).toBe('completed');
        expect(stage.artifacts).toBeDefined();
      }
    });
  });

  describe('getStageDefinition', () => {
    it('returns stage definition by ID', () => {
      const def = getStageDefinition('evidence');
      expect(def).toBeDefined();
      expect(def!.name).toBe('Evidence Collection');
    });
  });

  describe('getPipelineStageOrder', () => {
    it('returns stage IDs in order', () => {
      expect(getPipelineStageOrder()).toEqual([
        'evidence',
        'geometry',
        'materials',
        'simulation',
        'visualization',
        'analysis',
      ]);
    });
  });
});
