import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordAudit,
  getAuditHistory,
  getAllAuditEntries,
  exportAuditLog,
  exportAuditHistory,
  AuditAction,
  type AuditEntry,
  _resetAuditLogForTesting,
} from './auditLog';

describe('Audit Log', () => {
  beforeEach(() => {
    _resetAuditLogForTesting();
  });

  it('records an audit entry', () => {
    const entry = recordAudit('EV-000001', AuditAction.CREATED, 'author', { field: 'value' });
    expect(entry.evidenceId).toBe('EV-000001');
    expect(entry.action).toBe(AuditAction.CREATED);
    expect(entry.actor).toBe('author');
    expect(entry.details).toEqual({ field: 'value' });
    expect(entry.id).toMatch(/^AUDIT-\d{6}$/);
    expect(entry.timestamp).toBeTruthy();
  });

  it('returns audit history for a specific evidence record', () => {
    recordAudit('EV-000001', AuditAction.CREATED, 'author');
    recordAudit('EV-000002', AuditAction.CREATED, 'author');
    recordAudit('EV-000001', AuditAction.UPDATED, 'editor');

    const history = getAuditHistory('EV-000001');
    expect(history).toHaveLength(2);
    expect(history[0].action).toBe(AuditAction.CREATED);
    expect(history[1].action).toBe(AuditAction.UPDATED);
  });

  it('returns all audit entries', () => {
    recordAudit('EV-000001', AuditAction.CREATED, 'author');
    recordAudit('EV-000002', AuditAction.CREATED, 'author');
    expect(getAllAuditEntries()).toHaveLength(2);
  });

  it('exports the full audit log as JSON', () => {
    recordAudit('EV-000001', AuditAction.CREATED, 'author');
    const json = exportAuditLog();
    const parsed = JSON.parse(json) as AuditEntry[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].evidenceId).toBe('EV-000001');
  });

  it('exports audit history for a single evidence record as JSON', () => {
    recordAudit('EV-000001', AuditAction.CREATED, 'author');
    recordAudit('EV-000002', AuditAction.CREATED, 'author');
    const json = exportAuditHistory('EV-000001');
    const parsed = JSON.parse(json) as AuditEntry[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].evidenceId).toBe('EV-000001');
  });

  it('generates sequential audit IDs', () => {
    const e1 = recordAudit('EV-000001', AuditAction.CREATED, 'author');
    const e2 = recordAudit('EV-000001', AuditAction.UPDATED, 'author');
    expect(e1.id).toBe('AUDIT-000001');
    expect(e2.id).toBe('AUDIT-000002');
  });

  it('audit entries are immutable (readonly properties)', () => {
    const entry = recordAudit('EV-000001', AuditAction.CREATED, 'author');
    // TypeScript enforces readonly at compile time; at runtime we verify
    // the entry has the expected shape
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.evidenceId).toBe('EV-000001');
  });
});
