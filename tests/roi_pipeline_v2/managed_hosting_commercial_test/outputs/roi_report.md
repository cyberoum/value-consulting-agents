# ROI Financial Model Report — Managed Hosting for Commercial Banking

**Client:** Generic Tier 2 Commercial Bank (Southeast Asia)
**Date:** 2026-04-07
**Currency:** USD
**Domain:** Commercial Banking
**Analysis Period:** 5 years
**Discount Rate:** 10%
**Model Type:** Capability-driven (Managed Hosting)

---

## Executive Summary

This report quantifies the financial impact of migrating from a self-hosted digital banking platform to Backbase Managed Hosting for a Tier 2 commercial bank in Southeast Asia (~$15B total assets, ~8,000 commercial clients, ~$600M annual revenue).

### Recommendation: CONDITIONAL GO

The quantified ROI for Managed Hosting is **marginally negative in the moderate scenario** (NPV: -$323K, ROI: -10%) and **positive only in the aggressive scenario** (NPV: +$195K, ROI: 18%). This means the pure financial business case does not stand on quantified cost savings alone.

**However, the business case should proceed with qualification** because:

1. **Strategic benefits are significant but unquantified.** Release velocity acceleration (L4), innovation capacity redeployment (L6), and CapEx-to-OpEx predictability are real CIO/CFO priorities that add material value beyond the quantified model.
2. **The hosting fee is estimated.** The $350K/yr assumption is the single largest sensitivity driver. If the actual Backbase proposal is lower, the business case improves materially. Conversely, if it is higher, the case deteriorates.
3. **Multi-LOB scope would transform the case.** If the platform serves Retail and SME in addition to Commercial, L1/L2/L5 benefits multiply proportionally while the hosting fee likely does not scale linearly.
4. **Risk reduction has asymmetric value.** A single major outage or regulatory finding related to self-hosted infrastructure could cost more than the entire 5-year net investment difference.

**Next step:** Obtain the actual Managed Hosting fee from Backbase and confirm platform scope (single-LOB vs. multi-LOB) before presenting to the client. These two data points will determine whether the moderate scenario flips to positive NPV.

---

## Financial Summary (Moderate Scenario)

### 5-Year Cash Flow

| Year | Benefits | Investment | Net Cash Flow | Cumulative |
|------|----------|------------|---------------|------------|
| Y1   | $234,201 | $850,000   | -$615,799     | -$615,799  |
| Y2   | $419,345 | $550,000   | -$130,655     | -$746,454  |
| Y3   | $509,688 | $350,000   | $159,688      | -$586,766  |
| Y4   | $522,983 | $350,000   | $172,983      | -$413,783  |
| Y5   | $522,983 | $350,000   | $172,983      | -$240,800  |
| **Total** | **$2,209,200** | **$2,450,000** | **-$240,800** | |

### Three-Scenario Comparison

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|------------|
| 5-Year Benefits (undiscounted) | $1,541,746 | $2,209,200 | $2,889,542 |
| 5-Year Investment | $2,450,000 | $2,450,000 | $2,450,000 |
| 5-Year Net (undiscounted) | -$908,254 | -$240,800 | +$439,542 |
| NPV (@ 10%) | -$823K | -$323K | +$195K |
| ROI | -37% | -10% | +18% |
| Payback Period | >5 yrs | >5 yrs | 3.2 yrs |
| Steady-State Annual Benefit | $392,706 | $522,983 | $654,198 |

### Benefit Composition (Moderate Steady-State)

| Lever | Annual Benefit | % of Total | Type |
|-------|---------------|------------|------|
| L1: IT Ops FTE Redeployment | $244,608 | 46.8% | Cost Avoidance |
| L5: Infrastructure Rationalization | $120,000 | 22.9% | Cost Avoidance |
| L3: Uptime Revenue Protection | $60,600 | 11.6% | Revenue Uplift |
| L2: Compliance & Security | $52,400 | 10.0% | Cost Avoidance |
| L7: Tech Debt Avoidance | $36,000 | 6.9% | Cost Avoidance |
| L4: Release Velocity | $9,375 | 1.8% | Revenue Uplift |
| **Total** | **$522,983** | **100%** | |

---

## Per-Lever Analysis with Gap-Based Calculations

### L1: IT Operations FTE Redeployment

**Lever Type:** Cost Avoidance | **Confidence:** MEDIUM | **Lifecycle:** Operating Model

**Gap-Based Calculation:**
- **Client Current:** 12 FTEs dedicated to self-hosted platform operations
- **Best-in-Class:** 2.5 FTEs retained for coordination under Managed Hosting
- **Gap:** 9.5 FTEs (79.2 percentage points of ops allocation)
- **Capture Rate (moderate):** 0.40
- **Formula Result:** 0.792 x 0.40 = 0.317 --> adjusted to **0.28** (accounting for transition friction and partial FTE reallocations)

**Baseline:** 12 FTEs x $72,800/yr = **$873,600/yr**
**Moderate Impact:** 0.28 x $873,600 = **$244,608/yr** (steady state)
**Conservative (0.21):** $183,456 | **Aggressive (0.35):** $305,760

**Ramp-Up (moderate):** IT cost curve [50%, 85%, 100%, 100%, 100%]

| Year | Effectiveness | Annual Benefit |
|------|-------------|----------------|
| Y1 | 50% | $122,304 |
| Y2 | 85% | $207,917 |
| Y3 | 100% | $244,608 |
| Y4 | 100% | $244,608 |
| Y5 | 100% | $244,608 |
| **5-Year Total** | | **$1,064,045** |

**Key Assumptions:**
- $35/hr loaded FTE cost (APAC commercial banking benchmark)
- 2-3 FTEs retained for vendor coordination (midpoint 2.5)
- FTEs framed as cost avoidance (not headcount reduction)
- L6 (Innovation Redeployment) excluded to prevent double-counting

---

### L2: Compliance & Security Cost Avoidance

**Lever Type:** Cost Avoidance | **Confidence:** MEDIUM | **Lifecycle:** Operating Model

**Gap-Based Calculation:**
- **Client Current:** $262K/yr (2.5 security FTEs x $72,800 + $80K audit costs)
- **Best-in-Class:** ~$40K residual (application-level security only, infra compliance absorbed)
- **Gap:** $222K = 84.7% of current spend
- **Capture Rate (moderate):** 0.40
- **Formula Result:** 0.847 x 0.40 = 0.339 --> **capped at 0.20** due to uncertain SEA regulatory requirements and LOW confidence on FTE allocation split

**Baseline:** 2.5 FTEs x $72,800 + $80,000 = **$262,000/yr**
**Moderate Impact:** 0.20 x $262,000 = **$52,400/yr** (steady state)
**Conservative (0.15):** $39,300 | **Aggressive (0.25):** $65,500

**5-Year Total (moderate):** $195,260

---

### L3: Uptime Revenue Protection

**Lever Type:** Revenue Uplift | **Confidence:** LOW | **Lifecycle:** Retain

**Gap-Based Calculation:**
- **Client Current:** ~99.0% uptime = 87.6 hours unplanned downtime/year (estimated)
- **Best-in-Class:** 99.95% SLA = 4.38 hours downtime/year (Managed Hosting)
- **Gap:** 83.2 hours = 95.0% of current downtime
- **Capture Rate (moderate):** 0.40
- **Formula Result:** 0.950 x 0.40 = 0.380 --> **reduced to 0.12** because payments are delayed (not lost) during downtime, and the 5% revenue-at-risk factor in baseline already discounts heavily

**Baseline:** $600M x 40% digital x 5% at-risk x (87.6/2,080) = **$505,000/yr** (revenue at risk during downtime)
**Moderate Impact:** 0.12 x $505,000 = **$60,600/yr** (steady state)
**Conservative (0.09):** $45,450 | **Aggressive (0.15):** $75,750

**Ramp-Up:** Revenue curve [11%, 49%, 81%, 100%, 100%] -- slower ramp reflecting commercial domain adoption discount

**5-Year Total (moderate):** $168,413

---

### L4: Release Velocity & Time-to-Market Acceleration

**Lever Type:** Revenue Uplift | **Confidence:** LOW | **Lifecycle:** Operating Model

**Gap-Based Calculation:**
- **Client Current:** 4-8 week release cycles (~6 releases/year)
- **Best-in-Class:** Continuous delivery, updates within days (~24+ releases/year)
- **Gap:** ~18 releases/year; average 3-month delay per revenue feature
- **Capture Rate (moderate):** 0.40
- **Formula Result:** 0.83 x 0.40 = 0.33 --> **reduced to 0.10** due to LOW confidence on feature revenue estimates

**Baseline:** 2.5 features x 3 months x ($150K/12) = **$93,750/yr** (opportunity cost of delayed features)
**Moderate Impact:** 0.10 x $93,750 = **$9,375/yr** (steady state)
**Conservative (0.08):** $7,500 | **Aggressive (0.13):** $12,188

**5-Year Total (moderate):** $26,069

**Note:** This is the smallest quantified lever and is best viewed as a strategic accelerator. The real value of faster releases is amplifying every feature-dependent lever in the broader platform deal.

---

### L5: Infrastructure License & Tooling Rationalization

**Lever Type:** Cost Avoidance | **Confidence:** MEDIUM | **Lifecycle:** Operating Model

**Gap-Based Calculation:**
- **Client Current:** ~$500K/yr in infrastructure licenses and tooling (estimated)
- **Best-in-Class:** $0 separate infrastructure cost (absorbed into MH fee)
- **Gap:** $500K (100% theoretically eliminable)
- **Platform-Attributable Fraction:** 60% (rest serves other bank systems)
- **Capture Rate (moderate):** 0.40
- **Impact:** 1.00 x 0.60 x 0.40 = **0.24**

**Baseline:** **$500,000/yr** (total infrastructure costs)
**Moderate Impact:** 0.24 x $500,000 = **$120,000/yr** (steady state)
**Conservative (0.18):** $90,000 | **Aggressive (0.30):** $150,000

**5-Year Total (moderate):** $444,600

**Critical Note:** The MH fee ($350K/yr) is captured in the investment section. L5 represents gross infrastructure cost savings. The net benefit = L5 savings minus the incremental hosting fee. This is handled structurally in the model (benefits minus investment).

---

### L7: Tech Debt Accumulation Avoidance

**Lever Type:** Cost Avoidance | **Confidence:** LOW | **Lifecycle:** Operating Model

**Gap-Based Calculation:**
- **Client Current:** Major platform upgrade every 3-5 years at $500K-$1.5M, plus $50K/yr carrying cost
- **Best-in-Class:** $0 — continuous updates via Managed Hosting
- **Gap:** $300K/yr annualized ($1M midpoint / 4 years + $50K carrying)
- **Capture Rate (moderate):** 0.40
- **Formula Result:** 0.40 --> **reduced to 0.12** (only infrastructure-layer tech debt addressed; application-layer persists)

**Baseline:** ($1M / 4 years) + $50K = **$300,000/yr** (annualized)
**Moderate Impact:** 0.12 x $300,000 = **$36,000/yr** (steady state)
**Conservative (0.09):** $27,000 | **Aggressive (0.15):** $45,000

**5-Year Total (moderate):** $133,200

---

## Excluded Levers

### L6: IT Staff Capacity Redeployment to Innovation (Qualitative)
**Reason:** Uses the same 12-FTE pool as L1. Including both would double-count. L1 captures cost avoidance (defensible, conservative). L6 captures the revenue upside of redeploying freed FTEs to digital innovation projects.

**Strategic Value:** 9-10 FTEs freed from ops could be redirected to commercial portal enhancements, API connectivity for corporate clients, data analytics initiatives. This shifts IT from "run" to "build" -- a top CIO priority.

**When to include:** If the bank explicitly plans to redeploy (not reduce) headcount AND has a concrete innovation backlog with estimated revenue, L6 can replace L1 as the primary framing.

### CapEx-to-OpEx Shift (Qualitative)
**Reason:** Cannot be expressed as a four-link value chain with measurable volume/rate impact.

**Strategic Value:** Elimination of lumpy CapEx on infrastructure refresh/upgrades. Replaced by predictable monthly/annual OpEx. Simplifies CFO financial planning.

---

## Sensitivity Analysis

### Key Sensitivity Drivers (Moderate Scenario)

The table below shows the impact on 5-year NPV of a +/-25% change in key assumptions:

| Variable | Base Value | -25% NPV Impact | +25% NPV Impact | Sensitivity |
|----------|-----------|------------------|------------------|-------------|
| Managed Hosting Fee | $350K/yr | NPV improves by +$332K | NPV worsens by -$332K | **CRITICAL** |
| IT Ops FTEs | 12 | NPV worsens by -$201K | NPV improves by +$201K | HIGH |
| Infrastructure Costs | $500K/yr | NPV worsens by -$84K | NPV improves by +$84K | MEDIUM |
| FTE Loaded Cost ($35/hr) | $72,800/yr | NPV worsens by -$128K | NPV improves by +$128K | MEDIUM |
| Migration Cost | $700K total | NPV improves by +$133K | NPV worsens by -$133K | MEDIUM |
| Downtime Hours | 87.6 hrs | NPV worsens by -$32K | NPV improves by +$32K | LOW |

### Breakeven Analysis

For the moderate scenario to achieve NPV = $0, one of the following must be true:
- Managed Hosting fee < **$283K/yr** (vs. current estimate of $350K/yr), OR
- Infrastructure costs > **$665K/yr** (vs. current estimate of $500K/yr), OR
- Platform serves **1.8 LOBs** (i.e., ~80% additional scope beyond commercial), OR
- IT ops FTEs increase to **15** (capturing broader IT ops consolidation)

### What Flips the Case to Positive

| Scenario Change | Moderate NPV Impact |
|----------------|---------------------|
| MH fee = $250K/yr (instead of $350K) | NPV improves by +$380K --> **NPV = +$57K** |
| Multi-LOB scope (2x benefits on L1, L2, L5) | NPV improves by +$635K --> **NPV = +$312K** |
| Higher infra costs ($750K actual) | NPV improves by +$168K --> **NPV = -$155K** |
| All three above | NPV improves by +$1.18M --> **NPV = +$857K** |

---

## Reasonableness Checks

| Check | Result | Status |
|-------|--------|--------|
| Total annual benefit < 5% of revenue | $522,983 / $600M = 0.087% | PASS |
| No single lever > 2% of revenue | Largest (L1): $244,608 / $600M = 0.041% | PASS |
| All backbase_impact values 0.05-0.60 | Range: 0.10 to 0.28 | PASS |
| All baseline_annual > 0 | Minimum: $93,750 (L4) | PASS |
| 5-Year ROI within segment range | -10% (moderate) -- marginal for hosting-only case | PASS (noted) |
| Investment adequate | $2.45M vs $2.21M benefits -- investment exceeds benefits in moderate | FLAGGED |

**Flag: Investment exceeds quantified benefits in moderate scenario.** This is a realistic result for a Managed Hosting migration where: (1) the hosting fee IS a significant ongoing cost, and (2) the primary quantifiable benefits are FTE redeployment and infrastructure cost avoidance, which are moderate in magnitude for a single-LOB deployment. The business case depends on strategic benefits (release velocity, innovation capacity, risk reduction, compliance simplification) and/or multi-LOB scope expansion to achieve positive ROI.

---

## Investment Structure

| Component | Y1 | Y2 | Y3 | Y4 | Y5 | Total |
|-----------|-----|-----|-----|-----|-----|-------|
| Managed Hosting Fee | $350K | $350K | $350K | $350K | $350K | $1,750K |
| Migration/Transition | $500K | $200K | $0 | $0 | $0 | $700K |
| **Total** | **$850K** | **$550K** | **$350K** | **$350K** | **$350K** | **$2,450K** |

**CRITICAL DATA GAP:** The $350K/yr hosting fee is an estimate. The actual Backbase Managed Hosting fee from the sales proposal must be substituted before presenting to the client. Every $100K change in this fee shifts 5-year net by $500K (undiscounted) or ~$380K (NPV).

---

## Ramp-Up Curves

### IT Cost Levers (L1, L2, L5, L7) -- Faster Ramp

Tied to infrastructure decommission milestones. Migration is largely binary: once the platform is on Managed Hosting, infrastructure costs and FTEs are released.

| Scenario | Y1 | Y2 | Y3 | Y4 | Y5 |
|----------|-----|-----|-----|-----|-----|
| Conservative | 40% | 75% | 90% | 100% | 100% |
| Moderate | 50% | 85% | 100% | 100% | 100% |
| Aggressive | 60% | 95% | 100% | 100% | 100% |

### Revenue Levers (L3, L4) -- Slower Ramp

Commercial domain adoption discount applied: client-by-client onboarding cycle means revenue effects take longer to materialize.

| Scenario | Y1 | Y2 | Y3 | Y4 | Y5 |
|----------|-----|-----|-----|-----|-----|
| Conservative | 7% | 39% | 72% | 95% | 100% |
| Moderate | 11% | 49% | 81% | 100% | 100% |
| Aggressive | 16% | 55% | 85% | 100% | 100% |

**Source:** ramp_up_models.md -- 15-month implementation timeline, commercial domain adoption multiplier (Y1: 0.45x, Y2: 0.65x, Y3+: 0.85x).

---

## Assumptions Register

| ID | Assumption | Confidence | Source | Sensitivity |
|----|-----------|-----------|--------|-------------|
| A1 | Loaded FTE cost: $72,800/yr ($35/hr x 2,080 hrs) | MEDIUM | Engagement context | MEDIUM |
| A2 | 12 IT platform FTEs dedicated to ops | HIGH | Client-provided | HIGH |
| A3 | 2-3 FTEs retained post-MH (midpoint 2.5) | MEDIUM | Industry pattern | MEDIUM |
| A4 | MH fee: $350K/year | LOW | Estimate | CRITICAL |
| A5 | Migration: $500K Y1 + $200K Y2 | LOW | Estimate | MEDIUM |
| A6 | Infrastructure costs: $500K/yr | LOW | Industry estimate | HIGH |
| A7 | Platform uptime: 99.0% (87.6 hrs downtime) | LOW | Industry pattern | MEDIUM |
| A8 | Digital adoption: 40% of clients | LOW | Benchmarks.md | LOW |
| A9 | L6 excluded (double-count with L1) | HIGH | Design decision | N/A |
| A10 | 15-month implementation timeline | MEDIUM | ramp_up_models.md | MEDIUM |
| A11 | Platform serves commercial LOB only | MEDIUM | Engagement context | HIGH |

---

## Data Gaps for Validation

| Priority | Data Item | Current Assumption | Impact |
|----------|----------|-------------------|--------|
| **CRITICAL** | Actual MH fee from Backbase proposal | $350K/yr | Determines if moderate scenario is NPV-positive or negative |
| **HIGH** | Itemized infrastructure license/tooling costs | $500K/yr | L5 sizing |
| **HIGH** | Annual unplanned downtime hours | 87.6 hrs (99.0% uptime) | L3 sizing |
| MEDIUM | Security team allocation to platform | 2.5 FTEs | L2 sizing |
| MEDIUM | Historical platform upgrade costs | $1M/4yr cycle | L7 sizing |
| MEDIUM | Specific SEA country | Generic SEA rates | FTE costs, regulations |
| MEDIUM | FTE disposition preference | Cost avoidance | L1 framing, L6 inclusion |
| MEDIUM | Platform scope (single vs. multi-LOB) | Commercial only | Potential multiplier on L1, L2, L5 |

---

## Measurement Plan

### Pre-Implementation Baseline (Capture Before Migration)

| Metric | Measurement Method | Owner |
|--------|-------------------|-------|
| Platform ops FTE count and roles | HR headcount + role mapping | CIO |
| Annual infrastructure costs (itemized) | IT finance budget extract | IT Finance |
| Security/compliance FTE allocation | Time allocation survey or role analysis | CISO |
| Annual audit + pen-test costs | Procurement/finance records | IT Finance |
| Unplanned downtime hours (12-month trailing) | Incident management system | IT Ops |
| Release cycle time | Deployment logs, CAB records | Dev Ops |
| Digital portal adoption rate | Portal login analytics | Digital Banking |

### Post-Implementation Tracking (Quarterly)

| Metric | Target (Moderate, Steady State) | Measurement |
|--------|-------------------------------|-------------|
| Platform ops FTEs | Reduce from 12 to 2-3 | HR headcount |
| Infrastructure cost line items | Eliminate $120K/yr in platform-attributable costs | IT finance budget |
| Unplanned downtime hours | <4.38 hrs/year (99.95% SLA) | SLA reports from Backbase |
| Security FTE allocation to platform | Reduce by 0.5-0.75 FTE | Role reallocation tracking |
| Release cycle time | Days (not weeks) | Deployment frequency metrics |
| Tech debt indicators | Zero deferred patches, current platform version | Version tracking |

### Value Realization Reviews

- **Quarter 2 post-migration:** Validate FTE redeployment (L1) and initial infrastructure savings (L5)
- **Quarter 4 post-migration:** First full-year benefit measurement; uptime SLA assessment (L3)
- **Annual:** Full lever review against model projections; adjust forecasts for Y3-Y5

---

## Appendix: Methodology Notes

### Gap-Based Impact Method (Per Agent Protocol)

```
backbase_impact = (Client Current - Best-in-Class) x Capture Rate

Where:
  Gap = Client Current metric - Best-in-Class metric (percentage points or absolute units)
  Capture Rate = 0.30 (conservative), 0.40 (moderate), 0.50 (aggressive)
```

All impacts were derived from this formula and then adjusted downward where confidence was LOW or where the formula produced results that exceeded reasonable bounds for the lever type.

### Ramp-Up Model

Implementation timeline: 15 months (commercial domain, medium integration complexity). Derived from `knowledge/standards/ramp_up_models.md` with commercial domain adoption discount (Y1: 0.45x, Y2: 0.65x for revenue levers).

### Safety Net Checks Applied

- backbase_impact capped at 0.60 (none exceeded 0.28 in moderate)
- Total annual benefit < 5% of revenue: 0.087% -- PASS
- No single lever > 2% of revenue: max 0.041% -- PASS
- All baseline_annual > 0 -- PASS

---

*Generated by: ROI Financial Modeler Agent*
*Model version: 2026-04-07*
*Engagement: Managed Hosting for Commercial Banking (Capability-Driven)*
