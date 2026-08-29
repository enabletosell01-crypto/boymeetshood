/* AUTO-GENERATED from design-source/desktop.dc.html — do not edit by hand.
   Re-export the design from Claude Design, drop it in, then: npm run designs */
/* eslint-disable */
// @ts-nocheck
import { DCLogic } from '@/dc/DCLogic';

class Component extends DCLogic {
  state = { splashOn: false, splashOut: false, portalOn: false, followed: false, wallet: '', err: '', pass: null, queue: 0, copied: false, dl: false, modalOn: false, flipped: false };
  ART = ['wall', 'umbrella', 'dunk', 'pirate', 'soda', 'jungle', 'scooter', 'snow', 'truck', 'winter', 'hood', 'cosmic', 'kid', 'beam', 'doodle', 'flame', 'gold', 'bear', 'astro', 'vamp', 'king', 'ice', 'devil', 'alien', 'skull'];
  MOODS = [
    { label: 'MOODY SAD', line: 'MOOD · MOODY SAD', scene: 'rain',
      bg: 'linear-gradient(135deg,#141c33,#2f3a63 52%,#0d1324)', stops: ['#141c33', '#2f3a63', '#0d1324'],
      ink: '#ffffff', muted: 'rgba(255,255,255,.76)', faint: 'rgba(255,255,255,.5)', rule: 'rgba(255,255,255,.26)', bar: '#9fb6ff',
      cloud: 'rgba(150,166,201,.55)', sky: 'linear-gradient(180deg,rgba(12,18,36,.55),rgba(12,18,36,.05) 60%)',
      words: ['Rain outside, liquidity inside.', 'Grey skies, green candles later.', 'Thunder in the charts, calm in the Hood.', 'Some weather, still holding.'] },
    { label: 'ANGRY', line: 'MOOD · ANGRY', scene: 'dust',
      bg: 'linear-gradient(135deg,#3f1d12,#a85a26 52%,#2b1410)', stops: ['#3f1d12', '#a85a26', '#2b1410'],
      ink: '#fff6ec', muted: 'rgba(255,246,236,.8)', faint: 'rgba(255,246,236,.55)', rule: 'rgba(255,246,236,.3)', bar: '#ffca8a',
      cloud: 'rgba(226,176,128,.3)', sky: 'linear-gradient(180deg,rgba(255,180,90,.22),rgba(70,26,12,.35) 70%)',
      words: ['Dry season, strong hands.', 'Heat rises, the floor holds.', 'No shade, no fear.', 'Desert patience pays.'] },
    { label: 'HAPPY', line: 'MOOD · HAPPY', scene: 'green',
      bg: 'linear-gradient(135deg,#123726,#33a06d 52%,#0f2b21)', stops: ['#123726', '#33a06d', '#0f2b21'],
      ink: '#ffffff', muted: 'rgba(255,255,255,.8)', faint: 'rgba(255,255,255,.56)', rule: 'rgba(255,255,255,.3)', bar: '#c9ffdd',
      cloud: 'rgba(255,255,255,.4)', sky: 'linear-gradient(180deg,rgba(255,255,255,.18),rgba(10,40,28,.25) 72%)',
      words: ['Green wind, easy morning.', 'Sunlight and clean charts.', 'Chill first, compound later.', 'Slow mornings, fast chains.'] },
    { label: 'NERVOUS', line: 'MOOD · NERVOUS', scene: 'snow',
      bg: 'linear-gradient(135deg,#17283f,#6b93bb 52%,#101d2e)', stops: ['#17283f', '#6b93bb', '#101d2e'],
      ink: '#ffffff', muted: 'rgba(255,255,255,.8)', faint: 'rgba(255,255,255,.56)', rule: 'rgba(255,255,255,.32)', bar: '#e6f4ff',
      cloud: 'rgba(223,233,245,.5)', sky: 'radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.28),rgba(16,29,46,.35) 74%)',
      words: ['Cold hands, colder wallet.', 'Freeze the fear, hold the pass.', 'Snow falls, floors hold.', 'Frost on the charts, fire in the Hood.'] }
  ];


  art(name) {
    const r = (typeof window !== 'undefined' && window.__resources) || null;
    return (r && r['nft_' + name]) || ('/assets/nft/' + name + '-sm.png');
  }

  cloud(col, o) {
    const hi = 'rgba(255,255,255,' + o.hi + ')';
    const nil = 'rgba(255,255,255,0)';
    return 'position:absolute;' + o.pos + ';width:' + o.w + 'px;height:' + o.h + 'px;pointer-events:none;background:'
      + 'radial-gradient(42% 66% at 32% 40%,' + hi + ' 0 42%,' + nil + ' 74%),'
      + 'radial-gradient(32% 60% at 24% 60%,' + col + ' 0 58%,' + nil + ' 76%),'
      + 'radial-gradient(30% 80% at 45% 44%,' + col + ' 0 56%,' + nil + ' 76%),'
      + 'radial-gradient(26% 56% at 64% 54%,' + col + ' 0 56%,' + nil + ' 76%),'
      + 'radial-gradient(20% 40% at 82% 66%,' + col + ' 0 54%,' + nil + ' 78%),'
      + 'radial-gradient(80% 28% at 50% 76%,' + col + ' 0 60%,' + nil + ' 86%);'
      + 'filter:blur(' + o.blur + 'px);opacity:' + o.op + ';animation:hmbPuff ' + o.dur + 's linear infinite'
      + (o.delay ? ';animation-delay:-' + o.delay + 's' : '');
  }

  hash(s) {
    let x = 2166136261;
    for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
    return Math.abs(x);
  }

  readQueue() {
    try { return JSON.parse(localStorage.getItem('hmb-waitlist') || '[]'); } catch (e) { return []; }
  }

  makePass(addr) {
    const hx = this.hash(addr.toLowerCase());
    const tier = this.MOODS[hx % this.MOODS.length];
    const art = this.ART[hx % this.ART.length];
    const d = new Date();
    const mon = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'][d.getMonth()];
    return {
      addr,
      short: addr.length > 14 ? addr.slice(0, 6) + '…' + addr.slice(-4) : addr,
      tier,
      art,
      no: '#' + String((hx % 4444) + 1).padStart(4, '0'),
      issued: mon + ' / ' + d.getFullYear(),
      mood: tier.label,
      word: tier.words[(hx >> 3) % tier.words.length],
      ink: 'BOYS-' + (hx.toString(16).toUpperCase() + 'HMB').slice(0, 4) + '-' + ((hx * 7) % 65536).toString(16).toUpperCase().padStart(4, '0'),
      seed: hx
    };
  }

  onOpen = ev => {
    if (ev && ev.preventDefault) ev.preventDefault();
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    this.setState({ modalOn: true });
  };

  onFlip = () => { this.setState({ flipped: !this.state.flipped }); };

  onFollow = () => { this.setState({ followed: true }); };

  onWallet = ev => { this.setState({ wallet: ev.target.value, err: '' }); };

  onKey = ev => { if (ev.key === 'Enter') this.onSubmit(); };

  onSubmit = () => {
    const w = (this.state.wallet || '').trim();
    if (!this.state.followed) return this.setState({ err: 'Follow @boymeetsh00d on X first.' });
    if (!w) return this.setState({ err: 'Paste a wallet address first.' });
    const ok = /^0x[a-fA-F0-9]{40}$/.test(w) || (w.length >= 8 && /^[a-zA-Z0-9._-]+$/.test(w));
    if (!ok) return this.setState({ err: 'That address does not look right.' });
    const list = this.readQueue();
    if (!list.some(r => (r.addr || '').toLowerCase() === w.toLowerCase())) {
      list.push({ addr: w, ts: Date.now() });
      try { localStorage.setItem('hmb-waitlist', JSON.stringify(list)); } catch (e) {}
    }
    this.setState({ pass: this.makePass(w), queue: list.length, err: '', copied: false, dl: false, modalOn: true, flipped: false });
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
  };

  onReset = () => {
    try { document.body.style.overflow = ''; } catch (e) {}
    this.setState({ pass: null, wallet: '', err: '', copied: false, dl: false, flipped: false });
  };

  onClose = () => {
    try { document.body.style.overflow = ''; } catch (e) {}
    this.setState({ modalOn: false });
  };

  stop = ev => { ev.stopPropagation(); };

  tweet() {
    const p = this.state.pass;
    if (!p) return '';
    return 'I just claimed my spot in the Hood.\n\nHOOD PASS ' + p.no + ' · ' + p.tier.line + '\nWallet ' + p.short + '\n\n4,444 Boys. One Hood. Real financial utility.\nOwn. Borrow. Lend. Build. Repeat.\n\n@boymeetsh00d #BoyMeetsHood #NFTFi';
  }

  onPost = () => {
    const url = 'https://x.com/intent/post?text=' + encodeURIComponent(this.tweet()) + '&url=' + encodeURIComponent('https://boymeetshood.xyz');
    window.open(url, '_blank', 'noopener');
  };

  onCopy = () => {
    const txt = this.tweet();
    const done = () => { this.setState({ copied: true }); setTimeout(() => this.setState({ copied: false }), 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, done); else done();
  };

  onCardMove = ev => {
    const card = ev.currentTarget.querySelector('[data-pass-card]');
    if (!card) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width - 0.5;
    const py = (ev.clientY - r.top) / r.height - 0.5;
    card.style.transition = 'transform .08s linear';
    const f = this.state.flipped ? 180 : 0;
    card.style.transform = 'perspective(1500px) rotateY(' + (f + px * 14).toFixed(2) + 'deg) rotateX(' + (-py * 10).toFixed(2) + 'deg) translateY(-6px) scale(1.02)';
  };

  onCardLeave = ev => {
    const card = ev.currentTarget.querySelector('[data-pass-card]');
    if (!card) return;
    card.style.transition = 'transform .5s cubic-bezier(.2,1.2,.3,1)';
    card.style.transition = 'transform .8s cubic-bezier(.2,.9,.3,1)';
    card.style.transform = 'perspective(1500px) rotateY(' + (this.state.flipped ? 180 : 0) + 'deg) rotateX(0) translateY(0) scale(1)';
  };

  onDownload = async () => {
    const p = this.state.pass;
    if (!p) return;
    const W = 1200, H = 675, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const t = p.tier;
    const g = c.createLinearGradient(0, 0, W, H);
    const stops = t.stops;
    g.addColorStop(0, stops[0]); g.addColorStop(0.52, stops[1]); g.addColorStop(1, stops[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const sheen = c.createRadialGradient(W * 0.18, H * 0.1, 40, W * 0.18, H * 0.1, W * 0.9);
    sheen.addColorStop(0, 'rgba(255,255,255,.45)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sheen; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = 0.05; c.fillStyle = '#000';
    for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
    c.restore();
    c.fillStyle = '#0b0d11';
    c.beginPath(); c.arc(0, H / 2, 30, 0, 6.283); c.fill();
    c.beginPath(); c.arc(W, H / 2, 30, 0, 6.283); c.fill();

    try { await document.fonts.ready; } catch (e) {}
    const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    const art = await load(this.art(p.art));
    if (art) {
      const x = 80, y = 176, s = 320;
      c.save();
      c.beginPath();
      if (c.roundRect) c.roundRect(x, y, s, s, 40); else c.rect(x, y, s, s);
      c.clip();
      c.drawImage(art, x, y, s, s);
      const slices = [[0.18, 0.1, -14, '#ff3b5c'], [0.52, 0.08, 12, '#22e1ff'], [0.74, 0.06, -8, '#7c5cff']];
      slices.forEach(([sy, sh, dx, col]) => {
        c.globalAlpha = 0.85;
        c.drawImage(art, 0, art.height * sy, art.width, art.height * sh, x + dx, y + s * sy, s, s * sh);
        c.globalAlpha = 0.35; c.fillStyle = col;
        c.fillRect(x + dx, y + s * sy, s, s * sh);
        c.globalAlpha = 1;
      });
      c.restore();
    }
    const L = 452;
    c.fillStyle = t.ink;
    c.font = '800 40px "Baloo 2", sans-serif';
    c.fillText('BoyMeetsHood', L, 130);
    c.fillStyle = t.faint;
    c.font = '700 18px "Space Mono", monospace';
    c.fillText('HOOD PASS', L, 232);
    c.fillStyle = t.ink;
    c.font = '800 76px "Baloo 2", sans-serif';
    c.fillText(p.short, L, 312);
    c.fillStyle = t.muted;
    c.font = '700 22px "Space Mono", monospace';
    c.fillText(t.line, L, 356);
    c.fillText(p.no + '   ' + p.issued, L, 470);
    c.fillStyle = t.bar;
    let bx = W - 360;
    for (let i = 0; i < 42; i++) {
      const bh = 14 + ((p.seed >> i % 24) % 46);
      const bwid = (p.seed >> (i % 12)) % 3 === 0 ? 6 : 3;
      c.globalAlpha = 0.8;
      c.fillRect(bx, 560 - bh, bwid, bh);
      bx += bwid + 4;
      if (bx > W - 80) break;
    }
    c.globalAlpha = 1;
    c.fillStyle = t.muted;
    c.font = '700 18px "Space Mono", monospace';
    c.font = '800 30px "Baloo 2", sans-serif';
    c.fillStyle = t.ink;
    c.fillText(p.word, 80, 604);
    c.fillStyle = t.muted;
    c.font = '700 18px "Space Mono", monospace';
    c.fillStyle = t.faint;
    c.font = '400 16px "Space Mono", monospace';
    c.fillText('MOOD · ' + p.mood + '   ' + p.ink, 80, 638);
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = 'hood-pass-' + p.no.replace('#', '') + '.png';
    a.click();
    this.setState({ dl: true });
    setTimeout(() => this.setState({ dl: false }), 1800);
  };


  componentDidMount() {
    this.applyTheme();
    this.setState({ queue: this.readQueue().length });
    if (this.props.splashEnabled !== false) {
      const rip = this.props.glitchIntro !== false;
      this.setState({ splashOn: true });
      this.t1 = setTimeout(() => {
        this.setState({ splashOut: true });
        if (!rip) return;
        const core = document.querySelector('[data-splash-core]');
        if (core) core.style.animation = 'hmbChannelRip .62s steps(7,end) both';
      }, 1500);
      this.t2 = setTimeout(() => {
        this.setState({ splashOn: false, portalOn: rip });
        if (!rip) return;
        ['header', '[data-stage]'].forEach((sel, i) => {
          const el = document.querySelector(sel);
          if (!el) return;
          el.style.transformOrigin = 'center top';
          el.style.animation = 'hmbUnfold ' + (i ? '.86s' : '.62s') + ' cubic-bezier(.2,.85,.25,1) ' + (i ? '.06s' : '0s') + ' both';
          setTimeout(() => { el.style.animation = ''; el.style.transformOrigin = ''; }, 1200);
        });
      }, rip ? 2180 : 2400);
      this.t3 = setTimeout(() => this.setState({ portalOn: false }), 3200);
    }
    this.observeReveals();
    this.initTilt();
    this.initWeather();
    this.initCounters();
    this.initParallax();
    this.initHeroSwap();
  }

  initHeroSwap() {
    const slots = Array.from(document.querySelectorAll('[data-swap]'));
    if (!slots.length) return;
    const pool = ['wall','umbrella','dunk','pirate','soda','jungle','scooter','snow','truck','winter','hood','cosmic','kid','beam','doodle','flame','gold','bear','astro','vamp','king','ice','devil','alien','skull']
      .map(n => this.art(n));
    pool.forEach(src => { const p = new Image(); p.src = src; });
    this.swapTimers = [];

    const spots = [
      { left: '4%', top: '', right: '', bottom: '10%' },
      { left: '', top: '14%', right: '6%', bottom: '' },
      { left: '', top: '', right: '15%', bottom: '13%' },
      { left: '9%', top: '18%', right: '', bottom: '' },
      { left: '', top: '', right: '30%', bottom: '6%' },
      { left: '20%', top: '', right: '', bottom: '6%' },
      { left: '', top: '9%', right: '22%', bottom: '' },
      { left: '3%', top: '', right: '', bottom: '30%' },
      { left: '', top: '', right: '4%', bottom: '34%' },
      { left: '26%', top: '10%', right: '', bottom: '' }
    ];
    const taken = new Map();
    const move = box => {
      const free = spots.filter((s, i) => {
        for (const [el, idx] of taken) if (el !== box && idx === i) return false;
        return true;
      });
      const pick = free[(Math.random() * free.length) | 0];
      taken.set(box, spots.indexOf(pick));
      box.style.left = pick.left || 'auto';
      box.style.right = pick.right || 'auto';
      box.style.top = pick.top || 'auto';
      box.style.bottom = pick.bottom || 'auto';
    };

    const fire = slot => {
      const box = slot.parentElement;
      const scan = box && box.querySelector('[data-scan]');
      slot.style.animation = 'none';
      void slot.offsetWidth;
      slot.style.animation = 'hmbTvOut .34s steps(6,end) forwards';
      if (scan) { scan.style.animation = 'none'; void scan.offsetWidth; scan.style.animation = 'hmbScanFlash .85s linear'; }
      const swap = setTimeout(() => {
        const used = slots.map(s => s.getAttribute('src'));
        const free = pool.filter(p => used.indexOf(p) === -1);
        const next = free.length ? free[(Math.random() * free.length) | 0] : pool[(Math.random() * pool.length) | 0];
        slot.setAttribute('src', next);
        if (box) move(box);
        slot.style.animation = 'none';
        void slot.offsetWidth;
        slot.style.animation = 'hmbTvIn .5s steps(7,end) forwards';
      }, 340);
      this.swapTimers.push(swap);
      queue(slot);
    };

    const queue = slot => {
      const wait = 2600 + Math.random() * 4200;
      const t = setTimeout(() => fire(slot), wait);
      this.swapTimers.push(t);
    };

    slots.forEach((slot, i) => {
      const t = setTimeout(() => fire(slot), 2200 + i * 1300 + Math.random() * 1200);
      this.swapTimers.push(t);
    });
  }

  initParallax() {
    const nodes = Array.from(document.querySelectorAll('[data-para]'));
    if (!nodes.length) return;
    const upd = () => {
      const y = window.scrollY || 0;
      nodes.forEach(n => {
        const k = parseFloat(n.getAttribute('data-para')) || 0.15;
        n.style.transform = 'translate3d(0,' + (y * k).toFixed(1) + 'px,0)';
      });
      this.pRaf = 0;
    };
    this.onPara = () => { if (!this.pRaf) this.pRaf = requestAnimationFrame(upd); };
    window.addEventListener('scroll', this.onPara, { passive: true });
    upd();
  }

  initCounters() {
    const fmt = (v, dec, sep) => {
      let s = v.toFixed(dec);
      if (sep) {
        const parts = s.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        s = parts.join('.');
      }
      return s;
    };
    const run = el => {
      const to = parseFloat(el.getAttribute('data-count'));
      const dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      const sep = to >= 1000;
      const dur = 1400 + Math.min(600, to / 8);
      const t0 = performance.now();
      const frame = now => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e, dec, sep);
        if (p < 1) requestAnimationFrame(frame);
      };
      el.textContent = fmt(0, dec, sep);
      requestAnimationFrame(frame);
    };
    const nodes = Array.from(document.querySelectorAll('[data-count]'));
    if (!nodes.length) return;
    this.cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { run(e.target); this.cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    nodes.forEach(n => this.cio.observe(n));
  }

  initWeather() {
    let cv = document.querySelector('[data-weather]');
    if (!cv) return;
    let ctx = cv.getContext('2d');
    const sun = null, halo = null;
    const seasons = ['clear', 'snow', 'rain', 'leaves'];
    const leafColors = ['#ff9f5c', '#ff6b8a', '#c6a1ff', '#7cd8ff'];
    let W = 0, H = 0, season = 'clear', fade = 0;
    const P = [];

    const size = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * d; cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    size();
    this.onResize = () => size();
    window.addEventListener('resize', this.onResize);

    const spawn = (type, top) => ({
      type,
      x: Math.random() * W,
      y: top ? -20 - Math.random() * H * 0.4 : Math.random() * H,
      r: type === 'snow' ? 1.4 + Math.random() * 2.6 : type === 'leaves' ? 4 + Math.random() * 6 : 0,
      len: 10 + Math.random() * 16,
      vy: type === 'snow' ? 0.25 + Math.random() * 0.6 : type === 'rain' ? 6 + Math.random() * 5 : 0.7 + Math.random() * 1.1,
      vx: type === 'rain' ? 1.1 : 0,
      sway: Math.random() * Math.PI * 2,
      swaySpd: 0.006 + Math.random() * 0.014,
      rot: Math.random() * Math.PI,
      rotSpd: (Math.random() - 0.5) * 0.05,
      c: leafColors[(Math.random() * leafColors.length) | 0],
      a: 0.35 + Math.random() * 0.5
    });

    const setSeason = s => {
      if (s === season) return;
      season = s;
      if (sun) {
        const dim = s === 'rain' ? 0.35 : s === 'snow' ? 0.6 : 1;
        sun.style.opacity = dim;
        sun.style.filter = s === 'rain' ? 'blur(6px)' : 'none';
        if (halo) halo.style.opacity = dim;
      }
    };

    this.onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(0.999, Math.max(0, window.scrollY / max));
      setSeason(seasons[Math.floor(p * seasons.length)]);
    };
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();

    const tick = () => {
      const live = document.querySelector('[data-weather]');
      if (!live) { this.wRaf = requestAnimationFrame(tick); return; }
      if (live !== cv || live.clientWidth !== W || live.clientHeight !== H) {
        cv = live; ctx = cv.getContext('2d'); size();
      }
      const want = season === 'clear' ? 0 : season === 'rain' ? 150 : 90;
      fade += ((season === 'clear' ? 0 : 1) - fade) * 0.03;
      while (P.length < want) P.push(spawn(season, true));
      ctx.clearRect(0, 0, W, H);
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.sway += p.swaySpd;
        p.y += p.vy * (p.type === 'rain' ? 1 : 1);
        p.x += p.type === 'rain' ? p.vx : Math.sin(p.sway) * (p.type === 'snow' ? 0.7 : 1.3);
        p.rot += p.rotSpd;
        const off = p.y > H + 30 || p.x > W + 40 || p.x < -40;
        if (off || (p.type !== season && Math.random() < 0.02)) {
          if (P.length > want) { P.splice(i, 1); continue; }
          P[i] = spawn(season, true);
          continue;
        }
        ctx.globalAlpha = p.a * fade;
        if (p.type === 'snow') {
          ctx.fillStyle = '#eaf6ff';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        } else if (p.type === 'rain') {
          ctx.strokeStyle = 'rgba(180,225,255,.75)';
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2.2, p.y - p.len); ctx.stroke();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, 6.283); ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      this.wRaf = requestAnimationFrame(tick);
    };
    this.wRaf = requestAnimationFrame(tick);
  }

  initTilt() {
    const parseRGB = s => (s || '198,245,17').split(',').map(Number);
    this.tiltNodes = Array.from(document.querySelectorAll('[data-tilt]')).map(el => {
      const node = {
        el,
        matte: el.hasAttribute('data-matte'),
        a: parseRGB(el.getAttribute('data-glow')),
        b: parseRGB(el.getAttribute('data-glow2')),
        cur: { rx: 0, ry: 0, y: 0, s: 1, h: 0 },
        vel: { rx: 0, ry: 0, y: 0, s: 0, h: 0 },
        tgt: { rx: 0, ry: 0, y: 0, s: 1, h: 0 },
        live: false
      };
      el.style.transformStyle = 'preserve-3d';
      el.addEventListener('pointerenter', () => { node.live = true; this.glitch(el); });
      el.addEventListener('pointermove', ev => {
        const r = el.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width - 0.5;
        const py = (ev.clientY - r.top) / r.height - 0.5;
        node.tgt.ry = px * 13;
        node.tgt.rx = -py * 10;
        node.tgt.y = -10;
        node.tgt.s = 1.025;
        node.tgt.h = 1;
      });
      el.addEventListener('pointerleave', () => {
        node.tgt.rx = 0; node.tgt.ry = 0; node.tgt.y = 0; node.tgt.s = 1; node.tgt.h = 0;
      });
      return node;
    });
    if (this.tiltNodes.length) this.raf = requestAnimationFrame(this.step);
  }

  glitch(el) {
    const h = el.querySelector('h2,h3');
    if (!h) return;
    h.style.animation = 'none';
    void h.offsetWidth;
    h.style.animation = 'hmbCardGlitch .34s steps(3,end) 1';
  }

  step = () => {
    const K = 0.13, D = 0.74;
    this.tiltNodes.forEach(n => {
      let moving = false;
      ['rx', 'ry', 'y', 's', 'h'].forEach(k => {
        const d = n.tgt[k] - n.cur[k];
        n.vel[k] = (n.vel[k] + d * K) * D;
        n.cur[k] += n.vel[k];
        if (Math.abs(d) > 0.0008 || Math.abs(n.vel[k]) > 0.0008) moving = true;
      });
      if (!moving && !n.live) return;
      if (!moving) n.live = false;
      const c = n.cur;
      n.el.style.transform = 'perspective(1000px) rotateX(' + c.rx.toFixed(3) + 'deg) rotateY(' + c.ry.toFixed(3) + 'deg) translateY(' + c.y.toFixed(2) + 'px) scale(' + c.s.toFixed(4) + ')';
      const t = Math.max(0, Math.min(1, c.h));
      const mix = i => Math.round(n.a[i] + (n.b[i] - n.a[i]) * t);
      const rgb = mix(0) + ',' + mix(1) + ',' + mix(2);
      if (n.matte) {
        n.el.style.boxShadow = '0 ' + (18 + t * 12).toFixed(0) + 'px ' + (44 + t * 26).toFixed(0) + 'px -18px rgba(0,0,0,.9), 0 ' + (10 + t * 20).toFixed(0) + 'px ' + (30 + t * 40).toFixed(0) + 'px -20px rgba(' + rgb + ',' + (t * 0.75).toFixed(3) + ')';
        n.el.style.borderColor = 'rgba(' + rgb + ',' + (0.1 + t * 0.45).toFixed(3) + ')';
      } else {
        n.el.style.boxShadow = '0 ' + (16 + t * 14).toFixed(0) + 'px ' + (50 + t * 34).toFixed(0) + 'px -12px rgba(' + rgb + ',' + (0.6 + t * 0.3).toFixed(3) + ')';
      }
    });
    this.raf = requestAnimationFrame(this.step);
  };

  componentDidUpdate() { this.applyTheme(); }

  componentWillUnmount() {
    clearTimeout(this.t1); clearTimeout(this.t2); clearTimeout(this.t3); clearTimeout(this.revealTimer);
    if (this.swapTimers) this.swapTimers.forEach(clearTimeout);
    if (this.io) this.io.disconnect();
    if (this.cio) this.cio.disconnect();
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.wRaf) cancelAnimationFrame(this.wRaf);
    if (this.pRaf) cancelAnimationFrame(this.pRaf);
    if (this.onScroll) window.removeEventListener('scroll', this.onScroll);
    if (this.onPara) window.removeEventListener('scroll', this.onPara);
    if (this.onResize) window.removeEventListener('resize', this.onResize);
  }

  applyTheme() {
    const r = document.documentElement;
    if (this.props.accent) r.style.setProperty('--lime', this.props.accent);
    if (this.props.coolAccent) r.style.setProperty('--sky', this.props.coolAccent);
    const art = this.props.artStrength;
    r.style.setProperty('--hmb-art', String(art === undefined || art === null ? 0.9 : art));
  }

  observeReveals() {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    els.forEach(el => {
      el.style.opacity = '0';
      if (el.hasAttribute('data-tilt')) {
        el.style.transition = 'opacity .8s ease';
      } else {
        el.style.transform = 'translateY(28px)';
        el.style.transition = 'opacity .7s ease, transform .7s cubic-bezier(.2,.9,.3,1)';
      }
    });
    this.io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          if (!e.target.hasAttribute('data-tilt')) e.target.style.transform = 'none';
          this.io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(el => this.io.observe(el));
    this.revealTimer = setTimeout(() => {
      els.forEach(el => {
        el.style.opacity = '1';
        if (!el.hasAttribute('data-tilt')) el.style.transform = 'none';
      });
    }, 2200);
  }

  renderVals() {
    const out = this.state.splashOut;
    const names = ['wall', 'umbrella', 'dunk', 'pirate', 'soda', 'jungle', 'scooter', 'snow', 'truck', 'winter', 'hood', 'cosmic', 'kid', 'beam', 'doodle', 'flame', 'gold', 'bear', 'astro', 'vamp', 'king', 'ice', 'devil', 'alien', 'skull'];
    const nfts = names.map((n, i) => ({
      src: this.art(n),
      style: 'width:100%;height:100%;background:url(' + this.art(n) + ') center/cover no-repeat',
      id: '#' + String(i + 1).padStart(4, '0')
    }));
    const st = this.state;
    const p = st.pass;
    const t = p ? p.tier : this.MOODS[0];
    const ghost = !p;
    const seed = p ? p.seed : 12345;
    const bars = [];
    for (let i = 0; i < 22; i++) {
      const bh = 12 + ((seed >> (i % 20)) % 22);
      const bwid = (seed >> (i % 9)) % 3 === 0 ? 5 : 2;
      bars.push({ style: 'display:block;width:' + bwid + 'px;height:' + bh + 'px;background:' + (ghost ? 'rgba(255,255,255,.3)' : t.bar) });
    }
    const artUrl = this.art(p ? p.art : 'hood');
    const drops = [];
    for (let i = 0; i < 9; i++) {
      const pos = 8 + i * 10;
      const dl = (i * 0.7).toFixed(1);
      if (t.scene === 'rain') drops.push({ style: 'position:absolute;left:' + pos + '%;top:-8%;width:2px;height:' + (12 + (i % 3) * 4) + 'px;border-radius:2px;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.8));animation:hmbDrizzle ' + (2.4 + (i % 4) * 0.4) + 's linear infinite;animation-delay:-' + dl + 's' });
      else if (t.scene === 'snow') drops.push({ style: 'position:absolute;left:' + pos + '%;top:-8%;width:' + (4 + (i % 3) * 2) + 'px;height:' + (4 + (i % 3) * 2) + 'px;border-radius:50%;background:rgba(255,255,255,.9);animation:hmbSnow ' + (6 + (i % 4)) + 's linear infinite;animation-delay:-' + dl + 's' });
      else if (t.scene === 'dust') drops.push({ style: 'position:absolute;left:-12%;top:' + (10 + i * 9) + '%;width:' + (16 + (i % 4) * 8) + 'px;height:3px;border-radius:3px;background:rgba(255,214,160,.55);animation:hmbGust ' + (2.8 + (i % 4) * 0.5) + 's linear infinite;animation-delay:-' + dl + 's' });
      else drops.push({ style: 'position:absolute;left:-10%;top:' + (12 + i * 8) + '%;width:10px;height:6px;border-radius:60% 40% 60% 40%;background:rgba(196,255,214,.7);animation:hmbGust ' + (4.5 + (i % 4) * 0.8) + 's linear infinite;animation-delay:-' + dl + 's' });
    }
    const ready = !!st.followed && !!(st.wallet || '').trim();
    const okBtn = 'border:none;cursor:pointer;background:var(--lime,#c6f511);color:#0d0f12;font-family:\'Baloo 2\',cursive;font-weight:800;font-size:16px;padding:15px 26px;border-radius:16px;box-shadow:0 12px 30px rgba(198,245,17,.28);transition:transform .18s cubic-bezier(.2,1.4,.4,1)';
    return {
      splashOn: this.state.splashOn,
      splashOut: out && this.props.glitchIntro !== false,
      portalOn: this.state.portalOn,
      splashCaption: out ? 'BREACHING' : 'ENTERING THE HOOD',
      modalOn: st.modalOn,
      stageForm: !p,
      stagePass: !!p,
      onOpen: this.onOpen,
      onFlip: this.onFlip,
      flipLabel: st.flipped ? 'SHOW FRONT' : 'FLIP CARD',
      modalEyebrow: p ? 'WELCOME TO THE HOOD' : 'FOLLOW · PASTE WALLET · GET YOUR PASS',
      modalTitle: p ? 'Your Hood Pass is live' : 'Submit Waitlist',
      walletFull: p ? p.addr.toUpperCase() : '',
      moodTag: p ? p.mood : '—',
      moodLine: p ? t.line : 'MOOD · PENDING',
      skyStyle: 'position:absolute;inset:0;background:' + t.sky,
      showBolt: t.scene === 'rain',
      showRainbow: t.scene === 'green',
      showSun: t.scene === 'dust' || t.scene === 'green',
      sunStyle: t.scene === 'dust'
        ? 'position:absolute;right:14%;top:-26px;width:110px;height:110px;border-radius:50%;background:radial-gradient(circle,rgba(255,226,150,.95),rgba(255,150,60,.35) 58%,rgba(255,120,40,0) 76%);animation:hmbHeat 6s ease-in-out infinite'
        : 'position:absolute;left:8%;top:-30px;width:96px;height:96px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.85),rgba(255,255,210,.3) 58%,rgba(255,255,200,0) 78%);animation:hmbHeat 9s ease-in-out infinite',
      cloudA: this.cloud(t.cloud, { pos: 'left:-18%;bottom:8px', w: 168, h: 74, hi: '.5', blur: 4, op: '.9', dur: 34 }),
      cloudB: this.cloud(t.cloud, { pos: 'left:4%;top:6px', w: 120, h: 54, hi: '.42', blur: 5, op: '.6', dur: 46, delay: 18 }),
      drops: drops,
      moodWord: p ? p.word : '',
      flipperStyle: 'position:relative;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.2,.9,.3,1);'
        + 'transform:perspective(1500px) rotateY(' + (st.flipped ? 180 : 0) + 'deg)',
      backFaceStyle: 'position:absolute;inset:0;border-radius:30px;padding:2px;backface-visibility:hidden;transform:rotateY(180deg);'
        + 'background:linear-gradient(140deg,rgba(201,182,255,.95),rgba(34,225,255,.7) 58%,rgba(124,92,255,.95))',
      backArtStyle: 'position:absolute;inset:0;background:url(' + artUrl + ') center/cover no-repeat;opacity:.24;filter:saturate(1.2)',
      onClose: this.onClose,
      stop: this.stop,
      tierBg: t.bg,
      inkLine: p ? p.ink : 'BOYS-PENDING',
      passCardStyle: 'position:relative;border-radius:30px;padding:2px;transform-style:preserve-3d;'
        + 'background:linear-gradient(115deg,#c9b6ff,#22e1ff,#c6f511,#ff6bd5,#c9b6ff);background-size:200% 100%;'
        + 'box-shadow:0 0 0 1px rgba(255,255,255,.2),0 30px 90px -20px rgba(124,92,255,.85),0 0 120px -30px rgba(34,225,255,.6);'
        + 'animation:hmbEdge 9s linear infinite,hmbPassIn .85s cubic-bezier(.2,1,.3,1) both',
      queueLabel: st.queue > 0 ? String(st.queue).padStart(3, '0') + ' WALLETS IN QUEUE' : 'QUEUE OPEN',
      followUrl: 'https://x.com/intent/follow?screen_name=boymeetsh00d',
      followLabel: st.followed ? 'FOLLOWING ✓' : 'FOLLOW @BOYMEETSH00D',
      onFollow: this.onFollow,
      onWallet: this.onWallet,
      onKey: this.onKey,
      onSubmit: this.onSubmit,
      onReset: this.onReset,
      onPost: this.onPost,
      onCopy: this.onCopy,
      onDownload: this.onDownload,
      onCardMove: this.onCardMove,
      onCardLeave: this.onCardLeave,
      wallet: st.wallet,
      hasPass: !!p,
      step1Bg: st.followed ? '#c6f511' : 'rgba(255,255,255,.25)',
      step2Bg: st.wallet ? '#c6f511' : 'rgba(255,255,255,.25)',
      step3Bg: p ? '#c6f511' : 'rgba(255,255,255,.25)',
      inputBorder: st.err ? 'rgba(255,59,92,.8)' : 'rgba(255,255,255,.14)',
      hint: st.err || 'ANY EVM ADDRESS OR ENS NAME',
      hintColor: st.err ? '#ff3b5c' : 'rgba(255,255,255,.4)',
      submitStyle: ready
        ? okBtn
        : okBtn.replace('cursor:pointer', 'cursor:not-allowed')
            .replace('var(--lime,#c6f511)', 'rgba(255,255,255,.12)')
            .replace('color:#0d0f12', 'color:rgba(255,255,255,.45)')
          + ';box-shadow:none;border:1px solid rgba(255,255,255,.14)',
      submitLabel: ready ? 'GENERATE MY PASS' : st.followed ? 'PASTE WALLET TO CONTINUE' : 'FOLLOW FIRST',
      submitHover: ready ? 'transform:translateY(-2px)' : 'transform:none',
      tweetText: this.tweet(),
      copyLabel: st.copied ? 'COPIED ✓' : 'COPY TEXT',
      dlLabel: st.dl ? 'SAVED ✓' : 'DOWNLOAD CARD',
      cardStyle: 'position:relative;overflow:hidden;border-radius:28px;padding:26px;min-height:270px;transform-style:preserve-3d;'
        + 'background:' + (ghost ? 'linear-gradient(135deg,#1b2033,#15182a 55%,#1d2440)' : t.bg) + ';'
        + 'box-shadow:0 26px 60px -18px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.14) inset;'
        + (p ? 'animation:hmbTicketIn .8s cubic-bezier(.2,1,.3,1) both' : 'opacity:.55'),
      cardInk: ghost ? 'rgba(255,255,255,.9)' : t.ink,
      cardMuted: ghost ? 'rgba(255,255,255,.55)' : t.muted,
      cardFaint: ghost ? 'rgba(255,255,255,.4)' : t.faint,
      cardRule: ghost ? 'rgba(255,255,255,.2)' : t.rule,
      walletShort: p ? p.short : '0x0000…0000',
      passNo: p ? 'PASS ' + p.no : 'PASS #????',
      issued: p ? p.issued : 'AWAITING SUBMISSION',
      artLayer: 'position:absolute;inset:0;background:url(' + artUrl + ') center/cover no-repeat;animation:hmbTvCycle 9s steps(1,end) infinite',
      bars: bars,
      cardCaption: p ? 'RANDOM ART · GLITCH PASS · SHAREABLE' : 'YOUR PASS APPEARS HERE',
      nfts: nfts,
      nftsAlt: nfts.slice().reverse(),
      splashStyle: 'position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;overflow:hidden;'
        + 'background:var(--lime,#c6f511);transform-origin:center;'
        + (out
          ? (this.props.glitchIntro !== false
            ? 'pointer-events:none;animation:hmbCollapse .68s cubic-bezier(.7,0,.25,1) both'
            : 'pointer-events:none;opacity:0;transition:opacity .8s ease')
          : 'opacity:1')
    };
  }
}

export default Component;
