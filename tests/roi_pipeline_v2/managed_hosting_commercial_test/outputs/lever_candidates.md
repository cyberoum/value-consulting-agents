# ROI Lever Candidates — Tier 2 Commercial Bank (Southeast Asia)

## Problem Statement

A Tier 2 commercial bank in Southeast Asia (~$15B total assets, ~8,000 commercial clients) currently self-hosts its digital banking platform with 12 dedicated FTEs for platform operations. The bank's CIO is asking "What's the value of Managed Hosting vs. self-hosting?" Backbase is positioning Managed Hosting as part of a broader platform deal for the Commercial Banking LOB. The primary problem is **cost reduction on IT infrastructure and operations** (Type 2), with secondary implications for **digital transformation/channel adoption** (Type 3) through faster release cycles and improved platform reliability, and **revenue protection** (Type 1, Branch B) through uptime improvements.

This is a **capability-driven exercise**: the starting point is the Managed Hosting capability pattern, not a bank-reported pain point. Value chains are traced from the capability's business functions upward to financial outcomes, then decomposed using problem-driven patterns.

## Problem Types

**Primary:** Type 2: Cost Reduction / Cost to Serve
```
Total Operating Cost = Cost to Acquire + Cost to Serve + Cost to Retain + IT/Infrastructure Cost
```
Focus: **IT/Infrastructure Cost** branch (Branch D) — licenses, hosting, support FTEs, integration maintenance, development cost.

**Secondary:** Type 1: Revenue Growth / Market Share (Branch B: Churn Reduction via uptime/availability)
```
Revenue = Customers x Revenue per Customer
Customers = Existing x (1 - Churn Rate) + New Acquisitions
```

**Secondary:** Type 3: Digital Transformation / Channel Adoption (Branch C: Time to Market)
```
Digital Value = Revenue Uplift from Digital + Cost Savings from Channel Migration
```

---

## Hypothesis Tree Summary

### Capability-to-Outcome Tracing (Managed Hosting Pattern)

```
Managed Hosting (Capability)
│
├── Business Function 1: Infrastructure Management
│   └── Outcome: IT Ops FTE cost avoidance
│       └── Problem Type 2, Branch D (IT/Infrastructure Cost)
│           └── [LEVER L1] ── IT Operations FTE Redeployment
│
├── Business Function 2: Security & Compliance
│   └── Outcome: Compliance FTE + audit cost avoidance
│       └── Problem Type 2, Branch D (IT/Infrastructure Cost)
│           └── [LEVER L2] ── Compliance & Security Cost Avoidance
│
├── Business Function 3: Availability & DR
│   └── Outcome: Reduced outage risk → revenue protection
│       └── Problem Type 1, Branch B (Churn Reduction / Revenue Protection)
│           └── [LEVER L3] ── Uptime Revenue Protection
│
├── Business Function 4: Deployment Management
│   └── Outcome: Faster time to market, reduced change risk
│       └── Problem Type 3, Branch C (Digital Revenue Acceleration)
│           └── [LEVER L4] ── Release Velocity & Time-to-Market Acceleration
│
├── Business Function 5: Predictable Cost Model (CapEx → OpEx)
│   └── Outcome: CFO financial planning benefit
│       └── Qualitative (strategic framing, not a quantifiable lever)
│           └── [EXCLUDED — qualitative only]
│
├── [CREATIVE — via Type 2, Branch D extension]
│   └── [LEVER L5] ── Infrastructure License & Tooling Rationalization
│
├── [CREATIVE — via Type 4, Branch A: RM/IT Productivity]
│   └── [LEVER L6] ── IT Staff Capacity Redeployment to Innovation
│
└── [CREATIVE — CIO-specific: Tech Debt & Vendor Risk]
    └── [LEVER L7] ── Tech Debt Accumulation Avoidance
```

---

## Validated Lever Candidates

| ID | Lever Name | Lifecycle | Type | Root Driver (evidence) | Backbase Enabler | Gap Estimate | Confidence |
|----|-----------|-----------|------|----------------------|-----------------|-------------|------------|
| L1 | IT Operations FTE Redeployment | Operating Model | cost_avoidance | 12 FTEs dedicated to self-hosted platform ops (engagement context) | Managed Hosting — Infrastructure Management | 12 FTEs → estimated 2-3 retained for coordination; 9-10 redeployable | MEDIUM |
| L2 | Compliance & Security Cost Avoidance | Operating Model | cost_avoidance | Self-hosted platform requires in-house security staff + SOC2/ISO27001 audit (capability pattern) | Managed Hosting — Security & Compliance Certifications | Dedicated security FTEs + annual audit costs avoided | MEDIUM |
| L3 | Uptime Revenue Protection | Retain | revenue_uplift | Self-hosted platforms in SEA Tier 2 banks typically lack enterprise-grade DR/failover (benchmark pattern) | Managed Hosting — SLA-Backed Uptime (99.9%+) with DR | Unplanned downtime hours reduced; commercial digital transaction revenue protected | LOW |
| L4 | Release Velocity & Time-to-Market Acceleration | Operating Model | revenue_uplift | Self-hosted deployment cycles are slower due to manual release management, change advisory boards, environment provisioning (capability pattern) | Managed Hosting — Continuous Delivery & Deployment Management | Release frequency improvement; weeks-to-days for platform updates | LOW |
| L5 | Infrastructure License & Tooling Rationalization | Operating Model | cost_avoidance | Self-hosted platform requires server licenses, monitoring tools, DR infrastructure, backup systems (capability pattern, typical for self-hosted) | Managed Hosting — Fully Managed Infrastructure | License/tooling costs absorbed into Managed Hosting fee | MEDIUM |
| L6 | IT Staff Capacity Redeployment to Innovation | Expand | revenue_uplift | IT ops staff consumed by "keep the lights on" cannot contribute to digital innovation or commercial portal enhancement (inferred from 12-FTE ops team) | Managed Hosting — Ops Responsibility Transfer | Freed IT capacity redirected to revenue-generating digital initiatives | LOW |
| L7 | Tech Debt Accumulation Avoidance | Operating Model | cost_avoidance | Self-hosted platforms accumulate tech debt: deferred patches, version lag, security vulnerability backlog (industry pattern for Tier 2 banks) | Managed Hosting — Continuous Platform Updates | Avoided future remediation cost from tech debt accumulation | LOW |

---

## Lever Details

### L1: IT Operations FTE Redeployment

**Root Driver:** The bank currently maintains 12 dedicated FTEs for platform operations on a self-hosted digital banking infrastructure. These roles cover infrastructure monitoring, incident management, patching, environment management, deployment support, and capacity planning. Source: Engagement context (bank-provided data: 12 FTEs dedicated to platform operations).

**Operational Change:** Backbase Managed Hosting transfers infrastructure management, monitoring, patching, incident response, and capacity planning responsibility to Backbase's managed operations team. The bank retains a thin coordination layer (estimated 2-3 FTEs for vendor management, integration oversight, and internal escalation) but eliminates the need for the remaining 9-10 platform operations roles. These FTEs can be redeployed to higher-value IT functions or represent hiring avoidance for future growth.

**Volume/Rate Impact:**
- Current: 12 FTEs dedicated to platform operations
- Target: 2-3 FTEs retained for coordination/vendor management
- Delta: 9-10 FTEs redeployable or avoided
- Derivation: Capability pattern — Managed Hosting absorbs infrastructure management, monitoring, patching, DR, and deployment. Retained roles cover vendor interface and internal coordination only. The 2-3 retained estimate is conservative; some banks retain only 1-2.

**Financial Impact Direction:** Redeployable FTEs x loaded annual cost per FTE (salary + benefits + overhead, using Southeast Asia IT operations rates). This is cost avoidance — the bank either redeploys these staff to innovation work (see L6) or avoids future hiring. Inputs needed: loaded annual cost per IT ops FTE in this geography.

**Data Needs for Modeling:**
- Loaded annual cost per IT operations FTE (Southeast Asia market rate)
- Current role breakdown of the 12 FTEs (infrastructure, security, deployment, monitoring)
- Bank's preference: redeployment vs. headcount reduction vs. hiring avoidance
- Managed Hosting fee (to net against savings)

---

### L2: Compliance & Security Cost Avoidance

**Root Driver:** Operating a self-hosted digital banking platform requires the bank to independently achieve and maintain security certifications (SOC2 Type II, ISO 27001) and comply with local regulatory requirements for IT security. This requires dedicated security personnel (security engineers, compliance officers), annual external audit engagements, penetration testing, vulnerability assessment programs, and ongoing compliance documentation. For a Tier 2 bank in Southeast Asia, this is a significant overhead relative to the bank's IT scale. Source: Capability pattern (Managed Hosting includes compliance certifications); industry standard for self-hosted banking platforms.

**Operational Change:** Backbase Managed Hosting includes SOC2 Type II and ISO 27001 certifications as part of the service. The bank's digital banking platform audit scope is reduced because infrastructure-layer compliance is inherited from Backbase's certifications. Dedicated security FTEs focused on platform-level security (not application or business security) can be reduced. Annual external audit costs for the platform infrastructure layer are eliminated or significantly reduced. Penetration testing and vulnerability management for the hosting layer transfer to Backbase.

**Volume/Rate Impact:**
- Current: Estimated 2-4 FTEs (or partial FTE allocations) dedicated to platform security and compliance; annual audit and penetration testing costs for self-hosted infrastructure
- Target: Platform security responsibilities absorbed by Managed Hosting; bank retains application-level and business-logic security only
- Delta: Security FTE reduction (estimated 1-3 FTEs or equivalent partial allocations) + annual audit cost reduction
- Derivation: Capability pattern — Managed Hosting includes certifications. Benchmark: mid-size banks typically allocate 15-25% of IT security staff to infrastructure/hosting-layer security.

**Financial Impact Direction:** (Reduced security FTEs x loaded annual cost) + (eliminated/reduced annual audit costs) + (eliminated penetration testing costs for infrastructure layer). Inputs needed: current security team size and allocation to platform infrastructure, annual audit costs, penetration testing costs.

**Data Needs for Modeling:**
- Number of FTEs (or FTE-equivalents) dedicated to platform infrastructure security
- Annual external audit costs attributable to the self-hosted platform
- Annual penetration testing and vulnerability assessment costs
- Local regulatory requirements (e.g., Bank of Thailand, BSP, BNM, MAS — depending on specific country) that may require residual bank-side compliance effort

---

### L3: Uptime Revenue Protection

**Root Driver:** Self-hosted digital banking platforms at Tier 2 banks in Southeast Asia typically lack enterprise-grade high availability, automated failover, and disaster recovery infrastructure comparable to cloud-native managed services. Unplanned downtime events disrupt commercial clients' access to payment initiation, balance visibility, and treasury operations — functions that directly generate transaction revenue and underpin client satisfaction. Commercial clients have low tolerance for platform unavailability because payment deadlines, payroll processing, and cash management are time-critical. Source: Capability pattern (Managed Hosting provides SLA-backed uptime with DR); commercial banking benchmark — portal adoption <30-50% is partly driven by reliability concerns.

**Operational Change:** Backbase Managed Hosting provides contractual SLA-backed uptime (99.9%+), automated failover, disaster recovery, and 24/7 monitoring by a dedicated operations team. This replaces the bank's self-managed availability setup, which typically has longer mean-time-to-recovery (MTTR) and lacks automated failover. The improvement in platform reliability also supports higher commercial portal adoption (benchmark: 30-50% average, >70% best-in-class) by removing a barrier to digital channel trust.

**Volume/Rate Impact:**
- Current: Unplanned downtime hours per year on self-hosted platform (data gap — needs discovery)
- Target: <4.38 hours/year unplanned downtime (consistent with 99.95% uptime SLA)
- Delta: Reduction in downtime hours; commercial transaction revenue protected during those hours
- Derivation: Gap-based — self-hosted Tier 2 bank estimated at 95-99% uptime (44-438 hours downtime/year) vs. Managed Hosting SLA of 99.9%+ (<8.76 hours/year). Exact current-state data required from the bank.

**Financial Impact Direction:** (Avoided downtime hours) x (digital commercial transactions per hour) x (revenue per transaction or fee per payment). Additionally, qualitative retention benefit — commercial clients switching banks due to platform unreliability represents relationship revenue at risk ($50K-200K per commercial client per year). Inputs needed: current downtime hours, commercial digital transaction volume per hour, revenue per transaction, and any known client attrition linked to platform issues.

**Data Needs for Modeling:**
- Annual unplanned downtime hours on the current self-hosted platform
- Number of commercial clients actively using digital channels
- Average digital transaction volume per business hour
- Revenue per digital transaction (payment fees, treasury fees)
- Any historical client complaints or attrition linked to platform outages

---

### L4: Release Velocity & Time-to-Market Acceleration

**Root Driver:** Self-hosted platforms at Tier 2 banks typically have slow release cycles due to manual deployment processes, change advisory board (CAB) approvals, environment provisioning delays, and risk-averse release management practices. Platform updates that could deliver new commercial banking capabilities (e.g., new payment types, enhanced treasury dashboards, API connectivity for commercial clients) are delayed by weeks or months. This slows the bank's ability to respond to competitive threats and commercial client demands. Source: Capability pattern (Managed Hosting includes continuous delivery and deployment management); industry pattern for self-hosted banking platforms.

**Operational Change:** Backbase Managed Hosting includes continuous delivery pipeline management — platform updates, patches, and new feature releases are deployed through Backbase's release management process with automated testing, staged rollouts, and rollback capability. The bank receives platform updates faster (days-weeks vs. weeks-months) without bearing the deployment risk or effort. This accelerates the delivery of new commercial banking capabilities to market.

**Volume/Rate Impact:**
- Current: Release cycle estimated at 4-8 weeks per platform update (typical for self-hosted Tier 2)
- Target: Continuous delivery — updates deployed within days of availability
- Delta: Weeks of time-to-market acceleration per feature/update
- Derivation: Capability pattern — Managed Hosting continuous delivery vs. self-hosted manual deployment. Benchmark: managed platforms typically deliver updates 3-5x faster than self-hosted equivalents.

**Financial Impact Direction:** Revenue acceleration — new capabilities (payment features, treasury services, portal enhancements) reach commercial clients faster, enabling earlier fee revenue capture and competitive differentiation. Inputs needed: planned feature roadmap with expected revenue per feature, current deployment cycle time, competitive pressure timeline. Note: This lever is harder to quantify precisely — it is best framed as a strategic accelerator rather than a precise dollar figure.

**Data Needs for Modeling:**
- Current average release cycle time (weeks per deployment)
- Planned feature roadmap for the next 12-24 months
- Estimated revenue impact of delayed features (competitive loss, client requests pending)
- Number of releases per year (current vs. projected with Managed Hosting)

---

### L5: Infrastructure License & Tooling Rationalization

**Root Driver:** The bank's self-hosted platform requires a stack of infrastructure software and tooling: server/VM licenses (or cloud IaaS costs), operating system licenses, database licenses, monitoring and alerting tools (e.g., Nagios, Datadog, New Relic equivalents), backup and recovery software, container orchestration (if applicable), load balancers, WAF/security appliances, and log management. These represent recurring annual costs that scale with the platform's footprint. Source: Capability pattern (Managed Hosting absorbs infrastructure); standard self-hosted banking platform cost structure.

**Operational Change:** Backbase Managed Hosting includes all infrastructure-layer software, tooling, and services within the managed service fee. The bank eliminates separate procurement, licensing, renewal, and vendor management for platform infrastructure components. Infrastructure costs become a single, predictable line item within the Managed Hosting agreement rather than a portfolio of separate vendor contracts.

**Volume/Rate Impact:**
- Current: Annual infrastructure license and tooling costs for the self-hosted platform (data gap — needs IT cost discovery)
- Target: These costs absorbed into Managed Hosting fee
- Delta: Gross infrastructure cost eliminated (net of Managed Hosting fee — the financial modeler handles the netting)
- Derivation: Direct cost replacement — current infrastructure costs vs. Managed Hosting fee. The financial modeler will need to ensure no double-counting with the Managed Hosting fee itself.

**Financial Impact Direction:** Annual infrastructure license and tooling costs avoided. Inputs needed: itemized annual costs for server/VM licensing, OS licensing, database licensing, monitoring tools, backup/DR tools, security appliances, and any managed services contracts for infrastructure components. The financial modeler must net these against the Managed Hosting fee to avoid overstating the benefit.

**Data Needs for Modeling:**
- Itemized annual infrastructure costs (licenses, subscriptions, hardware amortization)
- Current hosting environment details (on-premise vs. private cloud vs. hybrid)
- Managed Hosting fee from Backbase proposal (for net cost comparison)
- Contract renewal dates for current infrastructure vendors

---

### L6: IT Staff Capacity Redeployment to Innovation (Creative)

**Root Driver:** With 12 FTEs consumed by platform operations ("keep the lights on"), the bank's IT organization has limited capacity to invest in digital innovation for commercial banking — such as building new API integrations for commercial clients, enhancing the treasury portal, or developing data analytics capabilities. This is a common pattern at Tier 2 banks where IT operations absorb a disproportionate share of IT talent. Source: Inferred from engagement context (12 FTEs on ops out of a presumably constrained IT organization); CIO stakeholder angle — CIOs at Tier 2 banks frequently cite the "run vs. build" imbalance as a strategic concern.

**Operational Change:** With Managed Hosting absorbing platform operations (see L1), 9-10 FTEs are freed from operations duties. If the bank chooses to redeploy (rather than reduce headcount), these staff can be redirected to digital innovation projects: commercial portal enhancements, API connectivity for corporate clients, data and analytics initiatives, or new product development. This shifts the IT cost profile from "run" to "build."

**Volume/Rate Impact:**
- Current: 12 FTEs on operations, leaving limited capacity for innovation
- Target: 2-3 FTEs on operations coordination, 9-10 FTEs available for innovation
- Delta: Innovation capacity equivalent to 9-10 additional FTE-years per year
- Derivation: This is a second-order effect of L1. The FTE redeployment is the same pool — but this lever captures the REVENUE-SIDE value of that redeployment (vs. L1 which captures the COST-SIDE value). Only one framing should be used in the final model to avoid double-counting.

**Financial Impact Direction:** Revenue acceleration from innovation projects delivered by redeployed staff. Inputs needed: bank's digital innovation pipeline and expected revenue per initiative, or benchmarked value of IT innovation capacity. Note: This is inherently harder to quantify than cost avoidance — recommend framing as a qualitative strategic benefit unless the bank has a concrete innovation backlog with revenue estimates.

**Data Needs for Modeling:**
- Bank's digital innovation roadmap / backlog
- Expected revenue or cost savings per innovation project
- Whether the bank plans to redeploy or reduce headcount
- CIO's stated priorities for IT investment rebalancing

**Confidence Note:** LOW — this is a creative/second-order lever. Consultant validation required. Risk of double-counting with L1 must be managed explicitly.

---

### L7: Tech Debt Accumulation Avoidance (Creative)

**Root Driver:** Self-hosted banking platforms at Tier 2 banks accumulate technical debt over time: deferred security patches, lagging platform version upgrades, outdated infrastructure components, and growing configuration drift. This tech debt creates compounding future costs — eventual forced migration/upgrade projects, increasing security vulnerability exposure, and rising maintenance burden as the platform falls further behind current versions. For a Southeast Asian Tier 2 bank, regulatory pressure (e.g., from local central banks) on IT resilience and cybersecurity standards is increasing, making tech debt increasingly risky. Source: Industry pattern for self-hosted banking platforms; CIO stakeholder concern — technical debt is a frequently cited risk in platform hosting decisions.

**Operational Change:** Backbase Managed Hosting includes continuous platform updates, security patching, and version management as part of the service. The bank's platform remains current, eliminating the accumulation of tech debt. This avoids future "big bang" upgrade projects and reduces the risk of regulatory findings related to outdated infrastructure.

**Volume/Rate Impact:**
- Current: Tech debt accumulation rate on the self-hosted platform (data gap — typically manifests as deferred upgrades, growing patch backlog, rising incident frequency)
- Target: Zero tech debt accumulation — platform continuously updated
- Delta: Avoided future remediation cost (typically a major upgrade every 3-5 years costing significant FTE time + vendor services + business disruption)
- Derivation: Industry pattern — self-hosted banking platform major upgrade projects typically cost 6-18 months of effort and significant budget. This is an avoided future cost, not a current-year saving.

**Financial Impact Direction:** Avoided future remediation/upgrade project costs, spread over the avoidance period. Inputs needed: historical upgrade project costs (if available), estimated cost of a major platform upgrade for the bank's current infrastructure, current patch backlog size. Note: This lever is strongest when framed as risk avoidance over a 3-5 year horizon rather than an annual cost saving.

**Data Needs for Modeling:**
- Historical platform upgrade project costs (last major upgrade)
- Current patch/upgrade backlog size
- Estimated cost of next major platform upgrade if self-hosted
- Any regulatory findings or audit observations related to platform currency

**Confidence Note:** LOW — this is a creative lever based on industry patterns. Quantification requires either historical upgrade cost data from the bank or industry benchmarks for platform upgrade projects. Consultant validation required.

---

## Excluded Branches

| Branch | Reason for Exclusion |
|--------|---------------------|
| Predictable Cost Model (CapEx to OpEx shift) | Qualitative CFO benefit — cannot be expressed as a four-link value chain with measurable volume/rate impact. Should be included in the business case narrative but not as a quantified lever. |
| Cost to Acquire (Type 2, Branch A) | Managed Hosting does not directly influence client acquisition costs — those are driven by onboarding processes and sales efficiency, not hosting model. |
| Cost to Serve (Type 2, Branch B) | Managed Hosting does not directly change customer-facing servicing costs — those are driven by portal capabilities, not infrastructure hosting. Indirectly, better uptime (L3) supports servicing, but the direct cost-to-serve levers belong to the portal/platform deal, not the hosting component. |
| Cost to Retain (Type 2, Branch C) | Retention costs are driven by relationship management and client experience, not hosting model. Uptime (L3) has an indirect retention effect, which is captured in the revenue protection framing. |
| New Acquisitions (Type 1, Branch A) | Managed Hosting does not directly drive new commercial client acquisition. |
| Products per Customer (Type 1, Branch C) | Cross-sell and product penetration are driven by portal capabilities and RM tools, not by hosting model. |
| Digital Adoption / Channel Migration (Type 3, Branch A/B) | Digital adoption is driven by portal UX, feature richness, and client enablement — not hosting infrastructure. Better uptime (L3) is a supporting factor but not the primary driver. |

---

## Coverage Check

### MECE Verification
- **Layer 1:** Type 2 math decomposition (Cost to Acquire + Cost to Serve + Cost to Retain + IT/Infrastructure Cost) is MECE by construction. This exercise focuses on Branch D (IT/Infrastructure) which is Managed Hosting's direct domain. Other branches excluded with rationale.
- **Layer 2:** Within IT/Infrastructure, the levers cover: personnel (L1), compliance (L2), infrastructure costs (L5), and tech debt (L7). These are non-overlapping cost categories. Checked for overlaps — L1 and L6 use the same FTE pool but frame different value types (cost vs. revenue); flagged for single-counting in the model.

### Lifecycle Coverage
- **Operating Model:** L1, L2, L4, L5, L7 (5 levers)
- **Retain:** L3 (1 lever)
- **Expand:** L6 (1 lever)
- **Coverage assessment:** 3 of 5 lifecycle stages represented. However, this is expected for a hosting/infrastructure capability — Managed Hosting's value is concentrated in the Operating Model stage by nature. The Retain (uptime) and Expand (innovation capacity) levers provide cross-stage representation.

### Lever Count
- **7 total levers** (5 systematic + 2 creative) — within the 5-8 typical range.

### Concentration Flag
- **5 of 7 levers (71%) are in Operating Model stage.** This is expected and acceptable for a Managed Hosting capability-driven exercise. The capability's value chain naturally maps to Operating Model. The two non-Operating-Model levers (L3: Retain, L6: Expand) provide breadth.

### Double-Counting Risk
- **L1 and L6 share the same FTE pool.** L1 frames the cost avoidance value (FTEs no longer needed for ops). L6 frames the revenue acceleration value (redeployed FTEs driving innovation). In the financial model, only ONE framing should be used per FTE — either cost avoidance OR revenue redeployment, not both. Recommend: use L1 (cost avoidance) as the primary lever; include L6 as a qualitative upside or model it only for FTEs the bank explicitly plans to redeploy to revenue-generating projects.
- **L5 and the Managed Hosting fee.** L5 captures infrastructure costs avoided, but the Managed Hosting fee replaces them. The financial modeler must net L5 savings against the Managed Hosting fee to show true incremental value.

---

## Creative Discovery

### Cross-LOB Adjacency
- The bank operates in commercial banking but likely also has retail and possibly SME segments. If the Managed Hosting deal covers the entire Backbase platform (not just commercial), the FTE and infrastructure savings in L1, L2, and L5 would apply across all LOBs served by the platform. This would increase the magnitude of those levers. **Recommendation:** Confirm with the bank whether the self-hosted platform serves multiple LOBs and whether the Managed Hosting proposal covers the full platform.

### Client-Specific Structural Uniqueness
- **Southeast Asia regulatory landscape:** Central banks in the region (MAS, BSP, Bank of Thailand, BNM) are increasingly mandating cybersecurity frameworks, cloud governance standards, and IT resilience requirements. Managed Hosting's compliance certifications (SOC2, ISO27001) may help the bank meet emerging regulatory requirements that would otherwise require significant investment to achieve independently. This strengthens L2 beyond current-state cost avoidance.
- **Multi-country operations:** If the bank operates across multiple Southeast Asian markets, self-hosted DR/BC across jurisdictions adds complexity and cost that Managed Hosting would absorb.

### Second-Order Effects
- **L3 (uptime) amplifies digital adoption.** Improved platform reliability increases commercial client trust in digital channels, potentially driving portal adoption from the current level toward best-in-class (>70%). This in turn amplifies the value of any portal-related levers in the broader platform deal (though those levers belong to the platform business case, not the Managed Hosting component).
- **L4 (release velocity) amplifies all feature-dependent levers.** Faster deployment means the bank realizes value from new platform features sooner — every feature-based lever in the broader platform deal starts generating value earlier.

### Stakeholder-Specific Angles
- **CIO:** Tech rationalization, "run vs. build" rebalancing (L1 + L6), tech debt avoidance (L7), reduced operational risk
- **CFO:** Cost predictability (CapEx to OpEx — qualitative, excluded from quantified levers but important for narrative), transparent cost model, elimination of hidden infrastructure costs
- **CISO/CRO:** Security posture improvement, inherited compliance certifications (L2), reduced vulnerability exposure (L7)
- **COO:** Operational resilience, SLA-backed uptime (L3), reduced incident management burden

---

## Data Gaps

The following items represent data the financial modeler will need to obtain from the bank or estimate using benchmarks:

| Data Item | Needed For | Fallback if Unavailable |
|-----------|-----------|------------------------|
| Loaded annual cost per IT ops FTE (Southeast Asia) | L1 — FTE cost avoidance calculation | Use regional IT salary benchmarks (Southeast Asia Tier 2 bank IT ops: estimated $25K-50K loaded, varies significantly by country) |
| Breakdown of 12 FTEs by role (infra, security, deployment, monitoring) | L1, L2 — allocate FTEs between ops and security levers | Assume 8-9 infrastructure/ops, 2-3 security/compliance, 1-2 deployment |
| Current security team size and allocation to platform | L2 — security FTE avoidance | Estimate 2-3 FTEs or partial allocations based on typical Tier 2 bank |
| Annual audit and penetration testing costs | L2 — audit cost avoidance | Use regional benchmarks for SOC2/ISO27001 audit costs |
| Annual unplanned downtime hours | L3 — revenue protection calculation | Estimate based on platform type and self-hosted benchmarks (20-100 hours/year for Tier 2 self-hosted) |
| Commercial digital transaction volume per hour | L3 — revenue per downtime hour | Derive from total transaction volume / business hours per year |
| Current release cycle time (weeks per deployment) | L4 — time-to-market acceleration | Estimate 4-8 weeks based on industry pattern for self-hosted Tier 2 |
| Itemized annual infrastructure costs (licenses, hardware, tools) | L5 — infrastructure cost avoidance | Request from CIO/IT finance; no reliable benchmark substitute |
| Managed Hosting fee from Backbase proposal | L5, overall — net cost comparison | Required from Backbase sales team |
| Historical platform upgrade project costs | L7 — tech debt avoidance | Estimate based on platform upgrade benchmarks (6-18 months effort) |
| Bank's IT innovation roadmap/backlog | L6 — redeployment value | Qualitative only if no data available |
| Country-specific regulatory requirements | L2 — compliance scope | Research based on confirmed country |

---

## Questions for Consultant

1. **Country confirmation:** Which specific Southeast Asian country is this bank in? This affects FTE cost rates, regulatory requirements, and benchmark applicability significantly.

2. **Platform scope:** Does the self-hosted platform serve only Commercial Banking, or also Retail/SME? If multi-LOB, the Managed Hosting savings (L1, L2, L5) apply to the entire platform, not just the commercial component — this significantly increases the magnitude.

3. **FTE disposition preference:** Does the bank want to frame the 9-10 freed FTEs as cost reduction (headcount elimination), cost avoidance (no new hiring as volumes grow), or capacity redeployment (same headcount, different work)? This changes the framing of L1 and determines whether L6 is relevant.

4. **Double-counting with L1 and L6:** Recommend using L1 (cost avoidance) as the quantified lever and L6 (innovation redeployment) as a qualitative strategic benefit, unless the bank has a concrete innovation backlog with revenue estimates. Confirm this approach.

5. **Managed Hosting fee transparency:** Is the Managed Hosting fee available for net cost comparison? Without it, we can only show gross savings, which overstates the benefit. The financial modeler needs the fee to produce a credible net analysis.

6. **Current hosting details:** Is the platform on-premise (bank's own data center), private cloud (e.g., AWS/Azure managed by the bank), or colocation? This affects the magnitude of L5 (infrastructure costs) and L2 (compliance scope) significantly.

7. **Competitive context:** Is the CIO evaluating Managed Hosting against other managed service providers (e.g., a local cloud MSP), or is the comparison strictly self-hosted vs. Backbase Managed Hosting? If competing against other MSPs, the value story needs to differentiate Backbase's managed service (platform-native expertise) from generic infrastructure MSPs.

8. **Broader platform deal levers:** Since Managed Hosting is positioned as part of a platform deal, are there separate levers being built for the commercial banking platform capabilities (onboarding, treasury, payments)? If so, ensure no overlap with L3 (uptime) and L4 (release velocity), which touch platform capabilities indirectly.
