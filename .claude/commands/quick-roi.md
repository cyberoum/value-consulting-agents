# Quick ROI — On-Demand Bank Value Estimate

Generate a conversation-ready ROI estimate for any bank in the Market Intelligence app. Produces a formatted, copy-pasteable summary with value levers, talking points, and transparent assumptions — ready for pre-meeting prep, email inserts, or presentation content.

## When to Invoke

- Before a meeting: "Give me the ROI numbers for Nordea"
- Email prep: "I need a quick value estimate for DNB to include in my email"
- Presentation content: "Generate ROI talking points for SEB"
- Territory planning: "Show me the ROI potential across all Nordic banks"
- When consultant says "quick roi", "roi estimate", "value estimate", or "what's the value case for [bank]?"

## Input

The user provides a **bank name** (or partial match). Examples:
- `/quick-roi Nordea`
- `/quick-roi TF Bank`
- `/quick-roi all` (generates summary table for all banks)

## Execution Steps

### Step 1: Identify the Bank

Read the bank data from the Market Intelligence app:

```
/Users/oumaimaaurag/cortex/market-intelligence-app/src/data/banks.js
```

Match the user's input to a bank key (e.g., "Nordea" → "Nordea_Sweden", "DNB" → "DNB_Norway"). If ambiguous, list matching banks and ask the user to pick.

If the user says "all", process all banks and generate a comparative summary table.

### Step 2: Read the ROI Engine Methodology

Read the calculation engine to understand the exact methodology, benchmarks, and addressability factors:

```
/Users/oumaimaaurag/cortex/market-intelligence-app/src/data/roiEngine.js
```

This file contains:
- `BENCHMARKS` — All industry benchmarks with documented sources
- `parseKpiValue()` — How to parse KPI strings like "€570B", "~28,000", "~46%"
- `extractMetrics()` — How to extract structured metrics from bank KPIs
- `calculateRoi()` — The 5 value lever calculations with addressability factors
- `formatEur()`, `formatMillions()` — Number formatting helpers

### Step 3: Read Supporting Data

Also read these files for the target bank:
- `/Users/oumaimaaurag/cortex/market-intelligence-app/src/data/valueSelling.js` — Value hypothesis, product mapping, discovery questions
- `/Users/oumaimaaurag/cortex/market-intelligence-app/src/data/qualification.js` — Qualification scores, deal size, timing

### Step 4: Calculate the ROI

Apply the **exact same methodology** as `calculateRoi()` in roiEngine.js:

1. **Parse KPIs** from the bank's `kpis` array using the `parseKpiValue` logic
2. **Extract metrics**: total assets, employees, customers, cost/income ratio, ROE, tech spend
3. **Calculate 5 value levers** × 3 scenarios (Conservative P25 / Base P50 / Optimistic P75):

| Lever | Addressability | Calculation |
|-------|---------------|-------------|
| **Cost-to-Serve Reduction** | 15% of FTEs are front-office addressable | Addressable FTEs × €95K × [5% / 10% / 18%] |
| **Digital Channel Migration** | 20% of non-digital interactions shiftable | Customers × 30 interactions/yr × 20% shiftable × [8% / 15% / 25%] shift rate × €8 savings |
| **Onboarding & Acquisition** | 3% acquisition rate × 60% digital | Digital new customers × [10% / 20% / 35%] conversion lift × €190 first-year revenue |
| **Cross-Sell Revenue** | 25% of customers are active digital | Addressable customers × [0.10 / 0.20 / 0.35] additional products × €130/product |
| **Platform Consolidation** | 25% of tech spend is addressable | Addressable tech spend × [5% / 10% / 18%] savings |

4. **Sum totals** for each scenario
5. **Calculate payback** if deal size is available

### Step 5: Generate Output

Produce a **formatted markdown summary** following this exact template:

---

```markdown
# ROI Value Estimate: [Bank Name]

> **Conversation-Ready:** Based on [Bank]'s [customers] customers, [employees] employees,
> and €[assets] in assets, a digital engagement platform could deliver
> €[conservative]–€[optimistic] in annual value. The base case projects €[base]/year.

## Value Potential (Annual)

| Scenario | Annual Value | Payback |
|----------|-------------|---------|
| Conservative (P25) | €XX.XM | X.X years |
| **Base Case (P50)** | **€XX.XM** | **X.X years** |
| Optimistic (P75) | €XX.XM | X.X years |

## Value Lever Breakdown (Base Case)

| # | Lever | Annual Value | Talking Point |
|---|-------|-------------|---------------|
| 1 | 💰 Cost-to-Serve Reduction | €XX.XM | "With ~X,XXX front-office FTEs..." |
| 2 | 📱 Digital Channel Migration | €XX.XM | "Shifting X% of X.XM interactions..." |
| 3 | 🚀 Onboarding & Acquisition | €XX.XM | "A X% lift across XX,XXX acquisitions..." |
| 4 | 📈 Cross-Sell & Engagement | €XX.XM | "Adding X.X products per XXX,XXX active customers..." |
| 5 | 🔧 Platform Consolidation | €XX.XM | "Consolidating from €XXM addressable tech spend..." |

## Bank Metrics Used

| Metric | Value | Source |
|--------|-------|--------|
| Total Assets | €XXXB | Annual Report |
| Employees | XX,XXX | Annual Report |
| Customers | X.XM | Annual Report |
| Cost/Income | XX% | Annual Report |
| Tech Spend | €X.XB | Annual Report / Estimated |
| Est. Revenue | €XX.XB | Calculated (Assets × NIM × 2.5) |

## Deal Context

- **Deal Size:** [from qualification data]
- **Sales Cycle:** [from qualification data]
- **Timing:** [from qualification data]
- **Value Hypothesis:** "[from value selling data]"

## Key Assumptions

1. 15% of FTEs are front-office/customer-facing (addressable by engagement platform)
2. 25% of customer base are "active digital" users addressable for cross-sell
3. 20% of non-digital interactions are realistically shiftable to digital
4. Average fully-loaded FTE cost: €95,000 (McKinsey Global Banking Review 2024)
5. Branch vs digital interaction cost delta: €8.00 (BCG Banking Efficiency 2024)
6. Revenue per additional product: €130/year (EBA/ECB Banking Statistics)
7. First-year revenue for new customers: €190 (50% of €380 annual avg)

---
⚠️ **Disclaimer:** These are high-level estimates for pre-meeting conversation purposes.
Based on publicly available annual report metrics and industry benchmarks.
Actual ROI requires client-specific data validation and detailed implementation scoping.
```

---

### Step 6: Multi-Bank Mode ("all")

If the user requests "all", generate a **comparison table**:

```markdown
# ROI Potential — All Banks

| Bank | Country | Customers | Employees | Conservative | Base Case | Optimistic | Deal Size |
|------|---------|-----------|-----------|-------------|-----------|-----------|-----------|
| Nordea | Sweden | 9.3M | 28K | €107.8M | €211.2M | €367.8M | €5-15M initial |
| SEB | Sweden | 4.4M | 16.5K | ... | ... | ... | ... |
| DNB | Norway | 2.1M | 8.6K | ... | ... | ... | ... |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Total addressable value (base case): €X.XB across XX banks**
```

## Quality Rules

1. **Never invent data** — only use metrics from the bank's KPIs array or documented benchmarks
2. **Always show sources** — every metric must say "Annual Report" or "Estimated (benchmark)"
3. **Conservative bias** — when in doubt, use lower numbers
4. **Addressability matters** — never apply improvement factors to the full base; always use the addressability percentages
5. **Include the disclaimer** — always end with the disclaimer about high-level estimates
6. **Talking points must be specific** — include actual numbers from the bank, not generic statements

## Error Handling

- If a bank has no KPIs: State "Insufficient data for ROI estimation — this bank needs customers, employees, or assets KPIs"
- If a bank has partial KPIs: Calculate only the levers that have sufficient data; note which levers couldn't be calculated
- If bank name doesn't match: List available banks and ask user to pick
