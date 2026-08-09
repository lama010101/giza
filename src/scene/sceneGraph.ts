import type { Vector3 } from '@/schemas/location';

export interface Transform {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

export const IDENTITY_TRANSFORM: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * Computes an axis-aligned bounding box from a center position and size.
 * Used by blockout-based scene graphs where nodes have position + size.
 */
export function boundingBoxFromSize(center: Vector3, size: Vector3): BoundingBox {
  return {
    min: {
      x: center.x - size.x / 2,
      y: center.y - size.y / 2,
      z: center.z - size.z / 2,
    },
    max: {
      x: center.x + size.x / 2,
      y: center.y + size.y / 2,
      z: center.z + size.z / 2,
    },
  };
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

export interface SurveyReference {
  /** Survey point ID (e.g., "SP-001") */
  id: string;
  /** Survey method used (e.g., "total-station", "photogrammetry", "laser-scan") */
  method: string;
  /** Date of survey (ISO 8601) */
  date: string;
  /** Surveyor or team name */
  surveyor: string;
  /** Coordinate system (e.g., "UTM-36N", "local") */
  coordinateSystem: string;
}

export interface SceneNodeMetadata {
  objectId?: string;
  evidenceIds?: string[];
  sourceIds?: string[];
  confidence?: number;
  hypothesisIds?: string[];
  layer?: string;
  /** Conceptual layer tags used by the layer taxonomy (M05-T05). */
  conceptualLayers?: string[];
  /** Axis-aligned bounding box in local coordinates (M09-T02) */
  boundingBox?: BoundingBox;
  /** Survey reference for georeferencing (M09-T02) */
  surveyReference?: SurveyReference;
}

export interface SceneNode {
  id: string;
  name: string;
  parentId: string | null;
  localTransform: Transform;
  metadata: SceneNodeMetadata;
  visible: boolean;
  children: string[];
}

export interface SceneNodeWithWorld extends SceneNode {
  worldTransform: Transform;
}

export class SceneGraph {
  private nodes = new Map<string, SceneNode>();
  private rootOrigin: Vector3 = { x: 0, y: 0, z: 0 };

  setRootOrigin(origin: Vector3): void {
    this.rootOrigin = { ...origin };
  }

  getRootOrigin(): Vector3 {
    return { ...this.rootOrigin };
  }

  addNode(node: Omit<SceneNode, 'children'>): SceneNode {
    const existing = this.nodes.get(node.id);
    if (existing) {
      throw new Error(`Scene node ${node.id} already exists`);
    }

    const newNode: SceneNode = {
      ...node,
      localTransform: {
        position: { ...node.localTransform.position },
        rotation: { ...node.localTransform.rotation },
        scale: { ...node.localTransform.scale },
      },
      children: [],
    };
    this.nodes.set(newNode.id, newNode);

    if (newNode.parentId) {
      const parent = this.nodes.get(newNode.parentId);
      if (parent) {
        parent.children.push(newNode.id);
      }
    }

    return newNode;
  }

  removeNode(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.children = parent.children.filter((childId) => childId !== id);
      }
    }

    for (const childId of [...node.children]) {
      this.removeNode(childId);
    }

    this.nodes.delete(id);
  }

  getNode(id: string): SceneNode | undefined {
    return this.nodes.get(id);
  }

  getNodeWithWorldTransform(id: string): SceneNodeWithWorld | undefined {
    const node = this.nodes.get(id);
    if (!node) return undefined;
    return { ...node, worldTransform: this.computeWorldTransform(id) };
  }

  getAllNodes(): SceneNode[] {
    return Array.from(this.nodes.values());
  }

  getRootNodes(): SceneNode[] {
    return this.getAllNodes().filter((n) => n.parentId === null);
  }

  getChildren(parentId: string): SceneNode[] {
    const parent = this.nodes.get(parentId);
    if (!parent) return [];
    return parent.children.map((childId) => this.nodes.get(childId)).filter(Boolean) as SceneNode[];
  }

  getAllVisibleNodes(): SceneNodeWithWorld[] {
    return this.getAllNodes()
      .filter((n) => n.visible)
      .map((n) => this.getNodeWithWorldTransform(n.id))
      .filter(Boolean) as SceneNodeWithWorld[];
  }

  findByObjectId(objectId: string): SceneNodeWithWorld[] {
    return this.getAllVisibleNodes().filter((n) => n.metadata.objectId === objectId);
  }

  findByEvidenceId(evidenceId: string): SceneNodeWithWorld[] {
    return this.getAllVisibleNodes().filter((n) => n.metadata.evidenceIds?.includes(evidenceId));
  }

  setLayerVisible(layer: string, visible: boolean): void {
    for (const node of this.nodes.values()) {
      if (node.metadata.layer === layer) {
        node.visible = visible;
      }
    }
  }

  setHypothesisVisible(hypothesisId: string, visible: boolean): void {
    for (const node of this.nodes.values()) {
      if (node.metadata.hypothesisIds?.includes(hypothesisId)) {
        node.visible = visible;
      }
    }
  }

  computeWorldTransform(id: string): Transform {
    const node = this.nodes.get(id);
    if (!node) {
      return {
        position: { ...IDENTITY_TRANSFORM.position },
        rotation: { ...IDENTITY_TRANSFORM.rotation },
        scale: { ...IDENTITY_TRANSFORM.scale },
      };
    }

    if (node.parentId === null) {
      return combineTransforms(
        {
          position: this.rootOrigin,
          rotation: IDENTITY_TRANSFORM.rotation,
          scale: IDENTITY_TRANSFORM.scale,
        },
        node.localTransform,
      );
    }

    const parentWorld = this.computeWorldTransform(node.parentId);
    return combineTransforms(parentWorld, node.localTransform);
  }
}

function combineTransforms(parent: Transform, local: Transform): Transform {
  return {
    position: {
      x: parent.position.x + local.position.x * parent.scale.x,
      y: parent.position.y + local.position.y * parent.scale.y,
      z: parent.position.z + local.position.z * parent.scale.z,
    },
    rotation: {
      x: parent.rotation.x + local.rotation.x,
      y: parent.rotation.y + local.rotation.y,
      z: parent.rotation.z + local.rotation.z,
    },
    scale: {
      x: parent.scale.x * local.scale.x,
      y: parent.scale.y * local.scale.y,
      z: parent.scale.z * local.scale.z,
    },
  };
}
