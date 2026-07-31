/**
 * Debug mode overlay per M04-T07.
 *
 * Provides 11 debug displays for the developer/debug overlay:
 *   1. FPS counter
 *   2. Draw call count
 *   3. Triangle count
 *   4. Memory usage
 *   5. Scene graph stats
 *   6. LOD distribution
 *   7. Bounding box visualization
 *   8. Wireframe mode
 *   9. Normal view
 *  10. Texture coordinate view
 *  11. Evidence coverage heatmap
 */

export type DebugDisplay =
  | 'fps'
  | 'draw-calls'
  | 'triangles'
  | 'memory'
  | 'scene-stats'
  | 'lod-distribution'
  | 'bounding-boxes'
  | 'wireframe'
  | 'normals'
  | 'texcoords'
  | 'evidence-coverage';

export const ALL_DEBUG_DISPLAYS: DebugDisplay[] = [
  'fps',
  'draw-calls',
  'triangles',
  'memory',
  'scene-stats',
  'lod-distribution',
  'bounding-boxes',
  'wireframe',
  'normals',
  'texcoords',
  'evidence-coverage',
];

export interface DebugOverlayState {
  enabled: boolean;
  activeDisplays: Set<DebugDisplay>;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  fontSize: number;
  backgroundOpacity: number;
}

export interface DebugStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  jsHeapUsed: number;
  jsHeapTotal: number;
  sceneNodes: number;
  visibleNodes: number;
  lodDistribution: Record<string, number>;
  evidenceCoverage: number;
}

class DebugOverlayManager {
  private state: DebugOverlayState = {
    enabled: false,
    activeDisplays: new Set(),
    position: 'top-left',
    fontSize: 12,
    backgroundOpacity: 0.7,
  };

  private stats: DebugStats = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    jsHeapUsed: 0,
    jsHeapTotal: 0,
    sceneNodes: 0,
    visibleNodes: 0,
    lodDistribution: {},
    evidenceCoverage: 0,
  };

  private frameTimes: number[] = [];

  /**
   * Enables or disables the debug overlay.
   */
  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * Toggles a specific debug display.
   */
  toggleDisplay(display: DebugDisplay): void {
    if (this.state.activeDisplays.has(display)) {
      this.state.activeDisplays.delete(display);
    } else {
      this.state.activeDisplays.add(display);
    }
  }

  /**
   * Enables all debug displays.
   */
  enableAll(): void {
    this.state.activeDisplays = new Set(ALL_DEBUG_DISPLAYS);
  }

  /**
   * Disables all debug displays.
   */
  disableAll(): void {
    this.state.activeDisplays.clear();
  }

  /**
   * Returns the active displays.
   */
  getActiveDisplays(): DebugDisplay[] {
    return ALL_DEBUG_DISPLAYS.filter((d) => this.state.activeDisplays.has(d));
  }

  /**
   * Updates stats for the current frame.
   */
  updateStats(stats: Partial<DebugStats>): void {
    this.stats = { ...this.stats, ...stats };
  }

  /**
   * Records a frame time for FPS calculation.
   */
  recordFrame(deltaTime: number): void {
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > 60) this.frameTimes.shift();
    this.stats.frameTime = deltaTime;
    this.stats.fps = Math.round(1000 / deltaTime);
  }

  /**
   * Returns the current stats.
   */
  getStats(): DebugStats {
    return { ...this.stats };
  }

  /**
   * Returns the overlay state.
   */
  getState(): DebugOverlayState {
    return { ...this.state, activeDisplays: new Set(this.state.activeDisplays) };
  }

  /**
   * Renders the debug overlay as text lines.
   */
  renderOverlay(): string[] {
    if (!this.state.enabled) return [];

    const lines: string[] = [];
    const active = this.getActiveDisplays();

    for (const display of active) {
      lines.push(this.renderDisplay(display));
    }

    return lines;
  }

  private renderDisplay(display: DebugDisplay): string {
    switch (display) {
      case 'fps':
        return `FPS: ${this.stats.fps} (${this.stats.frameTime.toFixed(1)}ms)`;
      case 'draw-calls':
        return `Draw Calls: ${this.stats.drawCalls}`;
      case 'triangles':
        return `Triangles: ${this.stats.triangles.toLocaleString()}`;
      case 'memory':
        return `Memory: ${(this.stats.jsHeapUsed / 1048576).toFixed(1)}MB / ${(this.stats.jsHeapTotal / 1048576).toFixed(1)}MB`;
      case 'scene-stats':
        return `Scene: ${this.stats.sceneNodes} nodes, ${this.stats.visibleNodes} visible`;
      case 'lod-distribution': {
        const dist = Object.entries(this.stats.lodDistribution)
          .map(([lod, count]) => `${lod}:${count}`)
          .join(' ');
        return `LOD: ${dist}`;
      }
      case 'bounding-boxes':
        return `Bounding Boxes: ON`;
      case 'wireframe':
        return `Wireframe: ON`;
      case 'normals':
        return `Normal View: ON`;
      case 'texcoords':
        return `TexCoord View: ON`;
      case 'evidence-coverage':
        return `Evidence Coverage: ${this.stats.evidenceCoverage.toFixed(1)}%`;
    }
  }

  /**
   * Resets the overlay. Intended for testing.
   */
  _resetForTesting(): void {
    this.state = {
      enabled: false,
      activeDisplays: new Set(),
      position: 'top-left',
      fontSize: 12,
      backgroundOpacity: 0.7,
    };
    this.stats = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
      jsHeapUsed: 0,
      jsHeapTotal: 0,
      sceneNodes: 0,
      visibleNodes: 0,
      lodDistribution: {},
      evidenceCoverage: 0,
    };
    this.frameTimes = [];
  }
}

export const debugOverlay = new DebugOverlayManager();
