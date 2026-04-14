import { useState, useEffect } from 'react';
import { ArrowLeft, Loader, Zap, CheckCircle, Pause, Play, Copy, Check } from 'lucide-react';
import { getPlayDetail, updatePlay, generatePlayOutputs } from '../../data/api';
import { PLAY_TYPES, OUTPUT_TYPES } from '../../data/intelligenceLayer';
import OutputCard from './OutputCard';

function CopyAllButton({ outputs }) {
  const [allCopied, setAllCopied] = useState(false);
  const handleCopyAll = () => {
    const text = outputs.map(o => `## ${o.title}\n\n${o.content}\n`).join('\n---\n\n');
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };
  return (
    <button onClick={handleCopyAll}
      className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 transition-colors">
      {allCopied ? <><Check size={12} className="text-emerald-500" /> Copied All</> : <><Copy size={12} /> Copy All</>}
    </button>
  );
}

export default function PlayDetail({ dealId, playId, onBack }) {
  const [play, setPlay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const fetchPlay = async () => {
    try {
      const data = await getPlayDetail(dealId, playId);
      setPlay(data);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchPlay(); }, [playId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      await generatePlayOutputs(dealId, playId);
      await fetchPlay(); // Refresh to show new outputs
    } catch (err) {
      setGenError(err.message || 'Generation failed');
    }
    setGenerating(false);
  };

  const handleStatusChange = async (newStatus) => {
    await updatePlay(dealId, playId, { status: newStatus });
    fetchPlay();
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-8 justify-center text-slate-400 text-xs"><Loader size={14} className="animate-spin" /> Loading play...</div>;
  }

  if (!play) {
    return <div className="text-center py-8 text-slate-400 text-xs">Play not found</div>;
  }

  const pt = PLAY_TYPES[play.play_type] || {};
  const outputs = play.outputs || [];

  // Group outputs by type
  const grouped = {};
  outputs.forEach(o => {
    const key = o.output_type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(o);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <span className="text-2xl">{pt.icon || '📋'}</span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-800">{pt.label || play.play_type}</h3>
          <p className="text-[10px] text-slate-400">{pt.description}</p>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
          play.status === 'active' ? 'bg-[var(--color-il-accent-light)] text-[var(--color-il-accent)]'
          : play.status === 'completed' ? 'bg-violet-50 text-violet-600'
          : 'bg-slate-100 text-slate-400'
        }`}>{play.status}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={handleGenerate} disabled={generating || play.status !== 'active'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[var(--color-il-accent)] hover:opacity-90 disabled:opacity-50 transition-opacity">
          {generating ? <Loader size={12} className="animate-spin" /> : <Zap size={12} />}
          {generating ? 'Generating...' : 'Generate Outputs'}
        </button>
        {play.status === 'active' && (
          <>
            <button onClick={() => handleStatusChange('completed')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors">
              <CheckCircle size={12} /> Complete
            </button>
            <button onClick={() => handleStatusChange('paused')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 transition-colors">
              <Pause size={12} /> Pause
            </button>
          </>
        )}
        {play.status === 'paused' && (
          <button onClick={() => handleStatusChange('active')}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-[var(--color-il-accent)] bg-[var(--color-il-accent-light)] hover:opacity-90 transition-opacity">
            <Play size={12} /> Resume
          </button>
        )}
        {outputs.length > 0 && <CopyAllButton outputs={outputs} />}
      </div>

      {genError && (
        <div className="p-2 mb-3 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-600">
          {genError} <button onClick={handleGenerate} className="ml-1 underline font-bold">Retry</button>
        </div>
      )}

      {/* Outputs */}
      {outputs.length === 0 ? (
        <div className="bg-white rounded-[var(--il-radius)] border border-slate-100 p-6 text-center shadow-[var(--color-il-card-shadow)]">
          <Zap size={24} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-bold text-slate-400">No outputs generated yet</p>
          <p className="text-[10px] text-slate-300 mt-0.5">Click "Generate Outputs" to create intelligence for this play.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, typeOutputs]) => {
            const otConfig = OUTPUT_TYPES[type] || {};
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{otConfig.icon || '📄'}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{otConfig.label || type}</span>
                  <span className="text-[9px] text-slate-300">{typeOutputs.length}</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="space-y-2">
                  {typeOutputs.map(output => (
                    <OutputCard key={output.id} output={output} playId={playId} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
