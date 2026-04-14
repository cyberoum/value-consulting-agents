import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Clock, AlertTriangle, TrendingUp, XCircle,
  Plus, FileText, ChevronDown, ChevronUp, Users, Calendar,
  MessageSquare, Target, Loader2, Upload, Check, Copy, Sparkles, File,
} from 'lucide-react';
import {
  getMeetings as apiGetMeetings,
  createMeeting as apiCreateMeeting,
  updateMeeting as apiUpdateMeeting,
  extractMeetingFromTranscript as apiExtractTranscript,
} from '../../../data/api';

/* ───────── Constants ───────── */

const OUTCOME_CONFIG = {
  progressed: { label: 'Progressed', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' },
  stalled:    { label: 'Stalled',    icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' },
  won:        { label: 'Won',        icon: CheckCircle2,color: 'text-primary',     bg: 'bg-primary-50 border-primary/30 dark:bg-primary/10 dark:border-primary/30' },
  lost:       { label: 'Lost',       icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' },
};

/* ───────── Helpers ───────── */

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${diff}d ago`;
}

/* ═══════════════════════════════════════════════
   Section 1: CommitmentTracker (top of tab)
   ═══════════════════════════════════════════════ */

function CommitmentTracker({ meetings, onMarkFulfilled }) {
  const outstanding = [];
  (meetings || []).forEach(m => {
    (m.commitments_made || []).forEach((c, idx) => {
      if (!c.fulfilled) {
        outstanding.push({ ...c, meetingId: m.id, meetingDate: m.meeting_date, commitmentIndex: idx, allCommitments: m.commitments_made });
      }
    });
  });

  if (outstanding.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={13} className="text-amber-500" />
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
          Outstanding Commitments ({outstanding.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {outstanding.map((c, i) => (
          <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
            <button
              onClick={() => onMarkFulfilled(c.meetingId, c.commitmentIndex, c.allCommitments)}
              className="mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 border-amber-400 hover:bg-amber-200 transition-colors"
              title="Mark as fulfilled"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-fg">{c.commitment}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-fg-muted">Owner: {c.owner || '—'}</span>
                {c.deadline && <span className="text-[9px] text-amber-600 font-bold">Due: {formatDate(c.deadline)}</span>}
                <span className="text-[9px] text-fg-disabled">from {formatDate(c.meetingDate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Section 2: MeetingList
   ═══════════════════════════════════════════════ */

function MeetingCard({ meeting }) {
  const [expanded, setExpanded] = useState(false);
  const oc = OUTCOME_CONFIG[meeting.outcome] || OUTCOME_CONFIG.progressed;
  const Icon = oc.icon;
  const attendees = meeting.attendees || [];
  const topics = meeting.key_topics || [];
  const objections = meeting.objections_raised || [];
  const commitments = meeting.commitments_made || [];
  const fulfilledCount = commitments.filter(c => c.fulfilled).length;

  return (
    <div className={`border rounded-lg overflow-hidden ${oc.bg}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-black/[0.02] transition-colors"
      >
        <Icon size={14} className={oc.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-fg">{formatDate(meeting.meeting_date)}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${oc.color} bg-white/50`}>{oc.label}</span>
            <span className="text-[9px] text-fg-disabled">{daysAgo(meeting.meeting_date)}</span>
            {meeting.meeting_type === 'internal' && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-surface-2 text-fg-disabled border border-border">Internal</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {attendees.length > 0 && (
              <span className="text-[9px] text-fg-muted">{attendees.map(a => a.name || a).join(', ')}</span>
            )}
          </div>
        </div>
        {commitments.length > 0 && (
          <span className="text-[9px] text-fg-muted shrink-0">{fulfilledCount}/{commitments.length} done</span>
        )}
        {expanded ? <ChevronUp size={12} className="text-fg-muted" /> : <ChevronDown size={12} className="text-fg-muted" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-black/5">
              {topics.length > 0 && (
                <div className="mt-2">
                  <div className="text-[9px] font-bold text-fg-muted uppercase mb-1">Topics</div>
                  <div className="flex flex-wrap gap-1">
                    {topics.map((t, i) => <span key={i} className="text-[9px] bg-white/60 dark:bg-white/10 px-2 py-0.5 rounded-full text-fg">{t}</span>)}
                  </div>
                </div>
              )}
              {objections.length > 0 && (
                <div>
                  <div className="text-[9px] font-bold text-red-500 uppercase mb-1">Objections</div>
                  {objections.map((o, i) => <div key={i} className="text-[10px] text-fg-muted pl-2 border-l-2 border-red-300 mb-1">{o}</div>)}
                </div>
              )}
              {commitments.length > 0 && (
                <div>
                  <div className="text-[9px] font-bold text-fg-muted uppercase mb-1">Commitments</div>
                  {commitments.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                      {c.fulfilled
                        ? <CheckCircle2 size={11} className="text-emerald-500 mt-0.5 shrink-0" />
                        : <Circle size={11} className="text-fg-disabled mt-0.5 shrink-0" />
                      }
                      <span className={`text-[10px] ${c.fulfilled ? 'text-fg-disabled line-through' : 'text-fg'}`}>
                        {c.commitment} <span className="text-fg-muted">({c.owner || '?'})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {meeting.notes && (
                <div>
                  <div className="text-[9px] font-bold text-fg-muted uppercase mb-1">Notes</div>
                  <p className="text-[10px] text-fg-muted leading-relaxed">{meeting.notes}</p>
                </div>
              )}
              {meeting.source && meeting.source !== 'manual' && (
                <div className="text-[9px] text-fg-disabled italic">Source: {meeting.source}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MeetingList({ meetings }) {
  if (!meetings || meetings.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={13} className="text-primary" />
        <span className="text-[10px] font-black uppercase tracking-wider text-fg-muted">
          Meeting History ({meetings.length})
        </span>
      </div>
      <div className="space-y-2">
        {meetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Section 3: MeetingForm + TranscriptUploader
   ═══════════════════════════════════════════════ */

const EMPTY_FORM = {
  meeting_date: new Date().toISOString().slice(0, 10),
  meeting_type: 'client',
  attendees: '',
  key_topics: '',
  objections_raised: '',
  commitments: [{ commitment: '', owner: '', deadline: '', fulfilled: false }],
  outcome: 'progressed',
  notes: '',
};

function MeetingForm({ bankKey, onSaved, prefill }) {
  const [form, setForm] = useState(prefill || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (prefill) setForm(prefill);
  }, [prefill]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const updateCommitment = (idx, field, value) => {
    const updated = [...form.commitments];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm(prev => ({ ...prev, commitments: updated }));
  };

  const addCommitment = () => setForm(prev => ({
    ...prev,
    commitments: [...prev.commitments, { commitment: '', owner: '', deadline: '', fulfilled: false }],
  }));

  const removeCommitment = (idx) => setForm(prev => ({
    ...prev,
    commitments: prev.commitments.filter((_, i) => i !== idx),
  }));

  const handleSubmit = async () => {
    if (!form.meeting_date) { setError('Date is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        meeting_date: form.meeting_date,
        attendees: form.attendees
          ? (typeof form.attendees === 'string'
            ? form.attendees.split(',').map(s => s.trim()).filter(Boolean).map(s => {
                const [name, role] = s.split('/').map(p => p.trim());
                return { name, role: role || null };
              })
            : form.attendees)
          : [],
        key_topics: form.key_topics
          ? (typeof form.key_topics === 'string'
            ? form.key_topics.split(',').map(s => s.trim()).filter(Boolean)
            : form.key_topics)
          : [],
        objections_raised: form.objections_raised
          ? (typeof form.objections_raised === 'string'
            ? form.objections_raised.split('\n').map(s => s.trim()).filter(Boolean)
            : form.objections_raised)
          : [],
        commitments_made: form.commitments.filter(c => c.commitment.trim()),
        outcome: form.outcome,
        notes: form.notes || null,
        source: form.source || 'manual',
        meeting_type: form.meeting_type || 'client',
      };
      await apiCreateMeeting(bankKey, payload);
      setForm(EMPTY_FORM);
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Date + Outcome row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Date *</label>
          <input type="date" value={form.meeting_date} onChange={e => set('meeting_date', e.target.value)}
            className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none" />
        </div>
        <div className="flex-1">
          <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Outcome</label>
          <div className="flex gap-1">
            {Object.entries(OUTCOME_CONFIG).map(([key, cfg]) => {
              const I = cfg.icon;
              return (
                <button key={key} onClick={() => set('outcome', key)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg border text-[9px] font-bold transition-all ${
                    form.outcome === key ? `${cfg.bg} ${cfg.color}` : 'bg-surface border-border text-fg-muted hover:bg-surface-2'
                  }`}>
                  <I size={10} /> {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meeting Type Toggle */}
      <div>
        <label className="text-[9px] font-bold text-fg-muted uppercase block mb-1">Meeting Type</label>
        <div className="flex gap-1.5">
          <button onClick={() => set('meeting_type', 'client')}
            className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
              form.meeting_type !== 'internal'
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-fg-muted hover:bg-surface-2'
            }`}>
            Client Meeting
          </button>
          <button onClick={() => set('meeting_type', 'internal')}
            className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
              form.meeting_type === 'internal'
                ? 'bg-surface-2 border border-fg-muted/30 text-fg'
                : 'bg-surface border border-border text-fg-muted hover:bg-surface-2'
            }`}>
            Internal Meeting
          </button>
        </div>
        {form.meeting_type === 'internal' && (
          <p className="text-[9px] text-fg-disabled mt-1 italic">
            Internal meetings are visible in this tab but not used in AI briefs.
          </p>
        )}
      </div>

      {/* Attendees */}
      <div>
        <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Attendees <span className="font-normal">(comma-separated, use / for role: "Jane Doe / CFO")</span></label>
        <input type="text" value={typeof form.attendees === 'string' ? form.attendees : (form.attendees || []).map(a => `${a.name}${a.role ? ' / ' + a.role : ''}`).join(', ')}
          onChange={e => set('attendees', e.target.value)} placeholder="Jane Doe / CFO, John Smith / CTO"
          className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none" />
      </div>

      {/* Topics */}
      <div>
        <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Key Topics <span className="font-normal">(comma-separated)</span></label>
        <input type="text" value={typeof form.key_topics === 'string' ? form.key_topics : (form.key_topics || []).join(', ')}
          onChange={e => set('key_topics', e.target.value)} placeholder="digital onboarding, platform modernization"
          className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none" />
      </div>

      {/* Objections */}
      <div>
        <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Objections Raised <span className="font-normal">(one per line)</span></label>
        <textarea value={typeof form.objections_raised === 'string' ? form.objections_raised : (form.objections_raised || []).join('\n')}
          onChange={e => set('objections_raised', e.target.value)} rows={2} placeholder="Need to validate with IT first..."
          className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none resize-none" />
      </div>

      {/* Commitments */}
      <div>
        <label className="text-[9px] font-bold text-fg-muted uppercase block mb-1">Commitments</label>
        {form.commitments.map((c, i) => (
          <div key={i} className="flex gap-1.5 mb-1.5">
            <input type="text" value={c.commitment} onChange={e => updateCommitment(i, 'commitment', e.target.value)}
              placeholder="What was committed" className="flex-1 text-[10px] bg-surface border border-border rounded px-2 py-1.5 text-fg placeholder:text-fg-disabled focus:border-primary outline-none" />
            <input type="text" value={c.owner} onChange={e => updateCommitment(i, 'owner', e.target.value)}
              placeholder="Owner" className="w-20 text-[10px] bg-surface border border-border rounded px-2 py-1.5 text-fg placeholder:text-fg-disabled focus:border-primary outline-none" />
            <input type="date" value={c.deadline || ''} onChange={e => updateCommitment(i, 'deadline', e.target.value)}
              className="w-28 text-[10px] bg-surface border border-border rounded px-2 py-1.5 text-fg focus:border-primary outline-none" />
            {form.commitments.length > 1 && (
              <button onClick={() => removeCommitment(i)} className="text-fg-disabled hover:text-red-500 text-xs px-1">×</button>
            )}
          </div>
        ))}
        <button onClick={addCommitment} className="text-[9px] text-primary font-bold hover:text-primary/80">+ Add commitment</button>
      </div>

      {/* Notes */}
      <div>
        <label className="text-[9px] font-bold text-fg-muted uppercase block mb-0.5">Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Key takeaway..."
          className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-primary outline-none resize-none" />
      </div>

      {/* Submit */}
      {error && <div className="text-[10px] text-red-500 font-bold">{error}</div>}
      <button onClick={handleSubmit} disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        {saving ? 'Saving...' : 'Save Meeting'}
      </button>
    </div>
  );
}

/* ── PDF.js lazy loader (from cdnjs — only loaded when a PDF is dropped) ── */
let pdfjsLoaded = false;
function loadPdfJs() {
  if (pdfjsLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfjsLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
}

async function extractTextFromPdf(file) {
  await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(' '));
  }
  return pages.join('\n\n');
}

function TranscriptUploader({ bankKey, onExtracted }) {
  const [transcript, setTranscript] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'txt' && ext !== 'pdf') {
      setError('Unsupported file type. Please use .txt or .pdf files.');
      return;
    }
    setFileLoading(true);
    setError(null);
    setFileName(file.name);
    try {
      let text;
      if (ext === 'txt') {
        text = await file.text();
      } else {
        text = await extractTextFromPdf(file);
      }
      if (!text.trim()) {
        setError('No text could be extracted from this file.');
        setFileName(null);
      } else {
        setTranscript(text);
      }
    } catch (err) {
      setError(`Failed to read file: ${err.message}`);
      setFileName(null);
    } finally {
      setFileLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleExtract = async () => {
    if (!transcript.trim()) return;
    setExtracting(true);
    setError(null);
    try {
      const res = await apiExtractTranscript(bankKey, transcript);
      const extracted = res.result || res;
      const prefill = {
        meeting_date: extracted.meeting_date || new Date().toISOString().slice(0, 10),
        meeting_type: 'client',
        attendees: (extracted.attendees || []).map(a => `${a.name}${a.role ? ' / ' + a.role : ''}`).join(', '),
        key_topics: (extracted.key_topics || []).join(', '),
        objections_raised: (extracted.objections_raised || []).join('\n'),
        commitments: (extracted.commitments_made || []).map(c => ({
          commitment: c.commitment || '',
          owner: c.owner || '',
          deadline: c.deadline || '',
          fulfilled: false,
        })),
        outcome: extracted.outcome || 'progressed',
        notes: extracted.notes || '',
        source: 'transcript_upload',
      };
      if (prefill.commitments.length === 0) {
        prefill.commitments = [{ commitment: '', owner: '', deadline: '', fulfilled: false }];
      }
      onExtracted(prefill);
      setTranscript('');
      setFileName(null);
    } catch (err) {
      setError(err.message || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={12} className="text-violet-500" />
        <span className="text-[10px] font-bold text-violet-600">AI Transcript Extraction</span>
      </div>

      {/* File drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
          dragOver
            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
            : 'border-border hover:border-violet-300 hover:bg-surface-2'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.pdf"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
        {fileLoading ? (
          <>
            <Loader2 size={14} className="text-violet-500 animate-spin" />
            <span className="text-[10px] text-fg-muted">Reading {fileName}...</span>
          </>
        ) : fileName ? (
          <>
            <File size={14} className="text-violet-500" />
            <span className="text-[10px] text-fg font-bold">{fileName}</span>
            <span className="text-[9px] text-fg-disabled">— text extracted below</span>
          </>
        ) : (
          <>
            <Upload size={14} className="text-fg-disabled" />
            <span className="text-[10px] text-fg-muted">
              Drop PDF or .txt file here, or <span className="text-violet-500 font-bold">click to browse</span>
            </span>
          </>
        )}
      </div>

      {/* Textarea for pasting or reviewing extracted text */}
      <textarea
        value={transcript}
        onChange={e => { setTranscript(e.target.value); if (!e.target.value) setFileName(null); }}
        rows={4}
        placeholder="Or paste your meeting transcript here — speaker labels, timestamps, and filler text will be automatically cleaned..."
        className="w-full text-xs bg-surface border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2 text-fg placeholder:text-fg-disabled focus:border-violet-400 outline-none resize-none"
      />
      <div className="flex items-center gap-2">
        <button onClick={handleExtract} disabled={extracting || !transcript.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[10px] font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {extracting ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          {extracting ? 'Extracting...' : 'Extract with AI'}
        </button>
        <span className="text-[9px] text-fg-disabled">Max 50,000 characters · Supports .txt and .pdf</span>
      </div>
      {error && <div className="text-[10px] text-red-500 font-bold">{error}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Tab Component
   ═══════════════════════════════════════════════ */

export default function MeetingHistoryTab({ bankKey }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('manual'); // 'manual' | 'transcript'
  const [prefill, setPrefill] = useState(null);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await apiGetMeetings(bankKey);
      setMeetings(res.meetings || []);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [bankKey]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleMarkFulfilled = async (meetingId, commitmentIndex, allCommitments) => {
    const updated = allCommitments.map((c, i) =>
      i === commitmentIndex ? { ...c, fulfilled: true } : c
    );
    try {
      await apiUpdateMeeting(bankKey, meetingId, { commitments_made: updated });
      fetchMeetings();
    } catch {
      // silent fail — will refresh on next load
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setPrefill(null);
    setFormMode('manual');
    fetchMeetings();
  };

  const handleTranscriptExtracted = (extracted) => {
    setPrefill(extracted);
    setFormMode('manual'); // switch to form view with prefilled data
  };

  // Outstanding commitment count (for parent badge)
  const outstandingCount = meetings.reduce((sum, m) =>
    sum + (m.commitments_made || []).filter(c => !c.fulfilled).length, 0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-fg-muted" />
        <span className="text-xs text-fg-muted ml-2">Loading meetings...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Section 1: Outstanding Commitments */}
      <CommitmentTracker meetings={meetings} onMarkFulfilled={handleMarkFulfilled} />

      {/* Section 2: Meeting List */}
      <MeetingList meetings={meetings} />

      {/* Empty state */}
      {meetings.length === 0 && !showForm && (
        <div className="text-center py-8">
          <MessageSquare size={24} className="text-fg-disabled mx-auto mb-2" />
          <div className="text-xs text-fg-muted mb-1">No meetings logged yet</div>
          <div className="text-[10px] text-fg-disabled">Log your first meeting to track commitments and context</div>
        </div>
      )}

      {/* Section 3: Log Meeting (collapsed) */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 w-full bg-surface-2 hover:bg-surface-3 border border-border border-dashed rounded-lg text-xs font-bold text-fg-muted hover:text-primary transition-all"
        >
          <Plus size={14} />
          Log Meeting
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-lg p-4 bg-surface"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-fg-muted">Log Meeting</span>
              {/* Mode toggle */}
              <div className="flex bg-surface-2 rounded-md p-0.5 ml-2">
                <button
                  onClick={() => { setFormMode('manual'); setPrefill(null); }}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                    formMode === 'manual' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  Manual
                </button>
                <button
                  onClick={() => setFormMode('transcript')}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                    formMode === 'transcript' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 shadow-sm' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  From Transcript
                </button>
              </div>
            </div>
            <button onClick={() => { setShowForm(false); setPrefill(null); setFormMode('manual'); }}
              className="text-[9px] text-fg-muted hover:text-fg font-bold">
              Cancel
            </button>
          </div>

          {formMode === 'transcript' && !prefill ? (
            <TranscriptUploader bankKey={bankKey} onExtracted={handleTranscriptExtracted} />
          ) : (
            <>
              {prefill && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-lg">
                  <Sparkles size={11} className="text-violet-500" />
                  <span className="text-[10px] text-violet-700 dark:text-violet-300 font-bold">AI-extracted — review and edit before saving</span>
                </div>
              )}
              <MeetingForm bankKey={bankKey} onSaved={handleSaved} prefill={prefill} />
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Export for badge count calculation
MeetingHistoryTab.useOutstandingCount = (meetings) =>
  (meetings || []).reduce((sum, m) =>
    sum + (m.commitments_made || []).filter(c => !c.fulfilled).length, 0
  );
