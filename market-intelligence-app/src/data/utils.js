import { MARKETS_META, MARKET_DATA } from './markets';
import { COUNTRY_DATA } from './countries';
import { BANK_DATA } from './banks';
import { QUAL_FRAMEWORK, QUAL_DATA } from './qualification';
import { CX_DATA } from './cx';
import { COMP_DATA } from './competition';
import { VALUE_SELLING } from './valueSelling';
import { SOURCES } from './sources';
import { GROUP_RELATIONSHIPS } from './relationships';

// Re-export everything for convenience
export { MARKETS_META, MARKET_DATA, COUNTRY_DATA, BANK_DATA, QUAL_FRAMEWORK, QUAL_DATA, CX_DATA, COMP_DATA, VALUE_SELLING, SOURCES, GROUP_RELATIONSHIPS };

// Calculate weighted qualification score for a bank key
export function calcScore(bankKey) {
  const qd = QUAL_DATA[bankKey];
  if (!qd) return 0;
  const fw = QUAL_FRAMEWORK.dimensions;
  let w = 0;
  Object.keys(fw).forEach(dim => {
    if (qd[dim]) w += qd[dim].score * fw[dim].weight;
  });
  if (qd.power_map?.activated) w += 1.0;
  if (qd.partner_access?.backbase_access) w += 0.5;
  return Math.round(Math.min(w, 10) * 10) / 10;
}

// Get score color
export function scoreColor(score) {
  if (score >= 8) return '#3366FF';
  if (score >= 6) return '#1F3D99';
  if (score >= 4) return '#F57F17';
  return '#FF7262';
}

// Get score background color
export function scoreBg(score) {
  if (score >= 8) return '#EBF0FF';
  if (score >= 6) return '#F0F4FA';
  if (score >= 4) return '#FFF8E1';
  return '#FFF0EE';
}

// Get score label
export function scoreLabel(score) {
  if (score >= 8) return 'Strong Fit';
  if (score >= 6) return 'Good Fit';
  if (score >= 4) return 'Moderate Fit';
  return 'Low Fit';
}

// Get data confidence level for a bank key
export function dataConfidence(bankKey) {
  const origBanks = ['Nordea_Sweden','SEB_Sweden','DNB_Norway','Handelsbanken_Sweden','Swedbank_Sweden','Danske Bank_Denmark','OP Financial Group_Finland','TF Bank_Sweden'];
  const bd = BANK_DATA[bankKey];
  const hasFullOp = bd?.operational_profile?.employees_breakdown || bd?.operational_profile?.tech_stack;
  if (origBanks.includes(bankKey)) return { level: 'deep', label: 'Deep', color: '#2E7D32', bg: '#E8F5E9' };
  if (hasFullOp) return { level: 'standard', label: 'Standard', color: '#F57F17', bg: '#FFF8E1' };
  return { level: 'preliminary', label: 'Preliminary', color: '#FF7262', bg: '#FFF0EE' };
}

// Get market key for a country name
export function getMarketForCountry(countryName) {
  return Object.entries(MARKETS_META).find(([k, m]) => m.countries.includes(countryName))?.[0] || null;
}

// Get all banks for a given country
export function getBanksForCountry(countryName) {
  const cd = COUNTRY_DATA[countryName];
  if (!cd?.top_banks) return [];
  return cd.top_banks.map(b => {
    const key = `${b.name}_${countryName}`;
    const score = calcScore(key);
    const bd = BANK_DATA[key];
    const q = bd?.backbase_qualification;
    return { ...b, key, score, bankData: bd, qualification: q };
  }).sort((a, b) => b.score - a.score);
}

// Get all banks for a market
export function getBanksForMarket(marketKey) {
  const meta = MARKETS_META[marketKey];
  if (!meta) return [];
  const banks = [];
  meta.countries.forEach(country => {
    getBanksForCountry(country).forEach(b => banks.push({ ...b, country }));
  });
  return banks.sort((a, b) => b.score - a.score);
}

// Get total stats
export function getTotalStats() {
  const totalBanks = Object.keys(BANK_DATA).length;
  const totalCountries = Object.keys(COUNTRY_DATA).length;
  const totalMarkets = Object.keys(MARKET_DATA).length;
  const scores = Object.keys(QUAL_DATA).map(k => calcScore(k));
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10
    : 0;
  return { totalBanks, totalCountries, totalMarkets, avgScore };
}

// Build search index — deep indexes all intelligence fields
export function buildSearchIndex() {
  const items = [];

  // Markets
  Object.entries(MARKETS_META).forEach(([key, m]) => {
    if (m.hasData) {
      items.push({ type: 'market', name: m.name, meta: `${m.countries.length} countries`, key, keywords: (m.name + ' ' + m.countries.join(' ')).toLowerCase() });
    }
  });

  // Countries
  Object.entries(COUNTRY_DATA).forEach(([name, d]) => {
    const marketKey = getMarketForCountry(name);
    items.push({ type: 'country', name, meta: d.tagline || '', marketKey, keywords: (name + ' ' + (d.tagline || '') + ' ' + (d.banking_sector || '')).toLowerCase() });
  });

  // Banks — deep index all data fields
  Object.entries(BANK_DATA).forEach(([key, d]) => {
    const bankName = d.bank_name;
    const country = d.country;
    const score = calcScore(key);
    const q = d.backbase_qualification;
    const comp = COMP_DATA[key];
    const vs = VALUE_SELLING[key];
    const qd = QUAL_DATA[key];

    // Build rich keyword string
    const kw = [
      bankName, country,
      d.overview || '',
      d.tagline || '',
      d.digital_strategy || '',
      d.strategic_initiatives || '',
      d.recommended_approach || '',
      // Pain points
      ...(d.pain_points || []).map(p => p.title + ' ' + p.detail),
      // Signals
      ...(d.signals || []).map(s => s.signal + ' ' + s.implication),
      // Landing zones
      ...(d.backbase_landing_zones || []).map(lz => lz.zone + ' ' + lz.rationale + ' ' + (lz.entry_strategy || '')),
      // Engagement zones
      ...(q?.engagement_banking_zones || []).map(z => z.zone + ' ' + z.detail),
      // People
      ...(d.key_decision_makers || []).map(k => k.name + ' ' + k.role + ' ' + (k.note || '')),
      // Points of interest
      ...(d.points_of_interest || []).map(p => p.title + ' ' + p.insight),
      // Competition / vendors
      comp?.core_banking || '', comp?.digital_platform || '',
      ...(comp?.key_vendors || []),
      comp?.vendor_risk || '',
      // Value selling
      vs?.value_hypothesis?.one_liner || '',
      // Qual notes
      ...(qd ? Object.values(qd).filter(v => v?.note).map(v => v.note) : []),
      // Deal info
      q?.deal_size || '', q?.timing || '', q?.risk || '',
    ];

    items.push({
      type: 'bank', name: bankName, meta: country + (q?.deal_size ? ' • ' + q.deal_size : ''),
      key, score,
      keywords: kw.join(' ').toLowerCase()
    });

    // Decision makers
    if (d.key_decision_makers) {
      d.key_decision_makers.forEach(dm => {
        if (dm.name && !dm.name.startsWith('(')) {
          items.push({
            type: 'person', name: dm.name, meta: bankName + ' — ' + dm.role,
            bankKey: key, keywords: (dm.name + ' ' + dm.role + ' ' + bankName + ' ' + (dm.note || '')).toLowerCase()
          });
        }
      });
    }
  });

  return items;
}

// Format a bank key into parts
export function parseBankKey(key) {
  const bd = BANK_DATA[key];
  if (bd) {
    const bankName = bd.bank_name;
    const country = key.slice(bankName.length + 1);
    return { bankName, country };
  }
  const parts = key.split('_');
  return { bankName: parts[0], country: parts.slice(1).join('_') };
}
