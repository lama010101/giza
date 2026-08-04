/**
 * Security model per M12-T04.
 *
 * 4 roles with hierarchical permissions:
 *   1. Visitor — read-only, public content only
 *   2. Researcher — read + annotations + measurements + bookmarks
 *   3. Reviewer — researcher + review/approve evidence + publish
 *   4. Administrator — full access including user management
 *
 * Permissions are enforced client-side for UX; server-side enforcement
 * is the source of truth.
 */

export type UserRole = 'visitor' | 'researcher' | 'reviewer' | 'admin';

export type Permission =
  | 'read:public'
  | 'read:restricted'
  | 'write:annotations'
  | 'write:measurements'
  | 'write:bookmarks'
  | 'write:hypotheses'
  | 'review:evidence'
  | 'publish:evidence'
  | 'manage:users'
  | 'manage:system'
  | 'export:data'
  | 'import:data';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  visitor: ['read:public', 'write:bookmarks'],
  researcher: [
    'read:public',
    'read:restricted',
    'write:annotations',
    'write:measurements',
    'write:bookmarks',
    'write:hypotheses',
    'export:data',
  ],
  reviewer: [
    'read:public',
    'read:restricted',
    'write:annotations',
    'write:measurements',
    'write:bookmarks',
    'write:hypotheses',
    'review:evidence',
    'publish:evidence',
    'export:data',
  ],
  admin: [
    'read:public',
    'read:restricted',
    'write:annotations',
    'write:measurements',
    'write:bookmarks',
    'write:hypotheses',
    'review:evidence',
    'publish:evidence',
    'manage:users',
    'manage:system',
    'export:data',
    'import:data',
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  visitor: 'Visitor',
  researcher: 'Researcher',
  reviewer: 'Reviewer',
  admin: 'Administrator',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  visitor: 'Read-only access to public content',
  researcher: 'Read access + annotations, measurements, bookmarks, hypotheses',
  reviewer: 'Researcher + review and publish evidence',
  admin: 'Full access including user management',
};

// ─── Security store ───────────────────────────────────────────────────────

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  email?: string;
}

interface SecurityState {
  currentUser: User | null;
  isAuthenticated: boolean;
  sessionToken: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateRole: (role: UserRole) => void;
}

export const useSecurityStore = create<SecurityState>()(
  devtools(
    persist(
      (set) => ({
        currentUser: null,
        isAuthenticated: false,
        sessionToken: null,
        login: (user, token) =>
          set({ currentUser: user, isAuthenticated: true, sessionToken: token }),
        logout: () => set({ currentUser: null, isAuthenticated: false, sessionToken: null }),
        updateRole: (role) =>
          set((state) => ({
            currentUser: state.currentUser ? { ...state.currentUser, role } : null,
          })),
      }),
      {
        name: 'giza-security',
        version: 1,
      },
    ),
    { name: 'GIZA Security' },
  ),
);

// ─── Permission helpers ────────────────────────────────────────────────────

/**
 * Checks if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Checks if the current user has a permission.
 */
export function checkPermission(permission: Permission): boolean {
  const state = useSecurityStore.getState();
  if (!state.currentUser) return false;
  return hasPermission(state.currentUser.role, permission);
}

/**
 * Returns all permissions for a role.
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Checks if role A can manage role B (hierarchy).
 */
export function canManageRole(manager: UserRole, target: UserRole): boolean {
  const hierarchy: UserRole[] = ['visitor', 'researcher', 'reviewer', 'admin'];
  return hierarchy.indexOf(manager) > hierarchy.indexOf(target);
}

/**
 * Returns the default user for development/demo purposes.
 */
export function getDefaultUser(): User {
  return {
    id: 'user-demo',
    username: 'demo',
    displayName: 'Demo Researcher',
    role: 'researcher',
  };
}
