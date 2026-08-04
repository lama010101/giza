# Survey Coverage Map

## Overview

This document maps the coverage of archaeological surveys referenced by
the GIZA project, per M06.5-T08. It documents which areas of the Giza
plateau have been surveyed, by whom, and what data is available.

## Survey Registry

The survey registry (`src/loaders/surveyRegistry.ts`) tracks all known
surveys of the Giza plateau and its monuments. Published CAD drawings
and their extractable dimensions are managed by
`src/loaders/publishedCadLoader.ts` (M06.5-T04).

### Registered Surveys

| Survey ID | Title | Year | Author | Type | Coverage | Status |
|-----------|-------|------|--------|------|----------|--------|
| SURV-001 | Hawass 2007 — Osiris Shaft Plans | 2007 | Zahi Hawass | published_cad | Osiris Shaft | Published |
| SURV-002 | Manual reconstruction — Northern Conduit | 2026 | GIZA Team | manual_reconstruction | Osiris Shaft | Internal |
| SURV-GP-001 | Petrie 1883 — Great Pyramid Plans and Sections | 1883 | W.M.F. Petrie | published_cad | Great Pyramid interior/exterior | Published |
| SURV-GP-002 | Cole 1925 — Exact Size and Orientation of the Great Pyramid | 1925 | J.H. Cole | published_cad | Great Pyramid base and orientation | Published |
| SURV-GP-003 | Dash & Paulson 2015 — Base Reanalysis | 2015 | G. Dash, J. Paulson | published_cad | Great Pyramid base | Published |
| SURV-GP-004 | Gantenbrink 1993 — Upuaut Shaft Survey | 1993 | R. Gantenbrink | laser_scan | Great Pyramid air shafts | Published |
| SURV-GP-005 | Lehner & Goodman — Giza Plateau Mapping Project | 2007 | M. Lehner, D. Goodman | photogrammetry | Giza Plateau / Great Pyramid exterior | Published |
| SURV-GP-006 | Hawass 2007 — Great Pyramid Interior Survey | 2007 | Zahi Hawass | published_cad | Great Pyramid interior | Published |

### Published CAD Drawings

| Drawing ID | Source | Title | Scale | Datum | Regions |
|------------|--------|-------|-------|-------|---------|
| CAD-GP-001 | SRC-0101 | Petrie 1883 — Great Pyramid Plans and Sections | 1 inch = 20 feet | Local Plateau Coordinates | Base, KC, QC, Gallery, Subterranean, Passages |
| CAD-GP-002 | SRC-0102 | Cole 1925 — Exact Size and Orientation | 1:5000 | Local Plateau Coordinates | Base and Exterior |
| CAD-GP-003 | SRC-0103 | Dash & Paulson 2015 — Base Reanalysis | 1:5000 | Local Plateau Coordinates | Base and Exterior |
| CAD-GP-004 | SRC-0105 | Gantenbrink 1993 — Upuaut Shaft Survey | 1:10 | Local Plateau Coordinates | KC and QC Air Shafts |
| CAD-GP-005 | SRC-0106 | Lehner & Goodman GPMP | 1:2000 | Local Plateau Coordinates | Plateau context / Exterior |
| CAD-GP-006 | SRC-0104 | Vyse 1841 — Relieving Chambers Sections | 1:50 | Local Plateau Coordinates | Relieving Chambers |

## Coverage Areas

### Great Pyramid (MON-GP-001)

- **Base and Exterior:** Measured (Cole 1925, Dash 2015 reanalysis; confidence 98)
- **King's Chamber:** Measured (Petrie 1883; confidence 97)
- **Queen's Chamber:** Measured (Petrie 1883; confidence 96)
- **Grand Gallery:** Measured (Petrie 1883; confidence 97)
- **Subterranean Chamber:** Measured (Petrie 1883, Hawass 2007; confidence 95)
- **Ascending Passage:** Measured (Petrie 1883; confidence 96)
- **Descending Passage:** Measured (Petrie 1883; confidence 96)
- **King's Chamber Air Shafts:** Measured (Gantenbrink 1993; confidence 94)
- **Queen's Chamber Air Shafts:** Measured (Gantenbrink 1993; confidence 94)
- **Well Shaft and Grotto:** Measured (Petrie 1883; confidence 93)
- **Relieving Chambers:** Measured (Vyse 1841, Petrie 1883; confidence 90)
- **Subterranean Pit / Lower Continuation:** Unknown — no direct survey
- **ScanPyramids Muon Void:** Inferred (ScanPyramids 2017; confidence 70)

### Osiris Shaft (MON-OS-001)

- **Main shaft:** Fully surveyed (Hassan 1934; Hawass 1999)
- **Water channels:** Surveyed with sonar (Hawass 1999)
- **Burial chamber:** Surveyed (Hawass 1999)
- **Gaps:** Northern conduit not fully surveyed

### Khafre (KF)

- **Exterior:** Partially surveyed
- **Interior:** Basic survey
- **Gaps:** Detailed interior not surveyed

### Menkaure (MK)

- **Exterior:** Partially surveyed
- **Gaps:** Limited interior survey

## Coverage Gaps

The following areas lack direct survey data and rely on inference:

1. **Sub-chamber level of Great Pyramid** — no direct survey; hypotheses
   predict location based on shaft geometry and acoustic measurements
2. **Northern conduit of Osiris Shaft** — partially flooded, limited sonar
3. **Khafre interior** — basic survey only, no detailed 3D scan
4. **Menkaure interior** — minimal survey data

## Data Integration

Survey data is integrated into the GIZA platform via:

1. **Survey registry** (`src/loaders/surveyRegistry.ts`) — metadata and
   coverage areas
2. **Published CAD loader** (`src/loaders/publishedCadLoader.ts`) —
   drawing metadata, datum, and extractable dimensions per source
3. **Evidence records** — each survey produces evidence records linked
   to source publications
4. **Geometry** — survey data informs the blockout geometry in
   `database/blockouts/`
5. **Confidence scoring** — areas with direct survey data receive
   higher confidence scores than inferred areas

## References

- Cole, J.H. (1925). *Determination of the Exact Size and Orientation of the Great Pyramid of Giza*. Survey of Egypt.
- Dash, G., & Paulson, J. (2016). *The 2015 Survey of the Base of the Great Pyramid*. Journal of Ancient Egyptian Architecture.
- Gantenbrink, R. (1993). *The Upuaut Project — Robot Survey of King's and Queen's Chamber Shafts*.
- Hassan, S. (1934). *Excavations at Giza*. Cairo.
- Hawass, Z. (2007). *The Discovery of the Osiris Shaft at Giza*.
- Lehner, M., & Goodman, D. (1984). *Giza Plateau Mapping Project (GPMP)*. AERA.
- Petrie, W.M.F. (1883). *The Pyramids and Temples of Gizeh*. Field & Tuer, London.
- Vyse, R.W.H. (1841). *Operations Carried on at the Pyramids of Gizeh in 1837*. London.
