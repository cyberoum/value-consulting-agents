/**
 * Discovery Meeting Presentation Generator
 * Generates a self-contained Prezi-style HTML presentation from the
 * Discovery Storyline + Meeting Prep Brief data.
 *
 * Design system: #3366FF primary, #091C35 dark, Inter font.
 * Pattern: same as generateAssessmentHtml — blob URL → new tab.
 */

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── VERIFIED SOURCE TYPES ────────────────────────────────────────
// Sources in this set are considered factually grounded (public filings, news articles,
// published case studies). Everything else (thought_leadership, etc.) is treated as
// AI-generated and flagged with an amber "⚠ Verify" indicator in the presentation.
const VERIFIED_SOURCES = new Set(['bank_data', 'case_study', 'news']);

// ── ACT METADATA ──────────────────────────────────────────────────
const ACT_META = {
  market_context:        { emoji: '🌍', label: 'Act 1', title: 'The World is Changing',        color: '#3B82F6' },
  your_reality:          { emoji: '🏦', label: 'Act 2', title: 'Your Reality',                 color: '#EF4444' },
  customer_lens:         { emoji: '👥', label: 'Act 3', title: 'Your Customers Expect More',   color: '#8B5CF6' },
  competitive_landscape: { emoji: '⚔️', label: 'Act 4', title: 'The Race',                     color: '#F59E0B' },
  art_of_possible:       { emoji: '✨', label: 'Act 5', title: 'The Art of the Possible',      color: '#3366FF' },
  proof_points:          { emoji: '🏆', label: 'Act 6', title: "We've Done This Before",       color: '#10B981' },
  call_to_action:        { emoji: '🤝', label: 'Act 7', title: "Let's Explore Together",       color: '#6366F1' },
};

// ── SCENE BUILDERS ────────────────────────────────────────────────

function buildTitleScene(bankName, attendees, topics, date) {
  const attendeeList = (attendees || []).map(a =>
    `<span class="attendee-chip">${esc(a.name)} <small>${esc(a.title || a.role || '')}</small></span>`
  ).join('');
  const topicList = (topics || []).map(t =>
    `<span class="topic-chip">${esc(t)}</span>`
  ).join('');

  return `
    <div class="scene" data-scene="0">
      <div class="scene-content">
        <div class="section-label">DISCOVERY MEETING</div>
        <h1 class="mega-title">
          <span class="white">${esc(bankName)}</span>
        </h1>
        <p class="subtitle">${esc(date)}</p>
        ${attendeeList ? `<div class="chip-row" style="margin-top:30px">${attendeeList}</div>` : ''}
        ${topicList ? `<div class="chip-row" style="margin-top:14px">${topicList}</div>` : ''}
      </div>
    </div>`;
}

function buildHookScene(marketAct, execSummary) {
  // Opening scene uses a market/competitive observation — NOT a direct stakeholder address.
  // Pull the observation headline from the market_context act's subtitle or narrative,
  // and show 2-3 key data points as evidence cards.
  const observation = marketAct?.subtitle || marketAct?.narrative || execSummary;
  if (!observation) return '';

  // Use up to 3 key points from the market act as supporting stat cards.
  // Mark thought_leadership sources as unverified (AI-generated, needs fact-checking).
  const evidenceCards = (marketAct?.keyPoints || []).slice(0, 3).map(kp => {
    const isUnverified = kp.sourceType && !VERIFIED_SOURCES.has(kp.sourceType);
    const srcBadge = kp.sourceType ? `<span class="src-badge src-${kp.sourceType}">${esc(kp.sourceType)}</span>` : '';
    return `<div class="card${isUnverified ? ' unverified' : ''}">${esc(kp.point)} ${srcBadge}</div>`;
  }).join('');

  return `
    <div class="scene" data-scene="1">
      <div class="scene-content" style="text-align:left;max-width:1100px">
        <div class="section-label">🌍 THE LANDSCAPE</div>
        <h2 class="scene-title">${esc(marketAct?.subtitle || observation)}</h2>
        ${execSummary && marketAct?.subtitle ? `<p class="body-text" style="margin-top:24px">${esc(execSummary)}</p>` : ''}
        ${evidenceCards ? `<div class="card-grid" style="margin-top:30px">${evidenceCards}</div>` : ''}
      </div>
    </div>`;
}

function buildPersonScene(personIntel) {
  if (!personIntel) return '';
  const priorities = (personIntel.priorities || []).map(p => {
    const text = typeof p === 'string' ? p : (p.priority || '');
    const detail = typeof p === 'object' ? p.detail : '';
    return `<div class="card"><strong>${esc(text)}</strong>${detail ? `<br><span class="card-sub">${esc(detail)}</span>` : ''}</div>`;
  }).join('');

  return `
    <div class="scene" data-scene="2">
      <div class="scene-content" style="text-align:left;max-width:1100px">
        <div class="section-label">👤 WHO YOU'RE MEETING</div>
        <h2 class="scene-title">${esc(personIntel.summary || 'Person Intelligence')}</h2>
        ${priorities ? `<div class="card-grid" style="margin-top:30px">${priorities}</div>` : ''}
        ${personIntel.approach ? `<div class="approach-box" style="margin-top:24px"><strong>Suggested Approach:</strong> ${esc(personIntel.approach)}</div>` : ''}
      </div>
    </div>`;
}

function buildActScene(act, sceneIndex) {
  const meta = ACT_META[act.id] || { emoji: '📌', label: `Act ${sceneIndex}`, title: act.title || 'Untitled', color: '#3366FF' };

  const keyPointsHtml = (act.keyPoints || []).map(kp => {
    const isUnverified = kp.sourceType && !VERIFIED_SOURCES.has(kp.sourceType);
    const srcBadge = kp.sourceType ? `<span class="src-badge src-${kp.sourceType}">${esc(kp.sourceType)}</span>` : '';
    return `<li${isUnverified ? ' class="unverified"' : ''}>${esc(kp.point)} ${srcBadge}</li>`;
  }).join('');

  const talkingPtsHtml = (act.talkingPoints || []).map(tp =>
    `<li class="talk-point">🎯 ${esc(tp)}</li>`
  ).join('');

  return `
    <div class="scene" data-scene="${sceneIndex}">
      <div class="scene-content" style="text-align:left;max-width:1100px">
        <div class="section-label" style="background:${meta.color}22;color:${meta.color}">${meta.emoji} ${esc(meta.label)}</div>
        <h2 class="scene-title">${esc(act.title || meta.title)}</h2>
        ${act.subtitle ? `<p class="scene-subtitle">${esc(act.subtitle)}</p>` : ''}
        ${act.narrative ? `<p class="body-text" style="margin-top:20px">${esc(act.narrative)}</p>` : ''}
        ${keyPointsHtml ? `<ul class="key-points" style="margin-top:24px">${keyPointsHtml}</ul>` : ''}
        ${talkingPtsHtml ? `<div class="talking-section"><h4>Talking Points</h4><ul class="talking-points">${talkingPtsHtml}</ul></div>` : ''}
      </div>
    </div>`;
}

function buildConversationScene(flow, sceneIndex) {
  if (!flow) return '';
  const steps = (flow.middleSequence || []).map((s, i) => {
    const txt = typeof s === 'string' ? s : `<strong>${esc(s.phase || '')}</strong> — ${esc(s.objective || '')}`;
    return `<div class="step-item"><span class="step-num">${i + 1}</span><span>${txt}</span></div>`;
  }).join('');

  return `
    <div class="scene" data-scene="${sceneIndex}">
      <div class="scene-content" style="text-align:left;max-width:1000px">
        <div class="section-label">🗣️ CONVERSATION FLOW</div>
        <h2 class="scene-title">How to Run This Meeting</h2>
        ${flow.opening ? `<div class="approach-box" style="margin-bottom:24px"><strong>Opening:</strong> ${esc(flow.opening)}</div>` : ''}
        ${steps ? `<div class="steps-list">${steps}</div>` : ''}
        ${flow.closing ? `<div class="approach-box" style="margin-top:24px;border-color:#10B981"><strong>Closing:</strong> ${esc(flow.closing)}</div>` : ''}
      </div>
    </div>`;
}

function buildValueScene(illustrativeRoi, quickValue, sceneIndex) {
  if (!illustrativeRoi && !quickValue) return '';

  let leversHtml = '';
  if (illustrativeRoi?.levers?.length) {
    const rows = illustrativeRoi.levers.map(l =>
      `<tr><td>${esc(l.lever)}</td><td class="val">${esc(l.range)}</td><td>${esc(l.confidence || '—')}</td></tr>`
    ).join('');
    leversHtml = `<table class="roi-table"><thead><tr><th>Lever</th><th>Range</th><th>Confidence</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  return `
    <div class="scene" data-scene="${sceneIndex}">
      <div class="scene-content" style="text-align:left;max-width:1100px">
        <div class="section-label" style="background:#10B98122;color:#10B981">💰 VALUE OPPORTUNITY</div>
        ${illustrativeRoi?.headline ? `<h2 class="scene-title">${esc(illustrativeRoi.headline)}</h2>` : '<h2 class="scene-title">Value at Stake</h2>'}
        ${illustrativeRoi?.comparison ? `<p class="body-text" style="margin-top:16px">${esc(illustrativeRoi.comparison)}</p>` : ''}
        ${quickValue?.narrative ? `<p class="body-text" style="margin-top:16px">${esc(quickValue.narrative)}</p>` : ''}
        ${quickValue?.suggestedMetric ? `<div class="metric-box"><strong>Anchor Metric:</strong> ${esc(quickValue.suggestedMetric)}</div>` : ''}
        ${leversHtml}
        ${illustrativeRoi?.caveats?.length ? `<div class="caveats"><strong>Caveats:</strong><ul>${illustrativeRoi.caveats.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
      </div>
    </div>`;
}

function buildNextStepsScene(nextSteps, sceneIndex) {
  if (!nextSteps) return '';
  const qwHtml = (nextSteps.quickWins || []).map(qw =>
    `<div class="qw-item">✅ ${esc(qw)}</div>`
  ).join('');

  return `
    <div class="scene" data-scene="${sceneIndex}">
      <div class="scene-content" style="max-width:1000px">
        <div class="section-label" style="background:#6366F122;color:#6366F1">🚀 NEXT STEPS</div>
        <h2 class="scene-title">${esc(nextSteps.proposedApproach || "Let's Move Forward")}</h2>
        ${qwHtml ? `<div class="qw-grid" style="margin-top:30px">${qwHtml}</div>` : ''}
        ${nextSteps.timeline ? `<div class="timeline-box" style="margin-top:24px">⏱️ <strong>Timeline:</strong> ${esc(nextSteps.timeline)}</div>` : ''}
        ${nextSteps.workshop ? `<div class="timeline-box" style="margin-top:12px">🏢 <strong>Workshop:</strong> ${esc(nextSteps.workshop)}</div>` : ''}
      </div>
    </div>`;
}

function buildCloseScene(bankName, sceneIndex) {
  return `
    <div class="scene" data-scene="${sceneIndex}">
      <div class="scene-content">
        <h1 class="mega-title">
          <span class="blue">Thank You</span>
        </h1>
        <p class="subtitle" style="margin-top:20px">Let's build the future of ${esc(bankName)} together.</p>
        <p class="generated-by">Generated by Market Intelligence • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>`;
}

// ── MAIN GENERATOR ────────────────────────────────────────────────

/**
 * Generate a Prezi-style discovery meeting presentation.
 * @param {object} params
 * @param {string} params.bankName - Bank display name
 * @param {object} [params.storyline] - DiscoveryStoryline data (7-act structure)
 * @param {object} [params.meetingBrief] - MeetingPrepBrief data
 * @param {Array}  [params.attendees] - Meeting attendees from MeetingContextBar
 * @param {Array}  [params.topics] - Meeting topics
 */
export function generateDiscoveryPresentation({ bankName, storyline, meetingBrief, attendees, topics }) {
  if (!storyline && !meetingBrief) {
    alert('No storyline or meeting brief data available yet. Run the meeting prep cascade first.');
    return;
  }

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Build scenes
  const scenes = [];
  scenes.push(buildTitleScene(bankName, attendees, topics, date));

  // Opening: market/competitive observation (NOT direct stakeholder address)
  const marketAct = storyline?.acts?.find(a => a.id === 'market_context') || storyline?.acts?.[0];
  const hookScene = buildHookScene(marketAct, storyline?.executiveSummary);
  if (hookScene) scenes.push(hookScene);

  // Person Intelligence (from meeting brief)
  const personScene = buildPersonScene(meetingBrief?.personIntelligence);
  if (personScene) scenes.push(personScene);

  // 7 Acts from storyline
  if (storyline?.acts?.length) {
    storyline.acts.forEach(act => {
      scenes.push(buildActScene(act, scenes.length));
    });
  }

  // Conversation Flow (from meeting brief)
  const convScene = buildConversationScene(meetingBrief?.conversationFlow, scenes.length);
  if (convScene) scenes.push(convScene);

  // Value Opportunity
  const valueScene = buildValueScene(storyline?.illustrativeRoi, meetingBrief?.quickValueEstimate, scenes.length);
  if (valueScene) scenes.push(valueScene);

  // Next Steps
  const nextScene = buildNextStepsScene(storyline?.nextSteps, scenes.length);
  if (nextScene) scenes.push(nextScene);

  // Closing
  scenes.push(buildCloseScene(bankName, scenes.length));

  // Fix data-scene indices (since some scenes are conditionally added)
  const fixedScenes = scenes.map((html, i) =>
    html.replace(/data-scene="\d+"/, `data-scene="${i}"`)
  );
  const totalScenes = fixedScenes.length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Discovery Meeting — ${esc(bankName)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--bb-blue:#3366FF;--bb-dark:#091C35;--bb-gray:#6B7280;--bb-light:#F3F4F6;--bb-glow:rgba(51,102,255,0.35)}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#000;overflow:hidden;color:#fff}
.canvas{width:100vw;height:100vh;position:relative;overflow:hidden}

/* Background */
.bg-grid{position:fixed;top:0;left:0;width:100%;height:100%;
  background-image:linear-gradient(rgba(51,102,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(51,102,255,0.03) 1px,transparent 1px);
  background-size:60px 60px;z-index:0}
.bg-glow{position:fixed;width:800px;height:800px;border-radius:50%;
  background:radial-gradient(circle,var(--bb-glow) 0%,transparent 70%);filter:blur(100px);z-index:0;
  animation:floatGlow 20s ease-in-out infinite}
.bg-glow.g1{top:-200px;right:-200px}
.bg-glow.g2{bottom:-300px;left:-200px;animation-delay:-10s}
@keyframes floatGlow{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-50px,50px) scale(1.1)}}

/* Scenes */
.scene{position:absolute;width:100%;height:100%;display:flex;align-items:center;justify-content:center;
  opacity:0;transform:scale(0.85);transition:all 0.9s cubic-bezier(0.4,0,0.2,1);pointer-events:none;padding:40px}
.scene.active{opacity:1;transform:scale(1);pointer-events:auto}
.scene-content{max-width:1400px;width:90%;position:relative}

/* Typography */
.mega-title{font-size:clamp(48px,7vw,100px);font-weight:900;line-height:0.95;letter-spacing:-0.03em}
.mega-title .blue{color:var(--bb-blue)}
.mega-title .white{color:#fff}
.subtitle{font-size:clamp(14px,1.8vw,24px);font-weight:400;color:rgba(255,255,255,0.65);margin-top:16px}
.section-label{display:inline-block;background:rgba(51,102,255,0.15);color:var(--bb-blue);
  padding:6px 16px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.08em;margin-bottom:16px;text-transform:uppercase}
.scene-title{font-size:clamp(24px,3.5vw,48px);font-weight:800;line-height:1.15;color:#fff}
.scene-subtitle{font-size:clamp(13px,1.5vw,18px);color:rgba(255,255,255,0.55);margin-top:8px;font-style:italic}
.body-text{font-size:clamp(13px,1.2vw,17px);line-height:1.7;color:rgba(255,255,255,0.75);max-width:900px}
.generated-by{font-size:12px;color:rgba(255,255,255,0.3);margin-top:40px}

/* Cards / Chips */
.chip-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.attendee-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(51,102,255,0.12);
  border:1px solid rgba(51,102,255,0.25);color:#fff;padding:8px 16px;border-radius:24px;font-size:13px;font-weight:600}
.attendee-chip small{font-weight:400;color:rgba(255,255,255,0.5);font-size:11px}
.topic-chip{display:inline-block;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);
  padding:6px 14px;border-radius:16px;font-size:12px;font-weight:500;border:1px solid rgba(255,255,255,0.1)}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;
  padding:16px 20px;font-size:14px;line-height:1.5;color:rgba(255,255,255,0.85)}
.card-sub{color:rgba(255,255,255,0.5);font-size:12px}
.approach-box{background:rgba(51,102,255,0.08);border-left:3px solid var(--bb-blue);
  padding:14px 20px;border-radius:0 10px 10px 0;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6}

/* Key Points */
.key-points{list-style:none;padding:0}
.key-points li{position:relative;padding:8px 0 8px 20px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.8);
  border-bottom:1px solid rgba(255,255,255,0.05)}
.key-points li::before{content:'›';position:absolute;left:0;color:var(--bb-blue);font-weight:700;font-size:18px}
.src-badge{display:inline-block;font-size:9px;padding:2px 8px;border-radius:10px;margin-left:8px;font-weight:600;text-transform:uppercase}
.src-bank_data{background:#10B98122;color:#6EE7B7}
.src-news{background:#F59E0B22;color:#FCD34D}
.src-thought_leadership{background:#F59E0B22;color:#FCD34D}
.src-case_study{background:#10B98122;color:#6EE7B7}

/* Unverified claim indicators */
.unverified{border-color:rgba(245,158,11,0.4) !important;position:relative}
.unverified::before{content:'⚠ Verify';position:absolute;top:6px;right:10px;font-size:9px;
  color:#FBBF24;font-weight:700;letter-spacing:0.04em;text-transform:uppercase}
.key-points li.unverified{border-left:2px solid rgba(245,158,11,0.5);padding-left:22px}
.key-points li.unverified::before{color:#FBBF24}
.disclaimer-bar{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:100;
  background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:20px;
  padding:6px 18px;font-size:10px;color:#FBBF24;font-weight:600;letter-spacing:0.03em;
  backdrop-filter:blur(8px);white-space:nowrap}
.src-case_study{background:#10B98122;color:#6EE7B7}

/* Talking Points */
.talking-section{margin-top:20px;background:rgba(255,255,255,0.03);border-radius:12px;padding:16px 20px}
.talking-section h4{font-size:12px;color:var(--bb-blue);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px}
.talking-points{list-style:none;padding:0}
.talk-point{padding:6px 0;font-size:13px;color:rgba(255,255,255,0.7);border-bottom:1px solid rgba(255,255,255,0.04)}

/* Conversation Steps */
.steps-list{display:flex;flex-direction:column;gap:12px}
.step-item{display:flex;align-items:flex-start;gap:14px;background:rgba(255,255,255,0.04);border-radius:12px;padding:14px 18px}
.step-num{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;
  background:var(--bb-blue);color:#fff;font-size:13px;font-weight:700;flex-shrink:0}
.step-item span:last-child{font-size:14px;line-height:1.5;color:rgba(255,255,255,0.8)}

/* ROI Table */
.roi-table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14px}
.roi-table th{text-align:left;padding:10px 14px;background:rgba(51,102,255,0.1);color:var(--bb-blue);
  font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid rgba(51,102,255,0.2)}
.roi-table td{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.8)}
.roi-table .val{font-weight:700;color:#10B981}
.metric-box{background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;
  padding:14px 20px;margin-top:16px;font-size:14px;color:rgba(255,255,255,0.8)}
.caveats{margin-top:16px;font-size:12px;color:rgba(255,255,255,0.5)}
.caveats ul{margin-top:4px;padding-left:18px}
.caveats li{padding:2px 0}

/* Next Steps */
.qw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.qw-item{background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:10px;
  padding:12px 18px;font-size:14px;color:rgba(255,255,255,0.8)}
.timeline-box{background:rgba(255,255,255,0.04);border-radius:10px;padding:14px 20px;font-size:14px;
  color:rgba(255,255,255,0.7);text-align:center}

/* Navigation */
.nav{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:100}
.nav button{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);
  background:rgba(255,255,255,0.05);color:#fff;font-size:16px;cursor:pointer;
  transition:all 0.3s;backdrop-filter:blur(10px)}
.nav button:hover{background:var(--bb-blue);border-color:var(--bb-blue)}
.nav button:disabled{opacity:0.2;cursor:default}
.nav button:disabled:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.15)}
.progress{position:fixed;bottom:0;left:0;height:3px;background:var(--bb-blue);transition:width 0.5s;z-index:100}
.counter{position:fixed;bottom:36px;right:30px;font-size:12px;color:rgba(255,255,255,0.35);z-index:100}
.key-hint{position:fixed;top:16px;right:20px;font-size:11px;color:rgba(255,255,255,0.2);z-index:100}

/* Scroll overflow for tall scenes */
.scene-content{max-height:calc(100vh - 120px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent}
.scene-content::-webkit-scrollbar{width:4px}
.scene-content::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
</style>
</head>
<body>
<div class="canvas">
  <div class="bg-grid"></div>
  <div class="bg-glow g1"></div>
  <div class="bg-glow g2"></div>

  ${fixedScenes.join('\n')}

</div>

<div class="disclaimer-bar">⚠ AI-generated content — items marked "Verify" need fact-checking before presenting</div>

<div class="nav">
  <button id="prev" onclick="go(-1)">‹</button>
  <button id="next" onclick="go(1)">›</button>
</div>
<div class="progress" id="progress"></div>
<div class="counter" id="counter"></div>
<div class="key-hint">← → or click to navigate</div>

<script>
const TOTAL=${totalScenes};
let cur=0;
const scenes=document.querySelectorAll('.scene');
const prog=document.getElementById('progress');
const counter=document.getElementById('counter');

function show(i){
  scenes.forEach((s,idx)=>{
    s.classList.toggle('active',idx===i);
    if(idx===i) s.querySelector('.scene-content')?.scrollTo(0,0);
  });
  prog.style.width=((i+1)/TOTAL*100)+'%';
  counter.textContent=(i+1)+' / '+TOTAL;
  document.getElementById('prev').disabled=i===0;
  document.getElementById('next').disabled=i===TOTAL-1;
}

function go(d){
  const n=cur+d;
  if(n>=0&&n<TOTAL){cur=n;show(cur)}
}

document.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key===' ')go(1);
  if(e.key==='ArrowLeft')go(-1);
  if(e.key==='Home'){cur=0;show(0)}
  if(e.key==='End'){cur=TOTAL-1;show(TOTAL-1)}
});

// Click left/right halves
document.querySelector('.canvas').addEventListener('click',e=>{
  if(e.target.closest('.nav')||e.target.closest('a')||e.target.closest('button'))return;
  e.clientX>window.innerWidth/2?go(1):go(-1);
});

show(0);
</script>
</body>
</html>`;

  // Open in new tab
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');

  // Also offer download
  const a = document.createElement('a');
  a.href = url;
  a.download = `Discovery_Meeting_${bankName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
}
