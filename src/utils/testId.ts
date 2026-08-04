/**
 * Returns a `data-testid` prop object when running under Vitest,
 * otherwise an empty object.
 *
 * React Three Fiber treats dashed props such as `data-testid` as nested
 * property setters on Three.js objects. Passing `data-testid` directly to
 * `<mesh>`, `<group>` or other R3F primitives causes a runtime crash
 * (`Cannot read properties of undefined (reading 'testid')`). In unit tests
 * R3F primitives are mocked or rendered as custom DOM tags, where
 * `data-testid` is required by testing-library queries.
 */
export function testId(id: string): Record<string, string> {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
    ? { 'data-testid': id }
    : {};
}
