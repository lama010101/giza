/**
 * Scene streaming system per M05-T04.
 *
 * Loads and unloads scene graph nodes based on camera proximity.
 * Supports pinning (keeping nodes loaded regardless of distance)
 * and configurable load/unload distances.
 */

import type { SceneGraph } from './sceneGraph';

export interface StreamingConfig {
  loadDistance: number;
  unloadDistance: number;
  maxLoadedNodes: number;
  pinByDefault: boolean;
}

export interface StreamingState {
  loadedNodeIds: Set<string>;
  pinnedNodeIds: Set<string>;
  pendingLoads: Set<string>;
  pendingUnloads: Set<string>;
}

class SceneStreamer {
  private config: StreamingConfig = {
    loadDistance: 200,
    unloadDistance: 300,
    maxLoadedNodes: 100,
    pinByDefault: false,
  };

  private state: StreamingState = {
    loadedNodeIds: new Set(),
    pinnedNodeIds: new Set(),
    pendingLoads: new Set(),
    pendingUnloads: new Set(),
  };

  /**
   * Updates the streaming configuration.
   */
  setConfig(config: Partial<StreamingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): StreamingConfig {
    return { ...this.config };
  }

  /**
   * Pins a node so it stays loaded regardless of distance.
   */
  pin(nodeId: string): void {
    this.state.pinnedNodeIds.add(nodeId);
  }

  /**
   * Unpins a node.
   */
  unpin(nodeId: string): void {
    this.state.pinnedNodeIds.delete(nodeId);
  }

  isPinned(nodeId: string): boolean {
    return this.state.pinnedNodeIds.has(nodeId);
  }

  /**
   * Determines which nodes should be loaded/unloaded based on camera position.
   */
  update(
    graph: SceneGraph,
    cameraPosition: { x: number; y: number; z: number },
  ): { toLoad: string[]; toUnload: string[] } {
    const allNodes = graph.getAllNodes();
    const toLoad: string[] = [];
    const toUnload: string[] = [];

    for (const node of allNodes) {
      const pos = node.localTransform.position;
      const dx = pos.x - cameraPosition.x;
      const dy = pos.y - cameraPosition.y;
      const dz = pos.z - cameraPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const isLoaded = this.state.loadedNodeIds.has(node.id);
      const isPinned = this.state.pinnedNodeIds.has(node.id);

      if (isPinned) {
        if (!isLoaded) toLoad.push(node.id);
        continue;
      }

      if (distance <= this.config.loadDistance && !isLoaded) {
        if (this.state.loadedNodeIds.size < this.config.maxLoadedNodes) {
          toLoad.push(node.id);
        }
      } else if (distance > this.config.unloadDistance && isLoaded) {
        toUnload.push(node.id);
      }
    }

    // Update state
    for (const id of toLoad) this.state.loadedNodeIds.add(id);
    for (const id of toUnload) this.state.loadedNodeIds.delete(id);

    return { toLoad, toUnload };
  }

  /**
   * Returns the current streaming state.
   */
  getState(): StreamingState {
    return {
      loadedNodeIds: new Set(this.state.loadedNodeIds),
      pinnedNodeIds: new Set(this.state.pinnedNodeIds),
      pendingLoads: new Set(this.state.pendingLoads),
      pendingUnloads: new Set(this.state.pendingUnloads),
    };
  }

  /**
   * Returns the number of currently loaded nodes.
   */
  getLoadedCount(): number {
    return this.state.loadedNodeIds.size;
  }

  /**
   * Force-loads a node regardless of distance.
   */
  forceLoad(nodeId: string): void {
    this.state.loadedNodeIds.add(nodeId);
  }

  /**
   * Force-unloads a node (unless pinned).
   */
  forceUnload(nodeId: string): void {
    if (!this.state.pinnedNodeIds.has(nodeId)) {
      this.state.loadedNodeIds.delete(nodeId);
    }
  }

  /**
   * Resets the streamer. Intended for testing.
   */
  _resetForTesting(): void {
    this.state = {
      loadedNodeIds: new Set(),
      pinnedNodeIds: new Set(),
      pendingLoads: new Set(),
      pendingUnloads: new Set(),
    };
    this.config = {
      loadDistance: 200,
      unloadDistance: 300,
      maxLoadedNodes: 100,
      pinByDefault: false,
    };
  }
}

export const sceneStreamer = new SceneStreamer();
