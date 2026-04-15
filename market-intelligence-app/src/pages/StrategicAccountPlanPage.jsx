import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useBank } from '../hooks/useData';
import { LoadingState, ErrorState } from '../components/common/DataState';
import { getMarketForCountry } from '../data/utils';
import AccountPlanSidebar, { SECTIONS } from '../components/account-plan/AccountPlanSidebar';
import AccountSnapshotSection from '../components/account-plan/AccountSnapshotSection';
import BusinessOverviewSection from '../components/account-plan/BusinessOverviewSection';
import StakeholderMapSection from '../components/account-plan/StakeholderMapSection';
import StrategicObjectivesSection from '../components/account-plan/StrategicObjectivesSection';

/**
 * StrategicAccountPlanPage — the interactive strategic account plan dashboard.
 *
 * Route: /account-plan/:bankKey
 *
 * Layout: two-column on desktop (sticky sidebar + scrollable main), stacked on mobile.
 * Scroll-spy: IntersectionObserver highlights the active section in the sidebar.
 *
 * Data: reuses the existing useBank() hook which returns
 *   { bank_name, data, qualification, cx, competition, value_selling, persons, ... }
 */

export default function StrategicAccountPlanPage() {
  const { bankKey: rawKey } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const bankKey = decodeURIComponent(rawKey);

  const { data: bank, isLoading, error, refetch } = useBank(bankKey);
  const [activeSection, setActiveSection] = useState('snapshot');
  const sectionRefs = useRef({});

  // Scroll-spy via IntersectionObserver — highlights active sidebar item
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.target.offsetTop - b.target.offsetTop);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-40% 0% -55% 0%' }
    );
    Object.values(sectionRefs.current).forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [bank]);

  const handleNavigate = useCallback((id) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleInvalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['bank', bankKey] });
    refetch();
  }, [qc, bankKey, refetch]);

  if (isLoading) return <LoadingState message="Loading account plan…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!bank) return <ErrorState message="Bank not found" />;

  const bankName = bank.bank_name || bankKey;
  const country = bank.country;
  const marketKey = country ? getMarketForCountry(country) : null;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={() => navigate(`/bank/${encodeURIComponent(bankKey)}`)}
          className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--nova-core)] transition-colors">
          <ArrowLeft size={14} /> Back to Bank
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-[var(--text-primary)] truncate">{bankName}</h1>
          <p className="text-[11px] text-[var(--text-muted)]">
            Strategic Account Plan {country && <span>· {country}</span>}
            {marketKey && <Link to={`/market/${marketKey}`} className="ml-1 text-[var(--nova-core)] hover:underline">({marketKey})</Link>}
          </p>
        </div>
        <Link to={`/account-plan-doc/${encodeURIComponent(bankKey)}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)]">
          <FileText size={11} /> Doc View
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <AccountPlanSidebar activeSection={activeSection} onNavigate={handleNavigate} />

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-10">
          {/* Section 1: Account Snapshot */}
          <section id="snapshot" ref={el => (sectionRefs.current.snapshot = el)} className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Account Snapshot</h2>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>
            <AccountSnapshotSection bankKey={bankKey} bankName={bankName} />
          </section>

          {/* Section 2: Business Overview */}
          <section id="business" ref={el => (sectionRefs.current.business = el)} className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Business Overview</h2>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>
            <BusinessOverviewSection
              bank={bank}
              cx={bank.cx}
              competition={bank.competition}
              qualification={bank.qualification}
            />
          </section>

          {/* Section 3: Stakeholder Map */}
          <section id="stakeholders" ref={el => (sectionRefs.current.stakeholders = el)} className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Stakeholder Map</h2>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>
            <StakeholderMapSection
              bankKey={bankKey}
              persons={bank.persons || []}
              onBankInvalidate={handleInvalidate}
            />
          </section>

          {/* Section 4: Strategic Objectives */}
          <section id="objectives" ref={el => (sectionRefs.current.objectives = el)} className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Strategic Objectives & Key Initiatives</h2>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>
            <StrategicObjectivesSection bankKey={bankKey} bankName={bankName} />
          </section>
        </div>
      </div>
    </div>
  );
}
