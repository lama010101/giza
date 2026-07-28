# GIZA — Hypothesis Framework Specification

**Version:** 0.1 Draft
**Status:** Working Specification
**Last update:** 2026-07-28

This specification defines the Hypothesis Framework, one of the fundamental engines of the GIZA platform. The framework manages multiple competing hypotheses regarding the construction, function, and operation of the Giza Plateau, allowing users to explore, compare, visualize, and experimentally test them against shared evidence.

This document is the architectural counterpart of the theory-independence principle established in *GIZA - 01 Vision & Scientific Foundation* §7 and operationalized in *GIZA - 05 Data Architecture* §-13 and *GIZA - 08 Evidence Database Specification* §1.24. It elevates that principle from a side constraint to the primary purpose of the platform.

GIZA is no longer simply a digital reconstruction. It is an interactive scientific platform for evaluating competing explanations of the Giza Plateau through evidence, visualization, simulation, and comparative analysis.

---

# 1. Purpose and Scope

## 1.1 Purpose

The Hypothesis Framework enables the platform to present multiple simultaneous, scientifically neutral interpretations of every archaeological object. Users activate one or more hypotheses, and the scene updates dynamically with overlays, annotations, simulations, and evidence panels — while the underlying geometry never changes.

## 1.2 Scope

This specification defines:

* the hypothesis data model and schema
* the plugin architecture for hypotheses
* the prediction framework
* the per-hypothesis confidence model
* the comparison framework
* the relationship between hypotheses, evidence, simulations, and geometry
* the visualization rules engine
* the terminology standard

It does not redefine the evidence model (owned by *08*), the data model (owned by *05*), the simulation solvers (owned by *06*), or the rendering pipeline (owned by *04*). It defines how hypotheses interact with those subsystems.

## 1.3 Dependencies

This specification depends on:

* *GIZA - 01 Vision & Scientific Foundation* (principles, evidence classes, confidence scale)
* *GIZA - 05 Data Architecture* (Theory schema §-13, Object schema §-14, confidence propagation §-10)
* *GIZA - 06 Simulation Framework* (simulation lifecycle, parameter provenance)
* *GIZA - 08 Evidence Database Specification* (evidence lifecycle, dependency graph, theory independence §1.24)

## 1.4 Relation to the Existing Theory Concept

The existing specifications define a `Theory` entity (*05* §-13) as an interpretation overlay with `supports`, `contradicts`, `confidence`, `authors`, and `references`. The `Hypothesis` entity defined here is a formalization and extension of that concept. A `Hypothesis` is a `Theory` augmented with:

* plugin packaging (installable without engine modification)
* explicit predictions (observable claims testable against evidence)
* per-object-per-hypothesis confidence (not a single per-theory score)
* visualization rules (declarative overlay specifications)
* linked simulation modules

The existing `THEORY-NNN` identifier namespace is retained. `Hypothesis` records use the same namespace. A `Hypothesis` is a `Theory` with additional fields; a legacy `Theory` without the new fields is still valid and treated as a hypothesis without predictions.

---

# 2. Core Principle: Multiple Simultaneous Hypotheses

## 2.1 Principle

Every archaeological object shall support multiple simultaneous hypotheses. The geometry never changes. Only the interpretation changes.

## 2.2 Example

```
Object:
    Granite Sarcophagus

Measurements:
    Dimensions
    Position
    Material
    Orientation

Evidence:
    Laser scans
    Photographs
    Publications
    Surveys

Hypotheses:
    • Mainstream Funerary Interpretation
    • Hydraulic Reservoir
    • Acoustic Resonator
    • Chemical Reactor
    • Mathematical Reference System
    • Astronomical Instrument
    • Unknown Function
```

The sarcophagus geometry, dimensions, position, material, and orientation are identical across all hypotheses. What changes is the explanation of its function, the overlays that highlight relevant features, the simulations that model its behavior under each interpretation, and the confidence assessment.

## 2.3 Scientific Neutrality

The platform must never assume that any interpretation is the "correct" one. It distinguishes between:

| Layer | Description | Mutability |
| ----- | ----------- | ---------- |
| Observable evidence | Measurements, scans, photographs | Immutable |
| Measured data | Dimensions, positions, materials | Immutable |
| Scientific sources | Publications, bibliographic records | Immutable |
| Interpretations (hypotheses) | Explanatory models | Replaceable |
| Predictions | Observable claims derived from hypotheses | Derived |
| Simulations | Physics solver outputs | Reproducible |
| Confidence assessments | Per-hypothesis confidence scores | Derived |

Evidence is immutable. Interpretations are interchangeable.

---

# 3. Hypothesis Schema

## 3.1 Full Schema

```json
{
  "id": "THEORY-GP-002",
  "name": "Hydraulic Interpretation",
  "description": "The internal passages of the Great Pyramid functioned as a hydraulic system.",
  "authors": [
    { "name": "Jane Doe", "orcid": "0000-0001-2345-6789" }
  ],
  "historicalBackground": "Proposed in the context of hydraulic ramp theories.",
  "scientificAssumptions": [
    "Water was available at the plateau level during construction.",
    "The Descending Passage could serve as a pressure conduit.",
    "The Subterranean Chamber could function as a reservoir."
  ],
  "predictions": [
    { "id": "PRED-GP-002-01", "description": "Water pathways conform to surveyed passage geometry.", "evidenceRefs": ["EV-003012"], "status": "partially-confirmed" },
    { "id": "PRED-GP-002-02", "description": "Erosion patterns consistent with water flow are present in the Descending Passage.", "evidenceRefs": [], "status": "untested" }
  ],
  "affectedStructures": ["OBJ-0012", "OBJ-0018", "LOC-007"],
  "supports": ["EV-003012", "EV-003045"],
  "contradicts": ["EV-002088"],
  "requiredEvidence": ["EV-003012"],
  "simulations": ["SIM-008", "SIM-012"],
  "visualizationRules": [
    { "target": "OBJ-0018", "overlay": "highlight-passage", "color": "#4488ff" },
    { "target": "OBJ-0012", "overlay": "water-level", "elevation": 2.5 }
  ],
  "confidence": 35,
  "confidenceByObject": {
    "OBJ-0012": 73,
    "OBJ-0018": 41,
    "OBJ-0025": 28
  },
  "confidenceModel": {
    "weights": { "sourceReliability": 0.35, "measurementQuality": 0.30, "consensus": 0.20, "directObservation": 0.15 },
    "notes": "Consensus weight is low because this hypothesis lacks mainstream acceptance."
  },
  "references": ["SRC-0210", "SRC-0211"],
  "bibliography": ["SRC-0210", "SRC-0211", "SRC-0215"],
  "plugin": {
    "package": "giza-hypothesis-hydraulic",
    "version": "0.1.0",
    "entry": "./index.ts",
    "configSchema": "./config.schema.json"
  },
  "status": "published",
  "tags": ["hydraulic", "engineering"]
}
```

## 3.2 Field Reference

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `THEORY-NNN` | yes | Stable identifier (same namespace as legacy Theory, *05* §-13) |
| `name` | string | yes | Human-readable name |
| `description` | string | yes | Short description of the hypothesis |
| `authors` | array | yes | Authors with ORCID where available |
| `historicalBackground` | string | no | Historical context of the hypothesis |
| `scientificAssumptions` | array | yes | Explicit assumptions the hypothesis makes |
| `predictions` | array | yes | Observable predictions (§4) |
| `affectedStructures` | array | yes | Object and Location IDs this hypothesis interprets |
| `supports` | array | no | Evidence IDs that support this hypothesis |
| `contradicts` | array | no | Evidence IDs that contradict this hypothesis |
| `requiredEvidence` | array | no | Evidence IDs without which the hypothesis is untenable |
| `simulations` | array | no | Simulation IDs linked to this hypothesis |
| `visualizationRules` | array | no | Declarative overlay specifications (§7) |
| `confidence` | number 0–100 | yes | Overall hypothesis confidence (aggregate of `confidenceByObject`) |
| `confidenceByObject` | map | yes | Per-object confidence for each affected structure (§5) |
| `confidenceModel` | object | no | Weights and notes for the confidence calculation |
| `references` | array | yes | Source IDs (SRC-NNNNNN) |
| `bibliography` | array | no | Extended bibliography for the hypothesis |
| `plugin` | object | no | Plugin packaging metadata (§6) |
| `status` | enum | yes | `draft` \| `in-review` \| `published` \| `deprecated` |
| `tags` | array | no | Free-form tags for search and filtering |

## 3.3 Backward Compatibility

A legacy `Theory` record (*05* §-13) with only `id`, `name`, `description`, `supports`, `contradicts`, `confidence`, `authors`, and `references` is a valid `Hypothesis` with:

* empty `predictions`
* empty `confidenceByObject` (overall `confidence` used for all objects)
* empty `visualizationRules`
* no `plugin` metadata

The engine treats legacy theories and full hypotheses uniformly. New hypotheses should populate all fields.

---

# 4. Prediction Framework

## 4.1 Purpose

Every hypothesis must define observable predictions. A prediction is a claim that, if the hypothesis is correct, a specific observable phenomenon should be present in the evidence. The system compares predicted observations against measured evidence.

## 4.2 Prediction Schema

```json
{
  "id": "PRED-GP-002-01",
  "hypothesisId": "THEORY-GP-002",
  "description": "Erosion patterns consistent with water flow are present in the Descending Passage.",
  "predictedObservation": "Directional erosion marks aligned with passage slope.",
  "evidenceRefs": ["EV-003045"],
  "status": "untested",
  "comparisonResult": null
}
```

## 4.3 Prediction Status

| Status | Meaning |
| ------ | ------- |
| `untested` | No evidence has been compared yet |
| `confirmed` | Evidence matches the prediction |
| `partially-confirmed` | Some evidence matches; some is ambiguous |
| `contradicted` | Evidence contradicts the prediction |
| `inconclusive` | Evidence is insufficient to confirm or contradict |

## 4.4 Prediction Comparison

The system compares each prediction against referenced evidence:

```
Prediction
    ↓
Search evidence database for matching observations
    ↓
Compare predicted observation vs measured observation
    ↓
Assign status: confirmed | partially-confirmed | contradicted | inconclusive | untested
    ↓
Feed result into confidence recalculation
```

Comparison is automated where the evidence and prediction are structured (e.g., dimensional checks, material composition). Where evidence is qualitative (e.g., erosion patterns), the comparison is proposed by the system and confirmed by a human reviewer.

## 4.5 Example Predictions

### Hydraulic Hypothesis Predicts

* water pathways conforming to passage geometry
* erosion patterns consistent with directional water flow
* pressure distribution matching conduit dimensions
* sediment deposition in low-velocity zones

### Acoustic Hypothesis Predicts

* resonance frequencies at specific chamber dimensions
* standing wave nodes at specific positions
* reflection zones at chamber boundaries
* amplification at specific frequencies

### Chemical Hypothesis Predicts

* reaction chamber geometry compatible with reactant flow
* residue locations at predicted deposition sites
* compatible materials at contact surfaces
* ventilation paths aligned with gas flow requirements

---

# 5. Per-Hypothesis Confidence Model

## 5.1 Principle

Confidence shall never belong to an object alone. Confidence belongs to:

```
Object + Hypothesis
```

## 5.2 Example

```
Sarcophagus (OBJ-0012)

    Mainstream Funerary    92%
    Hydraulic              73%
    Acoustic               51%
    Chemical               38%
    Mathematical           44%
    Astronomical           29%
    Unknown Function       10%
```

Each confidence value is independent. A high confidence for one hypothesis does not imply a low confidence for another. Multiple hypotheses may have high confidence if the evidence is ambiguous.

## 5.3 Confidence Propagation

The existing propagation chain (*05* §-10, *08* §1.8) is extended:

```text
Evidence
    ↓
Object Confidence (geometry + measurement)
    ↓
Hypothesis Confidence per Object (evidence supports/contradicts/required)
    ↓
Overall Hypothesis Confidence (aggregate of per-object confidence)
    ↓
Simulation Confidence (bounded by hypothesis + geometry confidence)
```

## 5.4 Per-Object-Per-Hypothesis Formula

For each (Object, Hypothesis) pair:

```
Confidence(Object, Hypothesis)
=
  weighted average of:
    supporting evidence confidence × source reliability
  minus:
    contradicting evidence confidence × source reliability
  bounded by:
    required evidence confidence (if any required evidence is missing or weak, confidence is capped)
```

The weights from *08* §1.9 are retained:

| Factor | Weight |
| ------ | ------ |
| Source reliability | 0.35 |
| Measurement quality | 0.30 |
| Consensus | 0.20 |
| Direct observation | 0.15 |

A hypothesis may declare a custom `confidenceModel` with different weights (§3.2), but the default weights apply unless overridden.

## 5.5 Overall Hypothesis Confidence

The `confidence` field on the hypothesis is the aggregate of `confidenceByObject`:

```
Overall Confidence = mean(confidenceByObject values)
```

This is a summary, not a substitute for the per-object values. The UI always shows per-object confidence when an object is selected.

## 5.6 Confidence Does Not Pick a Winner

Confidence values are independent. The platform never declares one hypothesis "correct." It shows the confidence distribution and lets the user draw conclusions. A hypothesis with 92% confidence and another with 73% confidence for the same object are both presented without ranking them as "right" and "wrong."

---

# 6. Plugin Architecture

## 6.1 Principle

Each hypothesis must behave like a plugin. Future hypotheses should be installable without modifying the engine.

## 6.2 Plugin Package

A hypothesis plugin is a self-contained package with:

```
giza-hypothesis-<name>/
├── package.json          (package name, version, peer dependency on giza-core)
├── index.ts              (entry: registers hypothesis, predictions, visualization rules)
├── hypothesis.json       (hypothesis schema, §3.1)
├── predictions.json      (prediction definitions, §4.2)
├── visualization.json    (visualization rules, §7)
├── config.schema.json    (optional user-configurable parameters)
├── simulations/          (optional: simulation module bindings)
│   └── <sim-module>.ts
└── bibliography.json     (SRC- references)
```

## 6.3 Plugin Interface

```typescript
interface HypothesisPlugin {
  id: string;                    // THEORY-NNN
  name: string;
  activate(context: HypothesisContext): void;
  deactivate(context: HypothesisContext): void;
  getPredictions(): Prediction[];
  getVisualizationRules(): VisualizationRule[];
  getConfidenceModel(): ConfidenceModel;
  onSimulationResult(simId: string, result: SimulationResult): void;
}

interface HypothesisContext {
  sceneGraph: SceneGraph;
  evidenceDb: EvidenceDatabase;
  activeHypotheses: string[];
  config: Record<string, unknown>;
}
```

## 6.4 Registration

Hypotheses are registered at startup via a plugin registry:

```typescript
hypothesisFramework.register(new HydraulicHypothesisPlugin());
hypothesisFramework.register(new AcousticHypothesisPlugin());
```

The engine loads all registered hypotheses. A hypothesis that fails to load is reported but does not crash the engine.

## 6.5 No Engine Modification

Installing a new hypothesis must not require changes to any engine source file. The hypothesis declares its `affectedStructures`, `predictions`, `visualizationRules`, and `simulations`. The engine applies these declaratively. If a hypothesis requires a new simulation solver, the solver is also a plugin (see *06* §1.2, extended).

## 6.6 Plugin Lifecycle

```
Discovered → Loaded → Registered → Activated (by user) → Deactivated → Unregistered → Unloaded
```

A hypothesis may be loaded but not activated. Only activated hypotheses affect the scene. Multiple hypotheses may be activated simultaneously.

---

# 7. Visualization Rules

## 7.1 Principle

When a hypothesis is activated, the scene updates dynamically with overlays, annotations, labels, simulations, and animations. The geometry itself remains unchanged.

## 7.2 Visualization Rule Schema

```json
{
  "target": "OBJ-0018",
  "overlay": "highlight-passage",
  "color": "#4488ff",
  "opacity": 0.4,
  "label": "Pressure Conduit",
  "annotation": "The Descending Passage is interpreted as a pressure conduit under this hypothesis.",
  "simulationOverlay": "SIM-008",
  "conditions": {
    "activeHypotheses": ["THEORY-GP-002"],
    "mode": "Explore"
  }
}
```

## 7.3 Overlay Types

| Overlay | Effect | Geometry Change |
| ------- | ------ | --------------- |
| `highlight` | Color/opacity highlight on existing mesh | No |
| `label` | Floating text label | No |
| `annotation` | Evidence-panel annotation | No |
| `water-level` | Semi-transparent water plane at elevation | No (additive overlay) |
| `flow-arrows` | Animated directional arrows | No (additive overlay) |
| `resonance-field` | Color-coded field visualization | No (additive overlay) |
| `interpretive-object` | Theory-only 3D object (e.g., seal, conduit) | No (separate object, never modifies base mesh) |
| `simulation-overlay` | Real-time simulation visualization | No (overlay on existing geometry) |

No overlay modifies the base mesh. Interpretive objects are separate scene nodes that exist only when the hypothesis is active.

## 7.4 Multi-Hypothesis Visualization

When multiple hypotheses are active simultaneously:

* Each hypothesis's overlays are rendered in its assigned color.
* Overlapping overlays blend with opacity.
* Conflicting overlays (e.g., two hypotheses labeling the same object differently) show both labels with hypothesis attribution.
* The user can toggle individual hypothesis overlays on/off without deactivating the hypothesis.

## 7.5 Scientific Evidence Mode

In Scientific Evidence mode (*03* §2.5, *07* §2.5), all hypothesis overlays and interpretive objects are hidden. Only measured geometry and evidence hotspots are visible. This mode is hypothesis-agnostic by design.

---

# 8. Evidence Model

## 8.1 Principle

Evidence shall never belong to a specific hypothesis. Evidence is shared. Interpretations reference evidence. Never duplicate evidence.

## 8.2 Evidence Flow

```text
Laser scan
    ↓
Evidence Database (EV-NNNNNN)
    ↓
Referenced by:
    • Mainstream hypothesis
    • Hydraulic hypothesis
    • Acoustic hypothesis
    • Chemical hypothesis
    • Mathematical hypothesis
```

## 8.3 Schema Enforcement

Evidence records have no `hypothesisId` field (already enforced by *08* §1.24). Hypotheses reference evidence via `supports`, `contradicts`, `requiredEvidence`, and prediction `evidenceRefs`. The dependency is unidirectional:

```
Hypothesis → Evidence (one-way reference)
```

Removing a hypothesis never alters evidence. Adding a hypothesis never requires new measurements.

## 8.4 Shared Evidence, Independent Interpretation

The same laser scan of the sarcophagus is referenced by the mainstream hypothesis (as evidence of a funerary artifact), the hydraulic hypothesis (as evidence of a reservoir), and the acoustic hypothesis (as evidence of a resonator). The evidence record contains only the measurement. The interpretation lives in the hypothesis.

---

# 9. Simulation Modules

## 9.1 Principle

The simulation framework (*06*) is extended from a single engine to independent, pluggable simulation modules. Each module is a self-contained solver that can be linked to one or more hypotheses.

## 9.2 Module Types

| Module | Solver | Example Hypothesis |
| ------ | ------ | ------------------ |
| Hydraulic | Fluid dynamics | Hydraulic Interpretation |
| Acoustic | Wave propagation | Acoustic Resonator |
| Structural | Stress analysis | Construction sequence |
| Chemical | Reaction modeling | Chemical Reactor |
| Thermal | Heat transfer | Thermal processing |
| Electromagnetic | EM field propagation | Astronomical Instrument |
| Particle Flow | Granular flow | Construction ramp |

## 9.3 Pluggability

Future simulation modules must be installable without modifying the engine. A simulation module is a plugin that:

1. registers a solver type
2. declares its parameter schema
3. declares its output schema
4. binds to one or more hypotheses via the hypothesis `simulations` field

## 9.4 Hypothesis-Simulation Link

A hypothesis references simulations via the `simulations` array. When a hypothesis is activated, its linked simulations become available to the user. Running a simulation under a hypothesis tags the result with both the simulation ID and the hypothesis ID, so that results are traceable to the interpretive context.

## 9.5 Prediction-Simulation Loop

```text
Hypothesis defines predictions
    ↓
Simulation produces outputs under hypothesis assumptions
    ↓
Outputs compared against predictions
    ↓
Predictions confirmed or contradicted
    ↓
Confidence recalculated
```

This closes the loop between hypothesis, simulation, prediction, and evidence.

---

# 10. Comparison Framework

## 10.1 Purpose

Users must be able to compare hypotheses side-by-side. The purpose is comparison, not advocacy.

## 10.2 Comparison Criteria

| Criterion | Source |
| --------- | ------ |
| Assumptions | `scientificAssumptions` |
| Supporting evidence | `supports` |
| Contradicting evidence | `contradicts` |
| Required evidence | `requiredEvidence` |
| Predicted observations | `predictions` |
| Prediction status | prediction `status` |
| Simulation outputs | linked `simulations` results |
| Unresolved questions | predictions with `untested` or `inconclusive` status |
| Confidence (per object) | `confidenceByObject` |
| Overall confidence | `confidence` |
| Bibliography | `bibliography` |

## 10.3 Comparison View

The comparison view presents a table with hypotheses as columns and criteria as rows:

```
                    Mainstream    Hydraulic    Acoustic    Chemical
Assumptions         ...           ...          ...         ...
Supporting evidence 5 refs        3 refs       2 refs      1 ref
Contradicting       1 ref         4 refs       3 refs      5 refs
Predictions         3 confirmed   1 partial    0 confirmed 0 confirmed
Confidence (OBJ-12) 92%           73%          51%         38%
Bibliography        12 sources    8 sources    5 sources   3 sources
```

## 10.4 Side-by-Side Scene

In addition to the tabular comparison, the user may open a side-by-side scene view:

```
┌─────────────────┬─────────────────┐
│                 │                 │
│  Mainstream     │   Hydraulic     │
│  overlays       │   overlays      │
│                 │                 │
│  confidence 92% │  confidence 73% │
│                 │                 │
└─────────────────┴─────────────────┘
```

Each pane renders the same geometry with the overlays of one hypothesis. The cameras are synchronized. Panning, rotating, or zooming in one pane mirrors in the other.

## 10.5 Neutrality

The comparison view never ranks hypotheses as "right" or "wrong." It presents the data. The user draws conclusions.

---

# 11. User Interface Integration

## 11.1 Hypothesis Selector

A hypothesis selector panel lists all installed hypotheses with checkboxes:

```
✓ Mainstream Funerary
✓ Hydraulic Reservoir
☐ Acoustic Resonator
☐ Chemical Reactor
☐ Mathematical Reference System
☐ Astronomical Instrument
☐ Unknown Function
```

The user activates one or multiple. The scene updates dynamically.

## 11.2 Dynamic Scene Update

When a hypothesis is activated or deactivated:

1. Its visualization rules are applied or removed (§7).
2. Its interpretive objects appear or disappear.
3. Its linked simulations become available or unavailable.
4. Its evidence references appear in the evidence panel.
5. Its confidence values appear on affected objects.
6. The geometry does not change.

## 11.3 Hypothesis Panel

When an object is selected, the right panel shows the hypothesis panel:

```
Granite Sarcophagus (OBJ-0012)

Hypothesis              Confidence    Key Evidence
Mainstream Funerary     92%           EV-001, EV-003
Hydraulic               73%           EV-030, EV-045
Acoustic                51%           EV-030
Chemical                38%           (none)
Mathematical            44%           EV-072

[Compare hypotheses →]
```

## 11.4 Comparison Mode Entry

A "Compare hypotheses" button opens the comparison view (§10). This is accessible from the hypothesis panel, the bottom toolbar, and the Research mode tools.

---

# 12. Terminology

## 12.1 Preferred Terms

| Preferred Term | Use |
| -------------- | --- |
| Hypothesis | A specific interpretive framework for an object or structure |
| Interpretive framework | A broader explanatory model |
| Scientific model | A formalized hypothesis with predictive power |
| Explanatory model | A general interpretation |
| Interpretation | The act or result of explaining evidence |

## 12.2 Avoided Terms

| Avoided Term | Reason |
| ------------ | ------ |
| Alternative theory | Implies a "main" theory and marginalizes others |
| Fringe theory | Dismissive; prejudges scientific merit |
| Pseudo-science | Prejudges the hypothesis before evaluation |

## 12.3 Relationship to "Theory"

The existing term `Theory` (defined in *00* §10.2 and *05* §-13) remains valid. `Hypothesis` is the preferred term going forward. In the data model, both use the `THEORY-NNN` identifier namespace. The terms are used as follows:

* `Theory` — the data entity and identifier namespace (legacy, retained for compatibility)
* `Hypothesis` — the conceptual term for an interpretive framework with predictions and per-object confidence (preferred in all user-facing and specification text)

---

# 13. API Endpoints

The Hypothesis Framework exposes the following endpoints, extending the API defined in *05* §-2 and *08* §1.25:

```
GET    /hypotheses                    List all installed hypotheses
GET    /hypotheses/:id                Hypothesis detail (full schema)
GET    /hypotheses/:id/predictions    Predictions for a hypothesis
GET    /hypotheses/:id/confidence     Per-object confidence for a hypothesis
GET    /hypotheses/:id/evidence       Evidence referenced by a hypothesis
GET    /hypotheses/:id/simulations    Simulations linked to a hypothesis
POST   /hypotheses/:id/activate       Activate a hypothesis (session-scoped)
POST   /hypotheses/:id/deactivate     Deactivate a hypothesis (session-scoped)
GET    /compare                       Comparison data for a set of hypotheses
GET    /compare/scene                 Side-by-side scene configuration
POST   /hypotheses/install            Install a hypothesis plugin
POST   /hypotheses/:id/predictions/:predId/compare  Run prediction comparison
```

All endpoints return typed data. Activation/deactivation is session-scoped and does not persist across sessions unless the user saves the session (*02* §23.21).

---

# 14. Plugin Discovery and Installation

## 14.1 Discovery

Hypothesis plugins are discovered from:

1. The local `hypotheses/` directory in the repository
2. Installed npm packages matching `giza-hypothesis-*`
3. A configured remote registry (future)

## 14.2 Installation

```bash
npm install giza-hypothesis-hydraulic
```

On installation, the plugin is registered with the framework. It is not activated by default. The user activates it via the hypothesis selector (§11.1).

## 14.3 Validation

Installed plugins are validated against the hypothesis schema (§3.1). A plugin that fails validation is reported but does not crash the engine. Validation checks:

* `id` is unique and follows `THEORY-NNN` format
* `predictions` is a non-empty array
* `confidenceByObject` covers all `affectedStructures`
* `references` resolve to existing `SRC-` records
* `simulations` resolve to registered simulation modules
* `visualizationRules` target existing objects

## 14.4 Uninstallation

Uninstalling a hypothesis plugin removes it from the registry. Evidence and sources referenced by the hypothesis are not affected (they are shared, §8). Sessions that had the hypothesis activated are updated to reflect its absence.

---

# 15. Scientific Transparency

## 15.1 Assumptions Are Visible

Every hypothesis declares its `scientificAssumptions`. These are visible in the hypothesis panel and the comparison view. The user sees what the hypothesis assumes before evaluating its conclusions.

## 15.2 Predictions Are Testable

Every hypothesis defines `predictions`. Each prediction has a `status` that is visible. The user sees which predictions are confirmed, contradicted, or untested.

## 15.3 Confidence Is Decomposed

Confidence is shown per-object-per-hypothesis, not as a single number. The user sees which objects are well-supported and which are speculative under each hypothesis.

## 15.4 Evidence Is Shared

The same evidence is referenced by multiple hypotheses. The user can see which evidence supports one hypothesis and contradicts another. Contradictions are presented, not hidden.

## 15.5 No Advocacy

The platform never advocates for a hypothesis. It presents assumptions, predictions, evidence, simulations, and confidence. The user draws conclusions.

---

# 16. Performance Considerations

## 16.1 Overlay Budget

Hypothesis overlays are additive and must fit within the rendering budget (*04* §6.27). Each overlay has a cost:

| Overlay | Approx. cost |
| ------- | ------------ |
| `highlight` | Low (material parameter change) |
| `label` | Low (DOM/Sprite) |
| `annotation` | None (panel only) |
| `water-level` | Medium (transparent plane) |
| `flow-arrows` | Medium (animated particles) |
| `resonance-field` | High (full-screen field) |
| `interpretive-object` | Medium (additional mesh) |
| `simulation-overlay` | High (real-time solver output) |

The framework enforces a maximum number of simultaneously active overlays per object. When the budget is exceeded, lower-priority overlays are deferred with a UI indicator.

## 16.2 Multi-Hypothesis Rendering

When multiple hypotheses are active, overlays are batched per object to minimize draw calls. Interpretive objects from different hypotheses are grouped but rendered in hypothesis-assigned colors for disambiguation.

## 16.3 Side-by-Side Scene

The comparison side-by-side view renders two scenes. On desktop, each pane runs at half the resolution of the full-screen view. On mobile, the side-by-side view is replaced by a tabbed single-pane comparison.

---

# 17. Proposed Enhancements

* Hypothesis marketplace: community-contributed hypothesis plugins with review workflow
* Automated prediction testing: AI-assisted comparison of predictions against evidence
* Hypothesis versioning: track how a hypothesis evolves over time
* Collaborative hypothesis editing: multiple authors working on a hypothesis plugin
* Hypothesis dependency graph: visualize relationships between hypotheses (refines, contradicts, extends)

---

# 18. Revision History

| Date | Version | Change |
| ---- | ------- | ------ |
| 2026-07-28 | 0.1 Draft | Initial Hypothesis Framework specification: schema, plugin architecture, predictions, per-hypothesis confidence, comparison framework, visualization rules, terminology, API |
