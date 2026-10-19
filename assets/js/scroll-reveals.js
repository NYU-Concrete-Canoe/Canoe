/* Quiet, one-time motion. All content stays readable without JavaScript. */
(function () {
  'use strict';
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window)) return;
  var observer;
  var frames = new Map();
  var pending = new Set();
  var counters = [];

  function finishCounter(counter) {
    var frame = frames.get(counter);
    if (frame) cancelAnimationFrame(frame);
    frames.delete(counter);
    var number = counter.querySelector('[data-count]');
    if (number) number.textContent = number.dataset.count;
    var suffix = counter.querySelector('[data-count-suffix]');
    if (suffix && counter.dataset.finalSuffix) suffix.textContent = counter.dataset.finalSuffix;
    counter.classList.add('is-revealed');
  }
  function count(counter) {
    counters.push(counter);
    var number = counter.querySelector('[data-count]');
    var suffix = counter.querySelector('[data-count-suffix]');
    if (!number) return;
    var target = Number(number.dataset.count);
    var start;
    var duration = 300;
    var rankSuffix = { 1: 'st', 2: 'nd', 3: 'rd' };
    function tick(now) {
      if (preference.matches) { finishCounter(counter); return; }
      if (start === undefined) start = now;
      var progress = Math.min(1, (now - start) / duration);
      var value = Math.min(target, 1 + Math.floor((target - 1) * (1 - Math.pow(1 - progress, 3))));
      number.textContent = String(value);
      // Keep ranks grammatical throughout: 1st, 2nd, 3rd (never 1rd).
      if (suffix && counter.dataset.ordinal === 'true') suffix.textContent = rankSuffix[value] || 'th';
      if (progress < 1) frames.set(counter, requestAnimationFrame(tick));
      else { frames.delete(counter); finishCounter(counter); }
    }
    frames.set(counter, requestAnimationFrame(tick));
  }

  observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var node = entry.target;
      observer.unobserve(node);
      pending.delete(node);
      node.classList.add('is-revealed');
      if (node.hasAttribute('data-result-counter')) count(node);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -28px 0px' });

  function observe(node) { pending.add(node); observer.observe(node); }

  // Start results at the viewport edge; captions and drawing rules retain their later trigger.
  var resultObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      resultObserver.unobserve(entry.target);
      count(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px 80px 0px' });
  document.querySelectorAll('[data-result-counter]').forEach(function (counter) {
    resultObserver.observe(counter);
  });

  // Observe a full-width hit area, not a line whose scale is initially zero.
  var ruleObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      ruleObserver.unobserve(entry.target);
      pending.delete(entry.target);
      entry.target.classList.add('is-revealed');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

  document.querySelectorAll('.home-story > section:not([hidden]), .engineering-story > section:not([hidden]):not(.product-story), .page-other .content-wrapper > section:not([hidden])').forEach(function (section) {
    // Replace only real section dividers; no additional decorative lines.
    if (parseFloat(getComputedStyle(section).borderBottomWidth) === 0) return;
    var rule = document.createElement('span');
    rule.className = 'drawing-rule reveal-pending';
    rule.setAttribute('aria-hidden', 'true');
    section.append(rule);
    section.classList.add('has-drawing-rule');
    pending.add(rule);
    ruleObserver.observe(rule);
  });

  document.querySelectorAll('figure figcaption').forEach(function (caption) {
    caption.classList.add('caption-reveal', 'reveal-pending');
    observe(caption);
  });

  preference.addEventListener('change', function (event) {
    if (!event.matches) return;
    observer.disconnect();
    resultObserver.disconnect();
    ruleObserver.disconnect();
    pending.forEach(function (node) { node.classList.add('is-revealed'); });
    pending.clear();
    counters.forEach(finishCounter);
    document.querySelectorAll('[data-result-counter]').forEach(function (counter) {
      var suffix = counter.querySelector('[data-count-suffix]');
      if (suffix && counter.dataset.finalSuffix) suffix.textContent = counter.dataset.finalSuffix;
    });
  });
})();
