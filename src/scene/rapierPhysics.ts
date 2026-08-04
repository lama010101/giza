/**
 * Rapier physics stub per M08.5-T06.
 *
 * This is a lightweight placeholder physics implementation using simple Euler
 * integration. It exposes the same surface API that the real Rapier integration
 * will use, so callers can be written against this stub today and swapped to
 * `@dimforge/rapier3d` when it is installed (see ADR pending).
 *
 * NOTE: This is a stub. Replace with @dimforge/rapier3d when available.
 * The stub does not perform collision detection or constraint solving; it only
 * integrates gravity and linear/angular velocity for free-falling bodies.
 */

/** 3D vector. */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** Quaternion (x, y, z, w). */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Rigid body type controlling how a body is integrated. */
export type RigidBodyType = 'dynamic' | 'fixed' | 'kinematic';

/** Description used to construct a rigid body. */
export interface RigidBodyDesc {
  type: RigidBodyType;
  position?: Vector3;
  rotation?: Quaternion;
  linearVelocity?: Vector3;
  angularVelocity?: Vector3;
  /** Inverse mass (0 = immovable). */
  inverseMass?: number;
}

/** Collider description (stub — not used for collision in the stub). */
export interface ColliderDesc {
  shape: 'box' | 'sphere' | 'cylinder';
  size?: Vector3;
  radius?: number;
  height?: number;
  friction?: number;
  restitution?: number;
}

/** A rigid body instance. */
export interface PhysicsBody {
  id: number;
  type: RigidBodyType;
  position: Vector3;
  rotation: Quaternion;
  linearVelocity: Vector3;
  angularVelocity: Vector3;
  inverseMass: number;
}

/** Physics world stub containing gravity and bodies. */
export interface PhysicsWorld {
  gravity: Vector3;
  bodies: PhysicsBody[];
  /** Monotonic id counter for new bodies. */
  nextId: number;
  /** Accumulated simulation time (seconds). */
  time: number;
}

/**
 * Creates a new physics world stub with default gravity (0, -9.81, 0).
 */
export function createPhysicsWorld(): PhysicsWorld {
  return {
    gravity: { x: 0, y: -9.81, z: 0 },
    bodies: [],
    nextId: 0,
    time: 0,
  };
}

/**
 * Creates a rigid body in the world from a description.
 * @param world - The physics world to add the body to.
 * @param desc - Rigid body description.
 * @returns The created physics body.
 */
export function createRigidBody(world: PhysicsWorld, desc: RigidBodyDesc): PhysicsBody {
  const body: PhysicsBody = {
    id: world.nextId++,
    type: desc.type,
    position: desc.position ?? { x: 0, y: 0, z: 0 },
    rotation: desc.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
    linearVelocity: desc.linearVelocity ?? { x: 0, y: 0, z: 0 },
    angularVelocity: desc.angularVelocity ?? { x: 0, y: 0, z: 0 },
    inverseMass: desc.inverseMass ?? (desc.type === 'dynamic' ? 1 : 0),
  };
  world.bodies.push(body);
  return body;
}

/**
 * Steps the physics simulation forward by `dt` seconds using Euler integration.
 * Fixed and kinematic bodies are not integrated.
 * @param world - The physics world to step.
 * @param dt - Delta time in seconds.
 */
export function stepPhysics(world: PhysicsWorld, dt: number): void {
  world.time += dt;
  for (const body of world.bodies) {
    if (body.type !== 'dynamic' || body.inverseMass === 0) continue;
    // v += a * dt (a = g for free fall in the stub)
    body.linearVelocity.x += world.gravity.x * dt;
    body.linearVelocity.y += world.gravity.y * dt;
    body.linearVelocity.z += world.gravity.z * dt;
    // x += v * dt
    body.position.x += body.linearVelocity.x * dt;
    body.position.y += body.linearVelocity.y * dt;
    body.position.z += body.linearVelocity.z * dt;
    // Integrate angular velocity into the quaternion (stub: small-angle approx).
    const ax = body.angularVelocity.x * dt;
    const ay = body.angularVelocity.y * dt;
    const az = body.angularVelocity.z * dt;
    if (ax !== 0 || ay !== 0 || az !== 0) {
      const half = 0.5;
      const dq: Quaternion = {
        x: body.angularVelocity.x * half * dt,
        y: body.angularVelocity.y * half * dt,
        z: body.angularVelocity.z * half * dt,
        w: 1,
      };
      body.rotation = quatMultiply(dq, body.rotation);
      body.rotation = quatNormalize(body.rotation);
    }
  }
}

/** Quaternion multiplication (Hamilton product). */
function quatMultiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

/** Normalizes a quaternion. */
function quatNormalize(q: Quaternion): Quaternion {
  const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
  if (len === 0) return { x: 0, y: 0, z: 0, w: 1 };
  return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
}

/**
 * Sets the gravity vector of a physics world.
 */
export function setGravity(world: PhysicsWorld, x: number, y: number, z: number): void {
  world.gravity.x = x;
  world.gravity.y = y;
  world.gravity.z = z;
}

/**
 * Returns the position of a physics body.
 */
export function getBodyPosition(body: PhysicsBody): Vector3 {
  return { x: body.position.x, y: body.position.y, z: body.position.z };
}

/**
 * Returns the rotation of a physics body as a quaternion.
 */
export function getBodyRotation(body: PhysicsBody): Quaternion {
  return { x: body.rotation.x, y: body.rotation.y, z: body.rotation.z, w: body.rotation.w };
}
