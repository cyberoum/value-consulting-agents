# CHECKPOINT: ROI Lever Candidates — Navy Federal Investment Services (NFIS)

> **Status:** AWAITING CONSULTANT VALIDATION
> **Agent:** roi-hypothesis-builder
> **Date:** 2026-04-08
> **Full details:** `lever_candidates.md` (same directory)

---

## Problem Statement

Navy Federal Investment Services wants to grow from 115K to 800K Digital Investor members by 2030, raise member satisfaction from 58% to 75%, and stem asset outflow to competitors (Schwab, Fidelity, Robinhood, Vanguard). Backbase is positioning Digital Invest to elevate NFIS from a standalone "island" product into the primary investing destination seamlessly integrated with the NFCU banking experience for 14M+ members. Primary problem type: Type 6 (AUM-Based / Advisory Business). Secondary: Type 3 (Digital Transformation), Type 2 (Cost Reduction).

## Problem Type

**Type 6: AUM-Based / Advisory Business**
```
Revenue = AUM x Blended Fee Rate
AUM = Existing AUM x (1 - Attrition) + Net New Assets + Market Appreciation
Net New Assets = New Client AUM + Existing Client Consolidation
```
Secondary: Type 3 (Digital Transformation), Type 2 (Cost Reduction)

## Hypothesis Tree Summary

```
NFIS Revenue Growth
├── A: New Client AUM (ACQUIRE)
│   ├── A1: Banking-to-DI Cross-Sell ← L1 (LEVER)
│   ├── A2: Onboarding Funding Recovery ← L2 (LEVER)
│   └── A3: External Acquisition — EXCLUDED (deprioritized by client)
├── B: Existing Client AUM Growth (EXPAND)
│   ├── B1: AUM Growth via Engagement ← L3 (LEVER)
│   ├── B2: DI-to-FA Tier Upgrade ← L4 (LEVER)
│   ├── B3: ACAT Consolidation ← L5 (LEVER)
│   └── B4: SD-to-Robo Conversion ← L6 (LEVER)
├── C: AUM Retention (RETAIN)
│   ├── C1: Retention & Primacy Lift ← L7 (LEVER)
│   └── C2: Early Churn — FOLDED INTO L2
└── D: Cost to Serve (OPERATING MODEL)
    ├── D1: Servicing Deflection ← L8 (LEVER)
    └── D2: IRA Automation — FOLDED INTO L8
```

## Validated Lever Candidates

| ID | Lever Name | Lifecycle | Type | Root Driver (evidence) | Backbase Enabler | Gap Estimate | Confidence |
|----|-----------|-----------|------|----------------------|-----------------|-------------|------------|
| L1 | Banking-to-DI Cross-Sell Activation | Acquire | revenue_uplift | <1% DI penetration vs 3-5% CU benchmark (E1, E8, E9) | Digital Engage (NBA), Digital Banking integration | +1-3% conversion = 140K-280K new accounts | HIGH |
| L2 | Onboarding-to-Funding Funnel Recovery | Activate | revenue_uplift | 50% close unfunded, 25% open unfunded (E5, E21, E26, E67) | Digital Onboarding (Account Funding), Digital Engage (nudges) | 50% to 70%+ funding rate | HIGH |
| L3 | AUM Growth via Digital Engagement | Expand | revenue_uplift | Static experience, 18% recurring, no push/SMS (E75, E78, E27) | Digital Engage, Digital Invest (dashboard, goals) | 15-20% AUM uplift on engaged | MEDIUM |
| L4 | DI-to-FA Tier Upgrade — Threshold Routing | Expand | revenue_uplift | No threshold detection, absent tier transition (E39, E40) | Digital Invest, Digital Assist, Flow Foundation | X% threshold captures | MEDIUM |
| L5 | ACAT / Asset Consolidation | Expand | revenue_uplift | Paper-based ACAT, competitor assets (E15, E64) | Digital Onboarding (ACAT flow), Digital Engage | +15-20% completion rate | MEDIUM |
| L6 | Self-Directed to Managed/Robo Conversion | Expand | revenue_uplift | 2:1 Robo preference (E6), no proactive conversion | Digital Invest (robo module), Digital Engage | 5-8% SD-to-managed conversion | MEDIUM |
| L7 | Retention & Asset Outflow Prevention | Retain | revenue_uplift | Funds flowing to competitors (E15, E64), TWB not connected (E12) | Digital Invest, Digital Engage (retention campaigns) | 2-3% retention improvement | MEDIUM |
| L8 | Servicing Cost Reduction | Operating Model | cost_avoidance | 130 chats/day at 12m41s, 50% doc rejection (E38, E91, E93) | Digital Invest (self-service), AI & Agentic, Digital Assist | 30-40% chat deflection | HIGH |

### Lever Details (Summary)

**L1 — Banking-to-DI Cross-Sell:** The single largest opportunity. 14M+ NFCU members, <1% penetration, "building wealth" is #3 new member goal. NBA engine in banking app + embedded DI visibility + P2I model connection. HIGH confidence.

**L2 — Funding Funnel Recovery:** The most-discussed pain point across all 4 sessions. 50% of closures never funded due to legacy two-step design. Integrated onboarding-to-funding flow + multi-channel nudges replace 3 manual emails. HIGH confidence.

**L3 — AUM Growth via Engagement:** Static experience with email-only communications. Contextual education, goal integration, surplus cash prompts, push/SMS. 15-20% AUM uplift benchmark (McKinsey proxy). MEDIUM confidence.

**L4 — Tier Upgrade:** "Dream state" today. Automated AUM monitoring + advisor routing + one-click upgrade. Revenue = fee rate delta between DI and FA. MEDIUM confidence (needs threshold data).

**L5 — ACAT Consolidation:** Paper-based process. Digital guided ACAT flow with Apex integration. Delayed curve: Y1-Y2 = 0, ramps from Y3. MEDIUM confidence.

**L6 — SD-to-Robo Conversion:** 2:1 Robo preference signals demand. Targeted conversion campaigns for existing SD holders. Incremental fee: 25-35 bps. MEDIUM confidence.

**L7 — Retention:** "Considerable funds flowing to Robinhood, Schwab." TWB predictive model exists but unconnected. Unified banking+investing experience creates switching cost. MEDIUM confidence (attrition rate needed).

**L8 — Servicing Cost:** 130 chats/day, 12m41s each, 50% doc rejection, manual IRA process. Self-service + AI chatbot + unified agent workspace + IRA automation. HIGH confidence.

## Creative Lever Candidates — CONSULTANT VALIDATION REQUIRED

| ID | Lever Name | Discovery Source | Key Assumption | Confidence |
|----|-----------|-----------------|----------------|------------|
| CL1 | Advisor Referral Pipeline Acceleration | Source 5: NFIS prior engagement ($1.65M steady-state) | Meaningful volume of warm leads going uncontacted | LOW |
| CL2 | FA-Side Advisor Productivity | Source 3: wealth/roi_levers.md + wealth_entitlements_roi.md | FAs face similar 40-60% admin burden as industry | LOW |
| CL3 | Vendor Platform Rationalization (Fusion IQ) | Source 2: Type 2 IT branch + tech_rationalization_decommission.md | Fusion IQ contract is material and replaceable | LOW |
| CL4 | NSF / Recurring Deposit Optimization | Source 1: Re-examined branches + Source 4: capabilities | ~300/day NSFs generate meaningful support cost + churn | LOW |
| CL5 | Member Onboarding Cost Reduction | Source 2: Type 2 Cost branch + investing roi_levers.md Lever 4 | Meaningful manual processing cost per account exists | LOW |

## Excluded Branches

| Branch | Reason for Exclusion |
|--------|---------------------|
| External Member Acquisition | Client deprioritized ("ice skating uphill" — E16) |
| Early Churn (30-day) | Folded into L2 (same root cause — unfunded accounts) |
| IRA Process Automation | Folded into L8 (part of overall servicing cost) |
| Branch/Call Center Migration | Not applicable — DI is digital/chat only |
| Fee Rate Optimization | Contradicts NFIS member-first pricing philosophy (E43) |
| FA Advisor Productivity | Insufficient evidence — elevated to CL2 for validation |

## Coverage Verification

| Check | Status |
|-------|--------|
| MECE (Layer 1 math) | PASS — AUM decomposition covers all revenue/cost paths |
| MECE (Layer 2 overlap) | PASS — no double-counting between levers |
| Lifecycle coverage | PASS — 5/5 stages represented (Acquire, Activate, Expand, Retain, Operating Model) |
| Lever count | PASS — 8 systematic (target: 5-8) + 5 creative |
| Concentration | PASS — Expand has 4/8 = 50% (below 70% threshold) |
| ROI benchmark potential | ASSESSED — lever set spans full value chain; L1 (cross-sell from 14M base) and L2 (funding recovery) are high-magnitude; 100-150% target achievable |

## Top 10 Questions for Consultant

1. What % of 14M+ NFCU members are eligible for DI? (sizes L1)
2. How many new DI accounts are opened per year? (sizes L2, CL5)
3. What is the DI-to-FA AUM threshold and current FA headcount? (sizes L4, CL1)
4. What is the annual DI attrition rate beyond the 30-day free look? (sizes L7)
5. How many FTEs support DI servicing, and at what loaded cost? (sizes L8)
6. Were FA advisor workflows discussed outside these 4 transcripts? (validates CL2)
7. What is the Fusion IQ annual contract cost? (validates CL3)
8. What % of support contacts are NSF-related? (validates CL4)
9. Is the $3.50/month SD fee and robo fee rate confirmed, or is a change planned? (affects all revenue levers)
10. When does Apex custodian migration complete? (gates L5, L8)

## Data Gaps (11 items)

Key missing data points: eligible member base, annual account opens, fee rates by product, DI attrition rate, service team FTE count/cost, FA headcount, Fusion IQ contract cost, ACAT volume, SD account count/AUM. Full list in `lever_candidates.md`.

---

**NEXT STEP:** Consultant validates lever candidates, answers open questions, and approves/rejects creative levers. Then the roi-financial-modeler agent receives this output and quantifies the approved levers into the financial model.

---

<!-- TELEMETRY_START
agent: roi-hypothesis-builder
checkpoint: CHECKPOINT_roi_levers
status: awaiting_consultant_validation
timestamp: 2026-04-08
TELEMETRY_END -->
