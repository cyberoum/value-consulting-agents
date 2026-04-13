# IGNITE AI AGENT SYSTEM - QUICK REFERENCE CARD

## 🚀 SETUP (One-Time)

### Option A: Single Project (Recommended)
1. Create Claude Project: "Ignite AI Agent"
2. Upload ALL 7 CLAUDE.md files to Project Knowledge
3. Upload ENGAGEMENT_CONTEXT_TEMPLATE.md
4. Done! Use trigger phrases to switch between agents

### Option B: Separate Projects
Create 7 projects, upload one CLAUDE.md each, pass context file manually

---

## 📋 TRIGGER PHRASES

| Need This | Say This |
|-----------|----------|
| Strategy deck | `Generate Strategy Workshop deck for [Client]` |
| Member/CX deck | `Generate Member Experience Workshop deck` |
| Employee/EX deck | `Generate Employee Experience Workshop deck` |
| Architecture deck | `Generate IT Architecture Workshop deck` |
| Use Case docs | `Create use case design documents and prototypes` |
| ROI questionnaire | `/generate-roi-questionnaire` |
| Business case | `Build the business case from this questionnaire` (roi-financial-modeler agent) |
| Final presentation | `Compile the Ignite Day presentation` |

---

## 🔄 TYPICAL WORKFLOW

```
[Strategy Docs] → Agent 1 → Workshop → Update Context
                                            ↓
                  Agent 2 → Workshop → Update Context
                                            ↓
                  Agent 3 → Workshop → Update Context
                                            ↓
                  Agent 4 → Workshop → Update Context
                                            ↓
        Agent 5 (Use Cases + Prototypes) ←──┘
                     ↓
        Agent 7 (Questionnaire → Business Case)
                     ↓
        Agent 6 (Final Presentation)
```

---

## ⚡ ENGAGEMENT TYPES

| Type | Agents | Duration |
|------|--------|----------|
| **Full Ignite** | 1→2→3→4→5→/generate-roi-questionnaire→/build-roi→6 | 6-8 weeks |
| **ROI Only** | /generate-roi-questionnaire + /build-roi | 1-2 weeks |
| **Experience Sprint** | 2→3→5 | 3-4 weeks |
| **Architecture Only** | 4→5 | 2-3 weeks |

---

## 📝 MUST-HAVE INPUTS

| Agent | Required | Optional |
|-------|----------|----------|
| **1 Strategy** | Client name/type/size, strategy docs | Competitor names |
| **2 Member** | Context file | Persona research, journey maps |
| **3 Employee** | Context file | Systems list, employee feedback |
| **4 Architecture** | Context file, core banking info | Tech landscape docs |
| **5 Use Case** | Context file, workshop findings | Existing wireframes |
| **6 Presentation** | All prior outputs | Prototype screenshots |
| **/generate-roi-questionnaire** | Context file, engagement directory | Use case scope |
| **roi-financial-modeler** | Filled questionnaire, context file | Pricing info |

---

## 🏦 TERMINOLOGY RULES

| Client Type | Use | Never Use |
|-------------|-----|-----------|
| Credit Union | **Member** | Customer |
| Bank | **Customer** | Member |

---

## ✅ QUALITY CHECKLIST

### For Workshop Decks
- [ ] Client name throughout
- [ ] Correct Member/Customer term
- [ ] Hypotheses are **specific + quantified**
- [ ] Validation questions included
- [ ] Backbase alignment shown

### For Use Cases
- [ ] Happy path numbered
- [ ] Prototypes match flow
- [ ] Definition of done measurable

### For Business Case
- [ ] ROI in 150-400% range (typical)
- [ ] Assumptions listed
- [ ] No Excel errors

---

## 🔢 KEY BENCHMARKS

| Metric | Average | Best-in-Class |
|--------|---------|---------------|
| Digital Adoption | 62% | 85%+ |
| iOS App Rating | 4.5 | 4.8+ |
| Acct Open Completion | 35% | 55%+ |
| Loan Abandonment | 65% | <40% |

---

## 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Wrong terminology | Add: "This is a CREDIT UNION, use Member" |
| Generic hypotheses | Add: "Include quantified claims with $ impact" |
| Missing competitive | Add: "Search for [Competitor] and compare" |
| ROI seems off | Ask: "Show all assumptions and calculations" |

---

## 📁 FILE STRUCTURE

```
ignite-agents/
├── CONSULTANT_GUIDE.md      ← Full documentation
├── QUICK_REFERENCE.md       ← This card
├── templates/
│   └── ENGAGEMENT_CONTEXT_TEMPLATE.md
├── agent-1-strategy/CLAUDE.md
├── agent-2-member/CLAUDE.md
├── agent-3-employee/CLAUDE.md
├── agent-4-architecture/CLAUDE.md
├── agent-5-usecase/CLAUDE.md
├── agent-6-presentation/CLAUDE.md
└── agent-7-roi/CLAUDE.md
```

---

**💡 Pro Tips:**
1. Always start with ENGAGEMENT_CONTEXT_TEMPLATE.md
2. Update context after EVERY workshop
3. Be specific in prompts - client name, size, priorities
4. Attach relevant documents
5. Check outputs before delivering to client

---

*Ignite AI Agent System v1.0 | January 2026*
