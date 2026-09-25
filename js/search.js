/* Local index, commands, and light-time math. No network. */
(function (root) {
  'use strict';

  var AU_LIGHT_S = 499;

  var SWITCH = {
    sun: 0,
    earth: 1,
    moon: 1,
    mars: 1.524,
    jupiter: 5.203
  };

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/^lc:\/\//, '')
      .replace(/[./_]+/g, ' ')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function edit(a, b) {
    if (a === b) return 0;
    var m = a.length;
    var n = b.length;
    if (Math.abs(m - n) > 4) return 9;
    if (m > 48 || n > 48) return 9;
    var prev = new Array(n + 1);
    var cur = new Array(n + 1);
    var j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
      cur[0] = i;
      var rowBest = cur[0];
      for (j = 1; j <= n; j++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (cur[j] < rowBest) rowBest = cur[j];
      }
      if (rowBest > 4) return 9;
      var swap = prev;
      prev = cur;
      cur = swap;
    }
    return prev[n];
  }

  function score(n, item) {
    var best = 0;
    var keys = item.keys;
    var i;
    for (i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key === n) best = Math.max(best, 100);
      else if (n.length >= 2 && key.indexOf(n) === 0) best = Math.max(best, 84);
      else if (n.length >= 3 && key.indexOf(n) !== -1) best = Math.max(best, 72);
      else if (n.length >= 3) {
        var d = edit(n, key);
        var limit = key.length <= 5 ? 1 : 3;
        if (d <= limit) best = Math.max(best, 62 - d);
      }
    }
    var tokens = n.split(' ');
    if (tokens.length > 1) {
      var ok = true;
      for (i = 0; i < tokens.length; i++) {
        var hit = false;
        for (var k = 0; k < keys.length; k++) {
          if (keys[k].indexOf(tokens[i]) !== -1) hit = true;
        }
        if (!hit) ok = false;
      }
      if (ok) best = Math.max(best, 66);
    }
    return best;
  }

  function rank(q, index) {
    var n = norm(q);
    if (!n) return [];
    var out = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(n, index[i]);
      if (s > 0) out.push({ item: index[i], s: s });
    }
    out.sort(function (a, b) {
      if (b.s !== a.s) return b.s - a.s;
      return a.item.title < b.item.title ? -1 : 1;
    });
    return out;
  }

  function buildIndex(bodies, topics) {
    var items = [];
    function add(entry) {
      var keys = [];
      var raw = [entry.id, entry.title].concat(entry.aliases || []);
      for (var i = 0; i < raw.length; i++) {
        var k = norm(raw[i]);
        if (k && keys.indexOf(k) === -1) keys.push(k);
      }
      items.push({
        id: entry.id,
        title: entry.title,
        path: String(entry.path || '').replace(/^lc:\/\//, ''),
        kind: entry.kind || 'file',
        keys: keys
      });
    }
    bodies.forEach(function (b) { add(b); });
    topics.forEach(function (t) { add(t); });
    [
      { id: 'home', title: 'Home', path: 'home', kind: 'pin', aliases: ['home', 'start'] },
      { id: 'solar', title: 'Solar system', path: 'solar', kind: 'pin', aliases: ['solar', 'solar system', 'solar sys', 'solarsys'] },
      { id: 'scale', title: 'Scale', path: 'scale', kind: 'pin', aliases: ['scale', 'powers of ten'] },
      { id: 'graph', title: 'Graph', path: 'graph/mass', kind: 'pin', aliases: ['graph', 'graphs'] },
      { id: 'galaxy', title: 'Galaxy trace', path: 'galaxy', kind: 'tool', aliases: ['galaxy', 'you are here'] },
      { id: 'deep', title: 'Deep', path: 'deep', kind: 'pin', aliases: ['deep', 'deep sky'] },
      { id: 'log', title: 'Log', path: 'log', kind: 'pin', aliases: ['log', 'history'] },
      { id: 'credits', title: 'Credits', path: 'credits', kind: 'pin', aliases: ['credits', 'credit', 'license'] },
      { id: 'help', title: 'Help', path: 'help', kind: 'tool', aliases: ['help', 'commands'] },
      { id: 'compare', title: 'Compare bench', path: 'compare/jupiter', kind: 'tool', aliases: ['compare', 'compare bench', 'comparison'] },
      { id: 'delay', title: 'Light-delay switchboard', path: 'delay/earth/moon', kind: 'tool', aliases: ['delay', 'light delay', 'light-delay', 'switchboard', 'radio'] }
    ].forEach(add);
    return items;
  }

  function byName(q, index) {
    var ranked = rank(q, index);
    if (!ranked.length) return null;
    if (ranked[0].s >= 60) return ranked[0].item;
    return null;
  }

  function suggest(q, index, n) {
    var ranked = rank(q, index).slice(0, n || 3);
    if (ranked.length) return ranked.map(function (r) { return r.item; });
    return index.filter(function (it) { return it.kind === 'file'; }).slice(0, n || 3);
  }

  function comparePath(name, index) {
    var item = byName(name, index);
    if (!item) return { action: 'missing', query: name, suggestions: suggest(name, index, 3) };
    if (item.path.indexOf('solar/') !== 0) {
      return { action: 'missing', query: name, suggestions: suggest(name, index, 3) };
    }
    return { action: 'route', path: 'compare/' + item.id, title: item.title };
  }

  function parse(raw, index) {
    var original = String(raw || '').trim();
    if (!original) return { action: 'none' };
    var stripped = original.replace(/^lc:\/\//i, '').replace(/^\/+/, '');
    if (/^(solar|deep|scale|compare|delay|help|credits|log|home|missing|graph|galaxy)\//i.test(stripped)) {
      return { action: 'route', path: stripped };
    }
    var q = norm(stripped);
    if (!q) return { action: 'none' };
    if (q === 'mute' || q === 'set mute' || q === 'toggle mute') return { action: 'mute' };
    if (q === 'set cadet' || q === 'cadet') return { action: 'density', value: 'cadet' };
    if (q === 'set analyst' || q === 'analyst') return { action: 'density', value: 'analyst' };
    if (q === 'help') return { action: 'route', path: 'help' };
    if (q === 'credits' || q === 'credit') return { action: 'route', path: 'credits' };
    if (q === 'scale') return { action: 'route', path: 'scale' };
    if (q === 'home' || q === 'start') return { action: 'route', path: 'home' };
    if (q === 'log' || q === 'history') return { action: 'route', path: 'log' };
    if (q === 'solar' || q === 'solar system' || q === 'solar sys' || q === 'solarsys') {
      return { action: 'route', path: 'solar' };
    }
    if (q === 'deep') return { action: 'route', path: 'deep' };
    if (q === 'compare' || q === 'compare earth') return { action: 'route', path: 'compare/jupiter' };
    if (q === 'delay' || q === 'light' || q === 'light delay' || q === 'light-delay' || q === 'switchboard') {
      return { action: 'route', path: 'delay/earth/moon' };
    }
    if (q === 'graph' || q === 'graphs' || q === 'graph mass') return { action: 'route', path: 'graph/mass' };
    if (q === 'graph year' || q === 'graph day') return { action: 'route', path: 'graph/year' };
    if (q === 'graph delay' || q === 'graph light') return { action: 'route', path: 'graph/delay' };
    if (q === 'graph gravity') return { action: 'route', path: 'graph/gravity' };
    if (q === 'graph size' || q === 'graph ladder') return { action: 'route', path: 'graph/size' };
    if (q === 'view honest') return { action: 'view', mode: 'honest' };
    if (q === 'view readable') return { action: 'view', mode: 'readable' };
    if (q === 'view hole' || q === 'view black hole') return { action: 'route', path: 'deep/black-hole' };
    if (q === 'view galaxy') return { action: 'route', path: 'galaxy' };
    if (q === 'view scale3d' || q === 'view scale 3d') return { action: 'scale3d' };
    if (q === 'galaxy') return { action: 'route', path: 'galaxy' };
    var m = q.match(/^open\s+(.+)$/);
    if (m) {
      var openedName = m[1].replace(/^lc\s+/, '').replace(/^(solar|deep)\s+/, '');
      var opened = byName(openedName, index);
      if (opened) return { action: 'route', path: opened.path, title: opened.title };
      return { action: 'missing', query: m[1], suggestions: suggest(openedName, index, 3) };
    }
    m = q.match(/^compare\s+earth\s+(.+)$/);
    if (m) return comparePath(m[1], index);
    m = q.match(/^compare\s+(.+?)\s+(?:to|vs|with|and)\s+earth$/);
    if (m) return comparePath(m[1], index);
    m = q.match(/^compare\s+(.+)$/);
    if (m) return comparePath(m[1], index);
    var direct = byName(q, index);
    if (direct) return { action: 'route', path: direct.path, title: direct.title };
    return { action: 'missing', query: stripped, suggestions: suggest(q, index, 3) };
  }

  function formatSeconds(seconds) {
    var a = Math.abs(Number(seconds) || 0);
    if (a < 90) {
      var s = Math.round(a * 10) / 10;
      return { text: s.toFixed(1), unit: 's', speak: s.toFixed(1) + ' seconds' };
    }
    if (a < 5400) {
      var min = Math.round((a / 60) * 10) / 10;
      return { text: min.toFixed(1), unit: 'min', speak: min.toFixed(1) + ' minutes' };
    }
    var h = Math.round((a / 3600) * 10) / 10;
    return { text: h.toFixed(1), unit: 'h', speak: h.toFixed(1) + ' hours' };
  }

  function lightDelay(idA, idB) {
    if (idA === idB) {
      return {
        kind: 'same',
        seconds: 0,
        note: 'Same node. There is no path to time.'
      };
    }
    var pair = [idA, idB].sort().join('-');
    if (pair === 'earth-moon') {
      return {
        kind: 'fixed',
        seconds: 1.28,
        note: 'Mean Earth-Moon distance is about 384,000 km. Light in vacuum takes about 1.3 seconds. The monthly wobble is a fraction of a second.'
      };
    }
    if (idA === 'moon' || idB === 'moon') {
      var other = idA === 'moon' ? idB : idA;
      var base = lightDelay('earth', other);
      if (base.kind === 'fixed') {
        return {
          kind: 'fixed',
          seconds: base.seconds + 1.28,
          note: 'The long haul is the Earth leg. Add about 1.3 seconds for the last step between Earth and the Moon.'
        };
      }
      if (base.kind === 'range') {
        return {
          kind: 'range',
          minS: base.minS + 1.28,
          maxS: base.maxS + 1.28,
          note: 'The Moon rides with Earth. Take the Earth-to-target extremes and add about 1.3 seconds.'
        };
      }
    }
    if (SWITCH[idA] == null || SWITCH[idB] == null) {
      return { kind: 'unsupported', note: 'This bench only times Earth, the Moon, Mars, Jupiter, and the Sun.' };
    }
    if ((idA === 'sun' || idB === 'sun')) {
      var planet = idA === 'sun' ? idB : idA;
      var au = SWITCH[planet];
      return {
        kind: 'fixed',
        seconds: Math.abs(au) * AU_LIGHT_S,
        note: 'Mean orbital distance divided by the speed of light. Real orbits are slightly stretched, so the true delay drifts through the year. This is not a live range.'
      };
    }
    var auA = SWITCH[idA];
    var auB = SWITCH[idB];
    return {
      kind: 'range',
      minS: Math.abs(auA - auB) * AU_LIGHT_S,
      maxS: (auA + auB) * AU_LIGHT_S,
      note: 'NEAR is the two worlds on the same side of the Sun, using mean orbital radii. FAR adds the radii, the opposite-side gap. Orbits are not perfect circles, and this is not today\'s ephemeris.'
    };
  }

  function compareFacts(base, other) {
    function ratio(a, b) {
      if (a == null || b == null || !isFinite(a) || !isFinite(b) || a === 0) return null;
      return b / a;
    }
    return {
      radius: ratio(base && base.radius_km, other && other.radius_km),
      day: ratio(base && base.day_hours, other && other.day_hours),
      year: ratio(base && base.year_days, other && other.year_days),
      gravity: ratio(base && base.gravity_g, other && other.gravity_g)
    };
  }

  root.LCSearch = {
    AU_LIGHT_S: AU_LIGHT_S,
    norm: norm,
    edit: edit,
    buildIndex: buildIndex,
    rank: rank,
    suggest: suggest,
    parse: parse,
    formatSeconds: formatSeconds,
    lightDelay: lightDelay,
    compareFacts: compareFacts
  };
})(typeof window !== 'undefined' ? window : globalThis);
