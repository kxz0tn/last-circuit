/* Instrument plates. Hairline axes. Numbers from the body files. */
(function (root) {
  'use strict';

  function n(v, d) {
    if (v == null || !isFinite(v)) return '—';
    var p = Math.pow(10, d == null ? 2 : d);
    var r = Math.round(v * p) / p;
    return String(r);
  }

  function svg(label, w, h, inner) {
    return '<svg class="graph" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '">' +
      '<rect width="' + w + '" height="' + h + '" fill="#050505"/>' + inner + '</svg>';
  }

  function plate(title, drawing, cadet, analyst, voice) {
    var line = voice === 'analyst' ? analyst : cadet;
    var tag = voice === 'analyst' ? 'ANALYST' : 'CADET';
    return '<figure class="plate"><header class="plate-title"><span>GRAPH</span><strong>' + title + '</strong></header>' +
      drawing +
      '<figcaption><span class="tag">' + tag + '</span> ' + line + '</figcaption>' +
      '<p class="fine"><span class="tag">FACT</span> Figures from the local files. Prose: Last Circuit.</p></figure>';
  }

  function find(bodies, id) {
    var i;
    for (i = 0; i < bodies.length; i++) if (bodies[i].id === id) return bodies[i];
    return null;
  }

  function mass(bodies, voice) {
    var ids = ['moon', 'mars', 'earth', 'jupiter', 'sun'];
    var rows = [];
    ids.forEach(function (id) { var b = find(bodies, id); if (b) rows.push(b); });
    var lo = Math.log10(0.01);
    var hi = Math.log10(333000);
    var marks = rows.map(function (b, i) {
      var y = 58 + i * 42;
      var m = b.mass_earth != null ? b.mass_earth : (b.id === 'earth' ? 1 : null);
      var x = 150 + (m ? ((Math.log10(m) - lo) / (hi - lo)) * 430 : 0);
      var digits = m >= 100 ? 0 : 3;
      return '<text x="24" y="' + (y + 4) + '" fill="#8d8d8d" font-size="13" font-family="Share Tech Mono, ui-monospace, monospace">' + b.title.toUpperCase() + '</text>' +
        '<line x1="150" y1="' + y + '" x2="' + x.toFixed(1) + '" y2="' + y + '" stroke="#c8c8c8"/>' +
        '<line x1="' + x.toFixed(1) + '" y1="' + (y - 7) + '" x2="' + x.toFixed(1) + '" y2="' + (y + 7) + '" stroke="#f3f3f3"/>' +
        '<text x="' + (x + 8).toFixed(1) + '" y="' + (y + 4) + '" fill="#ececec" font-size="13" font-family="Share Tech Mono, ui-monospace, monospace">× ' + n(m, digits) + '</text>';
    }).join('');
    var drawing = svg('Mass relative to Earth, logarithmic', 680, 300,
      '<text x="150" y="32" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">LOG MASS · EARTH = 1</text>' +
      '<line x1="150" y1="44" x2="600" y2="44" stroke="#2a2a2a"/>' + marks);
    return plate('MASS', drawing,
      'Jupiter is a few hundred Earths. The Sun is a few hundred thousand. The ruler is logarithmic so the Moon still has a mark.',
      'Moon 0.012, Mars 0.11, Earth 1, Jupiter 318, Sun 333,000 Earth masses. Tick position is log10 of that ratio.',
      voice);
  }

  function year(bodies, voice) {
    var order = ['mercury', 'earth', 'mars', 'jupiter', 'saturn'];
    var maxDays = 10759;
    var yearMarks = order.map(function (id, i) {
      var b = find(bodies, id);
      var y = 56 + i * 28;
      var w = b && b.year_days ? (b.year_days / maxDays) * 360 : 0;
      var label = !b || b.year_days == null ? '—' : (b.year_days < 800 ? Math.round(b.year_days) + ' d' : n(b.year_days / 365.25, 1) + ' y');
      return '<text x="20" y="' + (y + 4) + '" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + (b ? b.title.toUpperCase() : id) + '</text>' +
        '<line x1="130" y1="' + y + '" x2="' + (130 + w).toFixed(1) + '" y2="' + y + '" stroke="#ececec"/>' +
        '<text x="' + (138 + w).toFixed(1) + '" y="' + (y + 4) + '" fill="#ececec" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + label + '</text>';
    }).join('');
    var days = ['jupiter', 'earth', 'venus'];
    var maxH = 2802;
    var dayMarks = days.map(function (id, i) {
      var b = find(bodies, id);
      var y = 220 + i * 28;
      var w = b && b.day_hours ? (b.day_hours / maxH) * 360 : 0;
      var label = !b || b.day_hours == null ? '—' : (b.day_hours < 48 ? n(b.day_hours, 1) + ' h' : n(b.day_hours / 24, 0) + ' d');
      return '<text x="20" y="' + (y + 4) + '" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + (b ? b.title.toUpperCase() : id) + '</text>' +
        '<line x1="130" y1="' + y + '" x2="' + (130 + w).toFixed(1) + '" y2="' + y + '" stroke="#c8c8c8"/>' +
        '<text x="' + (138 + w).toFixed(1) + '" y="' + (y + 4) + '" fill="#ececec" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + label + '</text>';
    }).join('');
    var drawing = svg('Orbital period and solar day', 680, 320,
      '<text x="130" y="32" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">YEAR · AXIS IN DAYS</text>' +
      yearMarks +
      '<text x="130" y="204" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">SOLAR DAY · AXIS IN HOURS</text>' +
      dayMarks);
    return plate('YEAR / DAY', drawing,
      'Jupiter’s year is many Earth years. Its day is shorter than ours.',
      'Mercury 88 d, Earth 365.25 d, Mars 687 d, Jupiter about 11.9 y, Saturn about 29.5 y. Day lengths are the solar-day hours stored on each file. Venus’s sidereal spin, about 243 Earth days, is named on the Venus page and is not this axis.',
      voice);
  }

  function gravity(bodies, voice) {
    var ids = ['moon', 'mars', 'earth', 'jupiter', 'sun'];
    var rows = [];
    ids.forEach(function (id) { var b = find(bodies, id); if (b && b.gravity_g != null) rows.push(b); });
    var max = 28;
    var ticks = rows.map(function (b) {
      var x = 56 + (b.gravity_g / max) * 560;
      var bright = b.id === 'earth';
      return '<line x1="' + x.toFixed(1) + '" y1="96" x2="' + x.toFixed(1) + '" y2="132" stroke="' + (bright ? '#f3f3f3' : '#c8c8c8') + '" stroke-width="' + (bright ? 2 : 1) + '"/>' +
        '<text x="' + x.toFixed(1) + '" y="156" text-anchor="middle" fill="#ececec" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + b.title.toUpperCase() + '</text>' +
        '<text x="' + x.toFixed(1) + '" y="174" text-anchor="middle" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + n(b.gravity_g, 2) + ' g</text>';
    }).join('');
    var drawing = svg('Surface gravity from 0 to 28 g', 680, 240,
      '<text x="56" y="40" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">SURFACE GRAVITY · LINEAR · EARTH IS THE BRIGHT TICK</text>' +
      '<line x1="56" y1="120" x2="616" y2="120" stroke="#c8c8c8"/>' +
      '<text x="56" y="88" fill="#8d8d8d" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">0</text>' +
      '<text x="580" y="88" fill="#8d8d8d" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">28 g</text>' +
      ticks);
    return plate('GRAVITY', drawing,
      'Earth is 1 g. The Moon is a light step. The Sun is the far mark.',
      'Stored values: Moon 0.17 g, Mars 0.38 g, Earth 1 g, Jupiter 2.53 g, Sun 28 g. The axis is linear, so the small worlds sit near the origin.',
      voice);
  }

  function delay(bodies, voice) {
    var ids = ['moon', 'sun', 'mars', 'jupiter', 'saturn', 'neptune'];
    var rows = [];
    ids.forEach(function (id) { var b = find(bodies, id); if (b && b.light_seconds_typical != null) rows.push(b); });
    var mins = rows.map(function (b) { return Math.max(b.light_seconds_typical / 60, 0.015); });
    var lo = Math.log10(0.015);
    var hi = Math.log10(Math.max.apply(null, mins));
    var dots = rows.map(function (b, i) {
      var x = 78 + i * 96;
      var m = Math.max(b.light_seconds_typical / 60, 0.015);
      var y = 210 - ((Math.log10(m) - lo) / (hi - lo)) * 140;
      var label = b.id === 'moon' ? '1.3 s' : (m >= 90 ? n(m / 60, 1) + ' h' : n(m, 1) + ' min');
      return '<line x1="' + x + '" y1="210" x2="' + x + '" y2="' + y.toFixed(1) + '" stroke="#2a2a2a"/>' +
        '<circle cx="' + x + '" cy="' + y.toFixed(1) + '" r="3.5" fill="#f3f3f3"/>' +
        '<text x="' + x + '" y="232" text-anchor="middle" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + b.title.toUpperCase() + '</text>' +
        '<text x="' + x + '" y="' + (y - 10).toFixed(1) + '" text-anchor="middle" fill="#ececec" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + label + '</text>';
    }).join('');
    var drawing = svg('One-way light time from Earth, log minutes', 680, 270,
      '<text x="24" y="28" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">Y · LOG MINUTES · MOON MARKED 1.3 s</text>' +
      '<line x1="48" y1="210" x2="640" y2="210" stroke="#c8c8c8"/>' + dots);
    return plate('LIGHT DELAY', drawing,
      'A radio note to the Moon is about one second. The outer worlds take hours.',
      'Representative one-way times from the files, not a live range. Moon 1.3 s. Sun about 8.3 min. Mars mid-range about 12.5 min. Vertical position is log10 of minutes.',
      voice);
  }

  function size(bodies, voice) {
    var ids = ['moon', 'earth', 'jupiter', 'sun'];
    var rows = [];
    ids.forEach(function (id) { var b = find(bodies, id); if (b && b.eq_diameter_km) rows.push(b); });
    var lo = Math.log10(3000);
    var hi = Math.log10(1400000);
    var marks = rows.map(function (b, i) {
      var t = (Math.log10(b.eq_diameter_km) - lo) / (hi - lo);
      var r = 8 + t * 42;
      var x = 90 + i * 150;
      return '<circle cx="' + x + '" cy="120" r="' + r.toFixed(1) + '" fill="none" stroke="#ececec"/>' +
        '<text x="' + x + '" y="200" text-anchor="middle" fill="#ececec" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + b.title.toUpperCase() + '</text>' +
        '<text x="' + x + '" y="218" text-anchor="middle" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">' + Math.round(b.eq_diameter_km).toLocaleString('en-US') + ' km</text>';
    }).join('');
    var drawing = svg('Equatorial diameter, logarithmic circles', 680, 250,
      '<text x="24" y="28" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">DIAMETER · LOG RADIUS · NO FILL</text>' +
      '<line x1="40" y1="170" x2="640" y2="170" stroke="#2a2a2a"/>' + marks);
    return plate('SIZE', drawing,
      'Earth is a small ring beside Jupiter. The Sun is still the wide one.',
      'Equatorial diameters from the files: Moon 3,475 km, Earth 12,756 km, Jupiter 142,984 km, Sun 1,392,000 km. Drawn radius follows log10 of the diameter.',
      voice);
  }

  function clock(body, phase, voice) {
    var title = body ? body.title.toUpperCase() : 'EARTH';
    var year = !body || body.year_days == null ? '—' : (body.year_days < 800 ? Math.round(body.year_days) + ' d' : n(body.year_days / 365.25, 1) + ' y');
    var drawing = svg('Orbit clock, static now mark', 680, 240,
      '<text x="24" y="28" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">ORBIT · ILLUSTRATION · NOT TONIGHT’S SKY</text>' +
      '<circle cx="160" cy="130" r="72" fill="none" stroke="#8d8d8d" stroke-dasharray="3 5"/>' +
      '<circle cx="160" cy="130" r="52" fill="none" stroke="#ececec"/>' +
      '<line x1="160" y1="130" x2="160" y2="62" stroke="#f3f3f3"/>' +
      '<text x="168" y="58" fill="#f3f3f3" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">NOW</text>' +
      '<text x="280" y="110" fill="#8d8d8d" font-size="13" font-family="Share Tech Mono, ui-monospace, monospace">DASHED RING · EARTH</text>' +
      '<text x="280" y="134" fill="#ececec" font-size="13" font-family="Share Tech Mono, ui-monospace, monospace">SOLID RING · ' + title + '</text>' +
      '<text x="280" y="164" fill="#8d8d8d" font-size="13" font-family="Share Tech Mono, ui-monospace, monospace">YEAR ' + year + '</text>');
    return plate('ORBIT CLOCK', drawing,
      'The bright tick is a drawn “now,” not the sky outside.',
      'Earth is the dashed ring. The solid ring is ' + (body ? body.title : 'Earth') + '. The year figure is year_days from the file. Phase is not an ephemeris.',
      voice);
  }

  function bench(earth, other) {
    if (!earth || !other || other.radius_km == null) return '';
    function row(label, a, b, y) {
      var max = Math.max(a || 0, b || 0) || 1;
      var w1 = a ? (a / max) * 180 : 0;
      var w2 = b ? (b / max) * 180 : 0;
      return '<text x="8" y="' + (y + 4) + '" fill="#8d8d8d" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">' + label + '</text>' +
        '<line x1="78" y1="' + (y - 6) + '" x2="' + (78 + w1).toFixed(1) + '" y2="' + (y - 6) + '" stroke="#8d8d8d"/>' +
        '<line x1="78" y1="' + (y + 6) + '" x2="' + (78 + w2).toFixed(1) + '" y2="' + (y + 6) + '" stroke="#ececec"/>';
    }
    return '<figure class="plate"><header class="plate-title"><span>BENCH</span><strong>EARTH / ' + other.title.toUpperCase() + '</strong></header>' +
      svg('Earth against ' + other.title, 320, 140,
        row('RADIUS', earth.radius_km, other.radius_km, 36) +
        row('DAY', earth.day_hours, other.day_hours, 68) +
        row('GRAVITY', earth.gravity_g, other.gravity_g, 100) +
        '<text x="78" y="128" fill="#8d8d8d" font-size="10" font-family="Share Tech Mono, ui-monospace, monospace">DIM EARTH · BRIGHT TARGET</text>') +
      '<p class="fine"><span class="tag">FACT</span> Same round figures as the compare bench.</p></figure>';
  }

  function galaxyFlat() {
    var marks = '';
    var i;
    for (i = 0; i < 70; i++) {
      var arm = i % 2;
      var u = (i % 35) / 35;
      var a = u * 4.2 + arm * Math.PI;
      var r = 16 + u * 92;
      var x = 200 + Math.cos(a) * r;
      var y = 140 + Math.sin(a) * r * 0.5;
      marks += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="1.5" height="1.5" fill="#c8c8c8"/>';
    }
    return svg('Schematic galaxy trace', 400, 260,
      '<text x="16" y="24" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">TRACE · NOT A CATALOG</text>' +
      marks +
      '<circle cx="262" cy="118" r="3.5" fill="#f3f3f3"/>' +
      '<text x="272" y="114" fill="#f3f3f3" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">YOU ARE HERE</text>');
  }

  root.LCGraphs = {
    mass: mass, year: year, gravity: gravity, delay: delay, size: size,
    clock: clock, bench: bench, galaxyFlat: galaxyFlat
  };
})(typeof window !== 'undefined' ? window : globalThis);
