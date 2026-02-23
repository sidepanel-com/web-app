# SidePanel Documentation

This directory defines the architectural philosophy and guardrails for SidePanel.

SidePanel is a tenant-scoped, communication-first operating system.

The goal of this documentation is to:

- Preserve architectural clarity
- Prevent layer violations
- Enable safe package development
- Support high-velocity iteration with LLM assistance
- Avoid long-term schema drift

---

## Core Principle

SidePanel separates:

**Reality**  
from  
**Business Interpretation**

The system is structured into explicit layers. Each layer has ownership and constraints.

---

## Documentation Structure

### `/architecture/layer-model.md`

Defines the canonical layer model:

- Platform Layer
- Ledger (Product Reality) Layer
- Temporal Model
- Activity Layer
- Projection (Packages) Layer
- Permission Layer

This document explains what each layer owns and what it must never do.

---

### `/architecture/guardrails.md`

Defines non-negotiable architectural rules, including:

- Schema boundaries
- Mutation discipline
- Temporal correctness
- Projection restrictions
- Package development constraints

This is the enforcement document.

---

### `/decisions/`

Architecture Decision Records (ADRs).

Each major structural decision is documented once and not debated repeatedly.

---

### `/glossary.md`

Defines canonical terminology used across the system.

All contributors and LLM prompts should use consistent vocabulary from this file.

---

## Guiding Philosophy

SidePanel is built around a communication ledger.

- Ledger answers: **What actually happened?**
- Packages answer: **What does it mean in this business context?**

The ledger is stable.
Packages evolve.

Architecture exists to increase long-term velocity, not slow development.

---

## Non-Negotiable Rules

- Canonical reality never contains business workflow state.
- Temporal relationships preserve historical truth.
- Packages do not duplicate ledger data.
- All mutations are explicit and auditable.
- Permission is applied at projection level, not ledger level.

---

## When in Doubt

If you are unsure where something belongs, ask:

1. Is this objective reality?
2. Is this business interpretation?
3. Is this access control?
4. Is this time-bound identity?

Then consult `layer-model.md`.

---

This documentation should remain minimal, precise, and enforceable.

It is not a feature guide.
It is a structural contract.
