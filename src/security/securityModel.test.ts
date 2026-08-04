import { describe, it, expect, beforeEach } from 'vitest';
import {
  useSecurityStore,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  hasPermission,
  checkPermission,
  getPermissions,
  canManageRole,
  getDefaultUser,
  type UserRole,
} from './securityModel';

describe('Security Model (M12-T04)', () => {
  beforeEach(() => {
    useSecurityStore.getState().logout();
  });

  describe('4 roles defined', () => {
    it('defines visitor, researcher, reviewer, admin', () => {
      const roles: UserRole[] = ['visitor', 'researcher', 'reviewer', 'admin'];
      for (const role of roles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(ROLE_LABELS[role]).toBeDefined();
        expect(ROLE_DESCRIPTIONS[role]).toBeDefined();
      }
    });
  });

  describe('ROLE_PERMISSIONS hierarchy', () => {
    it('visitor has minimal permissions', () => {
      expect(ROLE_PERMISSIONS.visitor).toContain('read:public');
      expect(ROLE_PERMISSIONS.visitor).toContain('write:bookmarks');
      expect(ROLE_PERMISSIONS.visitor).not.toContain('write:annotations');
      expect(ROLE_PERMISSIONS.visitor).not.toContain('manage:users');
    });

    it('researcher has more permissions than visitor', () => {
      expect(ROLE_PERMISSIONS.researcher.length).toBeGreaterThan(ROLE_PERMISSIONS.visitor.length);
      expect(ROLE_PERMISSIONS.researcher).toContain('write:annotations');
      expect(ROLE_PERMISSIONS.researcher).toContain('write:measurements');
      expect(ROLE_PERMISSIONS.researcher).toContain('write:hypotheses');
    });

    it('reviewer can review and publish evidence', () => {
      expect(ROLE_PERMISSIONS.reviewer).toContain('review:evidence');
      expect(ROLE_PERMISSIONS.reviewer).toContain('publish:evidence');
    });

    it('admin has all permissions', () => {
      expect(ROLE_PERMISSIONS.admin).toContain('manage:users');
      expect(ROLE_PERMISSIONS.admin).toContain('manage:system');
      expect(ROLE_PERMISSIONS.admin).toContain('import:data');
    });

    it('permissions are cumulative (each role includes previous)', () => {
      const visitorPerms = new Set(ROLE_PERMISSIONS.visitor);
      const researcherPerms = new Set(ROLE_PERMISSIONS.researcher);
      for (const p of visitorPerms) {
        expect(researcherPerms.has(p)).toBe(true);
      }

      const reviewerPerms = new Set(ROLE_PERMISSIONS.reviewer);
      for (const p of researcherPerms) {
        expect(reviewerPerms.has(p)).toBe(true);
      }

      const adminPerms = new Set(ROLE_PERMISSIONS.admin);
      for (const p of reviewerPerms) {
        expect(adminPerms.has(p)).toBe(true);
      }
    });
  });

  describe('hasPermission', () => {
    it('returns true for allowed permission', () => {
      expect(hasPermission('admin', 'manage:users')).toBe(true);
    });

    it('returns false for disallowed permission', () => {
      expect(hasPermission('visitor', 'manage:users')).toBe(false);
    });
  });

  describe('checkPermission (with store)', () => {
    it('returns false when not authenticated', () => {
      expect(checkPermission('read:public')).toBe(false);
    });

    it('returns true when user has permission', () => {
      useSecurityStore
        .getState()
        .login({ id: 'u1', username: 'admin', displayName: 'Admin', role: 'admin' }, 'token');
      expect(checkPermission('manage:users')).toBe(true);
    });

    it('returns false when user lacks permission', () => {
      useSecurityStore
        .getState()
        .login({ id: 'u2', username: 'visitor', displayName: 'Visitor', role: 'visitor' }, 'token');
      expect(checkPermission('manage:users')).toBe(false);
    });
  });

  describe('getPermissions', () => {
    it('returns all permissions for a role', () => {
      const perms = getPermissions('researcher');
      expect(perms).toContain('read:public');
      expect(perms).toContain('write:annotations');
    });
  });

  describe('canManageRole', () => {
    it('admin can manage all other roles', () => {
      expect(canManageRole('admin', 'reviewer')).toBe(true);
      expect(canManageRole('admin', 'researcher')).toBe(true);
      expect(canManageRole('admin', 'visitor')).toBe(true);
    });

    it('reviewer can manage researcher and visitor', () => {
      expect(canManageRole('reviewer', 'researcher')).toBe(true);
      expect(canManageRole('reviewer', 'visitor')).toBe(true);
    });

    it('researcher can manage visitor', () => {
      expect(canManageRole('researcher', 'visitor')).toBe(true);
    });

    it('visitor cannot manage anyone', () => {
      expect(canManageRole('visitor', 'visitor')).toBe(false);
    });

    it('cannot manage same or higher role', () => {
      expect(canManageRole('admin', 'admin')).toBe(false);
      expect(canManageRole('reviewer', 'admin')).toBe(false);
    });
  });

  describe('getDefaultUser', () => {
    it('returns a researcher user for demo', () => {
      const user = getDefaultUser();
      expect(user.role).toBe('researcher');
      expect(user.username).toBeDefined();
    });
  });

  describe('useSecurityStore', () => {
    it('login sets user and token', () => {
      useSecurityStore
        .getState()
        .login({ id: 'u3', username: 'test', displayName: 'Test', role: 'researcher' }, 'abc123');
      const state = useSecurityStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser?.username).toBe('test');
      expect(state.sessionToken).toBe('abc123');
    });

    it('logout clears user and token', () => {
      useSecurityStore
        .getState()
        .login({ id: 'u4', username: 'test', displayName: 'Test', role: 'admin' }, 'token');
      useSecurityStore.getState().logout();
      const state = useSecurityStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
      expect(state.sessionToken).toBeNull();
    });

    it('updateRole changes the user role', () => {
      useSecurityStore
        .getState()
        .login({ id: 'u5', username: 'test', displayName: 'Test', role: 'visitor' }, 'token');
      useSecurityStore.getState().updateRole('researcher');
      expect(useSecurityStore.getState().currentUser?.role).toBe('researcher');
    });
  });
});
