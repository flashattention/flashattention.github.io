// 포트폴리오 장면: 프로젝트마다 캔버스 하나, 스크롤 진행도(p: 0~1)가 장면을 움직인다.
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pinned = matchMedia('(min-width: 901px) and (min-height: 700px)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (c1, c2, t) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], t))).join(',')})`;
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const FONT = "'Pretendard Variable', Pretendard, sans-serif";
  const MONO = "'JetBrains Mono', ui-monospace, monospace";
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };

  // ---------- 젤리 게임즈: 게임 수만큼 젤리가 떨어져 자리를 잡는다 (수는 data-stat="jelly.games", 매일 아침 갱신) ----------
  const GAMES = parseInt(document.querySelector('[data-stat="jelly.games"]')?.textContent, 10) || 21;
  const jelly = {
    colors: ['#ff7aa2', '#ffb347', '#ffe066', '#8ce0b0', '#7cc8ff', '#b79cff', '#ff9ecb', '#9be7e0'],
    layout(s, w, h) {
      // 4개·3개 줄이 번갈아 가는 벌집 모양으로 놓는다 (21개면 6줄)
      const rowSizes = []; for (let left = GAMES; left > 0; ) { const n = Math.min(left, rowSizes.length % 2 ? 3 : 4); rowSizes.push(n); left -= n; }
      const rows = rowSizes.length, gap = 0.9;
      const cell = Math.min(w / 4.9, h / ((rows - 1) * gap + 1.9));
      const oy = (h - cell * (rows - 1) * gap) / 2;
      const spots = [];
      for (let row = 0; row < rows; row++) {
        const n = rowSizes[row], ox = w / 2 - (cell * (n - 1)) / 2;
        for (let k = 0; k < n; k++) spots.push([ox + k * cell, oy + row * cell * gap]);
      }
      const r = rng(7);
      s.cell = cell;
      s.blobs = spots.map(([tx, ty], i) => ({
        tx, ty,
        y: -cell * (1 + r() * 3), vy: 0, x: 0, vx: 0,
        gate: 0.04 + r() * 0.5, color: this.colors[i % this.colors.length], ph: r() * 6.28, wink: r(),
      }));
    },
    draw(c, w, h, p, t, s, ptr) {
      const R = s.cell * 0.4;
      for (const b of s.blobs) {
        const on = p > b.gate;
        const ty = on ? b.ty : -s.cell * 1.5;
        // 스프링: 떨어지고, 눌리고, 되튄다
        b.vy += (ty - b.y) * 0.035; b.vy *= 0.86; b.y += b.vy;
        let push = 0;
        if (ptr && on) { const d = Math.hypot(ptr.x - b.tx, ptr.y - b.y); if (d < s.cell * 1.2) push = ((b.tx - ptr.x) / (d + 1)) * (1 - d / (s.cell * 1.2)) * s.cell * 0.35; }
        b.vx += (push - b.x) * 0.08; b.vx *= 0.8; b.x += b.vx;
        if (b.y < -s.cell) continue;
        const sq = clamp(b.vy * 0.012, -0.28, 0.28) + Math.sin(t * 2 + b.ph) * 0.025;
        const sx = 1 - sq, sy = 1 + sq, x = b.tx + b.x, y = b.y + R * (1 - sy) * 0.6;
        c.save(); c.translate(x, y); c.scale(sx, sy);
        c.fillStyle = b.color;
        c.beginPath(); c.arc(-R * 0.62, -R * 0.72, R * 0.3, 0, 7); c.arc(R * 0.62, -R * 0.72, R * 0.3, 0, 7); c.fill(); // 귀
        rr(c, -R, -R, R * 2, R * 2, R * 0.78); c.fill();
        c.fillStyle = 'rgba(255,255,255,.38)'; c.beginPath(); c.ellipse(-R * 0.36, -R * 0.5, R * 0.3, R * 0.16, -0.5, 0, 7); c.fill(); // 윤기
        c.fillStyle = '#4a2433';
        const blink = Math.sin(t * 1.3 + b.ph * 3) > 0.97 || (ptr && Math.abs(b.x) > 3 && b.wink > 0.5);
        if (blink) { c.fillRect(-R * 0.42, -R * 0.06, R * 0.24, R * 0.06); c.fillRect(R * 0.18, -R * 0.06, R * 0.24, R * 0.06); }
        else { c.beginPath(); c.arc(-R * 0.3, -R * 0.04, R * 0.09, 0, 7); c.arc(R * 0.3, -R * 0.04, R * 0.09, 0, 7); c.fill(); }
        c.lineWidth = Math.max(1.5, R * 0.06); c.strokeStyle = '#4a2433'; c.lineCap = 'round';
        c.beginPath(); c.arc(0, R * 0.16, R * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
        c.restore();
      }
      const n = s.blobs.filter((b) => p > b.gate).length;
      c.fillStyle = '#b0577a'; c.font = `600 ${Math.max(13, w * 0.022)}px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText(`${n} / ${GAMES}`, w * 0.045, h - h * 0.04);
    },
  };

  // ---------- 젤리 서울 러너: 스크롤이 낮을 밤으로 넘기고, 열차가 다리를 건넌다 ----------
  const seoul = {
    layout(s, w, h) {
      const r = rng(21);
      s.far = []; s.near = [];
      for (let x = -10; x < w; ) { const bw = 18 + r() * 34, bh = h * (0.1 + r() * 0.2); s.far.push({ x, w: bw, h: bh }); x += bw + r() * 6; }
      for (let x = -10; x < w; ) {
        const bw = 30 + r() * 52, mid = x > w * 0.3 && x < w * 0.66, bh = h * (mid ? 0.08 + r() * 0.1 : 0.16 + r() * 0.28), win = [];
        const cw = 9, ch = 12;
        for (let wy = 10; wy < bh - 8; wy += ch) for (let wx = 6; wx < bw - 8; wx += cw) if (r() > 0.5) win.push({ x: wx, y: wy, th: 0.42 + r() * 0.5, warm: r() > 0.45 });
        s.near.push({ x, w: bw, h: bh, win }); x += bw + 3 + r() * 10;
      }
      s.stars = Array.from({ length: 70 }, () => ({ x: r() * w, y: r() * h * 0.5, a: 0.4 + r() * 0.6 }));
    },
    draw(c, w, h, p, t, s) {
      const DAY = [[126, 196, 247], [214, 236, 250]], DUSK = [[72, 62, 140], [255, 160, 110]], NIGHT = [[7, 10, 32], [28, 36, 84]];
      const a = p < 0.55 ? [DAY, DUSK, ease(0.1, 0.55, p)] : [DUSK, NIGHT, ease(0.55, 0.95, p)];
      const g = c.createLinearGradient(0, 0, 0, h * 0.8);
      g.addColorStop(0, mix(a[0][0], a[1][0], a[2])); g.addColorStop(1, mix(a[0][1], a[1][1], a[2]));
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const night = ease(0.55, 0.95, p);
      c.fillStyle = '#fff';
      for (const st of s.stars) { c.globalAlpha = night * st.a * (0.7 + 0.3 * Math.sin(t * 2 + st.x)); c.fillRect(st.x, st.y, 1.6, 1.6); }
      c.globalAlpha = 1;
      // 해는 지고 달은 뜬다
      const sunY = lerp(h * 0.16, h * 0.72, ease(0, 0.6, p));
      c.fillStyle = mix([255, 244, 200], [255, 120, 70], ease(0.2, 0.6, p)); c.globalAlpha = 1 - ease(0.55, 0.68, p);
      c.beginPath(); c.arc(w * 0.7, sunY, Math.min(w, h) * 0.055, 0, 7); c.fill();
      c.globalAlpha = night; c.fillStyle = '#f4f1d8';
      c.beginPath(); c.arc(w * 0.24, lerp(h * 0.5, h * 0.14, night), Math.min(w, h) * 0.04, 0, 7); c.fill(); c.globalAlpha = 1;

      const ground = h * 0.74;
      // 남산과 타워
      c.fillStyle = mix([120, 160, 150], [20, 28, 60], ease(0.3, 0.95, p));
      c.beginPath(); c.moveTo(w * 0.22, ground); c.quadraticCurveTo(w * 0.47, ground - h * 0.42, w * 0.74, ground); c.fill();
      const tx = w * 0.475, ty = ground - h * 0.215;
      c.fillRect(tx - 2, ty - h * 0.16, 4, h * 0.16); rr(c, tx - 9, ty - h * 0.115, 18, 14, 4); c.fill();
      if (night > 0.1) { c.fillStyle = `rgba(120,220,255,${night})`; c.fillRect(tx - 9, ty - h * 0.1, 18, 3); }
      // 먼 건물
      c.fillStyle = mix([150, 178, 200], [22, 30, 66], ease(0.3, 0.95, p));
      for (const b of s.far) c.fillRect(b.x, ground - b.h, b.w, b.h);
      // 롯데월드타워, 63빌딩
      const body = mix([196, 212, 228], [30, 40, 82], ease(0.3, 0.95, p));
      c.fillStyle = body;
      c.beginPath(); c.moveTo(w * 0.85, ground); c.lineTo(w * 0.862, ground - h * 0.6); c.lineTo(w * 0.872, ground - h * 0.6); c.lineTo(w * 0.89, ground); c.fill();
      c.fillStyle = mix([226, 178, 96], [70, 58, 60], ease(0.3, 0.95, p)); c.fillRect(w * 0.1, ground - h * 0.4, w * 0.045, h * 0.4);
      // 가까운 건물과 창
      for (const b of s.near) {
        c.fillStyle = mix([92, 116, 150], [14, 19, 46], ease(0.25, 0.9, p));
        c.fillRect(b.x, ground - b.h, b.w, b.h);
        for (const q of b.win) { if (p < q.th) continue; c.fillStyle = q.warm ? 'rgba(255,214,130,.9)' : 'rgba(214,232,255,.85)'; c.fillRect(b.x + q.x, ground - b.h + q.y, 5, 7); }
      }
      // 한강과 철교
      const rg = c.createLinearGradient(0, ground, 0, h);
      rg.addColorStop(0, mix(a[0][1], a[1][1], a[2])); rg.addColorStop(1, mix([70, 130, 190], [8, 12, 36], ease(0.2, 0.95, p)));
      c.fillStyle = rg; c.fillRect(0, ground, w, h - ground);
      const deck = ground + (h - ground) * 0.3;
      c.fillStyle = mix([70, 84, 110], [24, 30, 64], night);
      c.fillRect(0, deck, w, 5);
      for (let x = w * 0.06; x < w; x += w * 0.16) c.fillRect(x, deck, 7, h - deck);
      // 2호선 열차
      const len = Math.min(w * 0.3, 190), x0 = ((t * 60) % (w + len * 2)) - len;
      for (let i = 0; i < 4; i++) {
        const cx = x0 + i * (len / 4);
        c.fillStyle = '#e8ecef'; rr(c, cx, deck - 13, len / 4 - 3, 13, 3); c.fill();
        c.fillStyle = '#00a84d'; c.fillRect(cx, deck - 4, len / 4 - 3, 3);
        c.fillStyle = night > 0.3 ? '#ffe9a8' : '#51627a'; c.fillRect(cx + 4, deck - 11, len / 4 - 11, 5);
      }
      // 걷는 곰돌이
      const bx = lerp(w * 0.1, w * 0.86, p), by = h * 0.93 - Math.abs(Math.sin(t * 6)) * 5, R = Math.min(w, h) * 0.035;
      c.fillStyle = '#ff9ecb'; c.beginPath(); c.arc(bx - R * 0.6, by - R * 0.75, R * 0.3, 0, 7); c.arc(bx + R * 0.6, by - R * 0.75, R * 0.3, 0, 7); c.fill();
      rr(c, bx - R, by - R, R * 2, R * 2, R * 0.75); c.fill();
      c.fillStyle = '#4a2433'; c.beginPath(); c.arc(bx + R * 0.1, by - R * 0.05, R * 0.1, 0, 7); c.arc(bx + R * 0.6, by - R * 0.05, R * 0.1, 0, 7); c.fill();
      // 시계
      const mins = Math.round(lerp(13 * 60, 22 * 60, p) / 10) * 10;
      c.fillStyle = night > 0.4 ? '#eef1ff' : '#12315a'; c.font = `700 ${Math.max(15, w * 0.03)}px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`, w * 0.045, h * 0.05);
      c.font = `500 ${Math.max(12, w * 0.018)}px ${FONT}`; c.fillText('여의도 한강', w * 0.045, h * 0.05 + Math.max(20, w * 0.038));
    },
  };

  // ---------- Latent Atlas: 손실 곡면이 돌아가고, 경사 하강이 한 걸음씩 내려간다 ----------
  const atlas = {
    f: (x, y) => 0.22 * (x * x + 0.6 * y * y) + 0.3 * Math.sin(2.1 * x) * Math.cos(1.7 * y),
    langs: ['ko', 'en', 'es', 'zh', 'ja', 'fr', 'de', 'pt', 'ru', 'ar', 'hi', 'it'],
    layout(s) {
      if (s.paths) return;
      const f = this.f, e = 1e-3;
      s.paths = [[-1.85, 1.6], [1.7, 1.75], [1.5, -1.8]].map(([x, y]) => {
        const pts = [[x, y]];
        for (let i = 0; i < 60; i++) {
          const gx = (f(x + e, y) - f(x - e, y)) / (2 * e), gy = (f(x, y + e) - f(x, y - e)) / (2 * e);
          x -= 0.11 * gx; y -= 0.11 * gy; pts.push([x, y]);
        }
        return pts;
      });
    },
    draw(c, w, h, p, t, s) {
      const f = this.f, N = 22, S = Math.min(w, h * 1.2) * 0.15;
      const yaw = -0.7 + p * 2.4 + t * 0.04, cy = Math.cos(yaw), sy = Math.sin(yaw), tilt = 0.92;
      const P = (x, y, z) => [w * 0.5 + (x * cy - y * sy) * S, h * 0.5 + (x * sy + y * cy) * Math.cos(tilt) * S - (z - 0.7) * Math.sin(tilt) * S * 1.5];
      c.lineWidth = 1; c.lineJoin = 'round';
      for (let k = 0; k < 2; k++) for (let i = 0; i <= N; i++) {
        const u = -2 + (4 * i) / N;
        c.beginPath();
        for (let j = 0; j <= N; j++) { const v = -2 + (4 * j) / N, x = k ? u : v, y = k ? v : u, q = P(x, y, f(x, y)); j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }
        c.strokeStyle = i % 11 === 0 ? 'rgba(20,48,63,.55)' : 'rgba(20,48,63,.2)'; c.stroke();
      }
      // 바닥 틀과 축 이름
      c.strokeStyle = 'rgba(20,48,63,.35)'; c.setLineDash([4, 5]); c.beginPath();
      [[-2, -2], [2, -2], [2, 2], [-2, 2], [-2, -2]].forEach(([x, y], i) => { const q = P(x, y, -0.25); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); });
      c.stroke(); c.setLineDash([]);
      c.fillStyle = '#4e6873'; c.font = `500 ${Math.max(12, w * 0.018)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      let q = P(2.35, 0, -0.25); c.fillText('θ₁', q[0], q[1]); q = P(0, 2.35, -0.25); c.fillText('θ₂', q[0], q[1]);
      // 경사 하강 경로
      const step = Math.floor(ease(0.08, 0.9, p) * 60);
      const cols = ['#c8324f', '#17627c', '#b7791f'];
      s.paths.forEach((pts, k) => {
        c.strokeStyle = cols[k]; c.lineWidth = 2.2; c.beginPath();
        for (let i = 0; i <= step; i++) { const a = P(pts[i][0], pts[i][1], f(pts[i][0], pts[i][1]) + 0.03); i ? c.lineTo(a[0], a[1]) : c.moveTo(a[0], a[1]); }
        c.stroke();
        const hd = P(pts[step][0], pts[step][1], f(pts[step][0], pts[step][1]) + 0.03);
        c.fillStyle = cols[k]; c.beginPath(); c.arc(hd[0], hd[1], 5.5, 0, 7); c.fill();
        c.strokeStyle = '#e9f0ee'; c.lineWidth = 2; c.stroke();
      });
      c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = '#14303f';
      c.font = `700 ${Math.max(15, w * 0.026)}px ${FONT}`; c.fillText('경사 하강법', w * 0.045, h * 0.05);
      c.font = `500 ${Math.max(12, w * 0.018)}px ${FONT}`; c.fillStyle = '#4e6873'; c.fillText(`${step}번째 걸음`, w * 0.045, h * 0.05 + Math.max(22, w * 0.036));
      // 12개 언어
      const fs = Math.max(12, w * 0.02); c.font = `600 ${fs}px ${MONO}`; c.textBaseline = 'bottom';
      this.langs.forEach((l, i) => { c.globalAlpha = ease(i / 14, i / 14 + 0.1, p) * 0.9; c.fillStyle = '#14303f'; c.fillText(l, w * 0.045 + i * fs * 1.95, h * 0.95); });
      c.globalAlpha = 1;
    },
  };

  // ---------- AgentLab: 노드가 놓이고, 선이 이어지고, 구조 분석이 경고를 띄운다 ----------
  const agentlab = {
    nodes: [
      { id: 'START', x: 0.1, y: 0.42, t: 0.03, io: 1 },
      { id: 'planner', x: 0.31, y: 0.42, t: 0.13, sub: 'LLM' },
      { id: 'tools', x: 0.55, y: 0.2, t: 0.27, sub: 'ToolNode' },
      { id: 'retriever', x: 0.55, y: 0.64, t: 0.39, sub: 'Vector DB' },
      { id: 'check', x: 0.77, y: 0.42, t: 0.52, sub: '검증' },
      { id: 'END', x: 0.93, y: 0.42, t: 0.66, io: 1 },
    ],
    edges: [['START', 'planner', 0.1], ['planner', 'tools', 0.24], ['planner', 'retriever', 0.36], ['tools', 'check', 0.49], ['retriever', 'check', 0.49], ['check', 'END', 0.63], ['check', 'planner', 0.76, 1]],
    code: [[0.13, 'g.add_node("planner", planner)'], [0.27, 'g.add_node("tools", ToolNode(tools))'], [0.39, 'g.add_node("retriever", retrieve)'], [0.52, 'g.add_node("check", check)'], [0.76, 'g.add_conditional_edges("check", route)'], [0.9, 'app = g.compile(recursion_limit=6)']],
    draw(c, w, h, p, t) {
      c.fillStyle = 'rgba(255,255,255,.12)';
      for (let x = 14; x < w; x += 24) for (let y = 14; y < h; y += 24) c.fillRect(x, y, 1.5, 1.5);
      const fs = clamp(w * 0.021, 11, 16), nw = fs * 7.4, nh = fs * 3.3, top = h * 0.06, area = h * 0.66;
      const pos = Object.fromEntries(this.nodes.map((n) => [n.id, [n.x * w, top + n.y * area]]));
      const fixed = p > 0.9;
      // 선
      for (const [a, b, te, loop] of this.edges) {
        const k = ease(te, te + 0.1, p); if (k <= 0) continue;
        const [x1, y1] = pos[a], [x2, y2] = pos[b];
        const path = new Path2D();
        if (loop) { path.moveTo(x1, y1 + nh / 2); path.bezierCurveTo(x1, y1 + area * 0.62, x2, y2 + area * 0.62, x2, y2 + nh / 2); }
        else { const mx = (x1 + x2) / 2; path.moveTo(x1, y1); path.bezierCurveTo(mx, y1, mx, y2, x2, y2); }
        const L = Math.hypot(x2 - x1, y2 - y1) * (loop ? 2.4 : 1.25);
        c.setLineDash([L * k, L]); c.lineWidth = 2;
        c.strokeStyle = loop ? (fixed ? '#34d399' : '#fbbf24') : '#5a5a5a'; c.stroke(path);
        if (k >= 1 && p > 0.66) { // 실행 흐름
          c.setLineDash([6, L]); c.lineDashOffset = -((t * 90 + te * 400) % L); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke(path); c.lineDashOffset = 0;
        }
        c.setLineDash([]);
        if (loop && k >= 1) {
          const label = fixed ? '재시도 상한 6회' : '경고: 재시도 상한 없음';
          c.font = `600 ${fs * 0.86}px ${FONT}`; const tw = c.measureText(label).width + 16, lx = (x1 + x2) / 2 - tw / 2, ly = y1 + area * 0.47;
          c.fillStyle = fixed ? '#0f2a20' : '#2e2408'; rr(c, lx, ly, tw, fs * 1.7, 6); c.fill();
          c.fillStyle = fixed ? '#34d399' : '#fbbf24'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, lx + tw / 2, ly + fs * 0.88);
        }
      }
      // 노드
      for (const n of this.nodes) {
        const k = ease(n.t, n.t + 0.08, p); if (k <= 0) continue;
        const [x, y] = pos[n.id], sc = 0.7 + 0.3 * k, ww = (n.io ? nw * 0.62 : nw) * sc, hh = (n.io ? nh * 0.7 : nh) * sc;
        c.globalAlpha = k;
        c.fillStyle = n.io ? '#161616' : '#0a0a0a'; rr(c, x - ww / 2, y - hh / 2, ww, hh, n.io ? hh / 2 : 9); c.fill();
        c.lineWidth = 1.5; c.strokeStyle = n.id === 'check' && p > 0.76 && !fixed ? '#fbbf24' : '#3a3a3a'; c.stroke();
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fafafa';
        c.font = `700 ${fs}px ${MONO}`; c.fillText(n.id, x, n.sub ? y - fs * 0.45 : y);
        if (n.sub) { c.fillStyle = '#8c8c8c'; c.font = `500 ${fs * 0.8}px ${FONT}`; c.fillText(n.sub, x, y + fs * 0.7); }
        c.globalAlpha = 1;
      }
      // 실시간으로 생성되는 코드
      const lines = this.code.filter(([te]) => p > te), lh = fs * 1.65, ph = lh * 6 + 16, py = h - ph - h * 0.04, px = w * 0.045, pw = Math.min(w * 0.91, fs * 30);
      c.fillStyle = 'rgba(13,13,13,.9)'; rr(c, px, py, pw, ph, 10); c.fill(); c.strokeStyle = '#242424'; c.lineWidth = 1; c.stroke();
      c.font = `500 ${fs * 0.88}px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'top';
      lines.forEach(([, text], i) => {
        c.fillStyle = '#555555'; c.fillText(String(i + 1).padStart(2, ' '), px + 12, py + 10 + i * lh);
        c.fillStyle = i === lines.length - 1 ? '#ffffff' : '#a3a3a3'; c.fillText(text, px + 12 + fs * 2, py + 10 + i * lh);
      });
      if (lines.length < 6 && Math.sin(t * 6) > 0) { c.fillStyle = '#ffffff'; c.fillRect(px + 12 + fs * 2, py + 10 + lines.length * lh, fs * 0.5, fs); }
    },
  };

  // ---------- 엔진 ----------
  const defs = { jelly, seoul, atlas, agentlab };
  const scenes = [...document.querySelectorAll('.pin[data-scene]')].map((pin) => {
    const canvas = pin.querySelector('canvas');
    return { pin, canvas, ctx: canvas.getContext('2d'), def: defs[pin.dataset.scene], state: {}, w: 0, h: 0, p: 0, sp: reduce ? 0.86 : 0, visible: false, ptr: null };
  });

  function size(sc) {
    const r = sc.canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    sc.w = r.width; sc.h = r.height;
    sc.canvas.width = Math.round(r.width * dpr); sc.canvas.height = Math.round(r.height * dpr);
    sc.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sc.def.layout?.(sc.state, sc.w, sc.h);
  }

  // 카드 글이 화면 높이를 넘으면 카드 안에 스크롤을 만들지 않는다.
  // 먼저 촘촘하게(dense) 줄여 보고, 그래도 넘치면 그 카드만 고정을 풀어(unpin) 글 길이대로 늘린다.
  function fit() {
    for (const pin of document.querySelectorAll('.pin')) {
      const card = pin.querySelector('.card'), copy = pin.querySelector('.copy');
      pin.classList.remove('dense', 'unpin');
      if (!pinned.matches) continue;
      const over = () => copy.scrollHeight > copy.clientHeight + 1;
      if (over()) pin.classList.add('dense');
      if (over()) pin.classList.add('unpin');
    }
  }
  fit();
  addEventListener('resize', fit);
  document.fonts?.ready.then(fit);

  function progress(sc) {
    const r = sc.pin.getBoundingClientRect(), vh = window.innerHeight;
    if (pinned.matches && !sc.pin.classList.contains('unpin')) return clamp((vh * 0.5 - r.top) / (r.height - vh * 0.5));
    const cr = sc.canvas.getBoundingClientRect();
    return clamp((vh * 0.95 - cr.top) / (vh * 0.75));
  }

  function render(sc, t) {
    if (!sc.w) return;
    sc.ctx.clearRect(0, 0, sc.w, sc.h);
    sc.def.draw(sc.ctx, sc.w, sc.h, sc.sp, t, sc.state, sc.ptr);
  }

  const ro = new ResizeObserver((es) => es.forEach((e) => { const sc = scenes.find((s) => s.canvas === e.target); size(sc); render(sc, 0); }));
  const io = new IntersectionObserver((es) => es.forEach((e) => { scenes.find((s) => s.canvas === e.target).visible = e.isIntersecting; }), { rootMargin: '80px' });
  for (const sc of scenes) {
    ro.observe(sc.canvas); io.observe(sc.canvas);
    sc.canvas.addEventListener('pointermove', (e) => { const r = sc.canvas.getBoundingClientRect(); sc.ptr = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    sc.canvas.addEventListener('pointerleave', () => (sc.ptr = null));
  }

  if (reduce) {
    // 움직임을 줄이는 설정에서는 완성된 한 장면만 보여 준다. 젤리는 자리를 잡을 때까지만 계산한다.
    requestAnimationFrame(() => scenes.forEach((sc) => { for (let i = 0; i < 240; i++) render(sc, 0); }));
    return;
  }
  const t0 = performance.now();
  (function loop(now) {
    const t = (now - t0) / 1000;
    for (const sc of scenes) {
      if (!sc.visible) continue;
      sc.p = progress(sc);
      sc.sp += (sc.p - sc.sp) * 0.14;
      render(sc, t);
    }
    requestAnimationFrame(loop);
  })(t0);
})();
