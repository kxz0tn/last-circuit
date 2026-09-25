/* Synthesized ticks only. No samples. Mute is the default. */
(function (root) {
  'use strict';

  var ctx = null;

  function context() {
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') {
      var resume = ctx.resume();
      if (resume && resume.catch) resume.catch(function () {});
    }
    return ctx;
  }

  function tick(kind) {
    var ac = context();
    if (!ac) return;
    var t = ac.currentTime;
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = 'square';
    var freq = kind === 'low' ? 196 : 740;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.028, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  root.LCAudio = {
    tick: tick,
    unlock: context
  };
})(typeof window !== 'undefined' ? window : globalThis);
