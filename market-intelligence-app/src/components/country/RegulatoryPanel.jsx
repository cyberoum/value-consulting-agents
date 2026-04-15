import { Shield, CheckCircle, Clock, AlertTriangle, ArrowRight, Globe, Check, X } from 'lucide-react';
import Section from '../common/Section';

const STATUS_BADGE = {
  implemented: { label: 'Implemented', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  planned: { label: 'Planned', icon: ArrowRight, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  not_applicable: { label: 'N/A', icon: X, color: 'bg-slate-50 text-slate-400 border-slate-200' },
};

const RELEVANCE_DOT = {
  high: 'bg-[var(--nova-cooling)]',
  medium: 'bg-[var(--nova-accreting)]',
  low: 'bg-[var(--nova-dormant)]',
};

const OB_STATUS = {
  advanced: { width: '90%', color: 'bg-emerald-500', label: 'Advanced' },
  implemented: { width: '70%', color: 'bg-blue-500', label: 'Implemented' },
  in_progress: { width: '45%', color: 'bg-amber-500', label: 'In Progress' },
  early: { width: '20%', color: 'bg-slate-400', label: 'Early Stage' },
  none: { width: '5%', color: 'bg-slate-300', label: 'Not Started' },
};

function LicenseItem({ label, value }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${value ? 'bg-emerald-100' : 'bg-slate-100'}`}>
        {value ? <Check size={12} className="text-emerald-600" /> : <X size={12} className="text-slate-400" />}
      </div>
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

export default function RegulatoryPanel({ data, countryName }) {
  if (!data) {
    return (
      <div className="nova-card text-center py-10">
        <Shield size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-sm font-bold text-[var(--text-secondary)]">Regulatory data not yet available for {countryName}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Click "Enrich with AI" to generate regulatory intelligence.</p>
      </div>
    );
  }

  const regulations = data.key_regulations || [];
  const ob = data.open_banking || {};
  const obStatus = OB_STATUS[ob.status] || OB_STATUS.none;
  const licensing = data.licensing || {};

  return (
    <div className="space-y-4">
      {/* Summary */}
      {data.summary && (
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{data.summary}</p>
      )}

      {/* Central bank */}
      {data.central_bank && (
        <div className="flex items-center gap-2 p-2.5 bg-[var(--bg-secondary)] rounded-lg">
          <Globe size={14} className="text-[var(--text-muted)] shrink-0" />
          <span className="nova-label">Central Bank:</span>
          <span className="text-xs font-bold text-[var(--text-primary)]">{data.central_bank}</span>
        </div>
      )}

      {/* Key Regulations Grid */}
      <div>
        <h4 className="nova-label mb-2">Key Regulations</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {regulations.map((reg, i) => {
            const st = STATUS_BADGE[reg.status] || STATUS_BADGE.not_applicable;
            const StIcon = st.icon;
            const relDot = RELEVANCE_DOT[reg.relevance] || RELEVANCE_DOT.low;
            return (
              <div key={i} className="nova-card-nested">
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${relDot}`} title={`${reg.relevance} relevance`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-[var(--text-primary)]">{reg.name}</span>
                      <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded border ${st.color}`}>
                        <StIcon size={8} /> {st.label}
                      </span>
                    </div>
                    {reg.effective_date && (
                      <span className="text-[9px] text-[var(--text-muted)]">Effective: {reg.effective_date}</span>
                    )}
                    {reg.impact && (
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-relaxed">{reg.impact}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open Banking Progress */}
      <Section title="Open Banking" defaultOpen={true}>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">Adoption Status</span>
              <span className="text-[10px] font-bold text-[var(--nova-core)]">{obStatus.label}</span>
            </div>
            <div className="h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div className={`h-full ${obStatus.color} rounded-full transition-all`} style={{ width: obStatus.width }} />
            </div>
          </div>
          {ob.standard && (
            <div className="text-[10px] text-[var(--text-secondary)]"><strong>Standard:</strong> {ob.standard}</div>
          )}
          {ob.api_adoption_rate && (
            <div className="text-[10px] text-[var(--text-secondary)]"><strong>API Adoption:</strong> {ob.api_adoption_rate}</div>
          )}
          {ob.notes && (
            <p className="text-[10px] text-[var(--text-muted)] italic">{ob.notes}</p>
          )}
        </div>
      </Section>

      {/* Licensing Framework */}
      <Section title="Licensing Framework" defaultOpen={false}>
        <div className="space-y-0.5">
          <LicenseItem label="Digital Banking License" value={licensing.digital_banking_license} />
          <LicenseItem label="Neobank Framework" value={licensing.neobank_framework} />
          <LicenseItem label="Regulatory Sandbox" value={licensing.sandbox_available} />
        </div>
        {licensing.notes && (
          <p className="text-[10px] text-[var(--text-muted)] italic mt-2">{licensing.notes}</p>
        )}
      </Section>

      {/* AML/KYC */}
      {data.aml_kyc && (
        <Section title="AML / KYC Framework" defaultOpen={false}>
          <div className="space-y-0.5">
            <LicenseItem label="Digital Onboarding Allowed" value={data.aml_kyc.digital_onboarding_allowed} />
            <LicenseItem label="eKYC Framework" value={data.aml_kyc.ekyc_framework} />
          </div>
          {data.aml_kyc.notes && (
            <p className="text-[10px] text-[var(--text-muted)] italic mt-2">{data.aml_kyc.notes}</p>
          )}
        </Section>
      )}
    </div>
  );
}
