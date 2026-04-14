/**
 * Intelligence Layer Constants
 * ─────────────────────────────
 * Signal Catalogue, Play Types, and Output Types for Nova's Intelligence Layer.
 * Used by both frontend (display) and referenced by backend (routing logic).
 */

// ── Signal Catalogue ──────────────────────────────────────────

export const SIGNAL_CATALOGUE = {
  stakeholder: {
    label: 'Stakeholder',
    icon: '👤',
    color: '#3B82F6',
    events: {
      StakeholderRoleChanged: 'Person changed title/role at the bank',
      StakeholderDeparted: 'Person left the bank',
      NewStakeholderIdentified: 'New relevant person discovered',
      StakeholderPublishedContent: 'Stakeholder posted on LinkedIn or spoke at conference',
      StakeholderConnectionMade: 'Stakeholder connected with competitor rep',
    },
    routes_to: ['discovery'],
  },
  strategic: {
    label: 'Strategic',
    icon: '📊',
    color: '#7C3AED',
    events: {
      AnnualReportPublished: 'Bank published new annual report',
      EarningsCallTranscript: 'New earnings call data available',
      StrategyDocumentDetected: 'Bank published strategy update',
      BoardChangeAnnounced: 'New CEO, CTO, CDO, etc.',
      MergerOrAcquisition: 'Bank involved in M&A',
      RegulatoryAction: 'Regulator action affecting the bank',
    },
    routes_to: ['discovery', 'competitive'],
  },
  competitive: {
    label: 'Competitive',
    icon: '⚔️',
    color: '#EF4444',
    events: {
      CompetitorWinAnnounced: 'Competitor won a deal at a peer bank',
      CompetitorProductLaunch: 'Competitor launched new capability',
      CompetitorPricingChange: 'Competitor changed pricing model',
      BankEvaluatingAlternatives: 'Bank is looking at competitors',
      CompetitorPartnershipFormed: 'Competitor formed relevant partnership',
    },
    routes_to: ['competitive'],
  },
  momentum: {
    label: 'Momentum',
    icon: '📈',
    color: '#10B981',
    events: {
      MeetingCompleted: 'Meeting happened, transcript available',
      MeetingScheduled: 'Upcoming meeting detected',
      MeetingCancelled: 'Meeting cancelled (risk signal)',
      EmailResponseReceived: 'Bank stakeholder responded',
      SilencePeriodExceeded: 'No contact for extended period',
      ChampionEngagementDrop: "Champion's response rate declining",
      MultiThreadDetected: 'Multiple stakeholders engaging (positive)',
    },
    routes_to: ['discovery', 'value', 'competitive', 'proposal', 'expansion'],
  },
  market: {
    label: 'Market',
    icon: '🌍',
    color: '#F59E0B',
    events: {
      PeerBankDealClosed: 'Backbase closed a deal at a peer bank',
      IndustryReportPublished: 'Relevant analyst report published',
      RegulatoryChangeAnnounced: "New regulation affecting bank's market",
      MarketEventRelevant: 'Interest rate change, fintech disruption, etc.',
    },
    routes_to: ['value', 'competitive'],
  },
  internal: {
    label: 'Internal',
    icon: '🏢',
    color: '#6B7280',
    events: {
      NewCaseStudyAvailable: 'New Backbase case study relevant to deal',
      ProductUpdateRelevant: "Backbase released feature relevant to deal's needs",
      SubjectMatterExpertAvailable: 'Internal expert freed up who knows this bank/market',
      PlaybookBenchmarkUpdated: 'Playbook got new benchmark data',
    },
    routes_to: ['value', 'proposal'],
  },
};

// ── Play Types ────────────────────────────────────────────────

export const PLAY_TYPES = {
  discovery: {
    label: 'Discovery Play',
    icon: '🔍',
    color: '#3B82F6',
    description: 'Map stakeholder priorities, identify knowledge gaps, generate targeted discovery questions',
    expected_outputs: ['discovery_guide', 'stakeholder_brief'],
  },
  value: {
    label: 'Value Play',
    icon: '💰',
    color: '#10B981',
    description: 'Build business case with benchmarks, stakeholder-specific value narratives, peer evidence',
    expected_outputs: ['value_framework', 'talking_points'],
  },
  competitive: {
    label: 'Competitive Play',
    icon: '⚔️',
    color: '#EF4444',
    description: 'Deal-specific competitive positioning, objection mapping, differentiation talking points',
    expected_outputs: ['competitive_brief', 'objection_map', 'talking_points'],
  },
  proposal: {
    label: 'Proposal Play',
    icon: '📋',
    color: '#7C3AED',
    description: 'Synthesize deal narrative into proposal structure, executive summary, risk register',
    expected_outputs: ['proposal_narrative', 'deck_section'],
  },
  expansion: {
    label: 'Expansion Play',
    icon: '📈',
    color: '#F59E0B',
    description: 'Map current footprint vs. expansion opportunities, upsell business case',
    expected_outputs: ['value_framework', 'stakeholder_brief'],
  },
};

// ── Output Types ──────────────────────────────────────────────

export const OUTPUT_TYPES = {
  talking_points: { label: 'Talking Points', icon: '💬', description: 'Concise, stakeholder-targeted conversation points' },
  discovery_guide: { label: 'Discovery Guide', icon: '🔍', description: 'Structured question sets per stakeholder' },
  value_framework: { label: 'Value Framework', icon: '💰', description: 'Business case with metrics and benchmarks' },
  competitive_brief: { label: 'Competitive Brief', icon: '⚔️', description: 'Deal-specific competitive positioning' },
  proposal_narrative: { label: 'Proposal Narrative', icon: '📋', description: 'Story arc for the proposal' },
  email_draft: { label: 'Email Draft', icon: '📧', description: 'Ready-to-send email for a stakeholder' },
  objection_map: { label: 'Objection Map', icon: '🛡️', description: 'Anticipated objections with responses' },
  stakeholder_brief: { label: 'Stakeholder Brief', icon: '👤', description: 'Per-person priorities and approach' },
  deck_section: { label: 'Deck Section', icon: '📊', description: 'Presentation content for a specific section' },
};

// ── Severity Levels ───────────────────────────────────────────

export const SIGNAL_SEVERITY = {
  info: { label: 'Info', color: '#6B7280', bg: 'bg-gray-100 dark:bg-gray-800' },
  attention: { label: 'Attention', color: '#F59E0B', bg: 'bg-amber-100 dark:bg-amber-900/20' },
  urgent: { label: 'Urgent', color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/20' },
};

// ── Helper: Get play types a signal category routes to ────────

export function getSignalRouting(signalCategory) {
  return SIGNAL_CATALOGUE[signalCategory]?.routes_to || [];
}

// ── Helper: Get all events for a category ─────────────────────

export function getSignalEvents(signalCategory) {
  return SIGNAL_CATALOGUE[signalCategory]?.events || {};
}
