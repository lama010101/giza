# GIZA Documentation

## Structure

```
docs/
  README.md              ← you are here
  mvp-roadmap.md         ← Phase 1–3 delivery plan (ADR-0002)
  useful-web-resources.md
  adr/                   ← Architecture Decision Records
    README.md
    0001-giza-core-content-split.md
    0002-scoped-mvp-roadmap.md
  specs/                 ← Canonical specification set (do not modify without explicit instruction)
    GIZA - 00 Master Specification.md
    GIZA - 01 Vision & Scientific Foundation.txt
    GIZA - 02 Information Architecture & UX.txt
    GIZA - 03 Osiris Shaft Specification.txt
    GIZA - 04 Technical Architecture.txt
    GIZA - 05 Data Architecture.txt
    GIZA - 06 Simulation Framework.txt
    GIZA - 07 Great Pyramid Specification.txt
    GIZA - 08 Evidence Database Specification.txt
    GIZA - 09 Sources & Bibliography Standard.txt
    GIZA - 10 Asset Production Pipeline.txt
    GIZA - 11 Hypothesis Framework.md
    GIZA - 15 Implementation Roadmap.md
    GIZA - 16 Hydraulic-Acoustic System Hypothesis Specification.md
    GIZA - 17 AI Development Governance & Engineering Standards.md
    GIZA - 99 Development Playbook.md
```

## Reading Order

Per GIZA - 99 Development Playbook §2:

1. **GIZA - 00** — Master Specification (entry point, meta-architecture, glossary)
2. **GIZA - 01** — Vision & Scientific Foundation
3. **GIZA - 17** — AI Development Governance & Engineering Standards
4. **GIZA - 99** — Development Playbook
5. **GIZA - 15** — Implementation Roadmap
6. **GIZA - 02** — Information Architecture & UX
7. **GIZA - 04** — Technical Architecture
8. **GIZA - 05** — Data Architecture
9. **GIZA - 03** — Osiris Shaft Specification
10. **GIZA - 07** — Great Pyramid Specification
11. **GIZA - 06** — Simulation Framework
12. **GIZA - 08** — Evidence Database Specification
13. **GIZA - 09** — Sources & Bibliography Standard
14. **GIZA - 10** — Asset Production Pipeline
15. **GIZA - 11** — Hypothesis Framework
16. **GIZA - 16** — Hydraulic-Acoustic System Hypothesis Specification

## Specification Protection

Numbered specifications (00–11, 15–17, 99) are canonical and must not be modified without explicit instruction from the project owner. See GIZA - 00 §13.1 and GIZA - 17 §4.

## Decision Records

ADRs are in `docs/adr/`. See `docs/adr/README.md` for format and index. Current decisions:

- **ADR-0001:** GIZA-Core / GIZA-Content two-repository split — **Accepted** (split executes at Internal Alpha)
- **ADR-0002:** Scoped MVP Roadmap — **Accepted** (three-phase delivery, Phase 1 in scope)
