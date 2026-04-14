/**
 * BriefFeedbackPage — Admin view for AI brief quality tracking.
 *
 * Shows:
 * - Most-used sections across all meetings
 * - Average accuracy rating
 * - Rating distribution
 * - Raw feedback comments
 *
 * Accessible via /feedback route (linked from header settings).
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, BarChart3, MessageSquare, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { fetchBriefFeedbackStats, fetchBriefFeedback } from '../data/api';

const SECTION_LABELS = {
  priorities: 'Priorities',
  stakeholder: 'Stakeholder Intel',
  context: 'Bank Context',
  guide: 'Meeting Guide',
  competitive: 'Competitive',
  none: 'None Used',
};

const SECTION_COLORS = {
  priorities: 'bg-violet-500',
  stakeholder: 'bg-blue-500',
  context: 'bg-emerald-500',
  guide: 'bg-amber-500',
  competitive: 'bg-red-500',
  none: 'bg-gray-400',
};

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={12}
          className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );
}

export default function BriefFeedbackPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, feedbackRes] = await Promise.all([
          fetchBriefFeedbackStats(),
          fetchBriefFeedback(),
        ]);
        setStats(statsRes);
        setFeedback(feedbackRes.feedback || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="ml-3 text-sm text-fg-muted">Loading feedback data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-red-500 mb-4">
          <AlertTriangle size={18} />
          <span className="font-bold">Failed to load feedback: {error}</span>
        </div>
      </div>
    );
  }

  const hasData = stats?.totalCount > 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-surface-2 text-fg-muted hover:text-primary transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-black text-fg">Brief Quality Dashboard</h1>
          <p className="text-xs text-fg-muted">Feedback from {stats?.totalCount || 0} meeting briefs</p>
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-16">
          <Star size={40} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-sm font-bold text-fg-muted mb-1">No feedback yet</h2>
          <p className="text-xs text-fg-disabled max-w-md mx-auto">
            After using an AI meeting brief, consultants can rate its accuracy and report which sections they used.
            That feedback will appear here to help improve the AI.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Average Rating */}
            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} className="text-amber-500" />
                <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">Avg Accuracy</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-fg">{stats.avgRating}</span>
                <div>
                  <StarDisplay rating={Math.round(stats.avgRating)} />
                  <span className="text-[9px] text-fg-muted">out of 5</span>
                </div>
              </div>
            </div>

            {/* Total Responses */}
            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} className="text-primary" />
                <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">Total Responses</span>
              </div>
              <span className="text-3xl font-black text-fg">{stats.totalCount}</span>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">Distribution</span>
              </div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map(n => {
                  const entry = stats.ratingDistribution?.find(r => r.accuracy_rating === n);
                  const count = entry?.count || 0;
                  const pct = stats.totalCount > 0 ? Math.round((count / stats.totalCount) * 100) : 0;
                  return (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-[9px] text-fg-muted w-3 text-right">{n}</span>
                      <Star size={9} className="text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-fg-muted w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Section Usage ── */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} className="text-primary" />
              <span className="text-xs font-black text-fg uppercase tracking-wider">Most-Used Sections</span>
            </div>
            {stats.sectionUsage?.length > 0 ? (
              <div className="space-y-2.5">
                {stats.sectionUsage.map(s => (
                  <div key={s.section} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-fg w-32 shrink-0">
                      {SECTION_LABELS[s.section] || s.section}
                    </span>
                    <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full ${SECTION_COLORS[s.section] || 'bg-primary'} rounded-lg transition-all flex items-center`}
                        style={{ width: `${Math.max(s.pct, 4)}%` }}
                      >
                        {s.pct > 15 && (
                          <span className="text-[9px] font-bold text-white px-2">{s.pct}%</span>
                        )}
                      </div>
                      {s.pct <= 15 && (
                        <span className="absolute top-1/2 -translate-y-1/2 left-2 text-[9px] font-bold text-fg-muted">{s.pct}%</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-fg-muted w-12 text-right">{s.count} uses</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-fg-muted">No section usage data yet.</p>
            )}
          </div>

          {/* ── Raw Comments ── */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={14} className="text-violet-500" />
              <span className="text-xs font-black text-fg uppercase tracking-wider">
                Feedback Comments ({feedback.filter(f => f.comment).length})
              </span>
            </div>
            {feedback.filter(f => f.comment).length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {feedback.filter(f => f.comment).map(f => (
                  <div key={f.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary">{f.bank_name}</span>
                        {f.persona && (
                          <span className="text-[9px] text-fg-muted bg-gray-100 px-1.5 py-0.5 rounded">{f.persona}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={f.accuracy_rating} />
                        <span className="text-[9px] text-fg-disabled">
                          {new Date(f.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-fg leading-relaxed">{f.comment}</p>
                    {f.sections_used && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(Array.isArray(f.sections_used) ? f.sections_used : []).map(s => (
                          <span key={s} className="text-[8px] font-bold text-fg-muted bg-gray-100 px-1.5 py-0.5 rounded">
                            {SECTION_LABELS[s] || s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-fg-muted">No comments submitted yet. Comments are optional in the feedback form.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
