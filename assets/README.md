# GIZA Asset Directory Structure

This document describes the asset directory layout for the GIZA project.

## Directory Layout

```
assets/
├── raw/                    # Original source data (read-only)
│   ├── laser-scans/        # E57, LAS, PLY point cloud files
│   ├── photogrammetry/     # OBJ, PLY, glTF source meshes
│   └── surveys/            # Raw survey data (CSV, JSON)
├── intermediate/           # Processed but not yet published
│   └── (working files)
├── export/                 # Published assets ready for runtime
│   ├── glTF/               # Published glTF files
│   ├── glB/                # Published GLB binary files
│   └── LOD/                # LOD chain variants
├── textures/               # Texture files (KTX2, PNG, JPG)
└── materials/              # Material definitions and presets
```

## Asset Pipeline Flow

1. **Raw** → Source data placed in `assets/raw/` (laser scans, photogrammetry, surveys)
2. **Intermediate** → Processing artifacts in `assets/intermediate/` (decimated meshes, optimized textures)
3. **Export** → Published assets in `assets/export/` (glTF/GLB with LODs, KTX2 textures)
4. **Runtime** → Assets loaded by the viewer from `assets/export/`

## Naming Conventions

- Raw files: `{source}_{date}_{type}.{ext}` (e.g., `gp_2024_laserscan.e57`)
- Export files: `{monumentId}_{objectId}_{lodLevel}.glb` (e.g., `gp_kings-chamber_lod0.glb`)
- Textures: `{monumentId}_{objectId}_{mapType}.ktx2` (e.g., `gp_kings-chamber_basecolor.ktx2`)

## Metadata

Every published asset must include GIZA metadata in `extras.giza`:

- `assetId`: Unique asset identifier
- `version`: Asset version number
- `monumentId`: Associated monument
- `evidenceIds`: Linked evidence records
- `confidence`: Confidence score (0-100)
- `author`: Creator
- `approvedBy`: Reviewer who approved publication
