/* eslint-disable no-console */
// Updates the LOD0 and LOD1 tables in docs/architecture/monument-geometry.md
// from the live geometry-dump.json. Run after generate-geometry-dump.ts.
//
// Usage: npx tsx scripts/update-monument-geometry-tables.ts

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dump from '../docs/architecture/geometry-dump.json' with { type: 'json' };

function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null) return '0';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4);
}
function pad(s: string, w: number): string {
  return s + ' '.repeat(Math.max(0, w - s.length));
}
function fmtPos(p: { x: number; y: number; z: number }): string {
  return pad('(' + fmt(p.x) + ', ' + fmt(p.y) + ', ' + fmt(p.z) + ')', 29);
}
function fmtSize(s: { x: number; y: number; z: number }): string {
  return pad('(' + fmt(s.x) + ', ' + fmt(s.y) + ', ' + fmt(s.z) + ')', 31);
}
function fmtRot(r: { x: number; y: number; z: number } | undefined): string {
  if (!r) return pad('(0, 0, 0)', 18);
  return pad('(' + fmt(r.x) + ', ' + fmt(r.y) + ', ' + fmt(r.z) + ')', 18);
}

interface Node {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  layer: string;
  color: string;
  opacity?: number;
  derivation?: string;
}

function generateTable(nodes: Node[]): string {
  const header =
    '| ID                              | Name                                              | Position (x, y, z)            | Size (x, y, z)                 | Rotation (x, y, z) | Layer          | Color   | Opacity | Derivation |\n' +
    '| ------------------------------- | ------------------------------------------------- | ----------------------------- | ------------------------------ | ------------------ | -------------- | ------- | ------- | ---------- |';
  const rows = nodes.map((n) => {
    const id = pad('`' + n.id + '`', 31);
    const name = pad(n.name ?? '', 49);
    const pos = fmtPos(n.position);
    const size = fmtSize(n.size);
    const rot = fmtRot(n.rotation);
    const layer = pad(n.layer ?? '', 14);
    const color = pad(n.color ?? '', 7);
    const op = pad(n.opacity !== undefined ? String(n.opacity) : '1', 7);
    const deriv = pad(n.derivation ?? '', 10);
    return (
      '| ' +
      id +
      ' | ' +
      name +
      ' | ' +
      pos +
      ' | ' +
      size +
      ' | ' +
      rot +
      ' | ' +
      layer +
      ' | ' +
      color +
      ' | ' +
      op +
      ' | ' +
      deriv +
      ' |'
    );
  });
  return header + '\n' + rows.join('\n');
}

const mdPath = resolve(import.meta.dirname, '..', 'docs', 'architecture', 'monument-geometry.md');
let md = readFileSync(mdPath, 'utf-8');

const lod0Table = generateTable(dump.greatPyramidLOD0.nodes as Node[]);
const lod1Table = generateTable(dump.greatPyramidLOD1.nodes as Node[]);

// Replace the LOD0 table: between the LOD0 header line and the next ### heading
const lod0Header = '### 1.2 LOD0 — manual blockout';
const lod0End = '### 1.3 LOD1';
const lod0StartIdx = md.indexOf(lod0Header);
const lod0EndIdx = md.indexOf(lod0End);
if (lod0StartIdx === -1 || lod0EndIdx === -1) {
  throw new Error('Could not find LOD0 section boundaries');
}
const lod0TableStart = md.indexOf('| ID', lod0StartIdx);
if (lod0TableStart === -1 || lod0TableStart > lod0EndIdx) {
  throw new Error('Could not find LOD0 table start');
}
md = md.slice(0, lod0TableStart) + lod0Table + '\n\n' + md.slice(lod0EndIdx);

// Replace the LOD1 table: between the LOD1 header line and the next ### heading
const lod1Header = '### 1.3 LOD1 — measurement-derived geometry';
const lod1End = '### 1.4';
const lod1StartIdx = md.indexOf(lod1Header);
const lod1EndIdx = md.indexOf(lod1End);
if (lod1StartIdx === -1 || lod1EndIdx === -1) {
  throw new Error('Could not find LOD1 section boundaries');
}
const lod1TableStart = md.indexOf('| ID', lod1StartIdx);
if (lod1TableStart === -1 || lod1TableStart > lod1EndIdx) {
  throw new Error('Could not find LOD1 table start');
}
md = md.slice(0, lod1TableStart) + lod1Table + '\n\n' + md.slice(lod1EndIdx);

writeFileSync(mdPath, md, 'utf-8');
console.log(`Updated tables in ${mdPath}`);
