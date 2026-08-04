import { describe, it, expect } from 'vitest';
import {
  BUILD_CONFIGS,
  getViteBuildOptions,
  DEFAULT_CDN_CONFIG,
  DEPLOYMENT_STEPS,
  getDeploymentSteps,
  ENV_TEMPLATES,
  generateManifestPlaceholder,
} from './deploymentConfig';

describe('Deployment Configuration (M12-T07)', () => {
  describe('BUILD_CONFIGS', () => {
    it('defines configs for development, staging, production', () => {
      expect(BUILD_CONFIGS.development).toBeDefined();
      expect(BUILD_CONFIGS.staging).toBeDefined();
      expect(BUILD_CONFIGS.production).toBeDefined();
    });

    it('development has source maps and no minification', () => {
      expect(BUILD_CONFIGS.development.sourceMaps).toBe(true);
      expect(BUILD_CONFIGS.development.minify).toBe(false);
    });

    it('production has minification and no source maps', () => {
      expect(BUILD_CONFIGS.production.sourceMaps).toBe(false);
      expect(BUILD_CONFIGS.production.minify).toBe(true);
    });

    it('production has CDN URL', () => {
      expect(BUILD_CONFIGS.production.cdnUrl).toBeDefined();
      expect(BUILD_CONFIGS.production.cdnUrl).not.toBeNull();
    });

    it('development has no CDN URL', () => {
      expect(BUILD_CONFIGS.development.cdnUrl).toBeNull();
    });
  });

  describe('getViteBuildOptions', () => {
    it('returns valid Vite build options', () => {
      const options = getViteBuildOptions(BUILD_CONFIGS.production);
      expect(options.outDir).toBe('dist');
      expect(options.assetsDir).toBe('assets');
      expect(options.rollupOptions.output.manualChunks).toBeDefined();
    });

    it('production uses terser minification', () => {
      const options = getViteBuildOptions(BUILD_CONFIGS.production);
      expect(options.minify).toBe('terser');
    });

    it('development does not minify', () => {
      const options = getViteBuildOptions(BUILD_CONFIGS.development);
      expect(options.minify).toBe(false);
    });

    it('has manual chunks for vendor splitting', () => {
      const options = getViteBuildOptions(BUILD_CONFIGS.production);
      const chunks = options.rollupOptions.output.manualChunks;
      expect(chunks['vendor-react']).toBeDefined();
      expect(chunks['vendor-three']).toBeDefined();
      expect(chunks['vendor-state']).toBeDefined();
    });

    it('uses hashed file names in production', () => {
      const options = getViteBuildOptions(BUILD_CONFIGS.production);
      expect(options.rollupOptions.output.assetFileNames).toContain('[hash]');
      expect(options.rollupOptions.output.chunkFileNames).toContain('[hash]');
      expect(options.rollupOptions.output.entryFileNames).toContain('[hash]');
    });
  });

  describe('DEFAULT_CDN_CONFIG', () => {
    it('has CDN provider and URL', () => {
      expect(DEFAULT_CDN_CONFIG.provider).toBeDefined();
      expect(DEFAULT_CDN_CONFIG.url).toBeDefined();
    });

    it('has long cache for hashed assets', () => {
      expect(DEFAULT_CDN_CONFIG.cacheMaxAge).toBeGreaterThanOrEqual(86400);
    });

    it('has short cache for HTML', () => {
      expect(DEFAULT_CDN_CONFIG.cacheMaxAgeHTML).toBeLessThan(DEFAULT_CDN_CONFIG.cacheMaxAge);
    });

    it('has security headers', () => {
      expect(DEFAULT_CDN_CONFIG.headers['X-Content-Type-Options']).toBeDefined();
      expect(DEFAULT_CDN_CONFIG.headers['X-Frame-Options']).toBeDefined();
      expect(DEFAULT_CDN_CONFIG.headers['X-XSS-Protection']).toBeDefined();
    });

    it('has compression enabled', () => {
      expect(DEFAULT_CDN_CONFIG.enableCompression).toBe(true);
      expect(DEFAULT_CDN_CONFIG.enableBrotli).toBe(true);
    });
  });

  describe('DEPLOYMENT_STEPS', () => {
    it('includes all required steps', () => {
      const names = DEPLOYMENT_STEPS.map((s) => s.name);
      expect(names).toContain('typecheck');
      expect(names).toContain('lint');
      expect(names).toContain('test');
      expect(names).toContain('governance');
      expect(names).toContain('build');
      expect(names).toContain('deploy');
    });

    it('every step has a command and description', () => {
      for (const step of DEPLOYMENT_STEPS) {
        expect(step.command.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getDeploymentSteps', () => {
    it('excludes deploy step for development', () => {
      const steps = getDeploymentSteps('development');
      expect(steps.some((s) => s.name === 'deploy')).toBe(false);
    });

    it('includes deploy step for production', () => {
      const steps = getDeploymentSteps('production');
      expect(steps.some((s) => s.name === 'deploy')).toBe(true);
    });

    it('includes deploy step for staging', () => {
      const steps = getDeploymentSteps('staging');
      expect(steps.some((s) => s.name === 'deploy')).toBe(true);
    });
  });

  describe('ENV_TEMPLATES', () => {
    it('has templates for all environments', () => {
      expect(ENV_TEMPLATES.development).toBeDefined();
      expect(ENV_TEMPLATES.staging).toBeDefined();
      expect(ENV_TEMPLATES.production).toBeDefined();
    });

    it('production has API and CDN URLs', () => {
      expect(ENV_TEMPLATES.production.VITE_API_URL).toContain('https://');
      expect(ENV_TEMPLATES.production.VITE_CDN_URL).toContain('https://');
    });

    it('development uses localhost', () => {
      expect(ENV_TEMPLATES.development.VITE_API_URL).toContain('localhost');
    });
  });

  describe('generateManifestPlaceholder', () => {
    it('returns an empty manifest object', () => {
      const manifest = generateManifestPlaceholder();
      expect(manifest).toEqual({});
    });
  });
});
