# M06B Asset Manifest

This manifest documents the expected asset files for the GIZA project's
asset production pipeline (M06B). Due to the lean MVP split (ADR-0003),
full asset production is deferred — this manifest serves as the
authoritative list of assets to be produced.

## Asset Categories

### T01: Rubble Assets

| Asset ID   | Description                   | Format | Status  |
| ---------- | ----------------------------- | ------ | ------- |
| RUBBLE_001 | Mixed limestone rubble chunks | GLB    | Pending |
| RUBBLE_002 | Granite rubble fragments      | GLB    | Pending |
| RUBBLE_003 | Small debris scatter          | GLB    | Pending |

### T02: Limestone Bedrock Assets

| Asset ID    | Description                 | Format | Status  |
| ----------- | --------------------------- | ------ | ------- |
| BEDROCK_001 | Tura limestone bedrock slab | GLB    | Pending |
| BEDROCK_002 | Local limestone bedrock     | GLB    | Pending |
| BEDROCK_003 | Weathered limestone surface | GLB    | Pending |

### T03: Granite Assets

| Asset ID    | Description              | Format | Status  |
| ----------- | ------------------------ | ------ | ------- |
| GRANITE_001 | Aswan red granite block  | GLB    | Pending |
| GRANITE_002 | Granite sarcophagus lid  | GLB    | Pending |
| GRANITE_003 | Polished granite surface | GLB    | Pending |

### T04: Stair/Shaft Component Assets

| Asset ID  | Description             | Format | Status  |
| --------- | ----------------------- | ------ | ------- |
| STAIR_001 | limestone stair section | GLB    | Pending |
| STAIR_002 | granite stair section   | GLB    | Pending |
| SHAFT_001 | Vertical shaft lining   | GLB    | Pending |
| SHAFT_002 | Shaft entrance frame    | GLB    | Pending |

### T06: Rendered Material Samples

| Asset ID           | Description                     | Format   | Status  |
| ------------------ | ------------------------------- | -------- | ------- |
| MAT_TuraLimestone  | Tura limestone rendered sample  | KTX2+GLB | Pending |
| MAT_LocalLimestone | Local limestone rendered sample | KTX2+GLB | Pending |
| MAT_AswanGranite   | Aswan granite rendered sample   | KTX2+GLB | Pending |
| MAT_Basalt         | Basalt rendered sample          | KTX2+GLB | Pending |
| MAT_Water          | Water surface rendered sample   | KTX2+GLB | Pending |

### T07: Published Export Assets

| Asset ID | Description        | Format | Status  |
| -------- | ------------------ | ------ | ------- |
| GP_LOD0  | Great Pyramid LOD0 | GLB    | Pending |
| GP_LOD1  | Great Pyramid LOD1 | GLB    | Pending |
| GP_LOD2  | Great Pyramid LOD2 | GLB    | Pending |
| OS_LOD0  | Osiris Shaft LOD0  | GLB    | Pending |
| OS_LOD1  | Osiris Shaft LOD1  | GLB    | Pending |

## Notes

- All assets must include GIZA metadata in `extras.giza` per M06A-T11.
- Assets must pass validation via the publishing pipeline (M06A-T11).
- LOD chains: LOD0 (hero), LOD1 (standard), LOD2 (background), LOD3 (distant).
- Material samples use KTX2 textures for BC7 compression.
- Full asset production is deferred per ADR-0003 (lean MVP split).
