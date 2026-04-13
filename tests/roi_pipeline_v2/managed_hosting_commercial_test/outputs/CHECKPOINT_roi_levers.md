# ROI Lever Candidates — Tier 2 Commercial Bank (Southeast Asia)

**Agent:** roi-hypothesis-builder
**Mode:** Capability-Driven (Managed Hosting pattern)
**Status:** CHECKPOINT — Awaiting consultant validation before financial modeling

---

## Problem Statement

A Tier 2 commercial bank in Southeast Asia (~$15B total assets, ~8,000 commercial clients) currently self-hosts its digital banking platform with 12 dedicated FTEs for platform operations. The bank's CIO is asking "What's the value of Managed Hosting vs. self-hosting?" Backbase is positioning Managed Hosting as part of a broader platform deal for the Commercial Banking LOB. The primary problem is cost reduction on IT infrastructure and operations (Type 2), with secondary implications for digital transformation/channel adoption (Type 3) through faster release cycles and improved platform reliability, and revenue protection (Type 1, Branch B) through uptime improvements.

## Problem Type

**Primary:** Type 2: Cost Reduction / Cost to Serve
```
Total Operating Cost = Cost to Acquire + Cost to Serve + Cost to Retain + IT/Infrastructure Cost
```
Focus area: IT/Infrastructure Cost (Branch D)

**Secondary:** Type 1: Revenue Growth (Branch B — Churn/Revenue Protection via uptime)
**Secondary:** Type 3: Digital Transformation (Branch C — Time to Market via release velocity)

## Hypothesis Tree Summary

```
Managed Hosting (Capability)
│
├─ Infrastructure Management → IT Ops FTE avoidance → [L1] IT Operations FTE Redeployment
├─ Security & Compliance → Compliance FTE + audit avoidance → [L2] Compliance & Security Cost Avoidance
├─ Availability & DR → Revenue protection → [L3] Uptime Revenue Protection
├─ Deployment Management → Time to market → [L4] Release Velocity & Time-to-Market Acceleration
├─ Predictable Cost Model → CFO benefit → [EXCLUDED — qualitative only]
├─ [CREATIVE] License/tooling costs → [L5] Infrastructure License & Tooling Rationalization
├─ [CREATIVE] Freed IT capacity → [L6] IT Staff Capacity Redeployment to Innovation
└─ [CREATIVE] Avoided future remediation → [L7] Tech Debt Accumulation Avoidance
```

## Validated Lever Candidates

| ID | Lever Name | Lifecycle | Type | Root Driver (evidence) | Backbase Enabler | Gap Estimate | Confidence |
|----|-----------|-----------|------|----------------------|-----------------|-------------|------------|
| L1 | IT Operations FTE Redeployment | Operating Model | cost_avoidance | 12 FTEs on self-hosted ops (engagement context) | Managed Hosting — Infrastructure Management | 12 FTEs → 2-3 retained; 9-10 redeployable | MEDIUM |
| L2 | Compliance & Security Cost Avoidance | Operating Model | cost_avoidance | Self-hosted requires in-house security + SOC2/ISO27001 audit (capability pattern) | Managed Hosting — Security & Compliance Certifications | Security FTEs + annual audit costs avoided | MEDIUM |
| L3 | Uptime Revenue Protection | Retain | revenue_uplift | Self-hosted lacks enterprise-grade DR/failover (benchmark pattern) | Managed Hosting — SLA-Backed Uptime (99.9%+) | Downtime hours reduced; commercial txn revenue protected | LOW |
| L4 | Release Velocity & Time-to-Market Acceleration | Operating Model | revenue_uplift | Self-hosted deployment cycles slow (4-8 weeks typical) (capability pattern) | Managed Hosting — Continuous Delivery | Release frequency improvement; weeks-to-days | LOW |
| L5 | Infrastructure License & Tooling Rationalization | Operating Model | cost_avoidance | Self-hosted requires license portfolio (servers, monitoring, DR, backup) (capability pattern) | Managed Hosting — Fully Managed Infrastructure | License/tooling costs absorbed into MH fee | MEDIUM |
| L6 | IT Staff Capacity Redeployment to Innovation | Expand | revenue_uplift | 12 FTEs on ops = no capacity for digital innovation (inferred) | Managed Hosting — Ops Responsibility Transfer | 9-10 FTEs freed for innovation projects | LOW |
| L7 | Tech Debt Accumulation Avoidance | Operating Model | cost_avoidance | Self-hosted accumulates deferred patches, version lag (industry pattern) | Managed Hosting — Continuous Platform Updates | Avoided future remediation cost | LOW |

### L1: IT Operations FTE Redeployment
**Root Driver:** 12 FTEs dedicated to self-hosted platform operations — infrastructure monitoring, incident management, patching, environment management, deployment support, capacity planning. Source: engagement context.
**Operational Change:** Managed Hosting transfers infrastructure ops to Backbase. Bank retains 2-3 FTEs for coordination/vendor management. 9-10 FTEs redeployable or hiring avoided.
**Volume/Rate Impact:** 12 FTEs → 2-3 FTEs retained = 9-10 FTEs delta. Derivation: capability pattern — Managed Hosting absorbs infra, monitoring, patching, DR, deployment.
**Financial Impact Direction:** Redeployable FTEs x loaded annual cost per FTE (Southeast Asia IT ops rates). Cost avoidance. Inputs: loaded FTE cost, role breakdown, bank preference (redeploy vs. reduce).
**Data Needs for Modeling:** Loaded annual FTE cost, role breakdown of 12 FTEs, redeployment vs. reduction preference, Managed Hosting fee for netting.

### L2: Compliance & Security Cost Avoidance
**Root Driver:** Self-hosted platform requires independent SOC2/ISO27001 compliance — dedicated security personnel, annual audits, penetration testing, vulnerability management. Source: capability pattern + industry standard.
**Operational Change:** Managed Hosting includes SOC2 Type II and ISO 27001 certifications. Bank's infrastructure-layer audit scope reduced. Platform security FTEs and audit costs reduced.
**Volume/Rate Impact:** Estimated 2-3 security FTEs (or partial allocations) + annual audit costs. Derivation: capability pattern — MH includes certifications.
**Financial Impact Direction:** (Reduced security FTEs x loaded cost) + (eliminated audit costs) + (eliminated pen testing costs). Inputs: security team allocation, audit costs, pen testing costs.
**Data Needs for Modeling:** Security FTE allocation to platform, annual audit costs, pen testing costs, country-specific regulatory requirements.

### L3: Uptime Revenue Protection
**Root Driver:** Self-hosted platforms at Tier 2 banks lack enterprise-grade HA, failover, and DR. Downtime disrupts commercial payments, balance visibility, treasury operations. Source: capability pattern + commercial benchmark.
**Operational Change:** Managed Hosting provides SLA-backed uptime (99.9%+), automated failover, DR, 24/7 monitoring. Reduces MTTR and downtime frequency.
**Volume/Rate Impact:** Current downtime (data gap — est. 20-100 hrs/yr for self-hosted Tier 2) → <8.76 hrs/yr with 99.9% SLA. Derivation: gap-based.
**Financial Impact Direction:** (Avoided downtime hours) x (digital commercial txns/hr) x (revenue/txn). Inputs: current downtime hours, digital txn volume, revenue per txn.
**Data Needs for Modeling:** Annual unplanned downtime hours, commercial digital txn volume per hour, revenue per digital txn, client attrition linked to outages.

### L4: Release Velocity & Time-to-Market Acceleration
**Root Driver:** Self-hosted deployment cycles slow (4-8 weeks typical) due to manual processes, CAB approvals, environment provisioning. Delays new commercial capabilities. Source: capability pattern.
**Operational Change:** Managed Hosting includes continuous delivery pipeline — updates deployed within days. Accelerates delivery of new commercial banking features.
**Volume/Rate Impact:** 4-8 weeks → days per platform update. 3-5x faster deployment. Derivation: capability pattern.
**Financial Impact Direction:** Revenue acceleration from earlier feature availability. Inputs: feature roadmap, revenue per feature, deployment cycle time. Note: harder to quantify precisely — strategic accelerator framing recommended.
**Data Needs for Modeling:** Current release cycle time, planned feature roadmap, estimated revenue impact of delayed features.

### L5: Infrastructure License & Tooling Rationalization
**Root Driver:** Self-hosted platform requires: server/VM licenses, OS licenses, DB licenses, monitoring tools, backup/DR software, load balancers, WAF, log management. Source: capability pattern + standard self-hosted cost structure.
**Operational Change:** Managed Hosting absorbs all infrastructure-layer software and tooling into a single managed service fee. Eliminates separate vendor contracts.
**Volume/Rate Impact:** Current annual infrastructure costs (data gap) → absorbed into MH fee. Derivation: direct cost replacement.
**Financial Impact Direction:** Annual infrastructure costs avoided. Inputs: itemized infrastructure costs. Financial modeler must net against MH fee.
**Data Needs for Modeling:** Itemized annual infrastructure costs, hosting environment details, MH fee from Backbase proposal.

### L6: IT Staff Capacity Redeployment to Innovation (Creative)
**Root Driver:** 12 FTEs on ops leaves no capacity for digital innovation — portal enhancements, API integrations, analytics. Source: inferred from engagement context. CIO "run vs. build" concern.
**Operational Change:** Managed Hosting frees 9-10 FTEs (per L1) for innovation projects. Shifts IT cost profile from "run" to "build."
**Volume/Rate Impact:** 12 FTEs ops → 2-3 ops + 9-10 innovation. Derivation: second-order effect of L1.
**Financial Impact Direction:** Revenue acceleration from innovation projects. Inputs: innovation backlog, revenue per initiative. Note: qualitative unless bank has concrete innovation pipeline.
**Data Needs for Modeling:** Digital innovation roadmap, revenue estimates per project, redeployment plans.
**Double-Counting Warning:** Uses same FTE pool as L1. Use L1 (cost) OR L6 (revenue), not both, in the financial model.

### L7: Tech Debt Accumulation Avoidance (Creative)
**Root Driver:** Self-hosted platforms accumulate tech debt — deferred patches, version lag, security vulnerability backlog. Creates compounding future costs. Source: industry pattern.
**Operational Change:** Managed Hosting includes continuous platform updates, patching, version management. Eliminates tech debt accumulation.
**Volume/Rate Impact:** Avoided future major upgrade project (typically 6-18 months, significant cost). Derivation: industry pattern.
**Financial Impact Direction:** Avoided future remediation costs over 3-5 year horizon. Inputs: historical upgrade costs, current patch backlog, next upgrade estimate.
**Data Needs for Modeling:** Historical upgrade costs, patch backlog, regulatory findings on platform currency.

## Excluded Branches

| Branch | Reason for Exclusion |
|--------|---------------------|
| Predictable Cost Model (CapEx → OpEx) | Qualitative CFO benefit — no four-link chain possible. Include in narrative, not model. |
| Cost to Acquire (Type 2, Branch A) | Managed Hosting does not influence client acquisition costs. |
| Cost to Serve (Type 2, Branch B) | Servicing costs driven by portal capabilities, not hosting model. |
| Cost to Retain (Type 2, Branch C) | Retention driven by RM and client experience, not hosting. |
| New Acquisitions (Type 1, Branch A) | Managed Hosting does not drive new client acquisition. |
| Products per Customer (Type 1, Branch C) | Cross-sell driven by portal/RM tools, not hosting. |
| Digital Adoption (Type 3, Branch A/B) | Adoption driven by portal UX, not infrastructure hosting. |

## Coverage Check

- **MECE:** Layer 1 math verified. IT/Infrastructure branch (Branch D) decomposed into personnel, compliance, infrastructure costs, and tech debt — non-overlapping categories.
- **Lifecycle stages:** Operating Model (5), Retain (1), Expand (1) — 3 of 5 stages. Concentration in Operating Model expected for infrastructure capability.
- **Lever count:** 7 (5 systematic + 2 creative) — within 5-8 range.
- **Concentration:** 71% Operating Model — flagged, accepted (inherent to Managed Hosting).
- **Double-counting risks:** L1/L6 (same FTE pool, different value framing) and L5/MH fee (gross vs. net). Both flagged for financial modeler.

## Data Gaps

| Data Item | Needed For | Fallback |
|-----------|-----------|----------|
| Loaded annual FTE cost (SE Asia IT ops) | L1, L2, L6 | Regional benchmarks ($25K-50K, country-dependent) |
| 12 FTE role breakdown | L1, L2 | Assume 8-9 infra, 2-3 security, 1-2 deployment |
| Security team allocation to platform | L2 | Estimate 2-3 FTEs or partials |
| Annual audit + pen testing costs | L2 | Regional audit cost benchmarks |
| Annual unplanned downtime hours | L3 | Estimate 20-100 hrs/yr for self-hosted Tier 2 |
| Commercial digital txn volume/hr | L3 | Derive from total volume / business hours |
| Current release cycle time | L4 | Estimate 4-8 weeks |
| Itemized infrastructure costs | L5 | Request from CIO — no reliable benchmark |
| Managed Hosting fee | L5, overall | Required from Backbase sales |
| Historical upgrade project costs | L7 | Estimate from platform upgrade benchmarks |
| Bank's innovation roadmap | L6 | Qualitative only |
| Specific country | All | Affects FTE costs, regulations, benchmarks |

## Questions for Consultant

1. **Country:** Which SE Asian country? Affects FTE costs, regulatory context, benchmarks.
2. **Platform scope:** Does the self-hosted platform serve only Commercial, or also Retail/SME? Multi-LOB scope increases L1/L2/L5 magnitude.
3. **FTE disposition:** Cost reduction, hiring avoidance, or capacity redeployment? Determines L1 vs. L6 framing.
4. **L1/L6 double-counting:** Recommend L1 (cost) as primary, L6 (revenue) as qualitative. Confirm.
5. **Managed Hosting fee:** Available for net cost comparison? Required for credible L5 analysis.
6. **Current hosting model:** On-premise, private cloud, or colocation? Affects L5 and L2 magnitude.
7. **Competitive comparison:** Self-hosted vs. Backbase MH only, or also vs. other MSPs?
8. **Broader platform deal:** Separate lever set for commercial platform capabilities? Ensure no overlap with L3/L4.

---

**Next step:** Consultant validates lever candidates and answers questions above. Then `roi-financial-modeler` agent receives this file + bank data to build the quantified model.
