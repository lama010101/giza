/**
 * GPU detection and quality profile selection per M04-T03.
 *
 * Detects GPU capabilities using WEBGL_debug_renderer_info and
 * selects an appropriate quality profile.
 */

export type QualityProfile = 'ultra' | 'high' | 'medium' | 'low';

export interface GPUCapabilities {
  vendor: string;
  renderer: string;
  maxTextureSize: number;
  maxViewportDims: number;
  maxVertexUniformVectors: number;
  maxFragmentUniformVectors: number;
  maxVertexTextureImageUnits: number;
  extensions: string[];
  qualityProfile: QualityProfile;
}

export interface QualitySettings {
  profile: QualityProfile;
  shadowMapSize: number;
  maxAnisotropy: number;
  pixelRatio: number;
  enablePostProcessing: boolean;
  enableShadows: boolean;
  enableBloom: boolean;
  enableSSAO: boolean;
  maxDrawCalls: number;
  maxTriangles: number;
}

export const QUALITY_SETTINGS: Record<QualityProfile, QualitySettings> = {
  ultra: {
    profile: 'ultra',
    shadowMapSize: 2048,
    maxAnisotropy: 16,
    pixelRatio: 2,
    enablePostProcessing: true,
    enableShadows: true,
    enableBloom: true,
    enableSSAO: true,
    maxDrawCalls: 1000,
    maxTriangles: 5_000_000,
  },
  high: {
    profile: 'high',
    shadowMapSize: 2048,
    maxAnisotropy: 8,
    pixelRatio: 2,
    enablePostProcessing: true,
    enableShadows: true,
    enableBloom: true,
    enableSSAO: false,
    maxDrawCalls: 500,
    maxTriangles: 2_000_000,
  },
  medium: {
    profile: 'medium',
    shadowMapSize: 1024,
    maxAnisotropy: 4,
    pixelRatio: 1.5,
    enablePostProcessing: true,
    enableShadows: true,
    enableBloom: false,
    enableSSAO: false,
    maxDrawCalls: 300,
    maxTriangles: 1_000_000,
  },
  low: {
    profile: 'low',
    shadowMapSize: 512,
    maxAnisotropy: 1,
    pixelRatio: 1,
    enablePostProcessing: false,
    enableShadows: false,
    enableBloom: false,
    enableSSAO: false,
    maxDrawCalls: 150,
    maxTriangles: 500_000,
  },
};

/**
 * Detects GPU capabilities from a WebGL context.
 */
export function detectGPUCapabilities(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): GPUCapabilities {
  // Get debug info if available
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
    : String(gl.getParameter(gl.VENDOR));
  const renderer = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));

  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const maxViewportDims = (gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array)[0];
  const maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) as number;
  const maxFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number;
  const maxVertexTextureImageUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) as number;

  const extensions = gl.getSupportedExtensions() ?? [];

  const qualityProfile = selectQualityProfile({
    vendor,
    renderer,
    maxTextureSize,
    maxViewportDims,
    maxVertexUniformVectors,
    maxFragmentUniformVectors,
    maxVertexTextureImageUnits,
    extensions,
  });

  return {
    vendor,
    renderer,
    maxTextureSize,
    maxViewportDims,
    maxVertexUniformVectors,
    maxFragmentUniformVectors,
    maxVertexTextureImageUnits,
    extensions,
    qualityProfile,
  };
}

/**
 * Selects a quality profile based on GPU capabilities.
 */
export function selectQualityProfile(
  capabilities: Omit<GPUCapabilities, 'qualityProfile'>,
): QualityProfile {
  const renderer = capabilities.renderer.toLowerCase();

  // High-end GPUs
  if (
    renderer.includes('rtx') ||
    renderer.includes('radeon rx 6') ||
    renderer.includes('radeon rx 7') ||
    renderer.includes('apple m1') ||
    renderer.includes('apple m2') ||
    renderer.includes('apple m3')
  ) {
    return 'ultra';
  }

  // Mid-range GPUs
  if (
    renderer.includes('gtx 10') ||
    renderer.includes('gtx 16') ||
    renderer.includes('rtx 20') ||
    renderer.includes('radeon rx 5') ||
    renderer.includes('iris xe') ||
    renderer.includes('apple m')
  ) {
    return 'high';
  }

  // Low-end GPUs
  if (
    renderer.includes('intel hd') ||
    renderer.includes('intel uhd') ||
    renderer.includes('mali') ||
    renderer.includes('adreno')
  ) {
    return 'low';
  }

  // Check texture size as a proxy for capability
  if (capabilities.maxTextureSize >= 16384) return 'high';
  if (capabilities.maxTextureSize >= 8192) return 'medium';

  return 'low';
}

/**
 * Returns the quality settings for a profile.
 */
export function getQualitySettings(profile: QualityProfile): QualitySettings {
  return QUALITY_SETTINGS[profile];
}

/**
 * Returns the recommended quality profile for the current device.
 * Uses heuristics when WebGL is not available.
 */
export function getRecommendedProfile(): QualityProfile {
  if (typeof navigator === 'undefined') return 'medium';

  // Check for mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
  if (isMobile) return 'low';

  // Check hardware concurrency
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores >= 8) return 'high';
  if (cores >= 4) return 'medium';

  return 'low';
}
