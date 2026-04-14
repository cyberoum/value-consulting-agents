import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, ChevronDown, Cpu, Zap, Loader2, Download, Upload } from 'lucide-react';
import { INTEL_CATEGORIES, CONFIDENCE_LEVELS, addIntel, exportIntel, importIntel } from '../../data/userIntel';
import { structureIntel } from '../../data/intelEngine';
import { checkAiAvailability, analyzeWithAI } from '../../data/aiService';
import IntelSuggestion from './IntelSuggestion';

export default function IntelPanel({ bankKey, bankName, isOpen, onClose, onAdded }) {
  const [category, setCategory] = useState('signal');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [confidence, setConfidence] = useState('likely');
  const [structured, setStructured] = useState(null);
  const [step, setStep] = useState('input'); // input | review
  const [aiAvailable, setAiAvailable] = useState(false);
  const [useAi, setUseAi] = useState(true); // prefer AI when available
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisSource, setAnalysisSource] = useState(null); // 'ai' | 'pattern'

  const cat = INTEL_CATEGORIES[category];

  // Check AI availability on mount
  useEffect(() => {
    checkAiAvailability().then(available => {
      setAiAvailable(available);
    });
  }, []);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setAnalyzing(true);

    const context = { bankKey, bankName };

    // Try Claude AI first, fall back to pattern engine
    if (aiAvailable && useAi) {
      try {
        const result = await analyzeWithAI(category, content.trim(), context);
        setStructured(result);
        setAnalysisSource('ai');
        setStep('review');
        setAnalyzing(false);
        return;
      } catch (err) {
        console.warn('AI analysis failed, falling back to pattern engine:', err.message);
      }
    }

    // Fallback: pattern-based engine (instant, no API needed)
    const result = structureIntel(category, content.trim(), context);
    setStructured(result);
    setAnalysisSource('pattern');
    setStep('review');
    setAnalyzing(false);
  };

  const handleSubmit = () => {
    const entry = addIntel({
      bankKey,
      category,
      content: content.trim(),
      source: source.trim() || 'Direct input',
      confidence,
      structured,
    });
    // Reset form
    setContent('');
    setSource('');
    setStructured(null);
    setStep('input');
    onAdded?.(entry);
  };

  const handleBack = () => {
    setStructured(null);
    setStep('input');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-surface z-50 shadow-2xl border-l border-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary-900">
              <div>
                <h3 className="text-sm font-bold text-white">Add Intelligence</h3>
                <p className="text-[10px] text-white/60 mt-0.5">{bankName}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { const count = exportIntel(); console.log(`Exported ${count} intel entries`); }}
                  title="Export all intel as JSON"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <Download size={14} />
                </button>
                <label
                  title="Import intel from JSON file"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const result = importIntel(ev.target.result);
                        if (result.error) alert('Import failed: ' + result.error);
                        else { alert(`Imported ${result.imported} entries (${result.skipped} duplicates skipped)`); onAdded?.(); }
                      };
                      reader.readAsText(file);
                      e.target.value = ''; // Reset so same file can be re-imported
                    }}
                  />
                </label>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {step === 'input' ? (
                <div className="space-y-4">
                  {/* Category Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-2 block">Category</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(INTEL_CATEGORIES).map(([key, c]) => (
                        <button
                          key={key}
                          onClick={() => setCategory(key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                            category === key
                              ? 'border-primary bg-primary-50 text-primary shadow-sm'
                              : 'border-border bg-surface-2 text-fg-muted hover:border-primary/30'
                          }`}
                        >
                          <span className="text-sm">{c.icon}</span>
                          <span className="truncate">{c.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-fg-disabled mt-1.5 italic">{cat.description}</p>
                  </div>

                  {/* Content Input */}
                  <div>
                    <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-2 block">
                      Intelligence Detail
                    </label>
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder={getPlaceholder(category)}
                      rows={6}
                      className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-fg placeholder:text-fg-disabled focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
                    />
                    <div className="text-[9px] text-fg-disabled text-right mt-1">
                      {content.length} characters
                    </div>
                  </div>

                  {/* Source */}
                  <div>
                    <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-2 block">Source</label>
                    <input
                      value={source}
                      onChange={e => setSource(e.target.value)}
                      placeholder="e.g., Meeting with CTO, LinkedIn post, Annual report..."
                      className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-xs text-fg placeholder:text-fg-disabled focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Confidence */}
                  <div>
                    <label className="text-[10px] font-bold text-fg-muted uppercase tracking-wider mb-2 block">Confidence Level</label>
                    <div className="flex gap-2">
                      {Object.entries(CONFIDENCE_LEVELS).map(([key, c]) => (
                        <button
                          key={key}
                          onClick={() => setConfidence(key)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                            confidence === key
                              ? 'shadow-sm'
                              : 'border-border bg-surface-2 text-fg-muted'
                          }`}
                          style={confidence === key ? { borderColor: c.color, backgroundColor: c.bg, color: c.color } : {}}
                        >
                          {c.icon} {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Review Step — show AI-structured output */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {analysisSource === 'ai' ? (
                        <Cpu size={14} className="text-violet-500" />
                      ) : (
                        <Sparkles size={14} className="text-primary" />
                      )}
                      <span className="text-xs font-bold text-primary">Structured Intelligence</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      analysisSource === 'ai'
                        ? 'bg-violet-100 text-violet-700 border border-violet-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {analysisSource === 'ai' ? '🤖 Claude AI' : '⚡ Pattern Engine'}
                    </span>
                  </div>
                  <IntelSuggestion
                    category={category}
                    structured={structured}
                    rawContent={content}
                    confidence={confidence}
                  />
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3 border-t border-border bg-surface-2">
              {step === 'input' ? (
                <div className="space-y-2">
                  {/* AI Toggle */}
                  {aiAvailable && (
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        <Cpu size={11} className={useAi ? 'text-violet-500' : 'text-fg-disabled'} />
                        <span className="text-[10px] font-bold text-fg-muted">Claude AI Analysis</span>
                      </div>
                      <button
                        onClick={() => setUseAi(!useAi)}
                        className={`relative w-8 h-4.5 rounded-full transition-colors ${
                          useAi ? 'bg-violet-500' : 'bg-surface-3'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                          useAi ? 'left-4' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleAnalyze}
                    disabled={!content.trim() || analyzing}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                      aiAvailable && useAi
                        ? 'bg-gradient-to-r from-violet-600 to-primary text-white hover:from-violet-700 hover:to-primary/90'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {aiAvailable && useAi ? 'Claude is thinking...' : 'Analyzing...'}
                      </>
                    ) : (
                      <>
                        {aiAvailable && useAi ? <Cpu size={14} /> : <Sparkles size={14} />}
                        {aiAvailable && useAi ? 'Analyze with Claude AI' : 'Analyze & Structure'}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-lg text-xs font-bold text-fg hover:bg-surface-3 transition-colors"
                  >
                    ← Edit
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all"
                  >
                    <Send size={14} />
                    Save Intel
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getPlaceholder(category) {
  const placeholders = {
    signal: 'e.g., Nordea just announced a new digital transformation program focused on retail engagement. The new CTO Kirsten Renner is leading the initiative with a €50M budget...',
    pain_point: 'e.g., Their mobile app still lacks personal finance management tools. Customers are complaining about the inability to set savings goals or get spending insights...',
    leadership: 'e.g., Kirsten Renner appointed as new Head of Group Technology (CIO/CTO) in February 2025. Former CIO at Credit Suisse with deep digital banking experience...',
    meeting_note: 'e.g., Met with Kirsten Renner and Sara Mella yesterday. Key discussion: frustrated with in-house digital platform costs, 18-month delivery cycles. Interested in seeing Backbase Wealth demo. Next step: schedule deep-dive session in Q2...',
    cx_insight: 'e.g., Nordea mobile app updated to 4.6 rating on iOS. New biometric login well received. However, business banking features still rated poorly (3.2 stars)...',
    competition: 'e.g., Heard from SI partner that Nordea is evaluating Temenos Infinity for their SME banking portal. Decision expected Q3 2026. They are also looking at Mambu...',
    strategy: 'e.g., New 3-year strategy announced: "Digital First Nordic" — targeting 80% digital self-service by 2028. €200M tech investment earmarked for platform modernization...',
    qualification: 'e.g., Budget confirmed for digital engagement platform — €5-15M initial scope. Procurement process started, 3 vendors shortlisted. Timeline: decision by Q4 2026...',
  };
  return placeholders[category] || 'Enter your intelligence...';
}
