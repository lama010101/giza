# GIZA — Master Specification

**Version:** 0.1 Draft
**Status:** Working Specification
**Repository:** https://github.com/lama010101/giza.git

This document is the canonical entry point for the GIZA project repository. It does not contain specifications itself. It defines how the specifications relate to one another, how the repository is organized, and how contributors and AI coding agents should navigate and extend it.

For any architectural decision, the numbered specifications are authoritative. This document is meta-architectural.

---

# 1. Project Overview

GIZA is an interactive scientific hypothesis exploration platform for the Giza Plateau.

The project reconstructs the plateau's monuments and subterranean structures as explorable 3D environments in which every visible element is traceable to archaeological evidence, and in which every archaeological object supports multiple simultaneous, scientifically neutral hypotheses regarding its construction, function, and operation.

The platform is **not** a documentary advocating a single conclusion. It is a scientific visualization engine in which users inspect evidence, compare hypotheses, visualize predictions, run simulations, and understand uncertainty. The primary purpose is to allow users to explore, compare, visualize, and experimentally test multiple competing hypotheses against shared evidence.

The full mission, product objectives, and core principles are defined in *GIZA - 01 Vision & Scientific Foundation* and are not repeated here.

---

# 2. Purpose of This Document

This document exists to:

* provide a single entry point for the repository
* establish the current specification version
* define the reading order
* map dependencies between specifications
* summarize the scope of each specification without duplicating it
* state the architectural principles that span all specifications
* define cross-document conventions
* record the revision history
* list planned future specifications
* instruct AI coding agents working on the repository
* guide human contributors

It is intentionally short. Depth lives in the numbered specifications.

---

# 3. Current Specification Version

| Field             | Value         |
| ----------------- | ------------- |
| Specification set | 0.3 Draft     |
| Document count    | 15 (00–11, 15, 99, ADR-0001) |
| Status            | Working specification |
| Last update       | 2026-07-28    |

The specification set is considered a working draft until the first implementation milestone is reached. Until then, documents may be extended but not rewritten without explicit instruction.

The numbered specifications (00–11) define *what* is built. Specification 11 (Hypothesis Framework) is the architectural centerpiece: it elevates the platform from a digital reconstruction to a scientific hypothesis exploration platform. Two operational documents extend the specifications without overriding them: *GIZA - 15 Implementation Roadmap* (how, in what order, when a task is finished) and *GIZA - 99 Development Playbook* (how development is conducted day to day). Architecture decisions are recorded as ADRs under `docs/adr/`.

---

# 4. Repository Organization

```
giza/
├── GIZA - 00 Master Specification.md
├── GIZA - 01 Vision & Scientific Foundation.txt
├── GIZA - 02 Information Architecture & UX.txt
├── GIZA - 03 Osiris Shaft Specification.txt
├── GIZA - 04 Technical Architecture.txt
├── GIZA - 05 Data Architecture.txt
├── GIZA - 06 Simulation Framework.txt
├── GIZA - 07 Great Pyramid Specification.txt
├── GIZA - 08 Evidence Database Specification.txt
├── GIZA - 09 Sources & Bibliography Standard.txt
├── GIZA - 10 Asset Production Pipeline.txt
├── GIZA - 11 Hypothesis Framework.md
├── GIZA - 15 Implementation Roadmap.md
├── GIZA - 99 Development Playbook.md
├── docs/
│   └── adr/
│       ├── README.md
│       └── 0001-giza-core-content-split.md
└── .devin/
    ├── config.json
    └── rules/
        └── giza.md
```

### File Naming Convention

```
GIZA - <NN> <Title>.<ext>
```

* `NN` is a two-digit zero-padded number.
* `00` is reserved for this master document.
* `01`–`11` are the canonical numbered specifications.
* `15` is the Implementation Roadmap (operational; bridges specs to executable work).
* `99` is the Development Playbook (operational; defines how development is conducted).
* Numbers `11`–`14` and `16`–`98` are reserved for future numbered specifications (see §11).
* The master document, the roadmap, and the playbook use `.md`; the numbered specifications use `.txt` to preserve compatibility with the existing corpus.

### Numbering Rules

* Numbers are stable. A published number is never reused.
* Numbers are never reordered. Insertions append at the next free number.
* Numbers do not imply strict reading order (see §6).
* Numbers do imply dependency layering (see §7).

---

# 5. Scope of Each Specification

Each specification is summarized below. The summaries define boundaries, not content. For full content, read the document.

### 01 Vision & Scientific Foundation

Defines the mission, product objectives, core principles, scientific methodology, evidence classification (E1–E8), confidence scale, and theory independence.

Foundational. Every other document inherits these definitions.

### 02 Information Architecture & UX

Defines the information architecture, user types, UX philosophy, interface layout, navigation modes (Explore, Guided, Research, Documentary, Presentation, Museum), evidence and theory panels, timeline navigation, layer manager, search, bookmarks, measurements, cross-sections, comparison mode, accessibility, and session persistence.

### 03 Osiris Shaft Specification

Defines the first fully explorable environment. Establishes the reconstruction methodology: chronology, geometry, room-by-room specification, materials, lighting, evidence hotspots, interaction, and performance. Reference implementation for all subsequent environments.

### 04 Technical Architecture

Defines the software architecture: frontend stack, folder structure, scene graph, coordinate system, asset standards, rendering engine, materials, lighting, cameras, interaction, evidence overlays, audio, navigation, debug mode, performance targets, rendering budgets, and the asset pipeline outline.

### 05 Data Architecture

Defines the core data model: Evidence, Source, Object, Location, Theory, Simulation, Annotation, Media, Users, Bookmarks, Measurements. Defines confidence propagation, the knowledge graph, version control, change logs, API design, search, filters, citation engine, bibliography engine, timeline engine, localization, offline support, security model, and extensibility.

### 06 Simulation Framework

Defines the simulation subsystem: design philosophy, simulation categories (Hydraulic, Acoustic, Geological, Structural, Thermal, Atmospheric, Human Movement), lifecycle, parameter sets, parameter provenance, visualization, validation, time control, comparison mode, metadata, scientific transparency, export formats, API integration, and performance strategy.

### 07 Great Pyramid Specification

Defines the second fully explorable environment and the first monument-scale reconstruction. Equivalent in scope to the Osiris Shaft specification. Covers all chambers, passages, shafts, relieving chambers, materials, lighting, evidence hotspots, interaction model, chronology layers, theory-independent reconstruction, theory variants, and performance considerations.

### 08 Evidence Database Specification

Defines the operational rules of the knowledge engine. Extends the Data Architecture with evidence lifecycle, identifiers, classes, review workflow, dependency graph, confidence propagation, scientific review, version history, conflict resolution, evidence linking, geometry linkage, media attachment, import/export workflows, and audit history.

### 09 Sources & Bibliography Standard

Defines citation rules, source reliability, DOI/ISBN/ORCID handling, archival URLs, museum references, image licensing, video references, duplicate detection, bibliography generation, metadata requirements, and preservation strategy. Extends the Source schema from the Data Architecture.

### 10 Asset Production Pipeline

Defines the production pipeline for every 3D asset: directory structure, naming conventions, layered coordinate system, Blender workflow, photogrammetry, laser scan integration, retopology, UV workflow, texture standards, PBR material library, mesh budgets, collision rules, LOD generation, glTF export, validation, publishing, and mandatory scientific metadata embedded in glTF node extras.

### 11 Hypothesis Framework

Defines the Hypothesis Framework, the architectural centerpiece that elevates GIZA from a digital reconstruction to a scientific hypothesis exploration platform. Covers the hypothesis data model and schema, plugin architecture, prediction framework, per-hypothesis confidence model, comparison framework, visualization rules engine, evidence sharing, pluggable simulation modules, terminology standard, and API endpoints. Extends the Theory concept from *05* §-13 and the theory-independence principle from *01* §7. Every archaeological object supports multiple simultaneous hypotheses; geometry never changes, only the interpretation changes.

---

# 6. Reading Order

The specifications are layered. New readers should follow this order.

### For All Readers

```
00 Master Specification
    ↓
01 Vision & Scientific Foundation
    ↓
02 Information Architecture & UX
```

### For Archaeologists and Researchers

```
01 Vision & Scientific Foundation
    ↓
05 Data Architecture
    ↓
08 Evidence Database Specification
    ↓
09 Sources & Bibliography Standard
    ↓
03 Osiris Shaft Specification
    ↓
07 Great Pyramid Specification
```

### For Engineers and Developers

```
01 Vision & Scientific Foundation
    ↓
04 Technical Architecture
    ↓
05 Data Architecture
    ↓
06 Simulation Framework
    ↓
10 Asset Production Pipeline
    ↓
03 Osiris Shaft Specification
    ↓
07 Great Pyramid Specification
```

### For UX and Product Contributors

```
01 Vision & Scientific Foundation
    ↓
02 Information Architecture & UX
    ↓
04 Technical Architecture (§6 only)
```

### For 3D Artists and Asset Producers

```
01 Vision & Scientific Foundation
    ↓
04 Technical Architecture (§5, §7 only)
    ↓
10 Asset Production Pipeline
    ↓
03 Osiris Shaft Specification (§2 only)
    ↓
07 Great Pyramid Specification (§2 only)
```

No reader is required to read all documents. Each specification is readable independently, with cross-references where context is needed.

---

# 7. Document Dependency Graph

Dependencies indicate which specification defines concepts that another specification consumes. Dependencies are not strict reading orders; they are architectural layering.

```text
01 Vision & Scientific Foundation
                │
                ▼
02 Information Architecture & UX
                │
      ┌─────────┴─────────┐
      ▼                   ▼
03 Osiris Shaft      05 Data Architecture
      │                   │
      │                   ▼
      │             08 Evidence Database
      │                   │
      │                   ▼
      │             09 Sources & Bibliography
      │
      ▼
04 Technical Architecture
      │
      ├──────────┐
      ▼          ▼
06 Simulation  10 Asset Production Pipeline
      │
      ├──────────┐
      ▼          ▼
11 Hypothesis  07 Great Pyramid
Framework
```

### Dependency Notes

* `01` is the root. Every other document depends on it.
* `02` depends on `01` and informs `04`.
* `03` depends on `01` and `02`, and is the reference implementation for `04`.
* `11` depends on `01`, `05`, `06`, and `08`. It is the architectural centerpiece that extends the Theory concept (*05* §-13) into a full hypothesis framework with plugins, predictions, per-hypothesis confidence, and comparison.
* `04` depends on `01`, `02`, and `03`.
* `05` depends on `01`.
* `06` depends on `01`, `04`, and `05`.
* `07` depends on `01`, `02`, `03`, `04`, `05`, `06`, and `11`.
* `08` depends on `05`.
* `09` depends on `05`.
* `10` depends on `04` and `05`.
* `11` depends on `01`, `05`, `06`, and `08`.

### Independence Guarantees

* `08`, `09`, and `10` may be read without reading `03`, `07`, or `11`.
* `03` and `07` may be read without reading `08`, `09`, `10`, or `11` (but `07` is enriched by `11`).
* `06` may be read without reading any environment specification.
* `11` may be read without reading `03` or `07` (it is environment-agnostic).

---

# 8. Architectural Principles

The following principles span all specifications. They are stated here once and referenced elsewhere.

## 8.1 Hypothesis Exploration

GIZA is a scientific hypothesis exploration platform. Every archaeological object supports multiple simultaneous, scientifically neutral hypotheses. The platform never assumes any interpretation is correct. Users activate one or more hypotheses; the scene updates dynamically with overlays, simulations, and evidence panels; the geometry never changes. Confidence belongs to (Object, Hypothesis), not to an object alone.

Defined in *11* (Hypothesis Framework) and grounded in *01* §7 (theory independence, extended).

## 8.2 Evidence First

Evidence is immutable. Interpretations are replaceable. Every visible claim links to one or more sources. Nothing appears as fact unless directly measured. Evidence is shared across hypotheses; interpretations reference evidence, never the reverse.

Defined in *01* §3 (Principles 1–4) and operationalized in *08* and *11* §8.

## 8.2 Four-Layer Separation

```
Observed Evidence

↓

Measured Reconstruction

↓

Interpretation

↓

Simulation
```

These layers never mix. Defined in *01* §4 and enforced by the schema in *05* and *08*.

## 8.3 Hypothesis Independence

Geometry exists independently. Hypotheses are overlays. Removing a hypothesis never alters evidence or geometry. Adding a hypothesis never requires new measurements. Evidence is shared; interpretations reference evidence, never the reverse. Defined in *01* §7 (extended) and operationalized in *11* §8, *07* §2.32, and *08* §1.24. The legacy term "Theory Independence" is retained for backward compatibility; "Hypothesis Independence" is the preferred term.

## 8.4 Geometry First

Visual quality never overrides geometric accuracy. Defined in *01* §3 (Principle 5).

## 8.5 Confidence Is Explicit

Nothing is presented as binary true/false. Confidence is continuous and propagated through the dependency graph. Confidence belongs to (Object, Hypothesis), not to an object alone. Multiple hypotheses may have high confidence for the same object; confidence values are independent and never pick a winner. Defined in *01* §6, operationalized in *05* §-9, §-10, *08* §1.8, and extended in *11* §5.

## 8.6 Modularity

Each specification is independent. Each subsystem is replaceable. Each monument reuses the same framework. Defined in *05* §7 and reinforced throughout.

## 8.7 Scientific Transparency

Uncertainty is visible. Contradictions are visible. Simulation assumptions are visible. Defined in *06* §1.22 and reinforced in *08* §1.15.

---

# 9. Separation of Responsibilities

Each specification owns a distinct concern. No concern is owned by two specifications.

| Concern                        | Owner  |
| ------------------------------ | ------ |
| Mission and principles         | 01     |
| User experience                | 02     |
| Environment reconstruction     | 03, 07 |
| Software architecture          | 04     |
| Data model                     | 05     |
| Simulation                     | 06     |
| Hypothesis framework           | 11     |
| Evidence operations            | 08     |
| Bibliography                   | 09     |
| Asset production               | 10     |

### Conflict Resolution Between Specifications

Where two specifications appear to conflict:

1. The more specific specification prevails.
2. The earlier-numbered specification prevails on foundational matters.
3. The conflict is recorded as an issue and resolved by editorial decision.
4. The resolution is recorded in the revision history (§12).

---

# 10. Cross-Document Conventions

These conventions apply to every specification.

## 10.1 Format

* Markdown
* Numbered chapters starting at 1 within each document
* Numbered subsections (e.g., `2.3`)
* Tables with right-aligned numeric columns
* ASCII diagrams in fenced code blocks
* JSON examples in fenced code blocks
* `---` horizontal rules between chapters
* No marketing language
* No emojis unless explicitly requested

## 10.2 Terminology

Stable terms used across documents:

| Term                  | Definition                                          | Defined In |
| --------------------- | --------------------------------------------------- | ---------- |
| Evidence              | An observation record                               | 01 §5, 05 §-17 |
| Source                | A bibliographic record                              | 05 §-16, 09 §1.3 |
| Object                | A reconstructed item                                | 05 §-14    |
| Location              | A spatial hierarchy node                            | 05 §-15    |
| Theory                | An interpretation overlay (legacy term; data entity and identifier namespace THEORY-NNN) | 05 §-13 |
| Hypothesis            | An interpretive framework with predictions, per-object confidence, and plugin packaging; preferred term for Theory | 11 §3, §12 |
| Prediction            | An observable claim derived from a hypothesis, testable against evidence | 11 §4 |
| Simulation            | A physics solver run                                | 06 §1      |
| Confidence            | A continuous score 0–100, belonging to (Object, Hypothesis) | 01 §6, 11 §5 |
| Evidence class        | E1–E8                                               | 01 §5      |
| Chronology layer      | A historical period visualization layer             | 03 §2.3, 07 §2.30 |
| Theory variant        | A modular interpretation overlay (legacy term; see Hypothesis variant) | 07 §2.32 |
| Hypothesis variant    | A modular interpretation overlay; preferred term for Theory variant | 07 §2.32, 11 §3 |
| Visualization rule    | A declarative overlay specification tied to a hypothesis | 11 §7 |
| Interpretive object   | A hypothesis-only visible object, never in Scientific Evidence mode | 03 §2.5, 07 §2.5, 11 §7.3 |
| Local Plateau Coordinates | The plateau-scale world coordinate system       | 04 §4, 10 §1.5 |

New terms must be added to this table when introduced.

### Terminology Standard

The following terms are preferred. The avoided terms must not be used in specifications, UI, or documentation.

| Preferred Term          | Avoided Term       | Reason |
| ----------------------- | ------------------ | ------ |
| Hypothesis              | Alternative theory | Implies a "main" theory and marginalizes others |
| Hypothesis              | Fringe theory      | Dismissive; prejudges scientific merit |
| Hypothesis              | Pseudo-science     | Prejudges the hypothesis before evaluation |
| Interpretive framework  | Alternative theory | Same as above |
| Scientific model        | Fringe theory      | Same as above |
| Explanatory model       | Pseudo-science     | Same as above |

Defined in *11* §12.

## 10.3 Identifier Namespaces

| Namespace | Format       | Owner |
| --------- | ------------ | ----- |
| Evidence  | `EV-NNNNNN`  | 08 §1.4 |
| Source    | `SRC-NNNNNN` | 09 §1.4 |
| Object    | `OBJ-NNNN`   | 05 §-14 |
| Location  | `LOC-NNN`    | 05 §-15 |
| Theory    | `THEORY-NNN` | 05 §-13 |
| Simulation| `SIM-NNN`    | 05 §-12 |
| Media     | `MED-NNNN`   | 08 §1.19 |
| Mesh      | `MESH-...`   | 10 §1.4 |
| Material  | `MAT_...`    | 10 §1.13 |
| Monument  | `MON-...`    | 07 §2.6 |

Identifiers are stable, opaque, never reused, and never renamed.

## 10.4 Coordinate System

All documents use the layered coordinate system defined in *04* §4 and extended in *10* §1.5.

* Y axis: vertical
* X axis: east-west
* Z axis: north-south
* Units: meters
* Scale: 1.0 = 1 meter

## 10.5 Cross-References

Cross-references use the form:

```
*GIZA - <NN> <Title>* §<chapter>
```

Example:

```
*GIZA - Evidence Database Specification* §1.8
```

Cross-references are preferred over duplication.

## 10.6 Proposed Enhancements

Each specification may close with "Proposed Enhancement" sections. These describe future capabilities that do not yet exist. They are not part of the current implementation contract but record the project's intended direction.

---

# 11. Future Planned Specifications

The following documents are anticipated. Numbers are reserved.

| Number | Title                              | Status    |
| ------ | ---------------------------------- | --------- |
| 11     | Hypothesis Framework               | Published |
| 12     | Menkaure Pyramid Specification     | Planned   |
| 13     | Sphinx Specification               | Planned   |
| 14     | Causeways and Temples Specification| Planned   |
| 16     | Construction Sequence Specification| Planned   |
| 17     | API Specification                  | Planned   |
| 18     | Localization Specification         | Planned   |
| 19     | Accessibility Specification        | Planned   |
| 20     | VR / XR Specification              | Planned   |
| 21     | Collaboration Specification        | Planned   |
| 22     | Security Specification             | Planned   |
| 23     | Deployment Specification           | Planned   |
| 24     | Testing & QA Specification         | Planned   |
| 25     | Plateau Topography Specification   | Planned   |
| 26     | Khafre Pyramid Specification       | Planned   |

Number `11` was reassigned from "Khafre Pyramid Specification" (previously planned, never published) to "Hypothesis Framework" by editorial decision. Khafre is now planned at `26`. Per the numbering rules (§4), a published number is never reused; `11` was never published as Khafre, so reassignment is permitted.

Number `15` is assigned to the *Implementation Roadmap* (operational document, not a numbered specification). Number `99` is assigned to the *Development Playbook* (operational document). Numbers `27`–`98` are reserved for future numbered specifications.

Architecture Decision Records are not numbered specifications; they live under `docs/adr/` and are indexed in `docs/adr/README.md`.

New specifications must:

* follow the writing style defined in §10
* reference existing specifications rather than duplicating them
* declare their dependencies in their introduction
* be committed individually before being considered canonical

---

# 12. Revision History

| Version | Date       | Changes                                              |
| ------- | ---------- | ---------------------------------------------------- |
| 0.1     | 2026-07-28 | Initial working specification set (00–10)           |
| 0.2     | 2026-07-28 | Added operational documents: *GIZA - 15 Implementation Roadmap* and *GIZA - 99 Development Playbook*. Added `docs/adr/` with ADR-0001 (GIZA-Core / GIZA-Content split, Proposed). Updated §3 (document count), §4 (repo organization, naming convention), §11 (15 reassigned to roadmap; Plateau Topography moved to 25; 99 reserved for playbook). No numbered specification 01–10 was modified. |
| 0.3     | 2026-07-28 | Architectural evolution: GIZA is now a Scientific Hypothesis Exploration Platform. Added *GIZA - 11 Hypothesis Framework* (new centerpiece specification). Updated §1 (project overview), §3 (doc count 15), §4 (repo org, naming), §5 (scope of 11), §7 (dependency graph), §8 (new principle 8.1 Hypothesis Exploration; 8.3 renamed to Hypothesis Independence; 8.5 confidence per-hypothesis), §9 (separation of responsibilities), §10 (terminology: Hypothesis, Prediction, Visualization rule, Interpretive object; terminology standard), §11 (11 = Hypothesis Framework Published; Khafre moved to 26). Modified specs 01, 02, 03, 04, 05, 06, 07, 08, 09, 10 to integrate the hypothesis framework. |

### Per-Document Revision History

Each specification maintains its own version history internally. The table above tracks the specification set as a whole.

A new row is added when:

* a new specification is added
* an existing specification is materially revised
* the architectural principles in §8 change
* the dependency graph in §7 changes

---

# 13. AI Coding Agent Instructions

This section instructs AI coding agents (Devin, Claude, Copilot, GLM, and others) working on the repository. AI agents must also read *GIZA - 99 Development Playbook* before touching the repository; it defines the day-to-day workflow, prompt templates, git workflow, coding conventions, review checklist, common mistakes, and recovery procedures that complement the rules below.

## 13.1 Repository Rules

* Do **not** rewrite, reorganize, or modify existing specifications (01–10) unless explicitly instructed.
* Extend the documentation by adding new specifications or new sections to existing specifications only when instructed.
* Create one file per new specification.
* Restart chapter numbering from 1 in each new document.
* Commit each completed specification before proceeding to the next.
* Follow the implementation roadmap (*GIZA - 15 Implementation Roadmap*) for ordering, milestone definitions, task Definition of Done, and the Definition of Scientific Done for traceable content.
* Follow the governance framework (milestone M-1): Conventional Commits, trunk-based branching, PR template, and ADRs for any architectural decision not already settled by a specification.
* Regenerate documentation (`npm run docs`) on every merge; the global Definition of Done requires it.

## 13.2 Writing Style

* Match the existing specifications exactly.
* Use Markdown with numbered chapters and subsections.
* Use tables, ASCII diagrams, JSON examples, and `---` separators.
* Use concise paragraphs and scientific language.
* Avoid unnecessary prose, marketing language, and emojis.

## 13.3 Architectural Alignment

* Follow the four-layer separation (§8.2).
* Follow theory independence (§8.3).
* Follow evidence-first principles (§8.1).
* Reference existing specifications rather than duplicating them.
* Use the identifier namespaces defined in §10.3.
* Use the coordinate system defined in §10.4.

## 13.4 Verification

Before considering a task complete:

* Verify that no existing specification was modified without instruction.
* Verify that cross-references resolve to real chapters.
* Verify that identifier formats match §10.3.
* Verify that the writing style matches §10.1.
* Run `git status` to confirm a clean working tree after committing.

## 13.5 Commit Conventions

* One specification per commit.
* Commit messages focus on "why" not "what".
* Include the Devin co-author trailer when applicable.
* Do not push unless explicitly asked.

## 13.6 Ambiguity

When a request is ambiguous:

1. Interpret it using the existing specifications.
2. Search the repository for related patterns.
3. If still uncertain, ask a focused clarifying question.

Do not guess. Do not invent architectural decisions that belong in a specification.

---

# 14. Contributor Guidance

## 14.1 Who Can Contribute

The project welcomes contributions from:

* archaeologists and Egyptologists
* software engineers
* 3D artists and technical artists
* simulation specialists
* UX designers
* educators and museum professionals
* documentary creators

## 14.2 How to Contribute

1. Read *00 Master Specification* in full.
2. Read the specification relevant to your contribution (see §6).
3. Open an issue describing the proposed change or addition.
4. Discuss the change with maintainers before implementing.
5. Implement following the writing style (§10) and architectural principles (§8).
6. Submit a pull request with one specification per commit.
7. Ensure no existing specification is modified without explicit approval.

## 14.3 Evidence Contributions

Evidence contributions (new measurements, surveys, scans) follow the workflow in *08* §1.3 and the source standard in *09*.

* Every evidence record must declare a confidence basis.
* Every source must declare a license.
* Every web source must declare an archival URL.
* No evidence bypasses scientific review.

## 14.4 Asset Contributions

Asset contributions (3D models, textures, materials) follow the pipeline in *10*.

* Every asset must embed scientific metadata in glTF extras.
* Every asset must pass automated validation.
* Every asset must link to at least one evidence record.
* No asset is published without Editor approval.

## 14.5 Code of Conduct

Contributions are evaluated on technical and scientific merit. Personal beliefs about the function of the monuments are not a basis for accepting or rejecting evidence. The platform presents multiple interpretations transparently and does not privilege any hypothesis.

## 14.6 Licensing

The specification documents in this repository are licensed for open scientific use. Individual evidence and asset licenses are recorded per record (see *09* §1.14 and *10* §1.18). Contributors retain attribution via the audit history (see *08* §1.22).

---

# 15. Glossary

This glossary defines terms that span multiple specifications. Term definitions live here; deeper context lives in the referenced specification.

| Term                          | Brief Definition                                  | See |
| ----------------------------- | ------------------------------------------------- | --- |
| Evidence                      | An observation record, class E1–E8                | 01 §5, 08 |
| Source                        | A bibliographic record                            | 05 §-16, 09 |
| Object                        | A reconstructed item                              | 05 §-14 |
| Location                      | A spatial hierarchy node                          | 05 §-15 |
| Theory                        | An interpretation overlay                         | 05 §-13, 07 §2.31 |
| Simulation                    | A physics solver run                              | 06 §1 |
| Confidence                    | A continuous score 0–100                          | 01 §6, 08 §1.8 |
| Chronology layer              | A historical period visualization layer           | 03 §2.3, 07 §2.30 |
| Theory variant                | A modular interpretation overlay                  | 07 §2.32 |
| Local Plateau Coordinates     | The plateau-scale world coordinate system         | 04 §4, 10 §1.5 |
| Monument Coordinates          | Coordinate system centered on a monument          | 10 §1.5 |
| Room Coordinates              | Coordinate system centered on a room              | 10 §1.5 |
| Object Coordinates            | Coordinate system centered on an object pivot     | 10 §1.5 |
| Evidence hotspot              | A metadata-driven interactive marker              | 04 §6.16 |
| Interpretive object           | A theory-only visible object                      | 03 §2.5, 07 §2.5 |
| Scientific Evidence mode      | Display mode showing only evidence-backed elements | 03 §2.5 |
| Dependency graph              | The directed acyclic graph of evidence relations  | 08 §1.10 |
| Confidence propagation        | Automatic recalculation of dependent confidence   | 08 §1.8 |
| glTF extras                   | glTF node metadata block for scientific traceability | 10 §1.18 |

---

# 16. Contact and References

* Repository: https://github.com/lama010101/giza.git
* Issue tracker: GitHub Issues on the repository
* Specification set version: 0.1 Draft

For questions about a specific specification, open an issue referencing the document number (e.g., `07` for the Great Pyramid Specification).

For questions about the specification set as a whole, open an issue referencing `00`.
