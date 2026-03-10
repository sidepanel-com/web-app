# SidePanel Documentation

This directory covers system-level architecture, terminology, and structural constraints.

Code-level patterns and usage live in local READMEs (e.g., `src/spaces/packages/workspace/README.md`, `db/ledger/README.md`). Do not duplicate code-level content here.

---

## Contents

| File | Role |
|---|---|
| [architecture.md](architecture.md) | System layers, ownership boundaries, data flow |
| [architecture-data-flow.md](architecture-data-flow.md) | Implementation-level data access and permission flow across layers |
| [architecture-remediation.md](architecture-remediation.md) | Phased plan to align codebase with the layer model |
| [glossary.md](glossary.md) | Canonical terminology |

---

## Writing Rules

- Each file has one role. Do not combine architecture with term definitions or constraints with orientation.
- Do not duplicate content across files. Reference instead.
- Delete outdated content before adding new content.
- Keep documentation precise, stable, and enforceable. Avoid speculative or transient content.
- If code and documentation diverge, update code to match intent or record a decision explaining the change.
- Documentation must increase development velocity. If it slows things down, simplify it.
