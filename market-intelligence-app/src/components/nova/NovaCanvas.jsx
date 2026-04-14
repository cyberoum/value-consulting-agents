/**
 * NovaCanvas — Binary nova system visualization.
 * Inspired by: white dwarf + companion star, accretion disk,
 * matter streams, particle burst, luminous cores.
 *
 * The center is "Nova" — the dense intelligence core.
 * Market stars orbit as companions, feeding intelligence streams.
 * When hovered, accretion intensifies. Click to navigate.
 */
import { useRef, useEffect, useCallback } from 'react';

export default function NovaCanvas({ markets = [], onMarketClick }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ nodes: [], particles: [], streams: [], mouse: { x: -999, y: -999 }, animId: null, time: 0 });

  const init = useCallback((canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const state = stateRef.current;
    state.w = w;
    state.h = h;
    state.cx = w / 2;
    state.cy = h / 2;

    // Background stars
    state.particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.6 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.02,
    }));

    // Market nodes
    // Regions with nested sub-markets
    const regionData = [
      { name: 'Northwest Europe', subs: [
        { name: 'Nordics', prospects: 8, hot: 3 },
        { name: 'UK & Ireland', prospects: 2, hot: 0 },
        { name: 'Benelux', prospects: 3, hot: 1 },
        { name: 'DACH', prospects: 2, hot: 0 },
      ]},
      { name: 'Southeast Europe', subs: [
        { name: 'Iberia', prospects: 1, hot: 0 },
        { name: 'Italy & Greece', prospects: 1, hot: 0 },
      ]},
      { name: 'Middle East', subs: [
        { name: 'GCC', prospects: 3, hot: 1 },
        { name: 'Levant', prospects: 1, hot: 0 },
      ]},
      { name: 'Africa', subs: [
        { name: 'Sub-Saharan', prospects: 1, hot: 0 },
        { name: 'North Africa', prospects: 1, hot: 0 },
      ]},
      { name: 'North America', subs: [
        { name: 'USA', prospects: 2, hot: 1 },
        { name: 'Canada', prospects: 1, hot: 0 },
      ]},
      { name: 'LatAm', subs: [
        { name: 'Brazil', prospects: 1, hot: 0 },
        { name: 'Mexico', prospects: 1, hot: 0 },
      ]},
      { name: 'APAC', subs: [
        { name: 'SEA', prospects: 2, hot: 0 },
        { name: 'India', prospects: 1, hot: 0 },
      ]},
      { name: 'ANZ', subs: [
        { name: 'Australia', prospects: 1, hot: 0 },
        { name: 'New Zealand', prospects: 1, hot: 0 },
      ]},
    ];

    const mktData = markets.length > 0 ? markets : regionData;

    const orbitBase = Math.min(w, h) * 0.36;
    state.nodes = []; // regions
    state.subNodes = []; // sub-markets orbiting regions

    mktData.forEach((region, i) => {
      const angle = (i / mktData.length) * Math.PI * 2 - Math.PI / 2;
      const totalProspects = (region.subs || []).reduce((s, sub) => s + (sub.prospects || 0), 0) + (region.prospects || 0);
      const totalHot = (region.subs || []).reduce((s, sub) => s + (sub.hot || 0), 0) + (region.hot || 0);
      const size = 6 + Math.min(totalProspects, 15) * 1.5;

      const regionNode = {
        ...region,
        prospects: totalProspects,
        hot: totalHot,
        angle,
        orbitR: orbitBase * (0.85 + (i % 2) * 0.2),
        orbitSpeed: 0.00025 + (i % 3) * 0.00006,
        size,
        x: 0, y: 0,
        hovered: false,
        isRegion: true,
      };
      state.nodes.push(regionNode);

      // Sub-markets orbit around the region
      (region.subs || []).forEach((sub, j) => {
        const subAngle = (j / (region.subs || []).length) * Math.PI * 2;
        const subSize = 2.5 + Math.min(sub.prospects || 0, 8) * 1.2;
        const subOrbitR = size * 2.5 + 8;
        state.subNodes.push({
          ...sub,
          parentIdx: state.nodes.length - 1,
          subAngle,
          subOrbitR,
          subOrbitSpeed: 0.003 + j * 0.001,
          size: subSize,
          x: 0, y: 0,
          hovered: false,
        });
      });
    });

    state.streams = [];
    state.coreX = w / 2;
    state.coreY = h / 2;
  }, [markets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;
    init(canvas);

    const animate = () => {
      state.time++;
      const { w, h, cx, cy } = state;
      const t = state.time * 0.016;

      // === BACKGROUND === Deep space gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      bgGrad.addColorStop(0, '#0c0a1a');
      bgGrad.addColorStop(0.4, '#0a0818');
      bgGrad.addColorStop(1, '#050410');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // === BACKGROUND STARS === twinkling
      state.particles.forEach(p => {
        p.twinkle += p.speed;
        const a = p.alpha * (0.5 + 0.5 * Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 255, ${a})`;
        ctx.fill();
      });

      // Old separate accretion disk removed — disk is now part of the "o" star

      // Center core removed — the "o" in N★va IS the core now

      // === MARKET NODES === companion stars orbiting
      state.nodes.forEach(node => {
        node.angle += node.orbitSpeed;
        node.x = cx + Math.cos(node.angle) * node.orbitR;
        node.y = cy + Math.sin(node.angle) * node.orbitR * 0.5; // elliptical

        // Check hover
        const mdx = state.mouse.x - node.x;
        const mdy = state.mouse.y - node.y;
        node.hovered = Math.sqrt(mdx * mdx + mdy * mdy) < node.size * 4;

        // === MATTER STREAM === from node toward center
        if (node.hovered || state.time % 180 < 3) {
          const streamCount = node.hovered ? 3 : 1;
          for (let s = 0; s < streamCount; s++) {
            state.streams.push({
              x: node.x + (Math.random() - 0.5) * 6,
              y: node.y + (Math.random() - 0.5) * 6,
              tx: state.coreX + (Math.random() - 0.5) * 20,
              ty: state.coreY + (Math.random() - 0.5) * 10,
              t: 0,
              speed: 0.006 + Math.random() * 0.008,
              color: node.hot > 0 ? [218, 165, 32] : [120, 160, 255],
            });
          }
        }

        // Node glow
        const nGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 3);
        const glowColor = node.hot > 0 ? '218, 140, 40' : '120, 170, 255';
        nGlow.addColorStop(0, `rgba(${glowColor}, ${node.hovered ? 0.25 : 0.1})`);
        nGlow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = nGlow;
        ctx.fill();

        // Node core
        const nCore = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size);
        const coreC = node.hot > 0 ? '255, 200, 100' : '180, 210, 255';
        nCore.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
        nCore.addColorStop(0.4, `rgba(${coreC}, 0.6)`);
        nCore.addColorStop(1, `rgba(${coreC}, 0.1)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = nCore;
        ctx.fill();

        // Labels
        if (node.hovered || node.size > 9) {
          ctx.textAlign = 'center';
          ctx.font = `${node.hovered ? 600 : 400} ${node.hovered ? 13 : 11}px 'DM Sans', sans-serif`;
          ctx.fillStyle = node.hovered ? 'rgba(255,255,255,0.9)' : 'rgba(200,210,230,0.5)';
          ctx.fillText(node.name, node.x, node.y - node.size - 8);

          if (node.hovered) {
            ctx.font = "500 10px 'IBM Plex Mono', monospace";
            ctx.fillStyle = node.hot > 0 ? 'rgba(218,165,32,0.8)' : 'rgba(120,170,255,0.7)';
            ctx.fillText(`${node.prospects} prospects · ${node.hot} hot`, node.x, node.y + node.size + 14);
          }
        }
      });

      // === SUB-MARKET NODES === smaller stars orbiting around their region
      state.subNodes.forEach(sub => {
        const parent = state.nodes[sub.parentIdx];
        if (!parent) return;

        sub.subAngle += sub.subOrbitSpeed;
        sub.x = parent.x + Math.cos(sub.subAngle) * sub.subOrbitR;
        sub.y = parent.y + Math.sin(sub.subAngle) * sub.subOrbitR * 0.6;

        // Check hover
        const sdx = state.mouse.x - sub.x;
        const sdy = state.mouse.y - sub.y;
        sub.hovered = Math.sqrt(sdx * sdx + sdy * sdy) < sub.size * 3;

        // Faint orbit trail
        ctx.beginPath();
        ctx.ellipse(parent.x, parent.y, sub.subOrbitR, sub.subOrbitR * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(150, 170, 220, 0.03)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Sub-node glow
        const sGlow = ctx.createRadialGradient(sub.x, sub.y, 0, sub.x, sub.y, sub.size * 2.5);
        const sGlowColor = sub.hot > 0 ? '218, 170, 80' : sub.prospects > 2 ? '150, 190, 255' : '160, 165, 180';
        sGlow.addColorStop(0, `rgba(${sGlowColor}, ${sub.hovered ? 0.2 : 0.08})`);
        sGlow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(sub.x, sub.y, sub.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = sGlow;
        ctx.fill();

        // Sub-node core
        const sCore = ctx.createRadialGradient(sub.x, sub.y, 0, sub.x, sub.y, sub.size);
        const sCoreColor = sub.hot > 0 ? '255, 210, 130' : sub.prospects > 2 ? '200, 220, 255' : '180, 185, 200';
        sCore.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        sCore.addColorStop(0.5, `rgba(${sCoreColor}, 0.5)`);
        sCore.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(sub.x, sub.y, sub.size, 0, Math.PI * 2);
        ctx.fillStyle = sCore;
        ctx.fill();

        // Sub-node label
        if (sub.hovered || (parent.hovered && sub.size > 3)) {
          ctx.textAlign = 'center';
          ctx.font = `${sub.hovered ? 500 : 400} ${sub.hovered ? 10 : 8}px 'DM Sans', sans-serif`;
          ctx.fillStyle = sub.hovered ? 'rgba(255,255,255,0.85)' : 'rgba(200,210,230,0.4)';
          ctx.fillText(sub.name, sub.x, sub.y - sub.size - 5);

          if (sub.hovered) {
            ctx.font = "500 8px 'IBM Plex Mono', monospace";
            ctx.fillStyle = sub.hot > 0 ? 'rgba(218,170,80,0.7)' : 'rgba(150,190,255,0.6)';
            ctx.fillText(`${sub.prospects} prospects`, sub.x, sub.y + sub.size + 10);
          }
        }
      });

      // === MATTER STREAMS === particles flowing between nodes and center
      state.streams = state.streams.filter(s => {
        s.t += s.speed;
        if (s.t >= 1) return false;

        // Curved path (bezier-like) — matter arcs toward the accretion disk
        const midX = (s.x + s.tx) / 2 + Math.sin(s.t * Math.PI) * 30;
        const midY = (s.y + s.ty) / 2 - Math.cos(s.t * Math.PI) * 20;
        const px = s.x * (1 - s.t) * (1 - s.t) + midX * 2 * s.t * (1 - s.t) + s.tx * s.t * s.t;
        const py = s.y * (1 - s.t) * (1 - s.t) + midY * 2 * s.t * (1 - s.t) + s.ty * s.t * s.t;

        const alpha = Math.sin(s.t * Math.PI) * 0.6;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color.join(',')}, ${alpha})`;
        ctx.fill();

        // Trail
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color.join(',')}, ${alpha * 0.15})`;
        ctx.fill();

        return true;
      });

      // === "N ★ v a" TEXT === The 'o' is ONE big luminous white dwarf — BIG
      ctx.textBaseline = 'middle';
      const novaSize = Math.min(w * 0.18, 130);
      ctx.font = `italic 400 ${novaSize}px 'Instrument Serif', Georgia, serif`;

      const nW = ctx.measureText('N').width;
      const vaText = 'va';
      const vaWidth = ctx.measureText(vaText).width;
      const coreR = novaSize * 0.35; // The 'o' is a large luminous star
      const letterGap = novaSize * 0.04;
      const totalW = nW + letterGap + coreR * 2 + letterGap + vaWidth;
      const startX = cx - totalW / 2;

      // Draw "N"
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(150, 180, 255, 0.3)';
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
      ctx.fillText('N', startX, cy);
      ctx.shadowBlur = 0;

      // === THE WHITE DWARF "O" — single luminous star ===
      const coreX = startX + nW + letterGap + coreR;
      const coreY = cy;
      state.coreX = coreX;
      state.coreY = coreY;

      // Layer 1: Wide soft halo (like image 2 — the blue nebula glow)
      const halo1 = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, coreR * 5);
      halo1.addColorStop(0, 'rgba(150, 190, 255, 0.12)');
      halo1.addColorStop(0.3, 'rgba(100, 150, 255, 0.04)');
      halo1.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(coreX, coreY, coreR * 5, 0, Math.PI * 2);
      ctx.fillStyle = halo1;
      ctx.fill();

      // Layer 2: Nebula glow — cool-toned, premium blue-white
      const nebula = ctx.createRadialGradient(coreX, coreY, coreR * 0.6, coreX, coreY, coreR * 3);
      nebula.addColorStop(0, 'rgba(180, 200, 255, 0.06)');
      nebula.addColorStop(0.4, 'rgba(150, 175, 240, 0.04)');
      nebula.addColorStop(0.7, 'rgba(140, 160, 220, 0.02)');
      nebula.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(coreX, coreY, coreR * 3, 0, Math.PI * 2);
      ctx.fillStyle = nebula;
      ctx.fill();

      // Layer 3: Accretion rings — premium cool-toned, luminous
      // Platinum/silver-blue palette — like light through a diamond
      for (let ring = 0; ring < 5; ring++) {
        const rr = coreR * (1.15 + ring * 0.18);
        const ry = rr * 0.75;
        const tilt = Math.sin(t * 0.08) * 0.08;
        // All cool-toned: white → ice blue → soft lavender
        const ringColors = [
          [255, 255, 255, 0.35],     // Pure white — brightest, defines the "o"
          [200, 215, 255, 0.22],     // Ice blue
          [170, 190, 240, 0.15],     // Soft blue
          [180, 175, 220, 0.10],     // Lavender hint
          [160, 200, 220, 0.07],     // Pale cyan — outermost
        ];
        const [r, g, b, a] = ringColors[ring];
        ctx.beginPath();
        ctx.ellipse(coreX, coreY, rr, ry, tilt, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.lineWidth = 2.2 - ring * 0.3;
        ctx.stroke();
      }

      // Layer 4: Ring particles — dots in matching cool tones
      for (let i = 0; i < 35; i++) {
        const diskAngle = (i / 35) * Math.PI * 2 + t * 0.18 + i * 0.15;
        const ringIdx = i % 5;
        const diskRx = coreR * (1.15 + ringIdx * 0.18) + Math.sin(diskAngle * 3) * coreR * 0.08;
        const diskRy = diskRx * 0.75;
        const dx = coreX + Math.cos(diskAngle) * diskRx;
        const dy = coreY + Math.sin(diskAngle) * diskRy;
        const pColors = ['255,255,255', '200,215,255', '170,190,240', '180,175,220', '160,200,220'];
        const dc = pColors[ringIdx];
        const da = 0.2 + 0.12 * Math.sin(diskAngle + t);
        ctx.beginPath();
        ctx.arc(dx, dy, 0.7 + (i % 3) * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dc}, ${da})`;
        ctx.fill();
      }

      // Layer 5: The white dwarf core — bright white-blue gradient (image 2)
      const starCore = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, coreR * 0.7);
      starCore.addColorStop(0, 'rgba(255, 255, 255, 1)');
      starCore.addColorStop(0.15, 'rgba(240, 248, 255, 0.95)');
      starCore.addColorStop(0.35, 'rgba(180, 210, 255, 0.6)');
      starCore.addColorStop(0.6, 'rgba(120, 170, 255, 0.2)');
      starCore.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(coreX, coreY, coreR * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = starCore;
      ctx.fill();

      // Layer 6: Cross-shaped lens flare (image 2 — the + shape)
      const flareLen = coreR * 1.8;
      const flareAlpha = 0.08 + 0.04 * Math.sin(t * 0.5);
      ctx.strokeStyle = `rgba(200, 220, 255, ${flareAlpha})`;
      ctx.lineWidth = 1;
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(coreX - flareLen, coreY);
      ctx.lineTo(coreX + flareLen, coreY);
      ctx.stroke();
      // Vertical
      ctx.beginPath();
      ctx.moveTo(coreX, coreY - flareLen);
      ctx.lineTo(coreX, coreY + flareLen);
      ctx.stroke();

      // Layer 7: Bright center point — the hottest part
      ctx.beginPath();
      ctx.arc(coreX, coreY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      // Pulsing inner glow
      ctx.beginPath();
      ctx.arc(coreX, coreY, 8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.15 * Math.sin(t * 0.7)})`;
      ctx.fill();

      // Draw "va"
      ctx.textAlign = 'left';
      ctx.font = `italic 400 ${novaSize}px 'Instrument Serif', Georgia, serif`;
      ctx.shadowColor = 'rgba(150, 180, 255, 0.3)';
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
      ctx.fillText(vaText, coreX + coreR + letterGap, cy);
      ctx.shadowBlur = 0;

      // Tagline — lower, describes what Nova does clearly
      const tagY = cy + novaSize * 1.3;
      ctx.textAlign = 'center';

      // Line 1: What it does — clear and specific
      ctx.font = `300 ${Math.min(w * 0.015, 15)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = 'rgba(190, 200, 220, 0.55)';
      ctx.fillText('AI-powered meeting prep, account intelligence & deal strategy', cx, tagY);

      // Line 2: Who it's for
      ctx.font = `300 ${Math.min(w * 0.011, 12)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = 'rgba(170, 185, 210, 0.35)';
      ctx.fillText('For value consultants & account executives', cx, tagY + 24);

      // Line 3: Navigation hint
      ctx.font = `400 ${Math.min(w * 0.01, 11)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = 'rgba(150, 170, 200, 0.22)';
      ctx.fillText('Select a market to begin', cx, tagY + 52);

      state.animId = requestAnimationFrame(animate);
    };

    animate();

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      state.mouse.x = e.clientX - rect.left;
      state.mouse.y = e.clientY - rect.top;
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Check sub-nodes first (they're on top visually)
      for (const sub of state.subNodes) {
        const dx = mx - sub.x;
        const dy = my - sub.y;
        if (Math.sqrt(dx * dx + dy * dy) < sub.size * 3) {
          for (let i = 0; i < 8; i++) {
            state.streams.push({
              x: sub.x, y: sub.y,
              tx: state.coreX + (Math.random() - 0.5) * 30,
              ty: state.coreY + (Math.random() - 0.5) * 15,
              t: 0, speed: 0.012 + Math.random() * 0.01,
              color: [200, 215, 255],
            });
          }
          setTimeout(() => onMarketClick?.(sub.name, sub), 400);
          return;
        }
      }

      // Then check region nodes
      for (const node of state.nodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < node.size * 4) {
          for (let i = 0; i < 12; i++) {
            state.streams.push({
              x: node.x, y: node.y,
              tx: state.coreX + (Math.random() - 0.5) * 40,
              ty: state.coreY + (Math.random() - 0.5) * 20,
              t: 0, speed: 0.01 + Math.random() * 0.01,
              color: [218, 185, 80],
            });
          }
          setTimeout(() => onMarketClick?.(node.name, node), 400);
          return;
        }
      }
    };

    const cx = state.cx;
    const cy = state.cy;

    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('click', handleClick);

    const updateCursor = () => {
      const anyHovered = state.nodes.some(n => n.hovered) || state.subNodes.some(n => n.hovered);
      canvas.style.cursor = anyHovered ? 'pointer' : 'default';
    };
    canvas.addEventListener('mousemove', updateCursor);

    const handleResize = () => init(canvas);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(state.animId);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('mousemove', updateCursor);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
    };
  }, [init, onMarketClick]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
