/* LAST//CIRCUIT public terminal. Static, local, no accounts. */
(function () {
  'use strict';

  var PINS = ['home', 'solar', 'scale', 'graph', 'deep', 'log', 'credits'];
  var DELAY_IDS = ['earth', 'moon', 'mars', 'jupiter', 'sun'];
  var state = {
    density: 'cadet',
    mute: true,
    frame: 'full',
    scaleMode: 'readable',
    solarView: 'volume',
    scaleView: 'plate',
    webgl: '—',
    act: 0,
    t0: Date.now(),
    clockBody: 'earth',
    orbitPhase: 0,
    path: 'home',
    activePath: '',
    bodies: [],
    topics: [],
    copy: null,
    index: [],
    stops: [],
    scaleT: 0.25,
    log: [],
    seen: {},
    drawer: false,
    reduce: false,
    ready: false,
    solarHandle: null,
    vizHandle: null,
    solarToken: 0,
    solarReady: null,
    sugIndex: -1,
    pulseWord: '',
    clockTimer: 0
  };

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function routeOf(node) {
    return String(node.path || '').replace(/^lc:\/\//, '');
  }

  function bodyById(id) {
    for (var i = 0; i < state.bodies.length; i++) {
      if (state.bodies[i].id === id) return state.bodies[i];
    }
    return null;
  }

  function topicById(id) {
    for (var i = 0; i < state.topics.length; i++) {
      if (state.topics[i].id === id) return state.topics[i];
    }
    return null;
  }

  function readHash() {
    var h = location.hash.replace(/^#/, '');
    if (h.charAt(0) === '/') h = h.slice(1);
    try { h = decodeURIComponent(h); } catch (e) { /* keep raw */ }
    return h || 'home';
  }

  function readJSON(store, key, fallback) {
    try {
      var raw = store.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(store, key, value) {
    try { store.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  function loadPrefs() {
    state.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var density = localStorage.getItem('lc-density');
    state.density = density === 'analyst' ? 'analyst' : 'cadet';
    var mute = localStorage.getItem('lc-mute');
    state.mute = mute === null ? true : mute === '1';
    var scale = localStorage.getItem('lc-scale-mode');
    state.scaleMode = scale === 'honest' ? 'honest' : 'readable';
    var frame = sessionStorage.getItem('lc-frame');
    state.frame = frame === 'max' || frame === 'min' || frame === 'cut' ? frame : 'full';
    state.log = readJSON(sessionStorage, 'lc-log', []);
    state.seen = readJSON(sessionStorage, 'lc-seen', {});
  }

  async function loadData() {
    if (location.protocol !== 'file:') {
      try {
        var files = await Promise.all(['bodies', 'topics', 'copy'].map(function (name) {
          return fetch('data/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
            if (!r.ok) throw new Error(name);
            return r.json();
          });
        }));
        return { bodies: files[0], topics: files[1], copy: files[2] };
      } catch (err) { /* use the generated fallback */ }
    }
    if (window.LC_FALLBACK) return window.LC_FALLBACK;
    throw new Error('Local files could not be read.');
  }

  function prepareStops(raw) {
    var logs = raw.map(function (s) { return Math.log10(s.meters); });
    var lo = logs[0];
    var hi = logs[logs.length - 1];
    var span = hi - lo || 1;
    return raw.map(function (s, i) {
      return {
        id: s.id,
        label: s.label,
        quantity: s.quantity,
        meters: s.meters,
        cadet: s.cadet,
        analyst: s.analyst,
        log: logs[i],
        t: (logs[i] - lo) / span
      };
    });
  }

  function fmtKm(n) {
    if (n == null) return '—';
    return Math.round(n).toLocaleString('en-US') + ' km';
  }

  function fmtDay(hours) {
    if (hours == null) return '—';
    if (hours < 48) {
      var h = Math.round(hours * 10) / 10;
      return (h % 1 === 0 ? String(h.toFixed(0)) : h.toFixed(1)) + ' h';
    }
    var d = Math.round((hours / 24) * 10) / 10;
    return d.toFixed(1) + ' Earth days';
  }

  function fmtYear(days) {
    if (days == null) return '—';
    if (days < 800) {
      var d = Math.round(days * 10) / 10;
      return (d % 1 === 0 ? String(Math.round(d)) : d.toFixed(1)) + ' d';
    }
    var y = days / 365.25;
    return (Math.round(y * 10) / 10).toFixed(1) + ' Earth years';
  }

  function fmtG(g) {
    if (g == null) return '—';
    var v = Math.round(g * 100) / 100;
    return (v >= 10 ? v.toFixed(0) : v.toFixed(2)) + ' g';
  }

  function formatRatio(r) {
    if (r == null || !isFinite(r)) return '—';
    return '× ' + (Math.abs(r) >= 10 ? r.toFixed(1) : r.toFixed(2));
  }

  function formatLength(meters) {
    if (meters < 1000) return (Math.round(meters * 100) / 100) + ' m';
    var au = meters / 1.4959787e11;
    var ly = meters / 9.4607e15;
    if (ly >= 1e9) return (ly / 1e9).toFixed(1) + ' billion ly';
    if (ly >= 100) return Math.round(ly).toLocaleString('en-US') + ' ly';
    if (ly >= 0.1) return ly.toFixed(2) + ' ly';
    if (au >= 0.1) return (au >= 10 ? au.toFixed(1) : au.toFixed(2)) + ' AU';
    if (meters >= 1e6) return Math.round(meters / 1000).toLocaleString('en-US') + ' km';
    return Math.round(meters).toLocaleString('en-US') + ' m';
  }

  function sciMeters(meters) {
    var exp = Math.floor(Math.log10(meters));
    var man = meters / Math.pow(10, exp);
    return man.toFixed(2) + 'e' + exp + ' m';
  }

  function metersAt(t) {
    var lo = state.stops[0].log;
    var hi = state.stops[state.stops.length - 1].log;
    return Math.pow(10, lo + (hi - lo) * t);
  }

  function nearestStop(t) {
    var log = Math.log10(metersAt(t));
    var best = state.stops[0];
    var bestD = Infinity;
    state.stops.forEach(function (s) {
      var d = Math.abs(s.log - log);
      if (d < bestD) { bestD = d; best = s; }
    });
    return best;
  }

  function stopById(id) {
    for (var i = 0; i < state.stops.length; i++) {
      if (state.stops[i].id === id) return state.stops[i];
    }
    return null;
  }

  function resolve(path) {
    var parts = String(path || 'home').split('/').filter(Boolean);
    var head = parts[0] || 'home';
    if (head === 'home') return { view: 'home', path: 'home' };
    if (head === 'solar' && !parts[1]) return { view: 'solar', path: 'solar' };
    if (head === 'solar') {
      var body = bodyById(parts[1]);
      if (!body) return missing(parts[1]);
      return { view: 'file', path: 'solar/' + body.id, node: body };
    }
    if (head === 'deep' && !parts[1]) return { view: 'deep', path: 'deep' };
    if (head === 'deep') {
      var topic = topicById(parts[1]);
      if (!topic) return missing(parts[1]);
      return { view: 'file', path: 'deep/' + topic.id, node: topic };
    }
    if (head === 'scale') {
      if (parts[1] === 'well') return { view: 'scale', path: 'scale/well', stop: null, well: true };
      var known = parts[1] ? stopById(parts[1]) : null;
      return { view: 'scale', path: known ? 'scale/' + known.id : 'scale', stop: known, well: false };
    }
    if (head === 'graph') {
      var which = parts[1] || 'mass';
      var allowed = { mass: 1, year: 1, gravity: 1, delay: 1, size: 1, clock: 1 };
      if (!allowed[which]) return missing(which);
      return { view: 'graph', path: 'graph/' + which, graph: which };
    }
    if (head === 'galaxy') return { view: 'galaxy', path: 'galaxy' };
    if (head === 'compare') {
      var cid = parts[1] || 'jupiter';
      var other = bodyById(cid);
      if (!other || other.radius_km == null) cid = 'jupiter';
      return { view: 'compare', path: 'compare/' + cid, id: cid };
    }
    if (head === 'delay') {
      var a = DELAY_IDS.indexOf(parts[1]) >= 0 ? parts[1] : 'earth';
      var b = DELAY_IDS.indexOf(parts[2]) >= 0 ? parts[2] : 'moon';
      return { view: 'delay', path: 'delay/' + a + '/' + b, a: a, b: b };
    }
    if (head === 'log') return { view: 'log', path: 'log' };
    if (head === 'credits') return { view: 'credits', path: 'credits' };
    if (head === 'help') return { view: 'help', path: 'help' };
    if (head === 'missing') {
      return missing(decodeURIComponent(parts.slice(1).join('/') || ''));
    }
    var asBody = bodyById(head);
    if (asBody) return { view: 'file', path: 'solar/' + asBody.id, node: asBody };
    var asTopic = topicById(head);
    if (asTopic) return { view: 'file', path: routeOf(asTopic), node: asTopic };
    return missing(path);
  }

  function missing(query) {
    return {
      view: 'missing',
      path: 'missing/' + encodeURIComponent(query || ''),
      query: query || '',
      suggestions: window.LCSearch.suggest(query || '', state.index, 3)
    };
  }

  function stamp(d) {
    var days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return {
      date: d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()),
      day: days[d.getDay()],
      time: pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
    };
  }

  function syncAddress(path) {
    var input = $('circuit');
    if (!input || document.activeElement === input) return;
    input.value = path || state.activePath || 'home';
    placeCaret();
  }

  function placeCaret() {
    var input = $('circuit');
    var mirror = $('mirror');
    var caret = $('caret');
    if (!input || !mirror || !caret) return;
    var end = document.activeElement === input ? (input.selectionStart || 0) : input.value.length;
    mirror.textContent = input.value.slice(0, end);
    caret.style.transform = 'translate(' + mirror.offsetWidth + 'px, -50%)';
  }

  function lightPhrase(node) {
    if (!node || node.light_seconds_typical == null) return 'LIGHT —';
    if (node.id === 'earth') return 'LIGHT LOCAL';
    var f = window.LCSearch.formatSeconds(node.light_seconds_typical);
    return 'LIGHT ' + (node.light_varies ? '~' : '') + f.text + ' ' + f.unit;
  }

  function delayPhrase(res) {
    if (!res || res.view !== 'delay' || !window.LCSearch) return '';
    var result = window.LCSearch.lightDelay(res.a, res.b);
    if (!result) return '';
    if (result.kind === 'same') return '0.0 s';
    if (result.kind === 'range') {
      var near = window.LCSearch.formatSeconds(result.minS);
      var far = window.LCSearch.formatSeconds(result.maxS);
      return near.text + ' ' + near.unit + '–' + far.text + ' ' + far.unit;
    }
    if (result.seconds == null) return '';
    var one = window.LCSearch.formatSeconds(result.seconds);
    return one.text + ' ' + one.unit;
  }

  function paintStatus(res) {
    var node = res && res.node;
    var nodeId = node ? node.id : (res && res.view ? res.view : 'home');
    var pair = delayPhrase(res);
    var delay = pair || lightPhrase(node).replace(/^LIGHT\s*/, '');
    var modeName = state.density === 'analyst' ? 'ANALYST' : 'CADET';
    var text = 'NODE ' + nodeId + ' · WEBGL ' + state.webgl + ' · DELAY ' + delay + ' · ' + modeName + ' · LOCAL';
    var el = $('status-text');
    if (el) el.textContent = text;
  }

  function paintEcho(res) {
    var el = $('echo');
    if (!el || !res) return;
    var name = res.node ? res.node.id : (res.path || 'home');
    var dt = ((Date.now() - state.t0) / 1000).toFixed(1);
    var pair = delayPhrase(res);
    el.textContent = '> CLOSE ' + name + ' · T+' + dt + 's · ' + (pair ? ('LIGHT ' + pair) : lightPhrase(res.node));
  }

  function pulse() {
    var win = $('win');
    if (!win || state.reduce) return;
    win.classList.remove('is-pulsing');
    void win.offsetWidth;
    win.classList.add('is-pulsing');
    state.pulseWord = 'CIRCUIT CLOSED';
    paintStatus(state.resolved);
    clearTimeout(pulse.timer);
    pulse.timer = setTimeout(function () {
      state.pulseWord = '';
      if (state.resolved) paintStatus(state.resolved);
    }, 240);
  }

  function pushLog(res) {
    if (!res || res.view === 'missing') return;
    var title = res.node ? res.node.title : res.view.toUpperCase();
    state.log.unshift({ t: Date.now(), path: res.path, title: title });
    if (state.log.length > 40) state.log.length = 40;
    writeJSON(sessionStorage, 'lc-log', state.log);
    if (res.node && state.copy) {
      var mission = state.copy.home.mission;
      for (var i = 0; i < mission.length; i++) {
        if (mission[i].id === res.node.id) state.seen[res.node.id] = true;
      }
      writeJSON(sessionStorage, 'lc-seen', state.seen);
    }
  }

  function paintChrome(res) {
    var head = (res.path || 'home').split('/')[0];
    document.querySelectorAll('#tabs [data-go], #dock [data-go]').forEach(function (btn) {
      var active = btn.getAttribute('data-go') === head;
      btn.classList.toggle('is-on', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });
    $('btn-cadet').setAttribute('aria-pressed', state.density === 'cadet' ? 'true' : 'false');
    $('btn-analyst').setAttribute('aria-pressed', state.density === 'analyst' ? 'true' : 'false');
    $('btn-cadet').classList.toggle('is-on', state.density === 'cadet');
    $('btn-analyst').classList.toggle('is-on', state.density === 'analyst');
    var muteBtn = $('btn-mute');
    muteBtn.setAttribute('aria-pressed', state.mute ? 'true' : 'false');
    muteBtn.textContent = 'MUTE';
    muteBtn.classList.toggle('is-on', state.mute);
    if ($('win')) $('win').setAttribute('data-frame', state.frame || 'full');
    document.querySelectorAll('#rail [data-go]').forEach(function (link) {
      var dest = link.getAttribute('data-go');
      var headNow = (res.path || '').split('/')[0];
      var on = dest === res.path || (dest.indexOf('/') < 0 && dest === headNow);
      link.classList.toggle('is-on', on);
      if (on) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    syncAddress(res.path);
    paintStatus(res);
  }

  function buildRail() {
    var pins = [
      ['HOME', 'home'],
      ['SOLAR.SYS', 'solar'],
      ['SCALE', 'scale'],
      ['GRAPH', 'graph'],
      ['DEEP', 'deep'],
      ['LOG', 'log'],
      ['CREDITS', 'credits']
    ];
    var html = '<p class="rail-label">PINS</p>';
    pins.forEach(function (pair, i) {
      html += '<a class="rail-link" data-go="' + pair[1] + '" href="#/' + pair[1] + '"><span>0' + i + '</span>' + pair[0] + '</a>';
    });
    html += '<p class="rail-label">WORLDS</p>';
    state.bodies.forEach(function (b) {
      html += '<a class="rail-link" data-go="solar/' + b.id + '" href="#/solar/' + b.id + '"><span>' + esc(b.class) + '</span>' + esc(b.title) + '</a>';
    });
    html += '<p class="rail-label">DEEP</p>';
    state.topics.forEach(function (t) {
      var path = routeOf(t);
      html += '<a class="rail-link" data-go="' + path + '" href="#/' + path + '"><span>NODE</span>' + esc(t.title) + '</a>';
    });
    html += '<p class="rail-label">TOOLS</p>';
    html += '<a class="rail-link" data-go="compare/jupiter" href="#/compare/jupiter"><span>BENCH</span>Compare</a>';
    html += '<a class="rail-link" data-go="delay/earth/moon" href="#/delay/earth/moon"><span>RADIO</span>Light delay</a>';
    html += '<a class="rail-link" data-go="galaxy" href="#/galaxy"><span>TRACE</span>Galaxy</a>';
    html += '<a class="rail-link" data-go="help" href="#/help"><span>HELP</span>Commands</a>';
    $('rail').innerHTML = html;
  }

  function svgFrame(inner, label) {
    return '<svg class="diagram" viewBox="0 0 360 220" role="img" aria-label="' + esc(label) + '">' +
      '<rect width="360" height="220" fill="#050505"/>' +
      '<path d="M10 10 H28 M10 10 V28 M350 10 H332 M350 10 V28 M10 210 H28 M10 210 V192 M350 210 H332 M350 210 V192" fill="none" stroke="#2a2a2a"/>' +
      inner + '</svg>';
  }

  function diagram(kind, title) {
    var label = title + ' diagram';
    var c = '';
    if (kind === 'sun') {
      c = '<circle cx="180" cy="112" r="28" fill="#f4f4f4"/>' +
        '<circle cx="180" cy="112" r="46" fill="none" stroke="#cfcfcf"/>' +
        '<circle cx="180" cy="112" r="64" fill="none" stroke="#2a2a2a"/>' +
        ticks(180, 112, 78, 16);
    } else if (kind === 'mercury') {
      c = '<circle cx="180" cy="112" r="36" fill="none" stroke="#e8e8e8"/>' +
        '<path d="M158 100 q10 8 0 16 M190 96 q12 6 4 16 M168 132 q14 -4 18 8" fill="none" stroke="#8a8a8a"/>';
    } else if (kind === 'venus') {
      c = '<circle cx="180" cy="112" r="34" fill="none" stroke="#e8e8e8"/>' +
        '<circle cx="180" cy="112" r="48" fill="none" stroke="#cfcfcf" stroke-width="6"/>' +
        '<circle cx="180" cy="112" r="48" fill="none" stroke="#050505" stroke-width="2"/>';
    } else if (kind === 'earth') {
      c = '<circle cx="168" cy="112" r="40" fill="none" stroke="#e8e8e8"/>' +
        '<path d="M168 72 v80" stroke="#8a8a8a"/>' +
        '<circle cx="230" cy="86" r="10" fill="none" stroke="#e8e8e8"/>' +
        '<path d="M208 100 H220" stroke="#2a2a2a"/>';
    } else if (kind === 'moon') {
      c = '<circle cx="180" cy="112" r="42" fill="none" stroke="#e8e8e8"/>' +
        '<circle cx="160" cy="100" r="8" fill="none" stroke="#8a8a8a"/>' +
        '<circle cx="196" cy="118" r="12" fill="none" stroke="#8a8a8a"/>' +
        '<circle cx="172" cy="132" r="5" fill="none" stroke="#8a8a8a"/>';
    } else if (kind === 'mars') {
      c = '<circle cx="180" cy="112" r="40" fill="none" stroke="#e8e8e8"/>' +
        '<path d="M148 92 A40 40 0 0 1 212 92" fill="none" stroke="#cfcfcf"/>' +
        '<path d="M150 138 h60" stroke="#8a8a8a"/>';
    } else if (kind === 'jupiter') {
      c = '<circle cx="180" cy="112" r="48" fill="none" stroke="#e8e8e8"/>' +
        '<path d="M132 96 h96 M134 112 h92 M136 128 h88" stroke="#cfcfcf"/>' +
        '<ellipse cx="210" cy="104" rx="10" ry="6" fill="none" stroke="#f4f4f4"/>';
    } else if (kind === 'saturn') {
      c = '<ellipse cx="180" cy="112" rx="92" ry="22" fill="none" stroke="#cfcfcf"/>' +
        '<circle cx="180" cy="112" r="36" fill="#050505" stroke="#e8e8e8"/>' +
        '<ellipse cx="180" cy="112" rx="70" ry="16" fill="none" stroke="#8a8a8a"/>';
    } else if (kind === 'uranus') {
      c = '<circle cx="180" cy="112" r="34" fill="none" stroke="#e8e8e8"/>' +
        '<ellipse cx="180" cy="112" rx="16" ry="70" fill="none" stroke="#cfcfcf"/>';
    } else if (kind === 'neptune') {
      c = '<circle cx="180" cy="112" r="40" fill="none" stroke="#e8e8e8"/>' +
        '<path d="M140 100 q40 16 80 0 M142 120 q38 14 76 0" fill="none" stroke="#8a8a8a"/>';
    } else if (kind === 'pluto') {
      c = '<circle cx="160" cy="116" r="28" fill="none" stroke="#e8e8e8"/>' +
        '<circle cx="214" cy="96" r="10" fill="none" stroke="#cfcfcf"/>' +
        '<path d="M188 108 H204" stroke="#2a2a2a"/>' +
        '<text x="40" y="40" fill="#8a8a8a" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">DWARF PLANET</text>';
    } else if (kind === 'belt') {
      c = '<circle cx="180" cy="112" r="34" fill="none" stroke="#2a2a2a"/>' +
        '<circle cx="180" cy="112" r="70" fill="none" stroke="#2a2a2a"/>' +
        dotsRing(180, 112, 52, 18);
    } else if (kind === 'black-hole') {
      c = '<circle cx="180" cy="112" r="26" fill="none" stroke="#f4f4f4" stroke-width="2"/>' +
        '<circle cx="180" cy="112" r="42" fill="none" stroke="#cfcfcf" stroke-dasharray="3 4"/>' +
        '<path d="M70 112 h46 M250 112 h40 M286 112 l-8 -5 M286 112 l-8 5" fill="none" stroke="#e8e8e8"/>' +
        '<path d="M180 70 v16" stroke="#8a8a8a"/>' +
        '<text x="48" y="40" fill="#e8e8e8" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">ILLUSTRATION</text>' +
        '<text x="214" y="78" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">LAST STABLE CIRCUIT</text>' +
        '<text x="196" y="150" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">HORIZON — NO SIGNAL OUT</text>';
    } else if (kind === 'why-black') {
      c = '<text x="48" y="36" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">IF ENDLESS AND ETERNAL</text>' +
        '<text x="200" y="36" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">WHAT WE OBSERVE</text>' +
        rays(90, 120, true) + rays(250, 120, false);
    } else if (kind === 'light-year') {
      c = '<line x1="36" y1="120" x2="324" y2="120" stroke="#cfcfcf"/>' +
        '<path d="M36 110 v20 M324 110 v20" stroke="#e8e8e8"/>' +
        '<circle cx="36" cy="120" r="6" fill="#f4f4f4"/>' +
        '<circle cx="324" cy="120" r="3" fill="#e8e8e8"/>' +
        '<text x="28" y="100" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">SUN</text>' +
        '<text x="250" y="100" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">PROXIMA</text>' +
        '<text x="110" y="150" fill="#e8e8e8" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">4.24 LIGHT-YEARS</text>';
    } else if (kind === 'big-bang') {
      c = '<line x1="36" y1="120" x2="330" y2="120" stroke="#cfcfcf"/>' +
        '<circle cx="48" cy="120" r="8" fill="#f4f4f4"/>' +
        '<circle cx="140" cy="120" r="4" fill="none" stroke="#e8e8e8"/>' +
        '<circle cx="230" cy="120" r="4" fill="none" stroke="#e8e8e8"/>' +
        '<circle cx="320" cy="120" r="4" fill="#e8e8e8"/>' +
        '<text x="28" y="96" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">HOT</text>' +
        '<text x="118" y="96" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">ATOMS</text>' +
        '<text x="210" y="96" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">STARS</text>' +
        '<text x="300" y="96" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">NOW</text>' +
        '<text x="36" y="160" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">A TIMELINE OF EXPANSION. NOT AN EXPLOSION IN A ROOM.</text>';
    } else if (kind === 'observable') {
      c = '<circle cx="180" cy="116" r="74" fill="none" stroke="#cfcfcf" stroke-dasharray="2 3"/>' +
        '<circle cx="180" cy="116" r="8" fill="#f4f4f4"/>' +
        '<text x="40" y="40" fill="#e8e8e8" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">LIGHT THAT HAS REACHED US</text>' +
        '<text x="78" y="200" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">OUTSIDE THE RING: NO SIGNAL YET</text>';
    } else {
      c = '<circle cx="180" cy="112" r="40" fill="none" stroke="#e8e8e8"/>';
    }
    return svgFrame(c, label);
  }

  function ticks(cx, cy, r, n) {
    var out = '';
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var x1 = cx + Math.cos(a) * (r - 8);
      var y1 = cy + Math.sin(a) * (r - 8);
      var x2 = cx + Math.cos(a) * r;
      var y2 = cy + Math.sin(a) * r;
      out += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#8a8a8a"/>';
    }
    return out;
  }

  function dotsRing(cx, cy, r, n) {
    var out = '';
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      out += '<rect x="' + (cx + Math.cos(a) * r - 1.5).toFixed(1) + '" y="' + (cy + Math.sin(a) * r - 1.5).toFixed(1) + '" width="3" height="3" fill="#e8e8e8"/>';
    }
    return out;
  }

  function rays(x, y, filled) {
    var out = '';
    for (var i = -2; i <= 2; i++) {
      var y2 = y + i * 16;
      out += '<line x1="' + (x - 30) + '" y1="' + y + '" x2="' + (x + 40) + '" y2="' + y2 + '" stroke="#8a8a8a"/>';
      if (filled || i === 0) {
        out += '<rect x="' + (x + 38) + '" y="' + (y2 - 2) + '" width="5" height="5" fill="#f4f4f4"/>';
      }
    }
    return out;
  }

  function factGrid(node) {
    var rows = [];
    function row(k, v, note) {
      rows.push('<div class="fact"><span>' + k + '</span><strong>' + esc(v) + '</strong>' + (note ? '<em>' + esc(note) + '</em>' : '') + '</div>');
    }
    if (node.eq_diameter_km) row('DIAMETER', fmtKm(node.eq_diameter_km), 'Equatorial, round.');
    if (node.day_hours != null) row('DAY', fmtDay(node.day_hours), node.day_note);
    if (node.year_days != null) row('YEAR', fmtYear(node.year_days), node.year_note);
    if (node.gravity_g != null) row('GRAVITY', fmtG(node.gravity_g), 'Compared with Earth.');
    if (node.moons != null) row('MOONS', String(node.moons), node.moons_note);
    else if (node.moons_note) row('MOONS', '—', node.moons_note);
    if (node.id !== 'earth' && node.light_seconds_typical != null) {
      var f = window.LCSearch.formatSeconds(node.light_seconds_typical);
      row('LIGHT', (node.light_varies ? '~' : '') + f.text + ' ' + f.unit, 'One-way from Earth. Representative, not a live range.');
    }
    if (!rows.length) return '';
    return '<div class="fact-grid"><span class="tag">FACT</span>' + rows.join('') + '</div>';
  }

  function compareChip(node) {
    if (!node.radius_km) return '';
    var earth = bodyById('earth');
    var facts = window.LCSearch.compareFacts(earth, node);
    return '<aside class="chip-card"><span class="tag">FACT</span><h2>COMPARE × EARTH</h2>' +
      '<p>Radius ' + formatRatio(facts.radius) + ' · Day ' + formatRatio(facts.day) + ' · Year ' + formatRatio(facts.year) + ' · Gravity ' + formatRatio(facts.gravity) + '</p>' +
      '<a class="btn" data-go="compare/' + node.id + '" href="#/compare/' + node.id + '">OPEN BENCH</a></aside>';
  }

  function renderFile(node) {
    var voice = state.density;
    var prose = voice === 'analyst' ? node.analyst : node.cadet;
    var cap = node.illustration
      ? '<figcaption><span class="tag">ILLUSTRATION</span> Teaching sketch. Not a solver and not a photograph.</figcaption>'
      : '<figcaption><span class="tag">FACT</span> Geometric mark drawn for this file. Not a photograph.</figcaption>';
    return '<article class="file" data-voice="' + voice + '">' +
      '<p class="path">lc://' + esc(routeOf(node)) + '</p>' +
      '<header class="file-head"><h1>' + esc(node.title) + '</h1><span class="klass">' + esc(node.class) + '</span></header>' +
      '<p class="voice-label"><span class="tag">' + (voice === 'analyst' ? 'ANALYST' : 'CADET') + '</span></p>' +
      '<div class="file-split">' +
      '<div><p class="prose">' + esc(prose) + '</p>' + factGrid(node) +
      (node.radius_km ? window.LCGraphs.bench(bodyById('earth'), node.id === 'earth' ? bodyById('jupiter') : node) : '') +
      '</div>' +
      (node.id === 'belt' || (node.class === 'PHENOMENON' && node.id !== 'black-hole') ? '' :
        '<div class="bezel"><header class="bezel-plate"><span>' + (node.id === 'black-hole' ? 'VIEW · HOLE' : 'VIEW · CORE') + '</span><span>ILLUSTRATION</span></header>' +
        '<div id="' + (node.id === 'black-hole' ? 'hole-stage' : 'core-stage') + '" class="viz-well"></div>' +
        '<p class="fine" id="viz-note"></p>' +
        (node.id === 'black-hole' ? '<p class="fine">No signal returns from inside the mark.</p>' : '') +
        '</div>') +
      '</div>' +
      (node.id === 'belt' || (node.class === 'PHENOMENON' && node.id !== 'black-hole')
        ? '<figure class="fig">' + diagram(node.diagram || node.id, node.title) + cap + '</figure>'
        : '') +
      (node.id === 'earth' ? '' : compareChip(node)) +
      '<p class="source">' + esc(state.copy.source_line) + (node.source_note ? ' ' + esc(node.source_note) : '') + '</p>' +
      '</article>';
  }

  function hereSvg() {
    var rings = [28, 48, 68, 88, 108];
    var circles = rings.map(function (r, i) {
      return '<circle cx="120" cy="120" r="' + r + '" fill="none" stroke="' + (i === 0 ? '#f4f4f4' : '#cfcfcf') + '"/>';
    }).join('');
    return '<svg class="here-svg" viewBox="0 0 240 240" role="img" aria-label="Nested address rings from Earth out to the observable universe.">' +
      '<rect width="240" height="240" fill="#050505"/>' + circles +
      '<circle cx="120" cy="120" r="3" fill="#f4f4f4"/>' +
      '</svg>';
  }

  function traceSvg() {
    return '<svg class="trace-svg" viewBox="0 0 240 180" role="img" aria-label="Original six-point circuit trace. Not a sky survey plate.">' +
      '<rect width="240" height="180" fill="#050505"/>' +
      '<path d="M40 70 H110 V40 H180 V78 H180 V140 H150 V140 H78 V150 H46 V112 H40" fill="none" stroke="#cfcfcf"/>' +
      '<path d="M40 70 V112" fill="none" stroke="#cfcfcf"/>' +
      star(40, 70) + star(110, 40) + star(180, 78) + star(150, 140) + star(78, 150) + star(46, 112) +
      '<text x="12" y="20" fill="#8a8a8a" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">TRACE/6</text>' +
      '</svg>';
  }

  function star(x, y) {
    return '<rect x="' + (x - 3) + '" y="' + (y - 3) + '" width="6" height="6" fill="#f4f4f4"/>';
  }

  function missionHtml() {
    var items = state.copy.home.mission.map(function (m) {
      var on = !!state.seen[m.id];
      return '<li><span class="box' + (on ? ' is-on' : '') + '" aria-hidden="true"></span>' +
        '<a data-go="' + m.path + '" href="#/' + m.path + '">' + esc(m.label) + '</a>' +
        '<span class="fine">' + (on ? 'CLOSED' : 'OPEN') + '</span></li>';
    }).join('');
    var done = state.copy.home.mission.every(function (m) { return state.seen[m.id]; });
    return '<section class="panel"><h2>' + esc(state.copy.home.mission_title) + '</h2>' +
      '<p>' + esc(state.copy.home.mission_text) + '</p><ul class="mission">' + items + '</ul>' +
      (done ? '<p class="fine">Three circuits closed. The log holds them.</p>' : '') +
      '<p class="fine">OPTIONAL · type graph mass. It does not change the three-node mark.</p></section>';
  }

  function renderHome() {
    var now = stamp(new Date());
    var rings = state.copy.home.rings.map(function (ring) {
      return '<li><a data-go="' + ring.path + '" href="#/' + ring.path + '">' + esc(ring.label) + '</a><span>' + esc(ring.note) + '</span></li>';
    }).join('');
    var chips = state.copy.home.suggestions.map(function (s) {
      return '<a class="btn" data-go="' + s.path + '" href="#/' + s.path + '">' + esc(s.label) + '</a>';
    }).join('');
    return '<article class="home" data-voice="' + state.density + '">' +
      '<p class="path">lc://home</p>' +
      '<header class="file-head"><h1>LAST//CIRCUIT</h1><span class="klass">LOCAL</span></header>' +
      '<p class="fine">' + esc(now.date) + '  ' + esc(now.day) + '</p>' +
      '<p class="lore-line"><span class="tag">LORE</span> ' + esc(state.copy.lore) + '</p>' +
      '<section class="here"><h2>' + esc(state.copy.home.here_title) + '</h2>' +
      '<p>' + esc(state.copy.home.here_lead) + '</p>' +
      '<div class="here-grid">' + hereSvg() + '<ol class="ring-list">' + rings + '</ol></div></section>' +
      '<section class="panel"><div class="bezel"><header class="bezel-plate"><span>VIEW · GALAXY · TRACE</span><span>ILLUSTRATION</span></header>' +
      '<div id="home-galaxy" class="viz-well" aria-label="Schematic spiral. Not a sky survey."></div></div>' +
      '<p><span class="tag">LORE</span> A local-neighborhood sketch for this terminal.</p>' +
      '<p><span class="tag">FACT</span> Original points. Not a catalog and not a sky survey.</p></section>' +
      '<section class="panel"><h2>' + esc(state.copy.home.suggest_title) + '</h2><div class="chips">' + chips + '</div></section>' +
      missionHtml() +
      '<section class="panel"><h2>TRACE/6</h2>' + traceSvg() +
      '<p><span class="tag">LORE</span> A six-point mark drawn for this terminal.</p>' +
      '<p><span class="tag">FACT</span> Not a chart from a sky survey. Not an official constellation plate.</p></section>' +
      '</article>';
  }

  function renderSolar() {
    var picks = state.bodies.map(function (b) {
      return '<a class="btn" data-go="solar/' + b.id + '" href="#/solar/' + b.id + '">' + esc(b.title) + '</a>';
    }).join('');
    var cap = state.scaleMode === 'honest' ? state.copy.solar.caption_honest : state.copy.solar.caption_readable;
    return '<article class="solar-page">' +
      '<p class="path">lc://solar</p>' +
      '<header class="file-head"><h1>SOLAR.SYS</h1><span class="klass">MAP</span></header>' +
      '<p id="solar-caption" class="fine">' + esc(cap) + '</p>' +
      '<div class="seg" role="group" aria-label="Orbit scale">' +
      '<button type="button" class="btn' + (state.scaleMode === 'readable' ? ' is-on' : '') + '" data-scale-mode="readable" aria-pressed="' + (state.scaleMode === 'readable') + '">READABLE ORBITS</button>' +
      '<button type="button" class="btn' + (state.scaleMode === 'honest' ? ' is-on' : '') + '" data-scale-mode="honest" aria-pressed="' + (state.scaleMode === 'honest') + '">HONEST SCALE</button>' +
      '</div>' +
      '<div class="seg" role="group" aria-label="Diagram style">' +
      '<button type="button" class="btn' + (state.solarView === 'volume' ? ' is-on' : '') + '" data-solar-view="volume" aria-pressed="' + (state.solarView === 'volume') + '">VOLUME</button>' +
      '<button type="button" class="btn' + (state.solarView === 'flat' ? ' is-on' : '') + '" data-solar-view="flat" aria-pressed="' + (state.solarView === 'flat') + '">FLAT</button>' +
      '</div>' +
      '<div class="bezel"><header class="bezel-plate"><span>VIEW · SOLAR.SYS</span><span>LIT</span></header>' +
      '<div id="solar-stage" class="solar-stage" aria-label="' + esc(state.copy.solar.a11y) + '"></div></div>' +
      '<p id="solar-note" class="fine"></p>' +
      '<div class="seg" id="clock-picks">' +
      '<button type="button" class="btn" data-clock="mercury">MERCURY</button>' +
      '<button type="button" class="btn" data-clock="earth">EARTH</button>' +
      '<button type="button" class="btn" data-clock="mars">MARS</button>' +
      '<button type="button" class="btn" data-clock="jupiter">JUPITER</button></div>' +
      '<div id="orbit-clock"></div>' +
      '<p class="fine"><span class="tag">ILLUSTRATION</span> Moon pips on Earth and Mars are placement marks, not a moon census.</p>' +
      '<p class="fine">' + esc(state.copy.solar.decor) + ' Drag to orbit. Scroll or pinch to zoom. The Moon is drawn beside Earth so it can be selected.</p>' +
      '<h2 class="rail-label">SELECT A WORLD</h2>' +
      '<div class="chips">' + picks + '</div>' +
      '<p class="source">' + esc(state.copy.source_line) + '</p>' +
      '</article>';
  }

  function renderDeep() {
    var cards = state.topics.map(function (t) {
      var path = routeOf(t);
      return '<a class="deep-card" data-go="' + path + '" href="#/' + path + '"><span>' + esc(t.class) + '</span><strong>' + esc(t.title) + '</strong></a>';
    }).join('');
    return '<article class="file"><p class="path">lc://deep</p><header class="file-head"><h1>DEEP</h1><span class="klass">INDEX</span></header>' +
      '<p class="prose">Files past the planets. Each one says whether you are reading a cadet line, an analyst line, or an illustration.</p>' +
      '<div class="deep-list">' + cards + '</div></article>';
  }

  function scaleSvg(t) {
    var active = nearestStop(t);
    var ticks = state.stops.map(function (s) {
      var x = (24 + s.t * 592).toFixed(1);
      var on = s.id === active.id;
      return '<line x1="' + x + '" y1="' + (on ? 24 : 40) + '" x2="' + x + '" y2="72" stroke="' + (on ? '#f4f4f4' : '#8a8a8a') + '" stroke-width="' + (on ? 2 : 1) + '"/>';
    }).join('');
    var x = (24 + Math.max(0, Math.min(1, t)) * 592).toFixed(1);
    return '<svg class="scale-svg" viewBox="0 0 640 96" role="img" aria-label="Logarithmic length line from a human to the observable universe.">' +
      '<rect width="640" height="96" fill="#050505"/>' +
      '<line x1="24" y1="72" x2="616" y2="72" stroke="#cfcfcf"/>' +
      ticks +
      '<line x1="' + x + '" y1="16" x2="' + x + '" y2="84" stroke="#f4f4f4" stroke-width="2"/>' +
      '</svg>';
  }

  function renderScale(res) {
    var t = res.stop ? res.stop.t : state.scaleT;
    state.scaleT = t;
    var value = Math.round(t * 1000);
    return '<article class="file" data-voice="' + state.density + '">' +
      '<p class="path" id="scale-path">lc://' + esc(res.path) + '</p>' +
      '<header class="file-head"><h1>SCALE</h1><span class="klass">LENGTH</span></header>' +
      '<p class="fine">Powers of ten, from a person to the observable universe. Each tick names what is being measured.</p>' +
      '<div class="seg" role="group" aria-label="Scale view">' +
      '<button type="button" class="btn' + (res.well ? '' : ' is-on') + '" data-scale-view="plate">PLATE</button>' +
      '<button type="button" class="btn' + (res.well ? ' is-on' : '') + '" data-scale-view="well">WELL</button></div>' +
      '<label class="slider-label" for="scale-slider">SCRUB</label>' +
      '<input id="scale-slider" type="range" min="0" max="1000" value="' + value + '" aria-valuemin="0" aria-valuemax="1000" aria-valuenow="' + value + '">' +
      '<div id="scale-diagram">' + scaleSvg(t) + '</div>' +
      '<div id="scale-readout"></div>' +
      (res.well ? '<div class="bezel"><header class="bezel-plate"><span>VIEW · SCALE · WELL</span><span>ILLUSTRATION</span></header><div id="scale-well" class="viz-well viz-short"></div><p id="viz-note" class="fine"></p></div>' : '') +
      '<p class="source">' + esc(state.copy.source_line) + '</p></article>';
  }

  function paintScale(t) {
    state.scaleT = t;
    var stop = nearestStop(t);
    var meters = metersAt(t);
    var voice = state.density === 'analyst' ? stop.analyst : stop.cadet;
    var readout = $('scale-readout');
    var diagram = $('scale-diagram');
    var slider = $('scale-slider');
    if (diagram) diagram.innerHTML = scaleSvg(t);
    if (slider) slider.setAttribute('aria-valuenow', String(Math.round(t * 1000)));
    if (slider) slider.setAttribute('aria-valuetext', stop.label + ', ' + formatLength(meters));
    if (!readout) return;
    var extra = state.density === 'analyst' ? '<p class="fine">' + esc(sciMeters(meters)) + '</p>' : '';
    readout.innerHTML = '<p class="kicker"><span class="tag">' + (state.density === 'analyst' ? 'ANALYST' : 'CADET') + '</span> ' + esc(stop.label) + '</p>' +
      '<p class="bignum">' + esc(formatLength(meters)) + '</p>' +
      '<p class="fine">' + esc(stop.quantity) + '</p>' + extra +
      '<p class="prose">' + esc(voice) + '</p>';
  }

  function comparableBodies() {
    return state.bodies.filter(function (b) { return b.radius_km != null; });
  }

  function renderCompare(res) {
    var list = comparableBodies();
    var options = list.map(function (b) {
      return '<option value="' + b.id + '"' + (b.id === res.id ? ' selected' : '') + '>' + esc(b.title) + '</option>';
    }).join('');
    var index = 0;
    list.forEach(function (b, i) { if (b.id === res.id) index = i; });
    return '<article class="file"><p class="path">lc://compare/' + esc(res.id) + '</p>' +
      '<header class="file-head"><h1>' + esc(state.copy.compare.title) + '</h1><span class="klass">BENCH</span></header>' +
      '<p class="fine">' + esc(state.copy.compare.fact) + '</p>' +
      '<label class="slider-label" for="compare-select">BODY</label>' +
      '<select id="compare-select">' + options + '</select>' +
      '<label class="slider-label" for="compare-slider">SCRUB THE FAMILY</label>' +
      '<input id="compare-slider" type="range" min="0" max="' + (list.length - 1) + '" value="' + index + '">' +
      '<div id="compare-readout"></div>' +
      '<p class="source">' + esc(state.copy.source_line) + '</p></article>';
  }

  function bar(value, max) {
    var pct = max > 0 && value != null ? Math.max(2, Math.round((value / max) * 100)) : 0;
    if (value == null) pct = 0;
    return '<span class="meter"><span style="width:' + pct + '%"></span></span>';
  }

  function paintCompare(id) {
    var earth = bodyById('earth');
    var other = bodyById(id) || bodyById('jupiter');
    var facts = window.LCSearch.compareFacts(earth, other);
    var rows = [
      ['RADIUS', earth.radius_km, other.radius_km, fmtKm(earth.radius_km), fmtKm(other.radius_km), facts.radius],
      ['DAY', earth.day_hours, other.day_hours, fmtDay(earth.day_hours), fmtDay(other.day_hours), facts.day],
      ['YEAR', earth.year_days, other.year_days, fmtYear(earth.year_days), fmtYear(other.year_days), facts.year],
      ['GRAVITY', earth.gravity_g, other.gravity_g, fmtG(earth.gravity_g), fmtG(other.gravity_g), facts.gravity]
    ];
    var html = '<div class="bench-head"><span>EARTH</span><span>' + esc(other.title.toUpperCase()) + '</span></div>';
    rows.forEach(function (row) {
      var max = Math.max(row[1] || 0, row[2] || 0);
      html += '<section class="bench-row"><h3>' + row[0] + ' <em>' + formatRatio(row[5]) + '</em></h3>' +
        '<div><span>' + esc(row[3]) + '</span>' + bar(row[1], max) + '</div>' +
        '<div><span>' + esc(row[4]) + '</span>' + bar(row[2], max) + '</div></section>';
    });
    if (other.day_note) html += '<p class="fine">' + esc(other.title) + ' day: ' + esc(other.day_note) + '</p>';
    var box = $('compare-readout');
    if (box) box.innerHTML = html;
  }

  function renderDelay(res) {
    function options(selected) {
      return DELAY_IDS.map(function (id) {
        var body = bodyById(id);
        var label = body ? body.title : id;
        return '<option value="' + id + '"' + (id === selected ? ' selected' : '') + '>' + esc(label) + '</option>';
      }).join('');
    }
    return '<article class="file"><p class="path">lc://' + esc(res.path) + '</p>' +
      '<header class="file-head"><h1>' + esc(state.copy.delay.title) + '</h1><span class="klass">RADIO</span></header>' +
      '<div class="delay-picks"><label>FROM<select id="delay-a">' + options(res.a) + '</select></label>' +
      '<button type="button" class="btn" id="delay-swap">SWAP</button>' +
      '<label>TO<select id="delay-b">' + options(res.b) + '</select></label></div>' +
      '<div class="bezel"><header class="bezel-plate"><span>VIEW · DELAY · PULSE</span><span>ILLUSTRATION</span></header>' +
      '<div id="delay-stage" class="viz-well viz-short"></div>' +
      '<p class="fine"><span class="tag">ILLUSTRATION</span> Tempo is illustrative. The number is the fact.</p>' +
      '<p id="viz-note" class="fine"></p></div>' +
      '<div id="delay-readout"></div>' +
      '<p class="source">' + esc(state.copy.source_line) + '</p></article>';
  }

  function paintDelay(a, b) {
    var result = window.LCSearch.lightDelay(a, b);
    var from = bodyById(a);
    var to = bodyById(b);
    var html = '<p class="kicker">' + esc(from.title.toUpperCase()) + '  →  ' + esc(to.title.toUpperCase()) + '</p>';
    if (result.kind === 'range') {
      var n = window.LCSearch.formatSeconds(result.minS);
      var f = window.LCSearch.formatSeconds(result.maxS);
      html += '<p class="bignum">' + n.text + ' <small>' + n.unit + '</small></p><p class="fine">NEAR</p>';
      html += '<p class="bignum">' + f.text + ' <small>' + f.unit + '</small></p><p class="fine">FAR</p>';
    } else if (result.kind === 'same') {
      html += '<p class="bignum">0.0 <small>s</small></p>';
    } else if (result.seconds != null) {
      var one = window.LCSearch.formatSeconds(result.seconds);
      html += '<p class="bignum">' + one.text + ' <small>' + one.unit + '</small></p><p class="fine">ONE WAY AT c</p>';
    }
    html += '<p><span class="tag">FACT</span> ' + esc(result.note || '') + '</p>';
    html += '<p class="fine">' + esc(state.copy.delay.fact) + '</p>';
    var box = $('delay-readout');
    if (box) box.innerHTML = html;
  }

  function renderLog() {
    var mission = missionHtml();
    var rows = state.log.length ? state.log.map(function (entry, i) {
      var d = stamp(new Date(entry.t));
      return '<li><span>' + String(i + 1).padStart(2, '0') + '</span><time>' + esc(d.time) + '</time><a data-go="' + esc(entry.path) + '" href="#/' + esc(entry.path) + '">lc://' + esc(entry.path) + '</a><em>' + esc(entry.title) + '</em></li>';
    }).join('') : '<li class="fine">No circuits closed this session.</li>';
    return '<article class="file"><p class="path">lc://log</p><header class="file-head"><h1>LOG</h1><span class="klass">SESSION</span></header>' +
      mission + '<h2>CLOSED CIRCUITS</h2><ol class="log-list">' + rows + '</ol></article>';
  }

  function renderCredits() {
    var c = state.copy.credits;
    var blocks = c.blocks.map(function (block) {
      return '<section class="panel"><h2>' + esc(block.title) + '</h2><ul class="plain">' +
        block.lines.map(function (line) { return '<li>' + esc(line) + '</li>'; }).join('') + '</ul></section>';
    }).join('');
    var free = c.free.map(function (line) { return '<li>' + esc(line) + '</li>'; }).join('');
    return '<article class="file"><p class="path">lc://credits</p><header class="file-head"><h1>CREDITS</h1><span class="klass">FREE</span></header>' +
      '<section class="panel"><h2>' + esc(c.free_title) + '</h2><ul class="plain">' + free + '</ul></section>' +
      blocks + '<p class="source">' + esc(state.copy.source_line) + '</p></article>';
  }

  function renderHelp() {
    var h = state.copy.help;
    var commands = h.commands.map(function (cmd) { return '<li><code>' + esc(cmd) + '</code></li>'; }).join('');
    var keys = h.keys.map(function (row) { return '<li><span>' + esc(row.k) + '</span>' + esc(row.v) + '</li>'; }).join('');
    return '<article class="file"><p class="path">lc://help</p><header class="file-head"><h1>HELP</h1><span class="klass">BAR</span></header>' +
      '<p class="prose">' + esc(h.lead) + '</p>' +
      '<section class="panel"><h2>COMMANDS</h2><ul class="plain">' + commands + '</ul></section>' +
      '<section class="panel"><h2>KEYS</h2><ul class="keys">' + keys + '</ul></section>' +
      '<p><span class="tag">LORE</span> ' + esc(state.copy.lore) + '</p>' +
      '<p><span class="tag">FACT</span> Nothing here calls a network for science. The files are local.</p></article>';
  }

  function renderMissing(res) {
    var items = (res.suggestions || []).map(function (item) {
      return '<li><a class="btn" data-go="' + esc(item.path) + '" href="#/' + esc(item.path) + '">' + esc(item.title) + '</a></li>';
    }).join('');
    return '<article class="file missing"><p class="path">lc://missing</p>' +
      '<h1 class="glitch">' + esc(state.copy.missing_title) + '</h1>' +
      '<p>' + esc(state.copy.missing_lead) + '</p>' +
      (res.query ? '<p class="fine">QUERY  ' + esc(res.query) + '</p>' : '') +
      '<h2>NEAREST</h2><ul class="chips">' + items + '</ul></article>';
  }

  function renderGraph(res) {
    var names = ['mass', 'year', 'gravity', 'delay', 'size', 'clock'];
    var nav = names.map(function (name) {
      var on = name === res.graph ? ' is-on' : '';
      return '<a class="btn' + on + '" data-go="graph/' + name + '" href="#/graph/' + name + '">' + name.toUpperCase() + '</a>';
    }).join('');
    var drawing = res.graph === 'clock'
      ? window.LCGraphs.clock(bodyById(state.clockBody || 'earth'), state.orbitPhase || 0, state.density)
      : window.LCGraphs[res.graph](state.bodies, state.density);
    return '<article class="file" data-voice="' + state.density + '"><p class="path">lc://graph/' + esc(res.graph) + '</p>' +
      '<header class="file-head"><h1>GRAPH</h1><span class="klass">INSTRUMENT</span></header>' +
      '<div class="chips">' + nav + '</div>' + drawing + '</article>';
  }

  function renderGalaxy() {
    return '<article class="file"><p class="path">lc://galaxy</p><header class="file-head"><h1>GALAXY TRACE</h1><span class="klass">ILLUSTRATION</span></header>' +
      '<div class="bezel"><header class="bezel-plate"><span>VIEW · GALAXY · TRACE</span><span>ILLUSTRATION</span></header>' +
      '<div id="galaxy-stage" class="viz-well" aria-label="Schematic spiral. Not a sky survey."></div>' +
      '<p id="viz-note" class="fine"></p></div>' +
      '<p><span class="tag">LORE</span> A local-neighborhood sketch. The pip is “you are here” on a spur.</p>' +
      '<p><span class="tag">FACT</span> Original points. Not a catalog and not a sky survey.</p></article>';
  }

  function viewWantsGl(res) {
    if (!res) return false;
    if (res.view === 'home' || res.view === 'galaxy' || res.view === 'delay') return true;
    if (res.view === 'solar') return state.solarView !== 'flat';
    if (res.view === 'scale') return !!res.well;
    if (res.view === 'file' && res.node) {
      if (res.node.id === 'belt') return false;
      if (res.node.class === 'PHENOMENON' && res.node.id !== 'black-hole') return false;
      return true;
    }
    return false;
  }

  function render(res) {
    if (state.solarHandle) {
      state.solarHandle.destroy();
      state.solarHandle = null;
    }
    if (state.vizHandle) {
      state.vizHandle.destroy();
      state.vizHandle = null;
    }
    state.solarToken += 1;
    clearInterval(state.orbitTimer);
    if (!viewWantsGl(res)) state.webgl = '—';
    var view = $('view');
    var html = '';
    if (res.view === 'home') html = renderHome();
    else if (res.view === 'solar') html = renderSolar();
    else if (res.view === 'deep') html = renderDeep();
    else if (res.view === 'graph') html = renderGraph(res);
    else if (res.view === 'galaxy') html = renderGalaxy();
    else if (res.view === 'file') html = renderFile(res.node);
    else if (res.view === 'scale') html = renderScale(res);
    else if (res.view === 'compare') html = renderCompare(res);
    else if (res.view === 'delay') html = renderDelay(res);
    else if (res.view === 'log') html = renderLog();
    else if (res.view === 'credits') html = renderCredits();
    else if (res.view === 'help') html = renderHelp();
    else html = renderMissing(res);
    view.innerHTML = html;
    view.scrollTop = 0;
    if (res.view === 'home') {
      mountNamed('home-galaxy', function (box) { return window.LCGalaxy.mount(box, { reduce: state.reduce }); });
    }
    if (res.view === 'galaxy') mountNamed('galaxy-stage', function (box) { return window.LCGalaxy.mount(box, { reduce: state.reduce }); });
    if (res.view === 'solar') {
      state.solarReady = mountSolar();
      paintOrbitClock();
    }
    if (res.view === 'file' && res.node && $('core-stage')) {
      mountNamed('core-stage', function (box) { return window.LCPlanet.mount(box, { body: res.node, reduce: state.reduce }); });
    }
    if (res.view === 'file' && res.node && res.node.id === 'black-hole') {
      mountNamed('hole-stage', function (box) { return window.LCHole.mount(box, { reduce: state.reduce }); });
    }
    if (res.view === 'delay') mountNamed('delay-stage', function (box) { return window.LCDelay.mount(box, { reduce: state.reduce }); });
    if (res.view === 'scale' && res.well) {
      mountNamed('scale-well', function (box) {
        return window.LCScale.mount(box, { stops: state.stops, t: state.scaleT, reduce: state.reduce });
      });
    }
    if (res.view === 'scale') {
      paintScale(state.scaleT);
      bindScale();
    }
    if (res.view === 'compare') {
      paintCompare(res.id);
      bindCompare(res.id);
    }
    if (res.view === 'delay') {
      paintDelay(res.a, res.b);
      bindDelay(res.a, res.b);
    }
  }

  function startClock() {
    if (state.clockTimer) return;
    function tick() {
      var el = $('clock');
      if (!el) return;
      var now = stamp(new Date());
      el.textContent = now.date + '  ' + now.time;
    }
    tick();
    state.clockTimer = setInterval(tick, 1000);
  }

  function bindScale() {
    var slider = $('scale-slider');
    if (!slider) return;
    slider.addEventListener('input', function () {
      var t = Number(slider.value) / 1000;
      paintScale(t);
      if (state.vizHandle && state.vizHandle.setT) state.vizHandle.setT(t);
      var stop = nearestStop(t);
      var path = (state.resolved && state.resolved.well) ? 'scale/well' : ('scale/' + stop.id);
      history.replaceState(null, '', '#/' + path);
      state.path = path;
      state.activePath = path;
      var label = $('scale-path');
      if (label) label.textContent = 'lc://' + path;
      syncAddress(path);
    });
  }

  function bindCompare(id) {
    var list = comparableBodies();
    var select = $('compare-select');
    var slider = $('compare-slider');
    function apply(nextId, source) {
      var idx = 0;
      list.forEach(function (b, i) { if (b.id === nextId) idx = i; });
      var body = list[idx];
      if (source !== 'select' && select) select.value = body.id;
      if (source !== 'slider' && slider) slider.value = String(idx);
      var path = 'compare/' + body.id;
      history.replaceState(null, '', '#/' + path);
      state.path = path;
      state.activePath = path;
      syncAddress(path);
      paintCompare(body.id);
      paintStatus({ view: 'compare', path: path });
    }
    if (select) select.addEventListener('change', function () { apply(select.value, 'select'); });
    if (slider) slider.addEventListener('input', function () { apply(list[Number(slider.value)].id, 'slider'); });
  }

  function bindDelay(a, b) {
    var selA = $('delay-a');
    var selB = $('delay-b');
    var swap = $('delay-swap');
    function go(nextA, nextB) {
      navigate('delay/' + nextA + '/' + nextB, { replace: true });
    }
    if (selA) selA.addEventListener('change', function () { go(selA.value, selB.value); });
    if (selB) selB.addEventListener('change', function () { go(selA.value, selB.value); });
    if (swap) swap.addEventListener('click', function () { go(selB.value, selA.value); });
  }

  function paintOrbitClock() {
    var el = $('orbit-clock');
    if (!el || !window.LCGraphs) return;
    el.innerHTML = window.LCGraphs.clock(bodyById(state.clockBody || 'earth'), state.orbitPhase || 0, state.density);
  }

  async function mountNamed(id, factory) {
    var token = state.solarToken;
    var box = $(id);
    if (!box) return;
    var handle = null;
    try { handle = await factory(box); } catch (err) { handle = null; }
    if (token !== state.solarToken) {
      if (handle && handle.destroy) handle.destroy();
      return;
    }
    state.vizHandle = handle;
    state.webgl = handle ? 'OK' : 'FAIL';
    var note = $('viz-note');
    if (!handle && note && state.copy) {
      note.textContent = location.protocol === 'file:' ? 'serve via http:// for 3D' : state.copy.solar.webgl_note;
    }
    if (state.resolved) paintStatus(state.resolved);
  }

  async function mountSolar() {
    var token = state.solarToken;
    var stage = $('solar-stage');
    var note = $('solar-note');
    if (!stage) return null;
    if (state.solarView === 'flat') {
      stage.innerHTML = window.LCSolar.schematicSvg(state.bodies, state.scaleMode);
      if (note) note.textContent = '';
      return null;
    }
    var handle = await window.LCSolar.mount(stage, {
      bodies: state.bodies,
      mode: state.scaleMode,
      mobile: window.matchMedia('(max-width: 800px)').matches,
      reduce: state.reduce,
      onSelect: function (id) { navigate('solar/' + id); }
    });
    if (token !== state.solarToken) {
      if (handle) handle.destroy();
      return null;
    }
    if (!handle) {
      state.webgl = 'FAIL';
      state.solarView = 'flat';
      stage.innerHTML = window.LCSolar.schematicSvg(state.bodies, state.scaleMode);
      var msg = location.protocol === 'file:' ? state.copy.solar.file_note : state.copy.solar.webgl_note;
      if (note) note.textContent = msg;
      document.querySelectorAll('[data-solar-view]').forEach(function (btn) {
        var on = btn.getAttribute('data-solar-view') === 'flat';
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      return null;
    }
    state.solarHandle = handle;
    state.webgl = 'OK';
    if (note) note.textContent = '';
    if (state.resolved) paintStatus(state.resolved);
    return handle;
  }

  function setScaleMode(mode) {
    state.scaleMode = mode === 'honest' ? 'honest' : 'readable';
    try { localStorage.setItem('lc-scale-mode', state.scaleMode); } catch (e) { /* ignore */ }
    document.querySelectorAll('[data-scale-mode]').forEach(function (btn) {
      var on = btn.getAttribute('data-scale-mode') === state.scaleMode;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var cap = $('solar-caption');
    if (cap) cap.textContent = state.scaleMode === 'honest' ? state.copy.solar.caption_honest : state.copy.solar.caption_readable;
    if (state.solarHandle) state.solarHandle.setMode(state.scaleMode);
    else {
      var stage = $('solar-stage');
      if (stage) stage.innerHTML = window.LCSolar.schematicSvg(state.bodies, state.scaleMode);
    }
  }

  function setSolarView(view) {
    state.solarView = view === 'flat' ? 'flat' : 'volume';
    if (state.resolved && state.resolved.view === 'solar') render(state.resolved);
  }

  function setDensity(value) {
    state.density = value === 'analyst' ? 'analyst' : 'cadet';
    try { localStorage.setItem('lc-density', state.density); } catch (e) { /* ignore */ }
    if (state.resolved) {
      render(state.resolved);
      paintChrome(state.resolved);
    }
  }

  function toggleMute() {
    state.mute = !state.mute;
    try { localStorage.setItem('lc-mute', state.mute ? '1' : '0'); } catch (e) { /* ignore */ }
    if (!state.mute && window.LCAudio) {
      window.LCAudio.unlock();
      window.LCAudio.tick('low');
    }
    if (state.resolved) paintChrome(state.resolved);
  }

  function setFrame(name) {
    state.frame = state.frame === name ? 'full' : name;
    try { sessionStorage.setItem('lc-frame', state.frame); } catch (e) { /* ignore */ }
    if (state.resolved) paintChrome(state.resolved);
    measure();
    if (state.solarHandle) state.solarHandle.resize();
  }

  function setDrawer(open) {
    state.drawer = !!open;
    $('rail').classList.toggle('is-open', state.drawer);
    $('scrim').hidden = !state.drawer;
    $('btn-index').setAttribute('aria-expanded', state.drawer ? 'true' : 'false');
  }

  function closeSuggest() {
    state.sugIndex = -1;
    var box = $('suggest');
    box.hidden = true;
    box.innerHTML = '';
    $('circuit').setAttribute('aria-expanded', 'false');
  }

  function paintSuggest(items) {
    var box = $('suggest');
    if (!items.length) { closeSuggest(); return; }
    if (state.sugIndex >= items.length) state.sugIndex = items.length - 1;
    box.hidden = false;
    box.innerHTML = items.map(function (item, i) {
      return '<li role="option" id="sug-' + i + '"><button type="button" data-go="' + esc(item.path) + '">' +
        esc(item.title) + '<span>lc://' + esc(item.path) + '</span></button></li>';
    }).join('');
    var buttons = box.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) buttons[i].classList.toggle('is-on', i === state.sugIndex);
    $('circuit').setAttribute('aria-expanded', 'true');
    if (state.sugIndex >= 0) $('circuit').setAttribute('aria-activedescendant', 'sug-' + state.sugIndex);
  }

  function currentHints() {
    var raw = $('circuit').value;
    return window.LCSearch.rank(raw, state.index).slice(0, 6).map(function (row) { return row.item; });
  }

  function runCommand(raw) {
    var hints = currentHints();
    if (state.sugIndex >= 0 && hints[state.sugIndex]) {
      navigate(hints[state.sugIndex].path);
      $('circuit').blur();
      closeSuggest();
      return;
    }
    var result = window.LCSearch.parse(raw, state.index);
    $('circuit').blur();
    closeSuggest();
    if (result.action === 'none') return;
    if (result.action === 'mute') { toggleMute(); return; }
    if (result.action === 'density') { setDensity(result.value); return; }
    if (result.action === 'view') { setScaleMode(result.mode); navigate('solar'); return; }
    if (result.action === 'scale3d') { navigate('scale/well'); return; }
    if (result.action === 'route') { navigate(result.path); return; }
    if (result.action === 'missing') navigate('missing/' + encodeURIComponent(result.query || raw));
  }

  function navigate(path, opts) {
    opts = opts || {};
    var clean = String(path || 'home').replace(/^#\/?/, '').replace(/^lc:\/\//i, '').replace(/^\/+/, '');
    var next = '#/' + clean;
    setDrawer(false);
    if (opts.replace) {
      history.replaceState({ path: clean }, '', next);
      commit(clean, opts);
      return;
    }
    if (location.hash === next) {
      commit(clean, opts);
      return;
    }
    location.hash = next;
  }

  function commit(path, opts) {
    opts = opts || {};
    if (!state.copy) return;
    var res = resolve(path);
    var changed = res.path !== state.activePath;
    state.path = path;
    state.activePath = res.path;
    state.resolved = res;
    if (res.view === 'scale' && res.stop) state.scaleT = res.stop.t;
    render(res);
    paintChrome(res);
    paintEcho(res);
    if (changed) {
      pushLog(res);
      if (!opts.initial && state.ready) {
        pulse();
        if (!state.mute && window.LCAudio) window.LCAudio.tick('nav');
      }
      var live = $('live');
      if (live) {
        var name = res.node ? res.node.title : res.view;
        live.textContent = (res.view === 'missing' ? 'No node. ' : 'Circuit closed. ') + name;
      }
    }
    measure();
  }

  function cyclePin(dir) {
    var head = (state.activePath || 'home').split('/')[0];
    var i = PINS.indexOf(head);
    if (i < 0) i = 0;
    var next = PINS[(i + dir + PINS.length) % PINS.length];
    navigate(next);
  }

  function measure() {
    var tabs = $('tabs');
    if (!tabs) return;
    document.documentElement.style.setProperty('--stack-bottom', tabs.getBoundingClientRect().bottom + 'px');
  }

  function focusCircuit() {
    var input = $('circuit');
    input.focus();
    input.select();
    placeCaret();
  }

  function bind() {
    document.body.addEventListener('click', function (e) {
      var modeBtn = e.target.closest('[data-scale-mode]');
      if (modeBtn) { setScaleMode(modeBtn.getAttribute('data-scale-mode')); return; }
      var scaleViewBtn = e.target.closest('[data-scale-view]');
      if (scaleViewBtn) {
        navigate(scaleViewBtn.getAttribute('data-scale-view') === 'well' ? 'scale/well' : 'scale');
        return;
      }
      var clockBtn = e.target.closest('[data-clock]');
      if (clockBtn) {
        state.clockBody = clockBtn.getAttribute('data-clock');
        paintOrbitClock();
        return;
      }
      var viewBtn = e.target.closest('[data-solar-view]');
      if (viewBtn) { setSolarView(viewBtn.getAttribute('data-solar-view')); return; }
      var go = e.target.closest('[data-go]');
      if (go) {
        e.preventDefault();
        navigate(go.getAttribute('data-go'));
        closeSuggest();
      }
    });
    $('suggest').addEventListener('mousedown', function (e) { e.preventDefault(); });
    $('btn-cadet').addEventListener('click', function () { setDensity('cadet'); });
    $('btn-analyst').addEventListener('click', function () { setDensity('analyst'); });
    $('btn-mute').addEventListener('click', toggleMute);
    $('btn-index').addEventListener('click', function () { setDrawer(!state.drawer); });
    $('scrim').addEventListener('click', function () { setDrawer(false); });
    var input = $('circuit');
    input.addEventListener('input', function () {
      state.sugIndex = -1;
      paintSuggest(currentHints());
      placeCaret();
    });
    input.addEventListener('focus', placeCaret);
    input.addEventListener('keyup', placeCaret);
    input.addEventListener('click', placeCaret);
    input.addEventListener('keydown', function (e) {
      var hints = currentHints();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!hints.length) return;
        e.preventDefault();
        if (state.sugIndex < 0) state.sugIndex = 0;
        else state.sugIndex = (state.sugIndex + (e.key === 'ArrowDown' ? 1 : -1) + hints.length) % hints.length;
        paintSuggest(hints);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runCommand(input.value);
      } else if (e.key === 'Escape') {
        closeSuggest();
        input.blur();
      }
    });
    input.addEventListener('blur', function () {
      setTimeout(function () {
        if (!$('suggest').contains(document.activeElement)) {
          closeSuggest();
          syncAddress(state.activePath);
        }
      }, 0);
    });
    document.addEventListener('keydown', function (e) {
      var tag = document.activeElement && document.activeElement.tagName;
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'Escape') {
        setDrawer(false);
        closeSuggest();
        if (typing) document.activeElement.blur();
        return;
      }
      var chord = (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K');
      if ((e.key === '/' && !typing) || chord) {
        e.preventDefault();
        focusCircuit();
        return;
      }
      if (e.key === 'Enter' && !typing) {
        var go = document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-go]');
        if (go && go.tagName !== 'A' && go.tagName !== 'BUTTON') {
          e.preventDefault();
          navigate(go.getAttribute('data-go'));
          return;
        }
      }
      if (!typing && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && window.innerWidth >= 1100) {
        e.preventDefault();
        cyclePin(e.key === 'ArrowRight' ? 1 : -1);
      }
    });
    document.addEventListener('selectionchange', function () {
      if (document.activeElement === input) placeCaret();
    });
    window.addEventListener('hashchange', function () { commit(readHash(), {}); });
    window.addEventListener('resize', function () {
      measure();
      if (window.innerWidth >= 1100) setDrawer(false);
      if (state.solarHandle) state.solarHandle.resize();
    });
  }

  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  async function runSelfTest() {
    var lines = [];
    function check(name, ok, extra) {
      lines.push((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' ' + extra : ''));
    }
    var mars = window.LCSearch.parse('mars', state.index);
    check('parse mars', mars.path === 'solar/mars', mars.path);
    var hole = window.LCSearch.parse('black hole', state.index);
    check('parse black hole', hole.path === 'deep/black-hole', hole.path);
    var sky = window.LCSearch.parse('why is space black', state.index);
    check('parse sky', sky.path === 'deep/why-black', sky.path);
    var cmp = window.LCSearch.parse('compare earth jupiter', state.index);
    check('parse compare', cmp.path === 'compare/jupiter', cmp.path);
    var cadet = window.LCSearch.parse('set cadet', state.index);
    check('parse cadet', cadet.action === 'density' && cadet.value === 'cadet');
    var moon = window.LCSearch.lightDelay('earth', 'moon');
    var moonFmt = window.LCSearch.formatSeconds(moon.seconds);
    check('moon delay', moon.kind === 'fixed' && moonFmt.text === '1.3' && moonFmt.unit === 's', moonFmt.text + moonFmt.unit);
    var sun = window.LCSearch.formatSeconds(window.LCSearch.lightDelay('earth', 'sun').seconds);
    check('sun delay', sun.text === '8.3' && sun.unit === 'min', sun.text + sun.unit);
    var range = window.LCSearch.lightDelay('earth', 'mars');
    check('mars range', range.kind === 'range' && range.minS > 240 && range.minS < 280 && range.maxS > 1200 && range.maxS < 1320, String(Math.round(range.minS)) + '/' + String(Math.round(range.maxS)));
    var pose = window.LCSolar.cameraOffset(10, Math.PI / 2, 0);
    check('camera +Z', Math.abs(pose.x) < 1e-6 && Math.abs(pose.y) < 1e-6 && Math.abs(pose.z - 10) < 1e-6);
    var earthPos = window.LCSolar.worldPos(bodyById('earth'), 'honest');
    check('earth +orbit', earthPos && earthPos.y === 0 && Math.hypot(earthPos.x, earthPos.z) > 9);
    check('bodies', state.bodies.length >= 12, String(state.bodies.length));
    check('topics', state.topics.length >= 5, String(state.topics.length));
    state.bodies.concat(state.topics).forEach(function (node) {
      check('copy ' + node.id, !!(node.cadet && node.analyst && node.class));
    });
    navigate('solar', { replace: true });
    if (state.solarReady) await state.solarReady;
    if (state.solarHandle) {
      check('webgl frame', !!state.solarHandle.frameOk);
      var before = state.solarHandle.cameraPosition();
      state.solarHandle.nudge(80, 0);
      var after = state.solarHandle.cameraPosition();
      check('drag right moves camera', Math.abs(after.x - before.x) + Math.abs(after.z - before.z) > 0.01);
    } else {
      lines.push('PASS webgl skipped — flat schematic');
    }
    var pre = document.createElement('pre');
    pre.id = 'selftest';
    pre.textContent = lines.join('\n');
    document.body.appendChild(pre);
    var failed = lines.some(function (line) { return line.indexOf('FAIL') === 0; });
    pre.dataset.result = failed ? 'FAIL' : 'PASS';
  }

  async function boot() {
    loadPrefs();
    bind();
    var bootEl = $('boot');
    var started = performance.now();
    try {
      var data = await loadData();
      state.bodies = data.bodies;
      state.topics = data.topics;
      state.copy = data.copy;
      state.index = window.LCSearch.buildIndex(state.bodies, state.topics);
      state.stops = prepareStops(state.copy.scaleStops);
      var earthStop = stopById('earth');
      state.scaleT = earthStop ? earthStop.t : 0.25;
      buildRail();
      if (!location.hash) history.replaceState(null, '', '#/home');
      startClock();
      state.t0 = Date.now();
      setInterval(function () {
        state.act += 1;
        if (state.resolved) paintStatus(state.resolved);
      }, 1000);
      state.ready = true;
      var wait = state.reduce ? 0 : Math.max(0, 1200 - (performance.now() - started));
      setTimeout(function () {
        if (bootEl) bootEl.hidden = true;
        $('win').hidden = false;
        commit(readHash(), { initial: true });
        registerSW();
        if (/[?&]selftest=1/.test(location.search)) runSelfTest();
      }, wait);
    } catch (err) {
      if (bootEl) {
        var title = $('boot-title');
        if (title) title.textContent = 'FILES UNREAD';
      }
      $('win').hidden = false;
      $('view').innerHTML = '<article class="file"><h1>FILES UNREAD</h1><p>Serve this folder locally, then open the printed URL. See README.</p></article>';
    }
  }

  window.__LC = {
    state: state,
    navigate: navigate,
    parse: function (q) { return window.LCSearch.parse(q, state.index); }
  };

  boot();
})();
