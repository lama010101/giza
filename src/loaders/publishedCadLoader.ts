/**
 * Published CAD / architectural drawing ingestion per M06.5-T04.
 *
 * Registers published Great Pyramid drawings and surveys, attaches them to the
 * Local Plateau Coordinate datum, and exposes extractable dimensions keyed by
 * source so geometry blockouts can be traced back to the original survey.
 */

import {
  GP_ASCENDING_PASSAGE,
  GP_DESCENDING_PASSAGE,
  GP_EXTERNAL,
  GP_GRAND_GALLERY,
  GP_KINGS_CHAMBER,
  GP_KC_SHAFTS,
  GP_QUEENS_CHAMBER,
  GP_QC_SHAFTS,
  GP_RELIEVING,
  GP_SUBTERRANEAN,
} from '@db/measurements/great-pyramid-measurements';

export type CadDrawingType = 'plan' | 'section' | 'elevation' | 'survey';

export interface CadDimension {
  name: string;
  value: number;
  unit: 'm' | 'm²' | '°';
  sourceRef: string;
  confidence: number;
}

export interface PublishedCadDrawing {
  id: string;
  sourceId: string;
  monumentId: string;
  title: string;
  author: string;
  year: number;
  type: CadDrawingType;
  scale?: string;
  datum: string;
  regions: string[];
  dimensions: CadDimension[];
}

const LOCAL_PLATEAU_DATUM =
  'Local Plateau Coordinates: X=east, Y=up, Z=south, origin at pyramid centre at pavement level';

const PUBLISHED_CAD_DRAWINGS: PublishedCadDrawing[] = [
  {
    id: 'CAD-GP-001',
    sourceId: 'SRC-0101',
    monumentId: 'MON-GP-001',
    title: 'Petrie 1883 — Great Pyramid Plans and Sections',
    author: 'W.M.F. Petrie',
    year: 1883,
    type: 'section',
    scale: '1 inch = 20 feet',
    datum: LOCAL_PLATEAU_DATUM,
    regions: [
      'Base and Exterior',
      "King's Chamber",
      "Queen's Chamber",
      'Grand Gallery',
      'Subterranean Chamber',
      'Descending Passage',
      'Ascending Passage',
      'Well Shaft and Grotto',
    ],
    dimensions: [
      {
        name: 'Original height',
        value: GP_EXTERNAL.originalHeight,
        unit: 'm',
        sourceRef: 'Petrie 1883 §II',
        confidence: 85,
      },
      {
        name: 'Casing angle',
        value: GP_EXTERNAL.casingAngleDeg,
        unit: '°',
        sourceRef: 'Petrie 1883 §II',
        confidence: 90,
      },
      {
        name: "King's Chamber width",
        value: GP_KINGS_CHAMBER.width,
        unit: 'm',
        sourceRef: 'Petrie 1883, p. 80',
        confidence: 97,
      },
      {
        name: "King's Chamber height",
        value: GP_KINGS_CHAMBER.height,
        unit: 'm',
        sourceRef: 'Petrie 1883, p. 80',
        confidence: 97,
      },
      {
        name: "King's Chamber depth",
        value: GP_KINGS_CHAMBER.depth,
        unit: 'm',
        sourceRef: 'Petrie 1883, p. 80',
        confidence: 97,
      },
      {
        name: "Queen's Chamber width",
        value: GP_QUEENS_CHAMBER.width,
        unit: 'm',
        sourceRef: 'Petrie 1883, p. 85',
        confidence: 96,
      },
      {
        name: "Queen's Chamber height",
        value: GP_QUEENS_CHAMBER.height,
        unit: 'm',
        sourceRef: 'Petrie 1883, p. 85',
        confidence: 96,
      },
      {
        name: "Queen's Chamber depth",
        value: GP_QUEENS_CHAMBER.depth,
        unit: 'm',
        sourceRef: 'Petrie 1883, p. 85',
        confidence: 96,
      },
      {
        name: 'Grand Gallery floor length',
        value: GP_GRAND_GALLERY.floorLength,
        unit: 'm',
        sourceRef: 'Petrie 1883, p. 88',
        confidence: 97,
      },
      {
        name: 'Grand Gallery height',
        value: GP_GRAND_GALLERY.height,
        unit: 'm',
        sourceRef: 'Petrie 1883, p. 88',
        confidence: 97,
      },
      {
        name: 'Subterranean chamber width',
        value: GP_SUBTERRANEAN.width,
        unit: 'm',
        sourceRef: 'Petrie 1883, p. 92',
        confidence: 93,
      },
      {
        name: 'Descending passage angle',
        value: GP_DESCENDING_PASSAGE.angleDeg,
        unit: '°',
        sourceRef: 'Petrie 1883, p. 70',
        confidence: 95,
      },
      {
        name: 'Ascending passage angle',
        value: GP_ASCENDING_PASSAGE.angleDeg,
        unit: '°',
        sourceRef: 'Petrie 1883, p. 75',
        confidence: 95,
      },
    ],
  },
  {
    id: 'CAD-GP-002',
    sourceId: 'SRC-0102',
    monumentId: 'MON-GP-001',
    title: 'Cole 1925 — Exact Size and Orientation of the Great Pyramid',
    author: 'J.H. Cole',
    year: 1925,
    type: 'survey',
    scale: '1:5000',
    datum: LOCAL_PLATEAU_DATUM,
    regions: ['Base and Exterior'],
    dimensions: [
      {
        name: 'Mean base length',
        value: GP_EXTERNAL.baseMean,
        unit: 'm',
        sourceRef: 'Cole 1925, Survey of Egypt',
        confidence: 99,
      },
      {
        name: 'Current height',
        value: GP_EXTERNAL.currentHeight,
        unit: 'm',
        sourceRef: 'Cole 1925, remaining courses',
        confidence: 90,
      },
    ],
  },
  {
    id: 'CAD-GP-003',
    sourceId: 'SRC-0103',
    monumentId: 'MON-GP-001',
    title: 'Dash & Paulson 2015 — Base Reanalysis',
    author: 'G. Dash, J. Paulson',
    year: 2015,
    type: 'survey',
    scale: '1:5000',
    datum: LOCAL_PLATEAU_DATUM,
    regions: ['Base and Exterior'],
    dimensions: [
      {
        name: 'Mean base length (reanalysis)',
        value: GP_EXTERNAL.baseMean,
        unit: 'm',
        sourceRef: 'Dash & Paulson 2015, JAEA',
        confidence: 95,
      },
    ],
  },
  {
    id: 'CAD-GP-004',
    sourceId: 'SRC-0105',
    monumentId: 'MON-GP-001',
    title: 'Gantenbrink 1993 — Upuaut Shaft Survey',
    author: 'R. Gantenbrink',
    year: 1993,
    type: 'section',
    scale: '1:10',
    datum: LOCAL_PLATEAU_DATUM,
    regions: ["King's Chamber Air Shafts", "Queen's Chamber Air Shafts"],
    dimensions: [
      {
        name: "King's north shaft angle",
        value: GP_KC_SHAFTS.north.angleDeg,
        unit: '°',
        sourceRef: 'Gantenbrink 1993',
        confidence: 94,
      },
      {
        name: "King's north shaft diameter",
        value: GP_KC_SHAFTS.north.diameter,
        unit: 'm',
        sourceRef: 'Gantenbrink 1993',
        confidence: 94,
      },
      {
        name: "King's south shaft angle",
        value: GP_KC_SHAFTS.south.angleDeg,
        unit: '°',
        sourceRef: 'Gantenbrink 1993',
        confidence: 94,
      },
      {
        name: "Queen's north shaft angle",
        value: GP_QC_SHAFTS.north.angleDeg,
        unit: '°',
        sourceRef: 'Gantenbrink 1993',
        confidence: 93,
      },
      {
        name: "Queen's south shaft angle",
        value: GP_QC_SHAFTS.south.angleDeg,
        unit: '°',
        sourceRef: 'Gantenbrink 1993',
        confidence: 93,
      },
    ],
  },
  {
    id: 'CAD-GP-005',
    sourceId: 'SRC-0106',
    monumentId: 'MON-GP-001',
    title: 'Lehner & Goodman — Giza Plateau Mapping Project',
    author: 'M. Lehner, D. Goodman',
    year: 2007,
    type: 'plan',
    scale: '1:2000',
    datum: LOCAL_PLATEAU_DATUM,
    regions: ['Base and Exterior', 'Plateau context'],
    dimensions: [
      {
        name: 'Current height',
        value: GP_EXTERNAL.currentHeight,
        unit: 'm',
        sourceRef: 'Lehner & Goodman GPMP',
        confidence: 88,
      },
      {
        name: 'Original height',
        value: GP_EXTERNAL.originalHeight,
        unit: 'm',
        sourceRef: 'Lehner & Goodman GPMP',
        confidence: 85,
      },
    ],
  },
  {
    id: 'CAD-GP-006',
    sourceId: 'SRC-0104',
    monumentId: 'MON-GP-001',
    title: 'Vyse 1841 — Relieving Chambers Sections',
    author: 'R.W.H. Howard Vyse',
    year: 1841,
    type: 'section',
    scale: '1:50',
    datum: LOCAL_PLATEAU_DATUM,
    regions: ['Relieving Chambers'],
    dimensions: [
      {
        name: 'Relieving chambers total height',
        value: GP_RELIEVING.totalHeight,
        unit: 'm',
        sourceRef: 'Vyse 1841, Operations',
        confidence: 85,
      },
    ],
  },
];

export function getPublishedCadDrawings(): PublishedCadDrawing[] {
  return [...PUBLISHED_CAD_DRAWINGS];
}

export function getPublishedCadDrawingById(id: string): PublishedCadDrawing | undefined {
  return PUBLISHED_CAD_DRAWINGS.find((d) => d.id === id);
}

export function getPublishedCadDrawingsBySource(sourceId: string): PublishedCadDrawing[] {
  return PUBLISHED_CAD_DRAWINGS.filter((d) => d.sourceId === sourceId);
}

export function getPublishedCadDrawingsByMonument(monumentId: string): PublishedCadDrawing[] {
  return PUBLISHED_CAD_DRAWINGS.filter((d) => d.monumentId === monumentId);
}

export function getCadDimensions(drawingId: string): CadDimension[] {
  const drawing = getPublishedCadDrawingById(drawingId);
  return drawing ? [...drawing.dimensions] : [];
}
