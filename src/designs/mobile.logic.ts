/* AUTO-GENERATED from design-source/mobile.dc.html — do not edit by hand.
   Re-export the design from Claude Design, drop it in, then: npm run designs */
/* eslint-disable */
// @ts-nocheck
import { DCLogic } from '@/dc/DCLogic';

const R = k => (window.__resources && window.__resources[k]) || '/assets/nft/' + k + '-sm.png';
const CAT = [
  { n: 'ice', t: 'FROST', c: '#39c6f5' }, { n: 'flame', t: 'EMBER', c: '#ff6b18' },
  { n: 'cosmic', t: 'COSMIC', c: '#7c5cff' }, { n: 'gold', t: 'GILDED', c: '#ffd23b' },
  { n: 'king', t: 'CROWNED', c: '#ffd23b' }, { n: 'bear', t: 'BEAR', c: '#c6f511' },
  { n: 'devil', t: 'DEVIL', c: '#ff3b5c' }, { n: 'jungle', t: 'JUNGLE', c: '#c6f511' },
  { n: 'skull', t: 'SKULL', c: '#e6e8ee' }, { n: 'astro', t: 'ASTRO', c: '#22e1ff' },
  { n: 'alien', t: 'ALIEN', c: '#8ef511' }, { n: 'pirate', t: 'PIRATE', c: '#ff9a1f' },
  { n: 'snow', t: 'SNOW', c: '#dff3ff' }, { n: 'truck', t: 'HAULER', c: '#39c6f5' },
  { n: 'scooter', t: 'RUNNER', c: '#c6f511' }, { n: 'hood', t: 'HOODED', c: '#7c5cff' },
  { n: 'umbrella', t: 'RAINY', c: '#22e1ff' }, { n: 'vamp', t: 'VAMP', c: '#ff3b5c' },
  { n: 'kid', t: 'KID', c: '#ffd23b' }, { n: 'dunk', t: 'DUNK', c: '#ff6b18' },
  { n: 'soda', t: 'SODA', c: '#ff3b5c' }, { n: 'beam', t: 'BEAM', c: '#22e1ff' },
  { n: 'doodle', t: 'DOODLE', c: '#c6f511' }, { n: 'winter', t: 'WINTER', c: '#dff3ff' },
  { n: 'wall', t: 'WALL', c: '#e6e8ee' }
];

const TOOLS = [
  { name: 'Hood Credit', blurb: 'Borrow against your NFT without selling it. P2P offers, lending pools, BNPL.', src: R('ice'), g: '57,198,245', color: '#39c6f5', to: 'credit' },
  { name: 'Hood AutoMint', blurb: 'Non-custodial minting terminal. Free for holders. Less clicking, less panic.', src: R('jungle'), g: '198,245,17', color: '#c6f511', to: 'automint' },
  { name: 'Hood Treasury', blurb: 'Protocol revenue, routed by contract. The 70/30 flywheel.', src: R('devil'), g: '255,59,92', color: '#ff3b5c', to: 'treasury' },
  { name: 'JUICE', blurb: 'The Hood needs a scoreboard. Earn it by actually using the protocol.', src: R('cosmic'), g: '124,92,255', color: '#22e1ff', to: 'juice' }
];

const FLYWHEEL = ['NFT', 'Token-Bound Account', 'Hood Credit', 'Lending', 'AutoMint', 'Hood Treasury', 'More products'];
const ASSETS = ['ETH', 'Stablecoins', 'NFTs', 'Tokenized assets', 'Protocol rewards', 'Other approved assets'];

const ROADMAP = [
  { tag: 'PHASE 01 · NEXT', name: 'Genesis mint', desc: '4,444 Boys on Robinhood Chain. Allowlist first, then public.', live: 1 },
  { tag: 'PHASE 02', name: 'Token-Bound Accounts', desc: 'ERC-6551 account deployed per Boy. The Boy becomes the wallet.' },
  { tag: 'PHASE 03', name: 'Hood Credit', desc: 'P2P offers and lending pools open. Collateral held in contract escrow.' },
  { tag: 'PHASE 04', name: 'AutoMint terminal', desc: 'Non-custodial mint automation, free for holders.' },
  { tag: 'PHASE 05', name: 'Treasury reporting', desc: 'Fee routing live and publicly verifiable where technically possible.' },
  { tag: 'PHASE 06', name: 'JUICE season one', desc: 'Activity points begin accruing across the ecosystem.' }
];

const AUTOROWS = [
  { k: 'Target collection', v: 'PRE-DEPLOY' },
  { k: 'Mint quantity', v: 'UP TO 3' },
  { k: 'Maximum gas', v: 'YOUR CAP' },
  { k: 'Maximum spend', v: 'YOUR CAP' },
  { k: 'Execution condition', v: 'PHASE = PUBLIC' }
];

const REVENUE = [
  { k: 'Loan origination', v: '1.0%', color: '#c6f511' },
  { k: 'BNPL facilitation', v: '1.5%', color: '#c6f511' },
  { k: 'Liquidation spread', v: 'up to 2.0%', color: '#c6f511' },
  { k: 'Premium tools', v: 'Variable', color: 'rgba(255,255,255,.6)' },
  { k: 'Other protocol services', v: 'Variable', color: 'rgba(255,255,255,.6)' }
];

const EARN = ['Lending', 'Borrowing', 'Providing liquidity', 'Using protocol products', 'Holding / participating', 'Ecosystem campaigns'];
const SPEND = ['Access', 'Allowlists', 'Fee discounts', 'Drops', 'Community rewards', 'Product perks'];

const JUMPS = [
  ['home', 'HOME'], ['waitlist', 'WAITLIST'], ['pass', 'HOOD PASS'], ['vision', 'VISION'], ['toolkit', 'TOOLKIT'], ['credit', 'CREDIT'],
  ['automint', 'AUTOMINT'], ['treasury', 'TREASURY'], ['juice', 'JUICE'], ['roadmap', 'ROADMAP'], ['peek', 'PEEK']
];
const TABS = [['home', 'HOME'], ['vision', 'VISION'], ['waitlist', 'WAITLIST'], ['toolkit', 'TOOLKIT'], ['peek', 'PEEK']];

const MOODS = [
  { k: 'MOODY SAD', c: '#a89cff', line: 'Thunder in the charts, calm in the Hood.', wx: 'rain' },
  { k: 'ANGRY', c: '#ff9a3b', line: 'Dry heat, hard wind, still standing.', wx: 'desert' },
  { k: 'HAPPY', c: '#c6f511', line: 'Green light, open air, easy breathing.', wx: 'green' },
  { k: 'NERVOUS', c: '#8fd8ff', line: 'Cold feet, warm bag, holding anyway.', wx: 'snow' }
];

const NO = 'pointer-events:none;';
const cloud = (c, op, x, y, w, dur) => NO + 'position:absolute;left:' + x + '%;top:' + y + '%;width:' + w + 'px;height:' + Math.round(w * 0.44) + 'px;opacity:' + op
  + ';filter:blur(5px);animation:hmbDrift ' + dur + 's ease-in-out infinite alternate;background:'
  + 'radial-gradient(circle at 20% 70%,' + c + ' 0 26%,transparent 27%),'
  + 'radial-gradient(circle at 44% 42%,' + c + ' 0 34%,transparent 35%),'
  + 'radial-gradient(circle at 70% 64%,' + c + ' 0 27%,transparent 28%),'
  + 'radial-gradient(circle at 48% 78%,' + c + ' 0 30%,transparent 31%)';
const drops = (c, dur) => NO + 'position:absolute;left:0;right:0;top:-100%;height:200%;animation:hmbRain ' + dur + 's linear infinite;'
  + 'background-image:radial-gradient(ellipse 1px 6px at 24% 16%,' + c + ' 0 100%,transparent 101%),'
  + 'radial-gradient(ellipse 1px 5px at 68% 58%,' + c + ' 0 100%,transparent 101%),'
  + 'radial-gradient(ellipse 1px 7px at 46% 82%,' + c + ' 0 100%,transparent 101%);'
  + 'background-size:82px 104px,126px 138px,158px 176px';

const WXBG = {
  rain: [
    NO + 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(24,32,62,.42),rgba(7,9,18,.72))',
    NO + 'position:absolute;inset:0;background:radial-gradient(135% 74% at 26% -16%,rgba(40,48,82,.8),transparent 64%)',
    drops('rgba(206,224,255,.55)', 1.1)
  ],
  desert: [
    NO + 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,148,36,.32),rgba(104,44,10,.78))',
    NO + 'position:absolute;inset:0;background:radial-gradient(58% 42% at 76% 10%,rgba(255,216,128,.75),transparent 62%)'
  ],
  green: [
    NO + 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(126,232,140,.24),rgba(8,38,20,.66))',
    NO + 'position:absolute;inset:0;background:linear-gradient(158deg,rgba(255,255,255,.18),transparent 46%)'
  ],
  snow: [
    NO + 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(176,220,255,.32),rgba(8,20,42,.72))',
    NO + 'position:absolute;inset:0;box-shadow:inset 0 0 54px rgba(214,242,255,.6)'
  ]
};

const WXFX = {
  rain: [
    cloud('#8f9dc4', .3, 4, 2, 168, 16),
    cloud('#7d8ab0', .24, 46, 62, 148, 21),
    NO + 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(220,236,255,.85),rgba(220,236,255,0) 56%);opacity:0;animation:hmbFlash 7s steps(1,end) infinite'
  ],
  desert: [
    cloud('#ffdca8', .2, 4, 2, 168, 18),
    cloud('#ffcf90', .14, 46, 64, 148, 24),
    NO + 'position:absolute;left:0;right:0;bottom:0;height:44%;background:linear-gradient(180deg,transparent,rgba(255,196,110,.4));animation:hmbShimmer 3.4s ease-in-out infinite'
  ],
  green: [
    cloud('#ffffff', .42, 4, 2, 172, 19),
    cloud('#eafff0', .3, 46, 62, 150, 26),
    NO + 'position:absolute;inset:0;box-shadow:inset 0 -40px 60px -30px rgba(120,220,130,.5)'
  ],
  snow: [
    cloud('#eaf6ff', .34, 4, 2, 170, 20),
    cloud('#dceeff', .24, 46, 64, 150, 27),
    NO + 'position:absolute;left:0;right:0;top:-100%;height:200%;background-image:radial-gradient(circle,rgba(255,255,255,.9) 1.2px,transparent 1.6px),radial-gradient(circle,rgba(255,255,255,.62) 1px,transparent 1.4px);background-size:52px 52px,34px 34px;background-position:0 0,18px 11px;animation:hmbSnow 7s linear infinite'
  ]
};
const BARS = [26, 12, 20, 8, 24, 16, 6, 22, 14, 26, 10, 18, 24, 8, 20, 12, 26, 16];
const PERKS = [
  { t: 'Holds your place in the queue with a number you can check' },
  { t: 'Mint-phase alerts land before public opens' },
  { t: 'First read on Hood Credit and AutoMint when they ship' },
  { t: 'Invite code — friends who join with it move you up' }
];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const TITLES = {
  home: ['Genesis is coming', 'ROBINHOOD CHAIN · PRE-MINT'],
  vision: ['The vision', 'WHY THE BOY EXISTS'],
  toolkit: ['The Hood Toolkit', 'EVERYTHING SHIPS AFTER MINT'],
  credit: ['Hood Credit', 'PLANNED · NFT LENDING'],
  automint: ['Hood AutoMint', 'PLANNED · MINT TERMINAL'],
  treasury: ['Hood Treasury', 'PLANNED · 70/30 FLYWHEEL'],
  juice: ['JUICE', 'PLANNED · ACTIVITY POINTS'],
  roadmap: ['Roadmap', 'ORDER OF OPERATIONS'],
  peek: ['NFTs sneak peek', '4,444 BOYS · TRAITS IN PROGRESS'],
  waitlist: ['Join the waitlist', 'THREE STEPS · NO SIGNATURE'],
  pass: ['Your Hood Pass', 'WAITLIST CONFIRMED']
};

const ROOTS = { home: 1, vision: 1, toolkit: 1, peek: 1, waitlist: 1 };

class Component extends DCLogic {
  state = {
    splashOn: true, splashOut: false, worldIn: false,
    screen: 'home', tab: 'home',
    showNotify: false, subscribed: false,
    wallet: '', followed: false, joined: false, flipped: false, queue: 11, pass: null,
    toast: '', now: Date.now()
  };

  componentDidMount() {
    this.lastScreen = this.state.screen;
    this.target = Date.now() + 11 * 864e5 + 6 * 36e5 + 42 * 6e4 + 18e3;
    if (this.props.splash === false) {
      this.setState({ splashOn: false });
    } else {
      this.t1 = setTimeout(() => this.setState({ splashOut: true }), 1500);
      this.t2 = setTimeout(() => {
        this.setState({ splashOn: false, worldIn: true });
        const el = document.querySelector('[data-scroll]');
        const hd = document.querySelector('[data-appbar]');
        [el, hd].forEach((n, i) => {
          if (!n) return;
          n.style.animation = 'none';
          void n.offsetWidth;
          n.style.animation = 'hmbWorldIn ' + (i ? .46 : .58) + 's steps(9,end) 1';
        });
      }, 2380);
      this.t3 = setTimeout(() => this.setState({ worldIn: false }), 3100);
    }
    this.tick = setInterval(() => this.setState({ now: Date.now() }), 1000);
    this.applyTheme();
  }

  componentDidUpdate() {
    this.applyTheme();
    if (this.lastScreen !== this.state.screen) {
      this.lastScreen = this.state.screen;
      const el = document.querySelector('[data-scroll]');
      if (el) {
        el.scrollTop = 0;
        if (this.props.glitch !== false) {
          el.style.animation = 'none';
          void el.offsetWidth;
          el.style.animation = 'hmbTvIn .42s steps(7,end) 1';
        }
      }
    }
  }

  componentWillUnmount() {
    clearTimeout(this.t1); clearTimeout(this.t2); clearTimeout(this.t3); clearTimeout(this.toastT); clearInterval(this.tick);
  }

  applyTheme() {
    if (this.props.accent) document.documentElement.style.setProperty('--lime', this.props.accent);
  }

  go = s => this.setState({ screen: s, tab: ROOTS[s] ? s : this.state.tab });

  flash = msg => {
    clearTimeout(this.toastT);
    this.setState({ toast: msg });
    this.toastT = setTimeout(() => this.setState({ toast: '' }), 2800);
  };

  subscribe = name => {
    this.setState({ subscribed: true, showNotify: false });
    this.flash('YOU\u2019RE ON THE LIST \u00B7 ' + name.toUpperCase());
  };

  hash = str => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  };

  walletState = () => {
    const w = this.state.wallet.trim();
    if (!w) return 'empty';
    if (/^0x[a-fA-F0-9]{40}$/.test(w)) return 'evm';
    if (/^[a-zA-Z0-9-]{3,}\.eth$/.test(w)) return 'ens';
    if (w.length >= 6) return 'loose';
    return 'short';
  };

  copy = (text, msg) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch (e) { /* clipboard blocked in preview */ }
    this.flash(msg);
  };

  submit = () => {
    const st = this.walletState();
    if (st === 'empty' || st === 'short') { this.flash('PASTE A WALLET ADDRESS OR ENS NAME'); return; }
    if (!this.state.followed) { this.flash('FOLLOW @BOYMEETSH00D FIRST'); return; }
    const w = this.state.wallet.trim();
    const h = this.hash(w.toLowerCase());
    const hex = h.toString(16).toUpperCase().padStart(8, '0');
    const m = MOODS[h % MOODS.length];
    const cat = CAT[(h >>> 4) % CAT.length];
    const d = new Date();
    this.setState({
      joined: true, flipped: false, queue: this.state.queue + 1, screen: 'pass',
      pass: {
        num: '#' + String(h % 4444).padStart(4, '0'),
        ink: 'BOYS-' + hex.slice(0, 4) + '-' + hex.slice(4, 8),
        mood: m.k, moodColor: m.c, moodLine: m.line, wx: m.wx,
        src: R(cat.n),
        short: w.length > 13 ? w.slice(0, 6) + '…' + w.slice(-4) : w,
        full: w.toUpperCase(),
        date: MONTHS[d.getMonth()] + ' / ' + d.getFullYear(),
        code: 'HOOD-' + hex.slice(0, 4)
      }
    });
    this.flash('YOU\u2019RE IN THE QUEUE \u00B7 PASS #' + String(h % 4444).padStart(4, '0'));
  };

  renderVals() {
    const s = this.state;
    const ms = Math.max(0, (this.target || 0) - s.now);
    const pad = n => String(n).padStart(2, '0');
    const title = TITLES[s.screen] || TITLES.home;
    const art = i => ({ src: R(CAT[i % CAT.length].n), tier: CAT[i % CAT.length].t, color: CAT[i % CAT.length].c });

    const wState = this.walletState();
    const done1 = s.followed ? 1 : 0;
    const done2 = (wState === 'evm' || wState === 'ens' || wState === 'loose') ? 1 : 0;
    const stepNow = s.joined ? 3 : done1 && done2 ? 3 : done1 ? 2 : 1;
    const canSubmit = !!(done1 && done2) && !s.joined;
    const NOTES = {
      empty: ['ANY EVM ADDRESS OR ENS NAME', 'rgba(255,255,255,.38)'],
      evm: ['VALID EVM ADDRESS', '#c6f511'],
      ens: ['ENS NAME · RESOLVED AT DROP', '#c6f511'],
      loose: ['NOT AN EVM FORMAT — SAVED EXACTLY AS TYPED', '#ffd23b'],
      short: ['TOO SHORT — CHECK THE ADDRESS', '#ff3b5c']
    };
    const wNote = NOTES[wState] || NOTES.empty;
    const stepDot = done => 'flex:0 0 auto;width:26px;height:26px;border-radius:50%;font-family:\'Space Mono\',monospace;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:2px;'
      + (done ? 'background:var(--lime,#c6f511);color:#0b0d11' : 'background:rgba(255,255,255,.09);color:rgba(255,255,255,.6)');
    const p = s.pass;
    const wxKey = (p && p.wx) || 'rain';
    const shareText = p
      ? 'I just claimed my spot in the Hood.\n\nHOOD PASS ' + p.num + ' · MOOD · ' + p.mood + '\nWallet ' + p.short
        + '\n\n4,444 Boys. One Hood. Real financial utility.\nOwn. Borrow. Lend. Build. Repeat.\n\n@boymeetsh00d #BoyMeetsHood #NFTFi'
      : '';

    const tabIcon = (on, i) => {
      const c = on ? 'var(--lime,#c6f511)' : 'rgba(255,255,255,.42)';
      const base = 'display:block;width:19px;height:19px;margin-bottom:5px;';
      if (i === 0) return base + 'border:2px solid ' + c + ';border-radius:4px 4px 3px 3px;clip-path:polygon(0 38%,50% 0,100% 38%,100% 100%,0 100%)';
      if (i === 1) return base + 'border:2px solid ' + c + ';border-radius:50%;background:linear-gradient(180deg,transparent 44%,' + c + ' 44%,' + c + ' 56%,transparent 56%)';
      if (i === 2) return base + 'border:2px solid ' + c + ';border-radius:5px;background:radial-gradient(circle at 50% 50%,' + c + ' 0 2.5px,transparent 2.6px)';
      if (i === 3) return base + 'border:2px solid ' + c + ';border-radius:3px;background:linear-gradient(180deg,transparent 46%,' + c + ' 46%,' + c + ' 54%,transparent 54%)';
      return base + 'border:2px solid ' + c + ';border-radius:50% 50% 50% 6px;transform:rotate(-45deg)';
    };

    return {
      splashOn: s.splashOn, splashOut: s.splashOut, worldIn: s.worldIn,
      splashWord: s.splashOut ? 'BREACHING' : 'ENTERING THE HOOD',
      splashStyle: 'position:absolute;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--lime,#c6f511);'
        + (s.splashOut ? 'pointer-events:none;animation:hmbPortal .88s steps(8,end) both' : ''),

      headTitle: title[0], headSub: title[1],
      canBack: !ROOTS[s.screen], atRoot: !!ROOTS[s.screen],
      back: () => this.go(s.screen === 'pass' ? 'waitlist' : s.screen === 'roadmap' ? 'home' : 'toolkit'),
      subscribed: s.subscribed, notSubscribed: !s.subscribed,
      showNotify: s.showNotify,
      openNotify: () => this.setState({ showNotify: true }),
      closeNotify: () => this.setState({ showNotify: false }),
      toast: s.toast,

      isHome: s.screen === 'home', isVision: s.screen === 'vision', isToolkit: s.screen === 'toolkit',
      isCredit: s.screen === 'credit', isAuto: s.screen === 'automint', isTreasury: s.screen === 'treasury',
      isJuice: s.screen === 'juice', isRoadmap: s.screen === 'roadmap', isPeek: s.screen === 'peek',

      goVision: () => this.go('vision'), goRoadmap: () => this.go('roadmap'), goPeek: () => this.go('peek'),

      cdD: pad(Math.floor(ms / 864e5)), cdH: pad(Math.floor(ms / 36e5) % 24),
      cdM: pad(Math.floor(ms / 6e4) % 60), cdS: pad(Math.floor(ms / 1e3) % 60),

      notifyBtnLabel: s.subscribed ? 'ALERT IS ON · MANAGE' : 'NOTIFY ME AT MINT',
      notifyBtnStyle: 'width:100%;min-height:52px;border-radius:18px;cursor:pointer;font-family:\'Baloo 2\',cursive;font-weight:800;font-size:17px;'
        + (s.subscribed
          ? 'border:1px solid rgba(198,245,17,.4);background:rgba(198,245,17,.1);color:var(--lime,#c6f511)'
          : 'border:none;background:var(--lime,#c6f511);color:#0b0d11;box-shadow:0 14px 34px -14px rgba(198,245,17,.7)'),

      tools: TOOLS.map(t => ({
        name: t.name.replace('Hood ', ''), blurb: t.blurb, src: t.src, go: () => this.go(t.to),
        cardStyle: 'position:relative;flex:0 0 auto;width:214px;height:214px;padding:0;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#12141a;cursor:pointer;display:flex;flex-direction:column;box-shadow:0 14px 34px -18px rgba(' + t.g + ',.8)',
        scrim: 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,20,26,0) 26%,rgba(18,20,26,.82) 62%,#12141a 100%)'
      })),
      toolkitList: TOOLS.map(t => ({ name: t.name, blurb: t.blurb, src: t.src, color: t.color, go: () => this.go(t.to) })),

      peekRow: [7, 11, 3, 18, 22, 9, 14, 1, 20, 5].map(art),
      gallery: [4, 0, 6, 21, 9, 2, 12, 19, 15, 8, 23, 10, 17, 1].map(art),

      assets: ASSETS.map(n => ({ n: n })),
      flywheel: FLYWHEEL.map((f, i) => ({
        n: i + 1, name: f,
        dot: 'flex:0 0 auto;width:24px;height:24px;border-radius:50%;font-family:\'Space Mono\',monospace;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;'
          + (i === FLYWHEEL.length - 1 ? 'background:var(--lime,#c6f511);color:#0b0d11' : 'background:rgba(255,255,255,.08);color:rgba(255,255,255,.65)'),
        label: 'font-family:\'Baloo 2\',cursive;font-weight:700;font-size:15.5px;'
          + (i === FLYWHEEL.length - 1 ? 'color:var(--lime,#c6f511)' : 'color:rgba(255,255,255,.85)')
      })),

      autoRows: AUTOROWS,
      revenue: REVENUE,
      earn: EARN.map(n => ({ name: n })),
      spend: SPEND.map(n => ({ name: n })),

      roadmap: ROADMAP.map((r, i) => ({
        tag: r.tag, name: r.name, desc: r.desc,
        tagColor: r.live ? 'var(--lime,#c6f511)' : 'rgba(255,255,255,.35)',
        dot: 'display:block;width:12px;height:12px;border-radius:50%;margin-top:4px;flex:0 0 auto;'
          + (r.live ? 'background:var(--lime,#c6f511);box-shadow:0 0 0 4px rgba(198,245,17,.16)' : 'background:rgba(255,255,255,.16)'),
        line: 'display:block;flex:1;width:1px;background:rgba(255,255,255,.12);margin-top:6px;'
          + (i === ROADMAP.length - 1 ? 'opacity:0' : '')
      })),

      channels: [
        { name: 'Push notifications', meta: 'THIS DEVICE · INSTANT', initial: 'P', c: '#c6f511' },
        { name: 'Email', meta: 'ONE MESSAGE PER PHASE', initial: '@', c: '#39c6f5' },
        { name: 'Add to calendar', meta: 'ESTIMATED MINT WINDOW', initial: '31', c: '#7c5cff' }
      ].map(c => ({
        name: c.name, meta: c.meta, initial: c.initial, pick: () => this.subscribe(c.name),
        mark: 'flex:0 0 auto;width:36px;height:36px;border-radius:11px;background:' + c.c + ';color:#0b0d11;font-family:\'Baloo 2\',cursive;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center'
      })),

      isWaitlist: s.screen === 'waitlist', isPass: s.screen === 'pass',
      goWaitlist: () => this.go('waitlist'),
      goPass: () => this.go(s.pass ? 'pass' : 'waitlist'),
      joined: s.joined, notJoined: !s.joined,
      passChip: s.pass ? 'PASS ' + s.pass.num : 'HOOD PASS',
      waitBtnLabel: s.joined ? 'VIEW YOUR HOOD PASS' : 'JOIN THE WAITLIST',
      waitBtnStyle: 'width:100%;min-height:54px;border-radius:18px;cursor:pointer;font-family:\'Baloo 2\',cursive;font-weight:800;font-size:18px;'
        + (s.joined
          ? 'border:1px solid rgba(198,245,17,.4);background:rgba(198,245,17,.1);color:var(--lime,#c6f511)'
          : 'border:none;background:var(--lime,#c6f511);color:#0b0d11;box-shadow:0 14px 34px -14px rgba(198,245,17,.7)'),

      queueStr: String(s.queue).padStart(3, '0') + ' WALLETS',
      stepLabel: 'STEP ' + stepNow + ' OF 3',
      progressFill: 'height:100%;border-radius:99px;background:var(--lime,#c6f511);transition:width .35s ease;width:' + (done1 + done2 + (s.joined ? 1 : 0)) * 33.4 + '%',
      dot1: stepDot(done1), dot1Mark: done1 ? '✓' : '1',
      dot2: stepDot(done2), dot2Mark: done2 ? '✓' : '2',
      dot3: stepDot(s.joined), dot3Mark: s.joined ? '✓' : '3',

      followTap: () => {
        try { window.open('https://x.com/boymeetsh00d', '_blank', 'noopener'); } catch (e) {}
        this.setState({ followed: true });
        this.flash('OPENED X · FOLLOW CHECK PENDING AT DROP');
      },
      followLabel: s.followed ? 'FOLLOWING @BOYMEETSH00D' : 'FOLLOW @BOYMEETSH00D',
      followStyle: 'margin-top:10px;width:100%;min-height:50px;border-radius:16px;cursor:pointer;font-family:\'Baloo 2\',cursive;font-weight:800;font-size:15px;letter-spacing:.2px;'
        + (s.followed
          ? 'border:1px solid rgba(198,245,17,.45);background:rgba(198,245,17,.12);color:var(--lime,#c6f511)'
          : 'border:none;background:#fff;color:#0b0d11'),

      wallet: s.wallet,
      hasWallet: s.wallet.length > 0,
      onWallet: e => this.setState({ wallet: e.target.value }),
      clearWallet: () => this.setState({ wallet: '' }),
      walletNote: wNote[0],
      walletNoteStyle: 'font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.14em;line-height:1.6;margin-top:8px;color:' + wNote[1],

      submitLabel: s.joined ? 'PASS ALREADY ISSUED' : 'GENERATE MY PASS',
      submitStyle: 'width:100%;min-height:56px;border-radius:20px;cursor:pointer;font-family:\'Baloo 2\',cursive;font-weight:800;font-size:19px;'
        + (canSubmit
          ? 'border:none;background:var(--lime,#c6f511);color:#0b0d11;box-shadow:0 16px 38px -14px rgba(198,245,17,.75)'
          : 'border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(255,255,255,.35)'),
      doSubmit: () => { if (s.joined) { this.go('pass'); return; } this.submit(); },

      pass: s.pass || { num: '#0000', ink: 'BOYS-0000-0000', mood: MOODS[0].k, moodColor: MOODS[0].c, moodLine: MOODS[0].line, wx: 'rain', src: R('kid'), short: '0x0000…0000', full: '0X0000', date: 'AUGUST / 2026', code: 'HOOD-0000' },
      weather: WXBG[wxKey].concat(WXFX[wxKey]).map(x => ({ s: x })),
      weatherSoft: WXFX[wxKey].map(x => ({ s: x })),
      flipped: s.flipped,
      toggleFlip: () => this.setState({ flipped: !s.flipped }),
      flipLabel: s.flipped ? 'SHOW FRONT' : 'FLIP CARD',
      showFront: !s.flipped, showBack: s.flipped,
      flipStyle: 'position:relative;height:326px',
      faceFront: 'position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden;border-radius:28px;background:linear-gradient(158deg,#161c33,#1c2442 52%,#0e1424) padding-box,linear-gradient(122deg,#7ef0ff,#8b7cff 54%,#7ef0ff) border-box;border:1.5px solid transparent;box-shadow:0 26px 64px -26px rgba(124,92,255,.95);animation:hmbTvIn .42s steps(7,end) both',
      faceBack: 'position:absolute;inset:0;overflow:hidden;border-radius:26px;background:#0a0c0e;border:1px solid rgba(255,255,255,.16);box-shadow:0 26px 64px -30px rgba(124,92,255,.9);animation:hmbTvIn .42s steps(7,end) both',
      bars: BARS.map((h, i) => ({
        style: 'display:block;width:2px;height:' + h + 'px;border-radius:1px;background:' + (i % 3 === 0 ? '#9fb2ff' : 'rgba(196,210,255,.62)')
      })),
      perks: PERKS,
      shareText: shareText,
      postX: () => {
        try { window.open('https://x.com/intent/tweet?text=' + encodeURIComponent(shareText) + (this.shareUrl ? '&url=' + encodeURIComponent(this.shareUrl) : ''), '_blank', 'noopener'); } catch (e) {}
        this.flash('OPENING X · TEXT PRE-FILLED');
      },
      copyText: () => this.copy(shareText + (this.shareUrl ? '\n\n' + this.shareUrl : ''), 'SHARE TEXT COPIED'),
      copyInvite: () => this.copy(s.pass ? s.pass.code : 'HOOD-0000', 'INVITE CODE COPIED'),
      saveCard: () => {
        if (navigator.share) { try { navigator.share({ text: shareText }); return; } catch (e) {} }
        this.flash('LONG-PRESS THE CARD TO SAVE · PNG EXPORT SHIPS AT LAUNCH');
      },

      tabs: TABS.map((t, i) => ({
        label: t[1], go: () => this.go(t[0]),
        style: 'flex:1;min-height:52px;border:none;background:transparent;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;color:'
          + (s.tab === t[0] ? 'var(--lime,#c6f511)' : 'rgba(255,255,255,.42)'),
        iconStyle: tabIcon(s.tab === t[0], i)
      })),

      jumps: JUMPS.map(j => ({
        label: j[1], go: () => this.go(j[0]),
        style: 'min-height:34px;padding:0 11px;border-radius:10px;cursor:pointer;font-family:\'Space Mono\',monospace;font-size:9.5px;letter-spacing:.1em;font-weight:700;border:1px solid '
          + (s.screen === j[0] ? 'rgba(198,245,17,.5)' : 'rgba(255,255,255,.12)') + ';background:' + (s.screen === j[0] ? 'rgba(198,245,17,.14)' : 'rgba(255,255,255,.03)')
          + ';color:' + (s.screen === j[0] ? '#c6f511' : 'rgba(255,255,255,.55)')
      }))
    };
  }
}

export default Component;
