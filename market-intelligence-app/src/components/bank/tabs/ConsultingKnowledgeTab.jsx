import { useState, useEffect, useMemo } from 'react';
import { fetchDomainKnowledge, fetchPlaybookBenchmarks } from '../../../data/api';

// ─── Zone → domain mapping (mirrors server-side logic) ───
const ZONE_KEYWORDS = {
  retail: 'retail', 'personal banking': 'retail', 'digital banking': 'retail',
  consumer: 'retail', onboarding: 'retail', origination: 'retail',
  sme: 'sme', 'small business': 'sme', 'business banking': 'sme',
  wealth: 'wealth', 'private banking': 'wealth', 'asset management': 'wealth',
  commercial: 'commercial', 'e-commerce': 'commercial', merchant: 'commercial',
  corporate: 'corporate', 'large corporate': 'corporate',
  investing: 'investing',
};

function mapZonesToDomains(zones) {
  if (!zones?.length) return ['retail'];
  const domains = new Set();
  for (const z of zones) {
    const zl = (z.zone || '').toLowerCase();
    for (const [kw, domain] of Object.entries(ZONE_KEYWORDS)) {
      if (zl.includes(kw)) domains.add(domain);
    }
  }
  return domains.size > 0 ? [...domains] : ['retail'];
}

// ─── Markdown section parser ───
function parseSections(md) {
  if (!md) return [];
  const sections = [];
  const lines = md.split('\n');
  let current = null;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      current = { title: line.replace(/^##\s+/, ''), content: '' };
    } else if (current) {
      current.content += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections;
}

// ─── Simple markdown table → structured data ───
function parseTable(md) {
  const lines = md.split('\n').filter(l => l.includes('|') && !l.match(/^\|[-\s|]+\|$/));
  if (lines.length < 2) return null;
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines.slice(1).map(l => {
    const cols = l.split('|').map(c => c.trim()).filter(Boolean);
    const row = {};
    headers.forEach((h, i) => row[h] = cols[i] || '');
    return row;
  }).filter(r => Object.values(r).some(v => v));
  return { headers, rows };
}

// ─── Sub-components ───

function SectionCard({ title, children, icon, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left transition-colors">
        <span className="text-sm">{icon}</span>
        <span className="text-[11px] font-semibold text-gray-800 flex-1">{title}</span>
        <span className="text-gray-400 text-xs">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-3 py-2 text-[11px] text-gray-700 leading-relaxed">{children}</div>}
    </div>
  );
}

function BenchmarksTable({ data }) {
  if (!data) return <p className="text-gray-400 italic">No benchmarks data</p>;
  const sections = parseSections(data);
  return (
    <div className="space-y-3">
      {sections.map((s, i) => {
        const table = parseTable(s.content);
        return (
          <div key={i}>
            <h4 className="text-[11px] font-semibold text-gray-600 mb-1">{s.title}</h4>
            {table ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-blue-50">
                      {table.headers.map((h, j) => (
                        <th key={j} className="px-2 py-1 text-left font-semibold text-blue-800 border-b border-blue-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((r, j) => (
                      <tr key={j} className={j % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {table.headers.map((h, k) => (
                          <td key={k} className="px-2 py-1 border-b border-gray-100">{r[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 whitespace-pre-wrap">{s.content.trim()}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PainPointsList({ data }) {
  if (!data) return <p className="text-gray-400 italic">No pain points data</p>;
  const sections = parseSections(data);
  return (
    <div className="space-y-2">
      {sections.map((s, i) => {
        const table = parseTable(s.content);
        const painPoints = table?.rows?.filter(r => r['Pain Point']) || [];
        return painPoints.length > 0 ? (
          <div key={i}>
            <h4 className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">{s.title}</h4>
            <div className="space-y-1">
              {painPoints.map((p, j) => (
                <div key={j} className="flex items-start gap-2 text-[11px]">
                  <span className="text-red-400 mt-0.5">•</span>
                  <div>
                    <span className="font-medium text-gray-800">{p['Pain Point']}</span>
                    {p['Impact'] && <span className="text-gray-500 ml-1">— {p['Impact']}</span>}
                    {p['Backbase Solution'] && (
                      <span className="text-blue-600 ml-1 text-[10px]">→ {p['Backbase Solution']}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })}
    </div>
  );
}

function ValuePropsList({ data }) {
  if (!data) return null;
  const sections = parseSections(data);
  return (
    <div className="space-y-2">
      {sections.filter(s => s.title && !s.title.includes('Value Propositions')).map((s, i) => (
        <div key={i} className="p-2 bg-blue-50/50 border border-blue-100 rounded">
          <h4 className="text-[11px] font-semibold text-blue-800">{s.title}</h4>
          {s.content.split('\n').filter(l => l.trim()).slice(0, 5).map((line, j) => (
            <p key={j} className="text-[10px] text-blue-700/80 mt-0.5">
              {line.replace(/^\*\*|\*\*$/g, '').replace(/^[-*]\s*/, '')}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

function CapabilityTaxonomyView({ data }) {
  if (!data) return <p className="text-gray-400 italic">No capability taxonomy for this domain</p>;
  const sections = parseSections(data);
  // Show maturity scale + first few capability sections
  const maturitySection = sections.find(s => s.title.includes('Maturity') || s.title.includes('Scale'));
  const capabilitySections = sections.filter(s =>
    !s.title.includes('Maturity') && !s.title.includes('Scale') && !s.title.includes('Overview') &&
    !s.title.includes('Layer') && !s.title.includes('Scoring')
  ).slice(0, 8);

  return (
    <div className="space-y-2">
      {maturitySection && (
        <div className="mb-2">
          <h4 className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">Maturity Scale</h4>
          {(() => {
            const table = parseTable(maturitySection.content);
            if (!table) return null;
            return (
              <div className="flex gap-1 flex-wrap">
                {table.rows.map((r, i) => (
                  <div key={i} className="px-2 py-1 rounded text-[9px] font-medium"
                    style={{ backgroundColor: r['Hex'] ? `${r['Hex']}20` : '#f3f4f6', color: r['Hex'] || '#374151' }}>
                    <span className="font-bold">{r['Level']}</span> {r['Label']}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
      {capabilitySections.map((s, i) => (
        <div key={i} className="text-[10px]">
          <span className="font-semibold text-purple-800">{s.title}</span>
          <p className="text-gray-500 line-clamp-2">{s.content.trim().split('\n')[0]}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───

export default function ConsultingKnowledgeTab({ bankData }) {
  const [domainData, setDomainData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState(null);
  const [activeView, setActiveView] = useState('benchmarks');

  const domains = useMemo(() =>
    mapZonesToDomains(bankData?.backbase_landing_zones),
    [bankData?.backbase_landing_zones]
  );

  useEffect(() => {
    setActiveDomain(domains[0]);
  }, [domains]);

  useEffect(() => {
    if (!activeDomain) return;
    if (domainData[activeDomain]) { setLoading(false); return; }

    setLoading(true);
    fetchDomainKnowledge(activeDomain)
      .then(data => {
        setDomainData(prev => ({ ...prev, [activeDomain]: data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeDomain]);

  const currentData = domainData[activeDomain] || {};

  const views = [
    { key: 'benchmarks', label: 'Benchmarks', icon: '📊' },
    { key: 'pain_points', label: 'Pain Points', icon: '🔴' },
    { key: 'value_propositions', label: 'Value Props', icon: '💎' },
    { key: 'use_cases', label: 'Use Cases', icon: '📋' },
    { key: 'capability', label: 'Capability Maturity', icon: '🎯' },
    { key: 'personas', label: 'Personas', icon: '👤' },
    { key: 'journeys', label: 'Journeys', icon: '🗺️' },
  ];

  return (
    <div>
      {/* Domain selector */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mr-1">Domain:</span>
        {domains.map(d => (
          <button key={d} onClick={() => setActiveDomain(d)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
              activeDomain === d
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* View selector */}
      <div className="flex gap-1 mb-3 flex-wrap border-b border-gray-200 pb-2">
        {views.map(v => (
          <button key={v.key} onClick={() => setActiveView(v.key)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              activeView === v.key
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            <span>{v.icon}</span> {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-300 border-t-indigo-600" />
          <span className="ml-2 text-[11px] text-gray-500">Loading {activeDomain} knowledge...</span>
        </div>
      ) : (
        <div>
          {activeView === 'benchmarks' && (
            <SectionCard title={`${activeDomain?.charAt(0).toUpperCase()}${activeDomain?.slice(1)} Banking Benchmarks`} icon="📊" defaultOpen>
              <BenchmarksTable data={currentData.benchmarks} />
            </SectionCard>
          )}

          {activeView === 'pain_points' && (
            <SectionCard title="Common Pain Points" icon="🔴" defaultOpen>
              <PainPointsList data={currentData.pain_points} />
            </SectionCard>
          )}

          {activeView === 'value_propositions' && (
            <SectionCard title="Backbase Value Propositions" icon="💎" defaultOpen>
              <ValuePropsList data={currentData.value_propositions} />
            </SectionCard>
          )}

          {activeView === 'use_cases' && (
            <SectionCard title="Use Cases" icon="📋" defaultOpen>
              <BenchmarksTable data={currentData.use_cases} />
            </SectionCard>
          )}

          {activeView === 'capability' && (
            <SectionCard title="Capability Maturity Framework" icon="🎯" defaultOpen>
              <CapabilityTaxonomyView data={currentData._capability_taxonomy} />
            </SectionCard>
          )}

          {activeView === 'personas' && (
            <SectionCard title="Target Personas" icon="👤" defaultOpen>
              <BenchmarksTable data={currentData.personas} />
            </SectionCard>
          )}

          {activeView === 'journeys' && (
            <SectionCard title="Customer Journeys" icon="🗺️" defaultOpen>
              <BenchmarksTable data={currentData.journey_maps} />
            </SectionCard>
          )}

          {/* ROI levers if available */}
          {currentData.roi_levers && (
            <SectionCard title="ROI Levers (Domain-Specific)" icon="💰">
              <BenchmarksTable data={currentData.roi_levers} />
            </SectionCard>
          )}
        </div>
      )}

      {/* Source attribution */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-[9px] text-gray-400">
          Source: knowledge/domains/{activeDomain}/ • Consulting Playbook benchmarks from 15+ bank engagements
        </p>
      </div>
    </div>
  );
}
