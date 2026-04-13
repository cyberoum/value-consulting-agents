# ROI Lever Candidates — SeABank (Southeast Asia Commercial Joint Stock Bank)

## Problem Statement

SeABank, a Vietnamese retail bank, has invested in digital capabilities (including digital onboarding) but is experiencing low adoption, high abandonment, and extended cycle times that undermine customer acquisition and increase cost-to-serve. Backbase is positioning a full digital banking platform (Digital Onboarding, Digital Banking, Digital Lending, Digital Engage) to accelerate digital adoption, recover lost onboarding volume, shift servicing to self-service channels, and enable digital lending origination. The primary LOB is Retail Banking, and the engagement spans the full customer lifecycle from acquisition through servicing. The scope is Vietnam domestic retail banking; no multi-country or wealth/SME segments are in play based on available evidence.

## Problem Type

Type 3: Digital Transformation / Channel Adoption — `Digital Value = Revenue Uplift from Digital + Cost Savings from Channel Migration`

Secondary: Type 1 (Revenue Growth — acquisition recovery), Type 2 (Cost Reduction — servicing cost), Type 5 (Lending Origination — digital lending)

## Hypothesis Tree Summary

```
Digital Value (Type 3 primary)
├── A. Digital Adoption (Activate)
│   ├── A1. Enrollment → Activation → Active Usage → Feature Utilization
│   │   KPI: Digital Active Rate (benchmark: Poor <20%, Avg 25-35%, BIC >60%)
│   │   Client: Unknown (DG7) — digital launched but "hasn't scaled well" (E7)
│   │   Gap: YES → evidence of low adoption → LEVER CANDIDATE (L5)
│   │
│   └── A2. Process Automation / Manual Workaround Elimination
│       KPI: STP Rate (benchmark: Poor <50%, Avg 50-70%, BIC >85%)
│       Client: "Teams still rely on manual workarounds" (E8)
│       Gap: YES → LEVER CANDIDATE (L6)
│
├── B. Channel Migration (Activate → Retain)
│   ├── B1. Branch-to-Digital Transaction Shift
│   │   KPI: Self-service rate (benchmark: Poor <40%, Avg 50-65%, BIC >90%)
│   │   Client: "Simple requests still come through the call center" (E5)
│   │   Gap: YES → LEVER CANDIDATE (L4)
│   │
│   └── B2. Call Center Deflection
│       KPI: Call center deflection rate (benchmark: Poor <20%, Avg 20-40%, BIC >60%)
│       Client: "Servicing is expensive" (E4), simple requests in call center (E5)
│       Gap: YES → LEVER CANDIDATE (L3)
│
├── C. Digital Revenue (Acquire + Expand)
│   ├── C1. Digital Onboarding Conversion (Acquire)
│   │   KPI: Digital Leakage (benchmark: Poor >90%, Avg 70-90%, BIC <50%)
│   │   Client: "Low completion rate" (E1), document drop-off (E2)
│   │   Gap: YES → LEVER CANDIDATE (L1)
│   │
│   ├── C2. Onboarding Cycle Time Acceleration (Activate)
│   │   KPI: Onboarding time (benchmark: Poor >30min, Avg 15-30min, BIC <5min)
│   │   Client: "More than a week in some cases" (E3)
│   │   Gap: YES → LEVER CANDIDATE (L2)
│   │
│   ├── C3. Digital Lending Origination (Expand)
│   │   KPI: Pre-approval conversion (benchmark: Poor <5%, Avg 5-15%, BIC >25%)
│   │   Client: No direct evidence — but Backbase Digital Lending in scope
│   │   Gap: Inferred from positioning → LEVER CANDIDATE (L7)
│   │
│   └── C4. Cross-Sell / Product Penetration (Expand)
│       KPI: Products per customer (benchmark: Poor <1.2, Avg 1.5-2.0, BIC >2.0)
│       Client: No evidence on current products per customer
│       Gap: Insufficient evidence → EXCLUDED (no root driver)
│
└── D. Experience / Engagement (Retain)
    ├── D1. Customer Retention / Churn Reduction
    │   Client: No evidence on churn rates or retention concerns
    │   Gap: No evidence → EXCLUDED
    │
    └── D2. Journey Analytics & Optimization
        Client: "No clear view of why customers choose branch or call over digital" (E6)
        Gap: YES — but no direct financial link → supports levers, not standalone lever
        → EXCLUDED as standalone (enabler for L3, L4, L5)
```

## Validated Lever Candidates

| ID | Lever Name | Lifecycle | Type | Root Driver (evidence) | Backbase Enabler | Gap Estimate | Confidence |
|----|-----------|-----------|------|----------------------|-----------------|-------------|------------|
| L1 | Digital Onboarding Funnel Recovery | Acquire | revenue_uplift | Low completion rate, document drop-off (E1, E2, E7) | Digital Onboarding Lifecycle (DOL.1-5) | Leakage likely >70% vs BIC <50% | MEDIUM |
| L2 | Onboarding Cycle Time Acceleration | Activate | cost_avoidance | 7+ day cycle time, manual workarounds (E3, E8) | Flow Foundation (STP Orchestration) + DOL | >7 days vs BIC <5 min (digital) | MEDIUM |
| L3 | Call Center Cost Deflection | Retain | cost_avoidance | Expensive servicing, simple requests in call center (E4, E5) | Digital Banking (Self-Service) + AI & Agentic | Self-service rate likely <40% vs BIC >90% | MEDIUM |
| L4 | Branch-to-Digital Servicing Migration | Retain | cost_avoidance | Channel inefficiency, no insight into channel choice (E4, E5, E6) | Digital Banking + Digital Engage (Channel Nudges) | Branch cost ~$4-5 vs digital $0.25-0.40 | MEDIUM |
| L5 | Digital Banking Adoption Acceleration | Activate | revenue_uplift | Digital onboarding launched but hasn't scaled (E7, E8) | Digital Banking (RB) + Digital Engage | Digital active rate likely Poor (<20%) vs BIC >60% | MEDIUM |
| L6 | Back Office STP & Workaround Elimination | Activate | cost_avoidance | Manual workarounds persist across teams (E8) | Flow Foundation + Digital Assist (Employee Workspace) | STP rate likely <50% vs BIC >85% | MEDIUM |
| L7 | Digital Lending Pre-Approved Origination | Expand | revenue_uplift | Branch-dependent origination, no digital pre-approved channel (inferred from positioning + SeABank training data) | Digital Lending + Digital Engage (Offer Engine) | Pre-approval conversion <5% vs BIC >25% | LOW |

---

### L1: Digital Onboarding Funnel Recovery

**Root Driver:** SeABank's Head of Retail reports "our onboarding completion rate is low" (E1) and "a lot of customers drop off when documents are required" (E2). The Digital Lead confirms digital onboarding "hasn't scaled well" (E7). Document verification is a known friction point causing abandonment. Industry benchmark for digital leakage: Poor >90%, Average 70-90%, Best-in-Class <50%. SeABank's leakage is likely in the Poor-to-Average range given the described symptoms.

**Operational Change:** Backbase Digital Onboarding Lifecycle (DOL.1-DOL.5) replaces the current fragmented flow with a mobile-first guided experience: progressive data capture with save-and-resume eliminates re-start friction; real-time identity verification via marketplace integrations (eKYC providers compatible with Vietnam's National ID system) replaces manual document submission; core system pre-fill eliminates redundant data entry; instant account provisioning replaces multi-day activation. The document upload step — identified as the primary drop-off point — is addressed through auto-capture, OCR, and real-time validation.

**Volume/Rate Impact:** Digital leakage reduction from estimated current 70-90% to target 50-60% (15-25pp improvement). Derivation: gap-based method. Assuming current leakage ~80% (Average for APAC), BIC <50%. Gap = 30pp. Backbase capture rate 40-50% (conservative). Improvement = 30pp x 0.40 = 12pp (conservative) to 30pp x 0.50 = 15pp (base). Client data needed to confirm current leakage rate (DG1, DG2).

**Financial Impact Direction:** Revenue uplift. Recovered applications x funding rate x average CASA balance x NII margin. Inputs needed: monthly digital application starts (DG4), current completion rate (DG1), funding rate, average new account balance, NII margin on deposits.

**Data Needs for Modeling:** Monthly digital application starts (DG4), current completion/leakage rate (DG1), step-level drop-off data (DG2), funded account rate, average CASA balance, NII margin on retail deposits.

---

### L2: Onboarding Cycle Time Acceleration

**Root Driver:** Operations Lead reports onboarding "can take more than a week in some cases" (E3). Digital Lead confirms "teams still rely on manual workarounds" (E8), indicating the extended cycle time is driven by process inefficiency, not regulatory complexity. Industry benchmark for digital onboarding time: Best-in-Class <5 minutes; a 7+ day process is orders of magnitude slower, suggesting predominantly manual, multi-handoff processing.

**Operational Change:** Backbase Flow Foundation provides STP orchestration — automated decisioning, exception-only routing, and parallel task processing replace sequential manual handoffs. Digital Onboarding (DOL) provides auto ID verification and eSignature, eliminating document courier delays. Digital Assist provides a unified employee workspace for exception handling, replacing the "manual workarounds" described in E8. Target: move from 7+ days to same-day for STP-eligible applications and 1-2 days for exceptions.

**Volume/Rate Impact:** Onboarding cycle time reduction from 7+ days to target 1-2 days (70-80% reduction). STP rate improvement from estimated <50% to 70-85%. Derivation: gap-based. Current STP assumed Poor (<50%) based on "manual workarounds" evidence. BIC >85%. Gap = 35pp+. Backbase capture rate 50%. Improvement = ~18pp (conservative).

**Financial Impact Direction:** Cost avoidance. Reduction in processing hours per application x FTE cost rate x annual application volume. Also: revenue acceleration from faster time-to-revenue (customers generate NII from day of account access, not day of application). Inputs needed: average processing hours per application, FTE hourly rate, annual application volume (DG4), current vs. target STP rate.

**Data Needs for Modeling:** Annual onboarding volume (DG4), average processing time per application (DG3), FTE blended hourly rate, number of back-office FTEs involved in onboarding, current STP rate.

---

### L3: Call Center Cost Deflection

**Root Driver:** Operations Lead states "servicing is expensive" (E4) and "simple requests still come through the call center" (E5). This indicates routine service requests — balance inquiries, card controls, transaction lookups, password resets — are handled via expensive call center channel rather than digital self-service. Industry benchmark: call center deflection rates of 20-60% are achievable; best-in-class self-service rate exceeds 90%.

**Operational Change:** Backbase Digital Banking enables self-service for routine requests: card block/unblock and limit changes (Self-Service Card Management, RB.15), transaction dispute initiation, balance and statement access, beneficiary management, and profile updates — all within the mobile app. Backbase AI & Agentic provides conversational banking for FAQ handling and transaction lookups. Digital Engage provides proactive notifications (payment due, low balance alerts) that prevent inquiry-driven calls. Digital Assist gives call center agents a unified workspace with Client 360, reducing handle time on calls that do remain.

**Volume/Rate Impact:** Call center deflection rate improvement from estimated <20% (current, given low digital adoption from E7) to 30-40% (target). Derivation: gap-based. Current deflection assumed Poor (<20%) based on evidence of simple requests still in call center (E5) and poor digital scaling (E7). BIC >60%. Gap = 40pp+. Backbase capture rate 40%. Improvement = ~16pp. Client data needed: annual call volume (DG6), current deflection rate.

**Financial Impact Direction:** Cost avoidance. Deflected calls x cost per call. For APAC, call center cost typically $3-5 per interaction. Inputs needed: annual inbound call volume (DG6), cost per call or blended call center FTE hourly rate, average handle time, current self-service rate.

**Data Needs for Modeling:** Annual call center inbound volume (DG6), cost per call or (FTE count x hourly rate x AHT), call type breakdown (to identify self-serviceable requests), current digital self-service rate (DG7).

---

### L4: Branch-to-Digital Servicing Migration

**Root Driver:** Operations Lead reports "servicing is expensive" (E4) and notes that the bank lacks visibility into why customers choose branch or call over digital (E6), indicating a channel migration strategy is absent. Simple requests that could be self-served digitally are consuming expensive branch resources. Industry benchmarks: branch interaction costs $4-5 per transaction vs. digital $0.25-0.40 — a 10-20x cost differential.

**Operational Change:** Backbase Digital Banking provides full transaction capability in the mobile app — transfers, payments, bill pay, account servicing — eliminating the need for branch visits for routine tasks. Digital Engage provides behavioral nudges to drive branch-visiting customers toward digital channels ("Did you know you can do this in the app?"). Journey analytics (enabled by Digital Engage) provide the "clear view of why customers choose branch or call over digital" that E6 describes as missing, enabling data-driven channel migration campaigns.

**Volume/Rate Impact:** Branch-to-digital transaction shift of 15-20% in Year 1, growing to 30-40% by Year 3. Derivation: benchmark-based. APAC mobile-first markets support faster digital adoption curves. SeABank's current low digital adoption (E7) means the base for migration is large. Specific volume data needed (no branch transaction volumes available — DG5, DG6).

**Financial Impact Direction:** Cost avoidance. Migrated branch transactions x (branch cost per transaction - digital cost per transaction). For Vietnam APAC market, branch cost estimated $3-4 per interaction, digital $0.25-0.40. Savings per shifted transaction ~$3-4. Inputs needed: annual branch transaction volume, transaction type breakdown, per-channel costs (DG5).

**Data Needs for Modeling:** Annual branch servicing transaction volume, cost per branch transaction (DG5), transaction type breakdown (to identify digitally shiftable transactions), current digital adoption rate (DG7).

---

### L5: Digital Banking Adoption Acceleration

**Root Driver:** Digital Lead reports "we launched digital onboarding, but it hasn't scaled well" (E7) and "teams still rely on manual workarounds" (E8). This indicates low digital active rates despite investment in digital capabilities. The bank has made the investment but is not realizing the return. Industry benchmark: digital active rate Poor <20%, Average 25-35%, Best-in-Class >60%. SeABank is likely in the Poor range given the described symptoms. Low digital adoption undermines every other lever — onboarding recovery, channel migration, and lending origination all require customers to be digitally active.

**Operational Change:** Backbase Digital Banking (RB) provides a complete, modern mobile banking experience — the quality of the daily banking experience (checking balances, transfers, payments) drives habitual digital usage. Digital Engage enables enrollment campaigns, activation nudges, and feature discovery prompts that move customers from enrolled to active to engaged. The platform replaces the underperforming current digital experience with a UX that drives adoption organically.

**Volume/Rate Impact:** Digital active rate improvement from estimated <20% (Poor) to 30-40% (Average-to-Good). Derivation: gap-based. Current estimated Poor (<20%) based on E7 ("hasn't scaled well"). BIC >60%. Gap = 40pp+. Backbase capture rate 30% (conservative for adoption). Improvement = ~12pp. Ramps over 3-5 years per standard retail adoption curve.

**Financial Impact Direction:** Revenue uplift. Digitally active customers generate incremental revenue through: higher cross-sell conversion (digital channel enables always-on product offers), higher retention (digitally engaged customers churn less — 25-35% reduction per benchmarks), and higher product utilization. Inputs needed: total customer base, current digital active rate (DG7), revenue per customer, digital vs. non-digital revenue differential.

**Data Needs for Modeling:** Total customer base, current digital active rate (DG7), current digital enrollment rate, revenue per customer (DG9), retention rate differential for digital vs. non-digital customers.

---

### L6: Back Office STP & Workaround Elimination

**Root Driver:** Digital Lead confirms "teams still rely on manual workarounds" (E8) despite having launched digital onboarding. Operations Lead notes extended cycle times (E3), which are a symptom of low STP rates and manual processing. Industry benchmark: STP rate Poor <50%, Average 50-70%, Best-in-Class >85%. Manual workarounds suggest the current STP rate is well below average.

**Operational Change:** Backbase Flow Foundation provides STP orchestration — automated data validation, rules-based decisioning, and exception-only routing replace the manual workarounds described in E8. Digital Assist provides a unified employee workspace that eliminates swivel-chairing across multiple systems (typical APAC bank employees navigate 10-20+ systems). Auto ID verification and data pre-population reduce manual data entry errors and eliminate rework.

**Volume/Rate Impact:** STP rate improvement from estimated <50% to 70-80% (20-30pp improvement). Back-office processing time reduction of 50-65% per application. Internal handoffs reduced from estimated 3-5 to 1-2. Derivation: gap-based. Current STP assumed <50% (from "manual workarounds" evidence). BIC >85%. Gap = 35pp+. Backbase capture rate 50%. Improvement = ~18pp.

**Financial Impact Direction:** Cost avoidance. (Applications no longer requiring manual processing x manual processing cost per application) + (remaining manual applications x time reduction x FTE rate) + (FTE capacity freed for redeployment or hiring avoidance). Inputs needed: annual application/request volumes, FTE count in back office, blended FTE hourly rate, current processing time per application, current STP rate.

**Data Needs for Modeling:** Annual application/transaction volumes across product types, back-office FTE count and blended hourly rate, average processing time per application (DG3), current STP rate, number of internal handoffs per application.

---

### L7: Digital Lending Pre-Approved Origination

**Root Driver:** SeABank has a large retail customer base with lending potential, and Backbase is positioning Digital Lending as part of the platform. The SeABank training data in the value lever framework confirms that SeABank has pre-approved lending eligibility data but no digital channel for pre-approved offer presentation — customers must visit branches to learn about loan eligibility. This is corroborated by the overall evidence of branch dependence and low digital scaling (E7). Industry benchmark: pre-approval conversion rate Poor <5%, Average 5-15%, Best-in-Class >25%. Digital lending STP rate for consumer loans: Poor <10%, Average 10-30%, Best-in-Class >50%.

**Operational Change:** Backbase Digital Lending with pre-approved offer engine enables customers to see personalized loan offers with pre-approved rates within the digital banking app (Product Explorer). Instant credit decisioning integrates with existing scoring systems. Single-session digital application with e-signature replaces branch visits. Digital Engage triggers targeted loan offers based on behavioral signals (salary deposits, surplus cash, life events).

**Volume/Rate Impact:** Monthly pre-approved base x digital conversion rate uplift x average loan ticket. Conversion uplift benchmarked against LATAM digital lending data (Banco Caja Social, Banesco). Derivation: benchmark-based. Current digital lending conversion assumed <5% (no digital channel for pre-approved offers). Target 5-15% (Average). APAC consumer loan economics differ from LATAM but margin structure is similar.

**Financial Impact Direction:** Revenue uplift. Additional funded loans x average loan ticket x net margin (interest spread - provision expense + origination fee). Per SeABank training data, this lever was valued at $2.63M annual benefit in a prior model iteration. Inputs needed: monthly pre-approved eligible customer base, current branch conversion rate, average consumer loan ticket, net lending margin (spread - provisions), current and target STP rates for loan processing.

**Data Needs for Modeling:** Monthly pre-approved eligible customers, average consumer loan ticket size, net lending margin (interest spread - provision expense), current loan application volume by channel, current STP rate for lending.

---

## Excluded Branches

| Branch | Reason for Exclusion |
|--------|---------------------|
| C4: Cross-Sell / Product Penetration | No evidence on current products per customer; no stakeholder mentioned cross-sell as a priority. Could be added if data surfaces during questionnaire phase. |
| D1: Customer Retention / Churn Reduction | No evidence on churn rates, attrition, or retention concerns from any stakeholder. No data to establish a root driver. |
| D2: Journey Analytics & Optimization | Evidence exists (E6 — no view of channel choice drivers) but this is an enabler for other levers (L3, L4, L5), not a standalone financial lever. No direct causal chain to financial impact without the channel migration or adoption levers it supports. |

## Coverage Check

- **MECE verified:** Layer 1 math (Digital Value = Revenue Uplift + Cost Savings) is MECE. Layer 2 branches cover Digital Adoption, Channel Migration, Digital Revenue, and Experience/Engagement. No overlaps detected. L3 (Call Center) and L4 (Branch) are separated by channel — distinct cost pools with distinct volumes.
- **Lifecycle coverage:** Acquire (L1), Activate (L2, L5, L6), Expand (L7), Retain (L3, L4) — 4 of 4 lifecycle stages represented.
- **Lever count:** 7 levers — within the 5-8 typical range.
- **Concentration check:** Activate has 3 levers (L2, L5, L6), Retain has 2 (L3, L4), Acquire has 1 (L1), Expand has 1 (L7). No stage exceeds 70% concentration (Activate = 43%). Distribution is acceptable.
- **Double-counting check:** L3 (call center deflection) and L4 (branch migration) could overlap if the same transactions are counted in both — they must use distinct volume pools (call center volume vs. branch volume). L1 (onboarding funnel) and L2 (cycle time) address different aspects of the same journey — L1 is a revenue lever (more completed applications) and L2 is a cost lever (lower processing cost per application). No financial double-counting as long as L1 uses incremental volume and L2 uses per-unit cost.

## Creative Discovery

### C1: Analytics-Driven Channel Optimization (Consultant Validation Required)

The Operations Lead explicitly states the bank has no visibility into why customers choose branch or call over digital (E6). Backbase Digital Engage with journey analytics could create a closed-loop optimization capability — not just shifting channels but continuously optimizing the channel mix based on customer behavior data. This is a second-order effect that amplifies L3, L4, and L5 over time. **Confidence: LOW.** Not modeled as a standalone lever but flagged as a multiplier for existing levers.

### C2: IT Cost Rationalization / Platform Consolidation (Consultant Validation Required)

If SeABank's current digital platform is underperforming (E7) and teams rely on manual workarounds (E8), there may be an opportunity to rationalize the existing technology stack. Replacing the underperforming digital onboarding platform with Backbase could eliminate maintenance costs for the current system. This is a CIO-facing angle. **Confidence: LOW.** No evidence on current IT spend or platform costs. Requires discovery.

### C3: Regulatory/eKYC Acceleration (Consultant Validation Required)

Vietnam's State Bank (SBV) has been progressively enabling eKYC and digital identity verification. If SeABank's current onboarding friction (E1, E2) is partly regulatory — requiring in-person document verification — then Backbase's marketplace integrations with Vietnam-compatible eKYC providers could unlock regulatory compliance as a lever. This is a structural uniqueness angle specific to Vietnam's regulatory environment. **Confidence: LOW.** No regulatory evidence in the register.

## Data Gaps

The following items are critical for the financial modeler and are currently missing:

| Gap ID | Data Point | Impact | Fallback |
|--------|-----------|--------|----------|
| DG1 | Onboarding completion rate (%) | Cannot size L1 | Use benchmark Average (70-90% leakage) as proxy |
| DG2 | Onboarding drop-off by step | Cannot optimize L1 targeting | Assume document step as primary friction (from E2) |
| DG3 | Average onboarding cycle time | Cannot size L2 | Use "7+ days" as conservative baseline (E3) |
| DG4 | Monthly onboarding volume | Cannot calculate L1, L2 absolute values | Estimate from customer base growth rate |
| DG5 | Cost per transaction by channel | Cannot size L3, L4 | Use APAC retail benchmarks ($3-4 branch, $0.30 digital) |
| DG6 | Call center transaction volumes | Cannot size L3 | Estimate from customer base x industry contact rate |
| DG7 | Digital adoption rate (%) | Cannot baseline L5 | Assume Poor (<20%) per E7 evidence |
| DG8 | Customer acquisition cost | Cannot fully value L1 | Use benchmark proxy |
| DG9 | Average revenue per customer | Cannot value L1, L5 | Use Vietnam retail banking benchmarks |
| DG10 | Current annual servicing cost | Cannot size L3, L4 total opportunity | Build bottom-up from volume x unit cost |
| NEW | Total retail customer base | Cannot size L5, L7 | Use public data (SeABank reports ~3.6M per training data) |
| NEW | Pre-approved lending eligible customers | Cannot size L7 | Request from credit risk team |
| NEW | Average consumer loan ticket (Vietnam) | Cannot size L7 | Use APAC consumer lending benchmarks |
| NEW | Net lending margin | Cannot value L7 | Use APAC benchmarks (4-6% net after provisions) |
| NEW | Back-office FTE count and cost | Cannot size L2, L6 | Estimate from bank size |
| NEW | Current STP rate | Cannot baseline L2, L6 | Assume Poor (<50%) per E8 evidence |

## Questions for Consultant

1. **Scope confirmation:** Is the engagement strictly Retail Banking, or does SeABank have SME/Business Banking segments that should be included? The evidence register only covers retail, but the full platform positioning might warrant cross-LOB consideration.

2. **Lending priority:** The training data in the value lever framework references SeABank's pre-approved lending opportunity with a $2.63M annual value. Should L7 (Digital Lending) be treated as a primary lever with HIGH confidence given this prior engagement data, or should it remain MEDIUM/LOW since the current evidence register does not contain lending-specific evidence?

3. **Existing digital platform:** What is the current digital banking platform? The evidence says digital onboarding was launched but "hasn't scaled well" (E7). Is this a Backbase enhancement of an existing platform, or a platform replacement? This affects the IT cost rationalization creative lever (C2).

4. **Vietnam regulatory context:** Are there specific eKYC or digital identity verification regulations (SBV Circular 16/2020 or later) that either enable or constrain digital onboarding? This would affect L1's achievable target.

5. **Customer base size:** The training data references 3.6M customers for SeABank. Should this be validated, or can it be used as the baseline for modeling?

6. **Channel volume data urgency:** L3 (call center) and L4 (branch) together represent the cost-avoidance story. Without DG5 and DG6, the financial modeler will rely entirely on benchmarks. Should the Business Case Questionnaire prioritize channel cost data above other gaps?

7. **Double-counting governance:** L1 (onboarding funnel recovery) creates new customers; L5 (digital adoption) makes existing customers more active. Should the financial modeler treat L1's recovered customers as feeding into L5's addressable base (compounding), or keep them independent to avoid complexity?

---

**Document Control:**
- Agent: roi-hypothesis-builder
- Version: 1.0
- Generated: 2026-04-06
- Classification: Confidential
- Engagement: SeABank (Vietnam) — Retail Banking
- Evidence Source: evidence_register.md (Retail Bank SEA Assessment, 2026-01-13)
- Methodology: hypothesis_tree_decomposition.md, value_lever_framework.md
- Benchmarks: retail/benchmarks.md, retail/roi_levers.md
