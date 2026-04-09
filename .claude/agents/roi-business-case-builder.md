---
name: roi-business-case-builder
description: "DEPRECATED — This agent has been replaced by two specialized agents. Use roi-hypothesis-builder for lever identification and roi-financial-modeler for financial modeling. Use the /build-roi skill to orchestrate both."
model: sonnet
color: gray
---

# DEPRECATED

This agent has been replaced by a two-agent architecture:

1. **`roi-hypothesis-builder`** (`.claude/agents/roi-hypothesis-builder.md`) — Defines the problem, builds hypothesis tree, derives value lever candidates
2. **`roi-financial-modeler`** (`.claude/agents/roi-financial-modeler.md`) — Receives validated levers, computes gap-based impacts, builds financial model

**Standalone skill:** `/build-roi` orchestrates both agents outside the full pipeline.

**Original file preserved at:** `.claude/agents/deprecated/roi-business-case-builder.md`

Do NOT use this agent. Use the new agents instead.
