# BACKBASE IGNITE AI AGENT SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════
# Value Consulting Engagement Automation
# Version: 1.0
# ═══════════════════════════════════════════════════════════════════════════════

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[CONSULTANT_GUIDE.md](CONSULTANT_GUIDE.md)** | Complete implementation guide (start here!) |
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** | One-page cheat sheet for daily use |
| **This README** | System overview and architecture |

---

## Overview

This system consists of **7 independent AI agents** (Agent 0–6) that automate the creation of Backbase Ignite Value Consulting deliverables. Each agent can work standalone or receive context from other agents via a standardized context file.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IGNITE AGENT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PLANNING AGENT                                                              │
│  └── Agent 0: Engagement Plan                                               │
│                                                                              │
│  PRE-WORKSHOP AGENTS (Generate facilitation materials)                       │
│  ├── Agent 1: Strategy Workshop                                             │
│  ├── Agent 2: Member/Customer Experience Workshop                           │
│  ├── Agent 3: Employee Experience Workshop                                  │
│  └── Agent 4: IT Architecture Workshop                                      │
│                                                                              │
│  POST-WORKSHOP AGENTS (Synthesize and deliver)                               │
│  ├── Agent 5: Use Case Design + Prototypes                                  │
│  └── Agent 6: Ignite Day Presentation                                       │
│                                                                              │
│  CONNECTOR                                                                   │
│  └── ENGAGEMENT_CONTEXT.md (Travels between agents)                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Option 1: Full Ignite Engagement
Use all 7 agents in sequence for a complete engagement.

```
1. Start Agent 0 → Provide client details → Get engagement plan + initial context
2. Use Agent 1 → Upload strategy docs → Get workshop deck + updated context
3. Use Agent 2 → Upload context + personas → Get member experience deck
4. Use Agent 3 → Upload context + employee info → Get employee experience deck
5. Use Agent 4 → Upload context + architecture docs → Get architecture deck

   [RUN WORKSHOPS WITH CLIENT]

5. Use Agent 5 → Upload context + transcripts → Get use case docs + prototypes
6. Use /generate-roi-questionnaire skill → Upload context → Get customized questionnaire

   [CLIENT FILLS QUESTIONNAIRE]

7. Use /build-roi skill → Upload filled questionnaire → Get business case + ROI
8. Use Agent 6 → Upload context + all outputs → Get final Ignite Day presentation
```

### Option 2: Selective Agent Usage
Use only the agents you need for a specific engagement type.

| Engagement Type | Agents to Use | Context Flow |
|----------------|---------------|--------------|
| ROI-Only Assessment | /generate-roi-questionnaire + /build-roi | Standalone |
| Experience Sprint | 2 → 3 → 5 | Partial chain |
| Strategy + Presentation | 1 → 6 | Skip middle |
| Use Case Validation | 5 only | Minimal context |
| Full Ignite | 0 → 1 → 2 → 3 → 4 → 5 → /generate-roi-questionnaire → /build-roi → 6 | Full chain |

---

## Setup Instructions

### Step 1: Create Claude Projects

Create 7 separate Claude Projects in claude.ai:

1. **Ignite - Engagement Plan**
2. **Ignite - Strategy Workshop**
3. **Ignite - Member Experience**
4. **Ignite - Employee Experience**
5. **Ignite - IT Architecture**
6. **Ignite - Use Case Design**
7. **Ignite - Presentation**

### Step 2: Upload CLAUDE.md Files

For each project, upload the corresponding agent definition file from this repository:

```
agent-0-engagement-plan.md      → Ignite - Engagement Plan
agent-1-strategy.md             → Ignite - Strategy Workshop
agent-2-member.md               → Ignite - Member Experience
agent-3-employee.md             → Ignite - Employee Experience
agent-4-architecture.md         → Ignite - IT Architecture
agent-5-usecase.md              → Ignite - Use Case Design
agent-6-presentation.md         → Ignite - Presentation
```

### Step 3: Upload Shared Knowledge (Optional)

For richer outputs, upload these to each project's knowledge base:
- Backbase product documentation
- Sample Ignite deliverables
- Brand guidelines
- Industry benchmarks

---

## Agent Specifications

### Agent 1: Strategy Workshop

**Purpose**: Generate hypothesis-driven facilitation materials for Strategy Alignment Workshop

**Inputs**:
- Client strategy documents (annual report, digital strategy, etc.)
- Client profile information
- ENGAGEMENT_CONTEXT.md (optional, will create if not provided)

**Outputs**:
- `[CLIENT]_Strategy_Workshop_Deck.html` - Facilitation deck with pre-populated hypotheses
- Updated `ENGAGEMENT_CONTEXT.md` with strategic themes and alignment

**Trigger Phrases**:
- "Generate strategy workshop deck for [Client]"
- "Start Ignite engagement for [Client]"
- "Analyze these strategy documents"

---

### Agent 2: Member/Customer Experience Workshop

**Purpose**: Generate facilitation materials for Member/Customer Experience Workshop

**Inputs**:
- Persona documents
- Customer journey maps
- Digital experience assessments
- ENGAGEMENT_CONTEXT.md (recommended)

**Outputs**:
- `[CLIENT]_Member_Experience_Workshop_Deck.html`
- Updated `ENGAGEMENT_CONTEXT.md` with personas and journey priorities

**Trigger Phrases**:
- "Generate member experience workshop deck"
- "Create customer experience facilitation materials"
- "Prepare for CX workshop"

---

### Agent 3: Employee Experience Workshop

**Purpose**: Generate facilitation materials for Employee Experience Workshop

**Inputs**:
- Employee role descriptions
- Current tools/systems list
- Process documentation
- ENGAGEMENT_CONTEXT.md (recommended)

**Outputs**:
- `[CLIENT]_Employee_Experience_Workshop_Deck.html`
- Updated `ENGAGEMENT_CONTEXT.md` with employee personas and pain points

**Trigger Phrases**:
- "Generate employee experience workshop deck"
- "Create employee enablement facilitation materials"
- "Prepare for EX workshop"

---

### Agent 4: IT Architecture Workshop

**Purpose**: Generate facilitation materials for IT Architecture Workshop

**Inputs**:
- Current architecture diagrams
- Technology landscape inventory
- Integration documentation
- ENGAGEMENT_CONTEXT.md (recommended)

**Outputs**:
- `[CLIENT]_IT_Architecture_Workshop_Deck.html`
- Updated `ENGAGEMENT_CONTEXT.md` with architecture decisions

**Trigger Phrases**:
- "Generate IT architecture workshop deck"
- "Create architecture assessment materials"
- "Prepare for technology workshop"

---

### Agent 5: Use Case Design + Prototypes

**Purpose**: Create detailed use case documents and interactive prototypes

**Inputs**:
- Workshop transcripts (all 4 workshops)
- ENGAGEMENT_CONTEXT.md (required for best results)
- Prioritization decisions

**Outputs**:
- `[CLIENT]_Member_Use_Case_Design.docx` - Detailed use case specifications
- `[CLIENT]_Employee_Use_Case_Design.docx` - Employee use case specifications
- `prototypes/UC-XXX-[name].html` - Interactive prototype for each use case
- Updated `ENGAGEMENT_CONTEXT.md` with use case details

**Trigger Phrases**:
- "Create use case design documents"
- "Generate use case documents and prototypes"
- "Build prototypes for the prioritized use cases"

---

### Agent 6: Ignite Day Presentation

**Purpose**: Compile final client-facing Ignite Day presentation

**Inputs**:
- ENGAGEMENT_CONTEXT.md (required)
- All prior agent outputs
- Backbase pricing/licensing (optional)

**Outputs**:
- `[CLIENT]_Ignite_Day_Presentation.pptx` or `.html`
- Executive summary document

**Trigger Phrases**:
- "Create Ignite Day presentation"
- "Compile final presentation"
- "Generate the Ignite deck"

---

## The Engagement Context File

The `ENGAGEMENT_CONTEXT.md` file is the **connector** between all agents. It carries:

1. **Client Profile**: Name, type, size, terminology
2. **Strategic Context**: Vision, themes, Backbase alignment
3. **Member/Customer Experience**: Personas, journeys, pain points
4. **Employee Experience**: Roles, tools, productivity gaps
5. **IT Architecture**: Systems, decisions, constraints
6. **Use Cases**: Prioritized list with details
7. **ROI Summary**: Investment, benefits, metrics
8. **Engagement Log**: Timeline of agent interactions

### Context File Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTEXT FILE FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Start] ──▶ Agent 1 ──▶ Context v1 ──▶ Agent 2 ──▶ Context v2 ──▶ ...     │
│                                                                              │
│  Each agent:                                                                 │
│  1. READS the current context file                                          │
│  2. USES information from prior agents                                       │
│  3. GENERATES its deliverables                                              │
│  4. UPDATES the context file with new information                           │
│  5. OUTPUTS both deliverable AND updated context                            │
│                                                                              │
│  User responsibility:                                                        │
│  • Download updated context after each agent                                │
│  • Upload to next agent along with other inputs                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Terminology Rules

| Client Type | Use | Never Use |
|-------------|-----|-----------|
| Credit Union | Member | Customer |
| Credit Union | Membership | Account holders |
| Bank | Customer | Member |
| Any | [Client Name] | "the bank" generically |

All agents automatically apply correct terminology based on client type in the context file.

---

## File Structure

```
Ignite Inspire/
├── README.md                              # This file
├── CONSULTANT_GUIDE.md                    # Complete implementation guide
├── QUICK_REFERENCE.md                     # One-page cheat sheet
├── ENGAGEMENT_CONTEXT_TEMPLATE.md         # Blank template for new engagements
├── CONVERSATION_STARTERS.md               # Trigger phrases for each agent
├── design-system.md                       # Backbase brand rules for HTML output
├── brand-assets/                          # Logos and visual assets
│
├── agent-0-engagement-plan.md             # Engagement Plan agent instructions
├── agent-1-strategy.md                    # Strategy Workshop agent instructions
├── agent-2-member.md                      # Member Experience agent instructions
├── agent-3-employee.md                    # Employee Experience agent instructions
├── agent-4-architecture.md                # IT Architecture agent instructions
├── agent-5-usecase.md                     # Use Case Design agent instructions
├── agent-6-presentation.md                # Ignite Presentation agent instructions
│
├── engagement-plan-template.html          # Template for Agent 0
├── strategy-workshop-template.html        # Template for Agent 1
├── member-experience-template.html        # Template for Agent 2
├── employee-experience-template.html      # Template for Agent 3
├── architecture-workshop-template.html    # Template for Agent 4
├── usecase-template.html                  # Template for Agent 5
├── ignite-day-template.html               # Template for Agent 6
│
├── example-member-experience-deck.html    # Example output: Agent 2
├── example-employee-experience-deck.html  # Example output: Agent 3
├── example-architecture-workshop-deck.html# Example output: Agent 4
├── example-member-usecase-deck.html       # Example output: Agent 5 (member)
├── example-employee-usecase-deck.html     # Example output: Agent 5 (employee)
└── example-ignite-day-deck.html           # Example output: Agent 6
```

---

## Best Practices

### 1. Always Use the Context File
Even for standalone agent usage, the context file improves output quality significantly.

### 2. Download Updated Context After Each Agent
Agents add valuable information. Don't lose it between sessions.

### 3. Provide Rich Inputs
The more client documents you provide, the better the hypotheses and outputs.

### 4. Review and Refine
Agent outputs are starting points. Always review and customize for your client.

### 5. Keep Client Documents Organized
Create a folder structure per engagement:
```
[CLIENT]_Ignite/
├── 01_Inputs/
│   ├── strategy_docs/
│   ├── personas/
│   ├── architecture/
│   └── questionnaire/
├── 02_Workshop_Decks/
├── 03_Transcripts/
├── 04_Use_Cases/
├── 05_Prototypes/
├── 06_Business_Case/
├── 07_Final_Presentation/
└── ENGAGEMENT_CONTEXT.md
```

---

## Troubleshooting

### Agent doesn't recognize client type
Ensure ENGAGEMENT_CONTEXT.md clearly states "Bank" or "Credit Union" in the Client Type field.

### Outputs are too generic
Provide more client-specific documents. The agents learn from what you give them.

### Context not carrying forward
Make sure you're uploading the UPDATED context file from the previous agent, not the original template.

### Missing sections in output
Check that you've provided all required inputs for that agent. Review the agent's input requirements.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01 | Initial release with 8 agents (0-7) |
| 1.1 | 2026-02 | Removed Agent 7 (ROI) — handled by separate ROI Business Case Builder agent. Now 7 agents (0-6). |

---

## Support

For questions or improvements, contact the Backbase Value Consulting team.

---

*End of README*
