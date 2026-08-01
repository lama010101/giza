import { describe, it, expect } from 'vitest';
import {
  createPhysicsWorld,
  createRigidBody,
  stepPhysics,
  setGravity,
  getBodyPosition,
  getBodyRotation,
  type RigidBodyDesc,
} from './rapierPhysics';

describe('Rapier Physics Stub (M08.5-T06)', () => {
  describe('createPhysicsWorld', () => {
    it('creates a world with default gravity', () => {
      const world = createPhysicsWorld();
      expect(world.gravity).toEqual({ x: 0, y: -9.81, z: 0 });
      expect(world.bodies).toEqual([]);
      expect(world.time).toBe(0);
    });

    it('starts with an empty body list', () => {
      const world = createPhysicsWorld();
      expect(world.bodies).toHaveLength(0);
    });
  });

  describe('createRigidBody', () => {
    it('adds a dynamic body with defaults', () => {
      const world = createPhysicsWorld();
      const body = createRigidBody(world, { type: 'dynamic' });
      expect(world.bodies).toHaveLength(1);
      expect(body.type).toBe('dynamic');
      expect(body.position).toEqual({ x: 0, y: 0, z: 0 });
      expect(body.rotation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
      expect(body.inverseMass).toBe(1);
    });

    it('assigns unique ids', () => {
      const world = createPhysicsWorld();
      const a = createRigidBody(world, { type: 'dynamic' });
      const b = createRigidBody(world, { type: 'dynamic' });
      expect(a.id).not.toBe(b.id);
    });

    it('fixed bodies have zero inverse mass', () => {
      const world = createPhysicsWorld();
      const body = createRigidBody(world, { type: 'fixed' });
      expect(body.inverseMass).toBe(0);
    });

    it('respects provided position and velocity', () => {
      const world = createPhysicsWorld();
      const desc: RigidBodyDesc = {
        type: 'dynamic',
        position: { x: 1, y: 2, z: 3 },
        linearVelocity: { x: 0, y: 5, z: 0 },
      };
      const body = createRigidBody(world, desc);
      expect(body.position).toEqual({ x: 1, y: 2, z: 3 });
      expect(body.linearVelocity).toEqual({ x: 0, y: 5, z: 0 });
    });
  });

  describe('stepPhysics', () => {
    it('integrates gravity into a dynamic body', () => {
      const world = createPhysicsWorld();
      const body = createRigidBody(world, { type: 'dynamic', position: { x: 0, y: 10, z: 0 } });
      stepPhysics(world, 1);
      // v = -9.81, y = 10 - 9.81 = 0.19
      expect(body.linearVelocity.y).toBeCloseTo(-9.81, 2);
      expect(body.position.y).toBeCloseTo(0.19, 2);
    });

    it('does not move fixed bodies', () => {
      const world = createPhysicsWorld();
      const body = createRigidBody(world, {
        type: 'fixed',
        position: { x: 0, y: 5, z: 0 },
      });
      stepPhysics(world, 1);
      expect(body.position.y).toBe(5);
      expect(body.linearVelocity.y).toBe(0);
    });

    it('accumulates time across steps', () => {
      const world = createPhysicsWorld();
      stepPhysics(world, 0.1);
      stepPhysics(world, 0.2);
      expect(world.time).toBeCloseTo(0.3, 5);
    });

    it('integrates angular velocity into rotation', () => {
      const world = createPhysicsWorld();
      const body = createRigidBody(world, {
        type: 'dynamic',
        angularVelocity: { x: 0, y: 1, z: 0 },
      });
      stepPhysics(world, 0.1);
      // rotation should no longer be identity
      expect(body.rotation.w).toBeLessThan(1);
      expect(body.rotation.y).not.toBe(0);
    });
  });

  describe('setGravity', () => {
    it('updates the gravity vector', () => {
      const world = createPhysicsWorld();
      setGravity(world, 0, -1.62, 0);
      expect(world.gravity).toEqual({ x: 0, y: -1.62, z: 0 });
    });

    it('affects subsequent integration', () => {
      const world = createPhysicsWorld();
      setGravity(world, 0, -1.62, 0);
      const body = createRigidBody(world, { type: 'dynamic' });
      stepPhysics(world, 1);
      expect(body.linearVelocity.y).toBeCloseTo(-1.62, 5);
    });
  });

  describe('getBodyPosition / getBodyRotation', () => {
    it('returns a copy of the position', () => {
      const world = createPhysicsWorld();
      const body = createRigidBody(world, {
        type: 'dynamic',
        position: { x: 1, y: 2, z: 3 },
      });
      const pos = getBodyPosition(body);
      expect(pos).toEqual({ x: 1, y: 2, z: 3 });
      pos.x = 99;
      expect(body.position.x).toBe(1);
    });

    it('returns a copy of the rotation', () => {
      const world = createPhysicsWorld();
      const body = createRigidBody(world, {
        type: 'dynamic',
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      });
      const rot = getBodyRotation(body);
      expect(rot).toEqual({ x: 0, y: 0, z: 0, w: 1 });
      rot.w = 0;
      expect(body.rotation.w).toBe(1);
    });
  });
});
