import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Edit3, AlertTriangle, Loader, CheckCircle } from 'lucide-react';
import { generateAccountPlanDoc as apiGenerateAccountPlan, getCachedAccountPlan } from '../data/api';
import { BANK_DATA, QUAL_DATA, calcScore } from '../data/utils';

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function ConfidenceBadge({ level }) {
  if (!level) return null;
  const config = {
    high: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', label: 'High confidence' },
    medium: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', label: 'Medium confidence' },
    low: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', label: 'Low — verify before presenting' },
  };
  const c = config[level] || config.medium;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold ${c.bg} ${c.text}`}>
      {level === 'low' && <AlertTriangle size={8} />} {c.label}
    </span>
  );
}

function NeedsInput({ label }) {
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">[NEEDS INPUT] {label}</span>;
}

/* ConfigForm removed — auto-generates on page load with defaults from bank data */
function _unused() {
  const score = calcScore(bankKey);
  const defaultIcp = score >= 8 ? 'GOLD' : score >= 6 ? 'SILVER' : 'BRONZE';
  const dealSize = bankData?.backbase_qualification?.deal_size || '';

  const [form, setForm] = useState({
    aeOwner: '', closeDate: '', arrEstimate: dealSize, lastContact: new Date().toISOString().slice(0, 10),
    icpRating: defaultIcp,
    teamMembers: { ae: '', se: '', vc: 'Oumaima Aurag', marketing: '', partner: '', cs: '' },
    confirmedActivities: [],
  });
  const [activityName, setActivityName] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [activityStatus, setActivityStatus] = useState('confirmed');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setTeam = (k, v) => setForm(prev => ({ ...prev, teamMembers: { ...prev.teamMembers, [k]: v } }));

  const addActivity = () => {
    if (!activityName || !activityDate) return;
    set('confirmedActivities', [...form.confirmedActivities, { activity: activityName, date: activityDate, status: activityStatus }]);
    setActivityName(''); setActivityDate('');
  };

  const removeActivity = (i) => set('confirmedActivities', form.confirmedActivities.filter((_, idx) => idx !== i));

  const Input = ({ label, value, onChange, type = 'text', readOnly = false }) => (
    <div>
      <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} readOnly={readOnly}
        className={`w-full text-xs border border-border rounded-lg px-3 py-2 text-fg focus:border-primary outline-none ${readOnly ? 'bg-surface-2 text-fg-muted' : 'bg-surface'}`} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-black text-fg mb-1">Generate Account Plan</h2>
      <p className="text-xs text-fg-muted mb-5">{bankData?.bank_name} — {bankData?.country}</p>

      <div className="space-y-4">
        {/* Account info */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Account Name" value={bankData?.bank_name || ''} readOnly />
          <Input label="Country" value={bankData?.country || ''} readOnly />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">ICP Rating</label>
            <select value={form.icpRating} onChange={e => set('icpRating', e.target.value)}
              className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg focus:border-primary outline-none">
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
              <option value="BRONZE">BRONZE</option>
            </select>
          </div>
          <Input label="ARR Estimate" value={form.arrEstimate} onChange={v => set('arrEstimate', v)} />
          <Input label="Close Date" value={form.closeDate} onChange={v => set('closeDate', v)} type="date" />
        </div>
        <Input label="Last Contact Date" value={form.lastContact} onChange={v => set('lastContact', v)} type="date" />

        {/* Team */}
        <div>
          <div className="text-[9px] font-bold text-fg-muted uppercase mb-2">Account Team</div>
          <div className="grid grid-cols-2 gap-2">
            {[['ae', 'Account Executive'], ['se', 'Solution Engineer'], ['vc', 'Value Consultant'], ['marketing', 'Field Marketeer'], ['partner', 'Partner Manager'], ['cs', 'CS Lead']].map(([k, label]) => (
              <Input key={k} label={label} value={form.teamMembers[k]} onChange={v => setTeam(k, v)} />
            ))}
          </div>
        </div>

        {/* Confirmed activities */}
        <div>
          <div className="text-[9px] font-bold text-fg-muted uppercase mb-2">Confirmed Activities</div>
          {form.confirmedActivities.length > 0 && (
            <div className="space-y-1 mb-2">
              {form.confirmedActivities.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-surface-2 rounded px-2 py-1">
                  <span className={`w-2 h-2 rounded-full ${a.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="flex-1">{a.activity} — {a.date}</span>
                  <button onClick={() => removeActivity(i)} className="text-fg-disabled hover:text-red-500 text-[10px]">remove</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={activityName} onChange={e => setActivityName(e.target.value)} placeholder="Activity name"
              className="flex-1 text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-fg placeholder:text-fg-disabled outline-none" />
            <input type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)}
              className="text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-fg outline-none" />
            <select value={activityStatus} onChange={e => setActivityStatus(e.target.value)}
              className="text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-fg outline-none">
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
            </select>
            <button onClick={addActivity} className="px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs font-bold text-fg hover:bg-surface-3">Add</button>
          </div>
        </div>

        <button onClick={() => onGenerate(form)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#091C35] text-white rounded-xl text-sm font-bold hover:bg-[#091C35]/90 transition-colors mt-4">
          <FileSpreadsheet size={16} /> Generate Account Plan
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STATE B: Rendered Plan — Slides
   ═══════════════════════════════════════════════ */

function Slide({ children, className = '' }) {
  return <div className={`slide bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6 ${className}`}>{children}</div>;
}

function SlideHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <div className="h-1 w-16 bg-[#3366FF] rounded mb-3" />
      <h3 className="text-lg font-black text-[#091C35]">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function CoverSlide({ bankName, pov }) {
  return (
    <Slide className="bg-[#091C35] text-white min-h-[300px] flex flex-col justify-center items-center text-center">
      <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#3366FF] mb-4">Backbase Account Plan</div>
      <h1 className="text-3xl font-black mb-3">{bankName}</h1>
      {pov && <p className="text-sm text-white/70 max-w-lg leading-relaxed">{pov}</p>}
      <div className="mt-8 text-[9px] text-white/40">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
    </Slide>
  );
}

function AccountOverviewSlide({ bankName, country, team, lastUpdated }) {
  return (
    <Slide>
      <SlideHeader title="Account Overview" />
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Account Information</div>
          <table className="w-full text-xs">
            <tbody>
              {[['Account', bankName], ['Country', country], ['Last Updated', lastUpdated]].map(([k, v]) => (
                <tr key={k} className="border-b border-gray-100"><td className="py-2 font-bold text-gray-600 w-28">{k}</td><td className="py-2 text-gray-900">{v || <NeedsInput label={k} />}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Account Team</div>
          <table className="w-full text-xs">
            <tbody>
              {[['Account Executive', team?.ae], ['Solution Engineer', team?.se], ['Value Consultant', team?.vc], ['Field Marketeer', team?.marketing], ['Partner Manager', team?.partner], ['CS Lead', team?.cs]].map(([role, name]) => (
                <tr key={role} className="border-b border-gray-100"><td className="py-2 font-bold text-gray-600 w-36">{role}</td><td className="py-2 text-gray-900">{name || <NeedsInput label={role} />}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Slide>
  );
}

function AccountSnapshotSlide({ plan, inputs }) {
  const s = plan.account_snapshot || {};
  const icpColors = { GOLD: 'bg-amber-400 text-white', SILVER: 'bg-gray-400 text-white', BRONZE: 'bg-orange-600 text-white' };

  return (
    <Slide>
      <SlideHeader title="Account Snapshot" subtitle="Key deal intelligence at a glance" />
      <div className="grid grid-cols-2 gap-6">
        {/* Left: metrics + proposition */}
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${icpColors[inputs.icpRating] || icpColors.SILVER}`}>{inputs.icpRating || 'N/A'}</span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#091C35] text-white">ARR: {inputs.arrEstimate || <NeedsInput label="ARR" />}</span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">Close: {inputs.closeDate || 'TBD'}</span>
          </div>
          <div>
            <div className="text-[9px] font-bold text-[#3366FF] uppercase mb-1">Backbase Proposition</div>
            <ul className="space-y-1">
              {(s.backbase_proposition || []).map((p, i) => <li key={i} className="text-[10px] text-gray-700 flex gap-1.5"><span className="text-[#3366FF]">&#8226;</span>{p}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-[9px] font-bold text-[#3366FF] uppercase mb-1">Next Steps</div>
            <ul className="space-y-1">
              {(s.next_steps || []).map((n, i) => <li key={i} className="text-[10px] text-gray-700 flex gap-1.5"><span className="text-emerald-500">&#8594;</span>{n}</li>)}
            </ul>
          </div>
        </div>
        {/* Right: strategic initiatives table + measures */}
        <div className="space-y-3">
          <table className="w-full text-[10px] border-collapse">
            <thead><tr className="bg-[#091C35] text-white"><th className="p-1.5 text-left font-bold">Initiative</th><th className="p-1.5 text-left font-bold">Challenge</th><th className="p-1.5 text-left font-bold">BB Advantage</th></tr></thead>
            <tbody>
              {(s.strategic_initiatives || []).map((si, i) => (
                <tr key={i} className="border-b border-gray-100"><td className="p-1.5 font-bold text-gray-700">{si.initiative}</td><td className="p-1.5 text-gray-500">{si.challenge}</td><td className="p-1.5 text-[#3366FF]">{si.backbase_advantage}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-3 gap-2">
            {[['Responsive', s.responsive_measures, 'bg-blue-50 border-blue-200'], ['Proactive', s.proactive_measures, 'bg-emerald-50 border-emerald-200'], ['Risks', s.potential_risks, 'bg-red-50 border-red-200']].map(([title, items, colors]) => (
              <div key={title} className={`p-2 rounded-lg border ${colors}`}>
                <div className="text-[8px] font-bold uppercase mb-1">{title}</div>
                {(items || []).map((item, i) => <div key={i} className="text-[9px] text-gray-600 mb-0.5">&#8226; {item}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Slide>
  );
}

function BusinessOverviewSlide({ plan, bankData }) {
  const biz = plan.business_overview || {};
  return (
    <Slide>
      <SlideHeader title="Business Overview" />
      <div className="grid grid-cols-2 gap-6">
        <div className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">{biz.description || bankData?.overview || ''}</div>
        <div>
          <table className="w-full text-[10px] border-collapse">
            <thead><tr className="bg-gray-50"><th className="p-2 text-left font-bold text-gray-500">Dimension</th><th className="p-2 text-left font-bold text-gray-500">Today</th><th className="p-2 text-left font-bold text-[#3366FF]">Ambition</th></tr></thead>
            <tbody>
              {(biz.today_vs_ambition || []).map((row, i) => (
                <tr key={i} className="border-b border-gray-100"><td className="p-2 font-bold text-gray-700">{row.dimension}</td><td className="p-2 text-gray-600">{row.today}</td><td className="p-2 text-[#3366FF]">{row.ambition}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Slide>
  );
}

function StakeholderMapSlide({ plan, confidence }) {
  const sm = plan.stakeholder_map || {};
  const categories = [
    ['Executive Sponsor', sm.executive_sponsor, '#7B2FFF'],
    ['Budget Owner', sm.budget_owner, '#3366FF'],
    ['Operational', sm.operational, '#0EA5E9'],
    ['Key Influencer', sm.key_influencer, '#26BC71'],
    ['Business Sponsor', sm.business_sponsor, '#FFAC09'],
    ['External Allies', sm.external_allies, '#6B7280'],
  ];
  return (
    <Slide>
      <SlideHeader title="Stakeholder Map" subtitle={confidence === 'low' ? 'Limited data — verify stakeholder assignments' : undefined} />
      <div className="grid grid-cols-3 gap-3">
        {categories.map(([label, people, color]) => (
          <div key={label} className="p-3 rounded-lg border border-gray-100" style={{ borderTopColor: color, borderTopWidth: 3 }}>
            <div className="text-[9px] font-bold uppercase mb-2" style={{ color }}>{label}</div>
            {(people || []).length > 0 ? people.map((p, i) => (
              <div key={i} className="mb-1.5">
                <div className="text-[11px] font-bold text-gray-800">{p.name}</div>
                <div className="text-[9px] text-gray-500">{p.title}</div>
              </div>
            )) : <div className="text-[9px] text-gray-400 italic">Not identified</div>}
          </div>
        ))}
      </div>
    </Slide>
  );
}

function StrategicObjectivesSlide({ plan }) {
  return (
    <Slide>
      <SlideHeader title="Strategic Objectives & Key Initiatives" />
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[9px] font-bold text-[#3366FF] uppercase mb-2">Strategic Objectives</div>
          {(plan.strategic_objectives || []).map((obj, i) => (
            <div key={i} className="flex gap-2 mb-2"><span className="w-5 h-5 rounded-full bg-[#3366FF] text-white flex items-center justify-center text-[9px] font-black shrink-0">{i + 1}</span><span className="text-[11px] text-gray-700">{obj}</span></div>
          ))}
        </div>
        <div>
          <div className="text-[9px] font-bold text-[#091C35] uppercase mb-2">Key Initiatives</div>
          {(plan.key_initiatives || []).map((init, i) => (
            <div key={i} className="flex gap-2 mb-2"><span className="w-5 h-5 rounded-full bg-[#091C35] text-white flex items-center justify-center text-[9px] font-black shrink-0">{i + 1}</span><span className="text-[11px] text-gray-700">{init}</span></div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

function LandingZonesSlide({ plan }) {
  const lz = plan.landing_zones || {};
  const rows = [['Retail Banking', lz.retail], ['Small Business', lz.sme], ['Commercial', lz.commercial], ['Wealth/Private', lz.wealth]];
  const cols = ['onboarding', 'servicing', 'loan_origination', 'investing', 'assist_engage'];
  const colLabels = ['Onboarding', 'Servicing', 'Loan Origination', 'Investing', 'Assist/Engage'];
  return (
    <Slide>
      <SlideHeader title="Landing Zones" subtitle="Target product-market fit matrix" />
      <table className="w-full text-[10px] border-collapse">
        <thead><tr><th className="p-2 text-left bg-[#091C35] text-white font-bold rounded-tl-lg">Segment</th>{colLabels.map(c => <th key={c} className="p-2 text-center bg-[#091C35] text-white font-bold last:rounded-tr-lg">{c}</th>)}</tr></thead>
        <tbody>
          {rows.map(([label, data], i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="p-2 font-bold text-gray-700">{label}</td>
              {cols.map(col => (
                <td key={col} className="p-2 text-center">
                  {data?.[col] ? <span className="inline-block w-4 h-4 rounded bg-[#3366FF]" /> : <span className="inline-block w-4 h-4 rounded bg-gray-100" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Slide>
  );
}

function PovMetricsSlide({ plan }) {
  return (
    <Slide>
      <SlideHeader title="Point of View & Key Metrics" />
      {plan.pov_summary && <p className="text-[11px] text-gray-700 leading-relaxed mb-4 p-3 bg-gray-50 rounded-lg italic">{plan.pov_summary}</p>}
      <table className="w-full text-[10px] border-collapse">
        <thead><tr className="bg-gray-50"><th className="p-2 text-left font-bold">KPI</th><th className="p-2 text-left font-bold">Current</th><th className="p-2 text-left font-bold">Benchmark</th><th className="p-2 text-left font-bold text-[#3366FF]">Gap</th><th className="p-2 text-left font-bold w-16">Source</th></tr></thead>
        <tbody>
          {(plan.key_kpis || []).map((kpi, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="p-2 font-bold text-gray-700">{kpi.label}</td>
              <td className="p-2 text-gray-600">{kpi.current}</td>
              <td className="p-2 text-gray-600">{kpi.benchmark}</td>
              <td className="p-2 font-bold text-[#3366FF]">{kpi.gap}</td>
              <td className="p-2">
                {kpi.source === 'bank_data'
                  ? <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">verified</span>
                  : <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">estimated</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Slide>
  );
}

function RoadmapSlide({ plan }) {
  const periods = ['h1_2026', 'h2_2026', 'h1_2027', 'h2_2027', 'h1_2028'];
  const periodLabels = ['H1 2026', 'H2 2026', 'H1 2027', 'H2 2027', 'H1 2028'];
  return (
    <Slide>
      <SlideHeader title="Three Year Roadmap" />
      <table className="w-full text-[10px] border-collapse">
        <thead><tr><th className="p-2 text-left bg-[#091C35] text-white font-bold">Initiative</th>{periodLabels.map(p => <th key={p} className="p-2 text-center bg-[#091C35] text-white font-bold">{p}</th>)}<th className="p-2 text-center bg-[#091C35] text-white font-bold">ARR</th></tr></thead>
        <tbody>
          {(plan.roadmap || []).map((row, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="p-2 font-bold text-gray-700">{row.initiative}</td>
              {periods.map(p => (
                <td key={p} className={`p-2 text-center text-[9px] ${row[p] ? 'bg-[#3366FF]/10 text-[#3366FF] font-bold' : 'text-gray-300'}`}>{row[p] || '—'}</td>
              ))}
              <td className="p-2 text-center font-bold text-[#091C35]">{row.arr_potential}</td>
            </tr>
          ))}
          {plan.three_year_arr && (
            <tr className="bg-[#091C35] text-white font-bold">
              <td className="p-2">Total ARR</td>
              {periods.map(p => <td key={p} className="p-2 text-center">{plan.three_year_arr[p] || '—'}</td>)}
              <td className="p-2" />
            </tr>
          )}
        </tbody>
      </table>
    </Slide>
  );
}

function EngagementCalendarSlide({ plan, confirmedActivities }) {
  const activities = [...(plan.engagement_plan || [])];
  // Merge confirmed activities from manual input
  (confirmedActivities || []).forEach(ca => {
    const month = ca.date ? new Date(ca.date + 'T00:00:00').toLocaleString('en-US', { month: 'short' }) : null;
    if (month) {
      const existing = activities.find(a => a.activity === ca.activity && a.month === month);
      if (existing) existing.status = ca.status;
      else activities.push({ category: 'Manual', activity: ca.activity, month, status: ca.status });
    }
  });

  const categories = [...new Set(activities.map(a => a.category))];
  const dotColor = { planned: 'bg-[#3366FF]', confirmed: 'bg-amber-400', completed: 'bg-emerald-500' };

  return (
    <Slide>
      <SlideHeader title="Engagement Plan" subtitle="Activity calendar by month" />
      <div className="flex gap-3 mb-3 text-[9px]">
        {[['Planned', 'bg-[#3366FF]'], ['Confirmed', 'bg-amber-400'], ['Completed', 'bg-emerald-500']].map(([label, bg]) => (
          <div key={label} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-full ${bg}`} />{label}</div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[9px] border-collapse min-w-[700px]">
          <thead>
            <tr><th className="p-1.5 text-left bg-gray-50 font-bold text-gray-500 w-24">Category</th><th className="p-1.5 text-left bg-gray-50 font-bold text-gray-500 w-32">Activity</th>
              {MONTHS.map(m => <th key={m} className="p-1.5 text-center bg-gray-50 font-bold text-gray-500 w-8">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const catActivities = activities.filter(a => a.category === cat);
              return catActivities.map((a, i) => (
                <tr key={`${cat}-${i}`} className="border-b border-gray-50">
                  {i === 0 && <td className="p-1.5 font-bold text-gray-600 align-top" rowSpan={catActivities.length}>{cat}</td>}
                  <td className="p-1.5 text-gray-700">{a.activity}</td>
                  {MONTHS.map(m => (
                    <td key={m} className="p-1.5 text-center">
                      {a.month === m ? <span className={`inline-block w-3 h-3 rounded-full ${dotColor[a.status] || dotColor.planned}`} /> : null}
                    </td>
                  ))}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </Slide>
  );
}

/* ═══════════════════════════════════════════════
   Loading State
   ═══════════════════════════════════════════════ */

function LoadingOverlay() {
  const [step, setStep] = useState(0);
  const messages = [
    'Analyzing bank intelligence...',
    'Mapping strategic objectives...',
    'Building roadmap and engagement plan...',
    'Finalizing account plan...',
  ];
  useEffect(() => {
    const timers = messages.map((_, i) => setTimeout(() => setStep(i), i * 3000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Loader size={24} className="animate-spin text-[#3366FF] mb-4" />
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-500 ${i <= step ? 'text-fg' : 'text-fg-disabled'}`}>
            {i < step ? <CheckCircle size={12} className="text-emerald-500" /> : i === step ? <Loader size={12} className="animate-spin text-[#3366FF]" /> : <span className="w-3 h-3" />}
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function AccountPlanPage() {
  const { bankKey } = useParams();
  const navigate = useNavigate();
  const key = decodeURIComponent(bankKey || '');
  const bankData = BANK_DATA[key];

  const [state, setState] = useState('idle'); // idle | loading | plan
  const [plan, setPlan] = useState(null);
  const [cachedAt, setCachedAt] = useState(null);
  const [error, setError] = useState(null);

  // Derive defaults from bank data — no form needed
  const score = bankData ? calcScore(key) : 0;
  const defaults = {
    icpRating: score >= 8 ? 'GOLD' : score >= 6 ? 'SILVER' : 'BRONZE',
    arrEstimate: bankData?.backbase_qualification?.deal_size || '',
    closeDate: '',
    lastContact: new Date().toISOString().slice(0, 10),
    teamMembers: { ae: '', se: '', vc: 'Oumaima Aurag', marketing: '', partner: '', cs: '' },
    confirmedActivities: [],
  };

  const handleGenerate = async () => {
    setState('loading');
    setError(null);
    try {
      const response = await apiGenerateAccountPlan({ bankKey: key, manualInputs: defaults });
      setPlan(response.result);
      setCachedAt(null);
      setState('plan');
    } catch (err) {
      setError(err.message || 'Failed to generate account plan');
      setState('idle');
    }
  };

  // Try cache first, then auto-generate
  useEffect(() => {
    if (!bankData || plan) return;
    (async () => {
      try {
        const cached = await getCachedAccountPlan(key);
        if (cached.result) {
          setPlan(cached.result);
          setCachedAt(cached.generated_at);
          setState('plan');
          return;
        }
      } catch { /* no cache — generate fresh */ }
      handleGenerate();
    })();
  }, [key]);

  if (!bankData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-sm text-red-600">Bank not found: {key}</p>
        <button onClick={() => navigate(-1)} className="mt-2 text-xs text-primary hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .slide { page-break-after: always; box-shadow: none; border: none; margin: 0; padding: 2cm; }
          .slide:last-child { page-break-after: auto; }
          body { background: white; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 no-print">
        <button onClick={() => navigate(`/bank/${encodeURIComponent(key)}`)} className="p-1.5 rounded-lg hover:bg-surface-2 text-fg-muted">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-black text-fg">Account Plan</h1>
          <p className="text-[10px] text-fg-muted">{bankData.bank_name} — {bankData.country}</p>
        </div>
        {state === 'plan' && (
          <div className="flex items-center gap-2">
            {cachedAt && (
              <span className="text-[9px] text-fg-disabled">
                Cached {new Date(cachedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#091C35] text-white rounded-lg text-xs font-bold hover:bg-[#091C35]/90">
              <Printer size={12} /> Print to PDF
            </button>
            <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border text-fg rounded-lg text-xs font-bold hover:bg-surface-2">
              <Edit3 size={12} /> Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 mb-4 no-print">
          {error}
          <button onClick={handleGenerate} className="ml-2 underline font-bold">Try again</button>
        </div>
      )}

      {/* Confidence bar */}
      {state === 'plan' && plan?.confidence_flags && (
        <div className="flex items-center gap-3 mb-4 p-2 bg-surface-2 rounded-lg no-print">
          <span className="text-[9px] font-bold text-fg-muted">Confidence:</span>
          {Object.entries(plan.confidence_flags).map(([section, level]) => (
            <div key={section} className="flex items-center gap-1">
              <span className="text-[8px] text-fg-disabled capitalize">{section.replace(/_/g, ' ')}</span>
              <ConfidenceBadge level={level} />
            </div>
          ))}
        </div>
      )}

      {/* States */}
      {(state === 'idle' || state === 'loading') && <LoadingOverlay />}
      {state === 'plan' && plan && (
        <div>
          <CoverSlide bankName={bankData.bank_name} pov={plan.pov_summary} />
          <AccountOverviewSlide bankName={bankData.bank_name} country={bankData.country} team={defaults.teamMembers} lastUpdated={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
          <AccountSnapshotSlide plan={plan} inputs={defaults} />
          <BusinessOverviewSlide plan={plan} bankData={bankData} />
          <StakeholderMapSlide plan={plan} confidence={plan.confidence_flags?.stakeholder_map} />
          <StrategicObjectivesSlide plan={plan} />
          <LandingZonesSlide plan={plan} />
          <PovMetricsSlide plan={plan} />
          <RoadmapSlide plan={plan} />
          <EngagementCalendarSlide plan={plan} confirmedActivities={defaults.confirmedActivities} />
        </div>
      )}
    </div>
  );
}
