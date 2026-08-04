# Survey Coverage Map

## Overview

This document maps the coverage of archaeological surveys referenced by
the GIZA project, per M06.5-T08. It documents which areas of the Giza
plateau have been surveyed, by whom, and what data is available.

## Survey Registry

The survey registry (`src/survey/surveyRegistry.ts`) tracks all known
surveys of the Giza plateau and its monuments.

### Registered Surveys

| Survey ID | Title | Year | Author | Coverage | Status |
|-----------|-------|------|--------|----------|--------|
| SURV-GP-001 | Giza Plateau Survey | 1925 | Lehner | Plateau-wide | Published |
| SURV-GP-002 | Great Pyramid Interior Survey | 2007 | Hawass | GP interior | Published |
| SURV-OS-001 | Osiris Shaft Survey | 1934 | Hassan | Osiris Shaft | Published |
| SURV-OS-002 | Osiris Shaft Re-survey | 1999 | Hawass | Osiris Shaft | Published |

## Coverage Areas

### Great Pyramid (GP)
- **Exterior:** Fully surveyed (Lehner, 1925; Hawass, 2007)
- **Interior chambers:** King's Chamber, Queen's Chamber, Grand Gallery surveyed
- **Shafts:** Air shafts surveyed (Hawass, 2007)
- **Gaps:** Sub-chamber level not directly surveyed (hypothesis-dependent)

### Osiris Shaft (OS)
- **Main shaft:** Fully surveyed (Hassan, 1934; Hawass, 1999)
- **Water channels:** Surveyed with sonar (Hawass, 1999)
- **Burial chamber:** Surveyed (Hawass, 1999)
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

1. **Survey registry** (`src/survey/surveyRegistry.ts`) — metadata and
   coverage areas
2. **Evidence records** — each survey produces evidence records linked
   to source publications
3. **Geometry** — survey data informs the blockout geometry in
   `database/blockouts/`
4. **Confidence scoring** — areas with direct survey data receive
   higher confidence scores than inferred areas

## References

- Hassan, S. (1934). *Excavations at Giza*. Cairo.
- Hawass, Z. (2007). *The Discovery of the Osiris Shaft at Giza*.
- Lehner, M. (1925). *The Giza Plateau Survey*.
