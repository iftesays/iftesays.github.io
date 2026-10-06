/* Holdfast theme JS: no dependencies. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Scroll reveal ---------------- */
  var revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    : null;

  function initReveal(root) {
    (root || document).querySelectorAll('.reveal, [data-stack]').forEach(function (el) {
      if (revealObserver && !reduceMotion) revealObserver.observe(el);
      else el.classList.add('is-in');
    });
  }

  /* ---------------- Hero word swap ---------------- */
  function initWordSwap(root) {
    (root || document).querySelectorAll('[data-word-swap]').forEach(function (wrap) {
      if (wrap._swap) clearInterval(wrap._swap);
      var words = wrap.getAttribute('data-word-swap').split(',').map(function (w) { return w.trim(); }).filter(Boolean);
      if (words.length < 2 || reduceMotion) return;
      var i = 0;
      wrap._swap = setInterval(function () {
        var current = wrap.querySelector('.hero__swap-word');
        current.classList.add('is-out');
        setTimeout(function () {
          i = (i + 1) % words.length;
          var next = document.createElement('span');
          next.className = 'hero__swap-word is-in';
          next.textContent = words[i];
          wrap.replaceChild(next, current);
        }, 330);
      }, 2600);
    });
  }

  /* ---------------- Drawers ---------------- */
  var lastFocus = null;
  function openDrawer(name) {
    var drawer = document.querySelector('[data-drawer="' + name + '"]');
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    var btn = document.querySelector('[data-nav-open]');
    if (name === 'nav' && btn) btn.setAttribute('aria-expanded', 'true');
    var focusable = drawer.querySelector('.drawer__panel button, .drawer__panel a');
    if (focusable) setTimeout(function () { focusable.focus(); }, 50);
  }
  function closeDrawers() {
    document.querySelectorAll('[data-drawer].is-open').forEach(function (d) {
      d.classList.remove('is-open');
      d.setAttribute('aria-hidden', 'true');
    });
    document.body.classList.remove('is-locked');
    var btn = document.querySelector('[data-nav-open]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-nav-open]')) { e.preventDefault(); openDrawer('nav'); return; }
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openDrawer('cart'); return; }
    if (e.target.closest('[data-drawer-close]')) { e.preventDefault(); closeDrawers(); return; }
    var navLink = e.target.closest('#MobileNav .mobile-nav a');
    if (navLink && navLink.getAttribute('href').indexOf('#') !== -1) closeDrawers();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawers(); });

  /* ---------------- Money ---------------- */
  function formatMoney(cents) {
    var format = (window.theme && theme.moneyFormat) || '${{amount}}';
    var value = (cents / 100).toFixed(2);
    var parts = value.split('.');
    var withCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return format
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, withCommas)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + parts[1])
      .replace(/\{\{\s*amount\s*\}\}/, withCommas + '.' + parts[1]);
  }

  /* ---------------- Cart (Ajax API + Section Rendering) ---------------- */
  var root = (window.theme && theme.routes.root) || '/';
  if (root.slice(-1) !== '/') root += '/';

  function refreshCart(open) {
    return fetch(root + '?section_id=cart-drawer', { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.querySelector('[data-cart-drawer]');
        var current = document.querySelector('[data-cart-drawer]');
        if (fresh && current) {
          current.innerHTML = fresh.innerHTML;
          var count = parseInt(fresh.getAttribute('data-item-count'), 10) || 0;
          current.setAttribute('data-item-count', count);
          document.querySelectorAll('[data-cart-count]').forEach(function (el) {
            el.textContent = count;
            el.classList.toggle('is-empty', count === 0);
            el.classList.remove('is-bump');
            void el.offsetWidth;
            el.classList.add('is-bump');
          });
        }
        if (open) openDrawer('cart');
      });
  }

  function changeLine(line, quantity) {
    var drawer = document.querySelector('[data-cart-drawer]');
    if (drawer) drawer.style.opacity = '.6';
    return fetch(root + 'cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity })
    })
      .then(function () { return refreshCart(false); })
      .finally(function () { if (drawer) drawer.style.opacity = ''; });
  }

  document.addEventListener('click', function (e) {
    var lineBtn = e.target.closest('[data-line-change]');
    if (lineBtn) {
      e.preventDefault();
      changeLine(parseInt(lineBtn.getAttribute('data-line-change'), 10), parseInt(lineBtn.getAttribute('data-qty'), 10));
      return;
    }
    var upgrade = e.target.closest('[data-upgrade-line]');
    if (upgrade) {
      e.preventDefault();
      upgrade.disabled = true;
      var line = parseInt(upgrade.getAttribute('data-upgrade-line'), 10);
      var to = upgrade.getAttribute('data-upgrade-to');
      var qty = parseInt(upgrade.getAttribute('data-upgrade-qty'), 10) || 1;
      fetch(root + 'cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line: line, quantity: 0 })
      })
        .then(function () {
          return fetch(root + 'cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [{ id: to, quantity: qty }] })
          });
        })
        .then(function () { return refreshCart(false); });
    }
  });

  /* ---------------- Product forms ---------------- */
  function initBuyBoxes(scope) {
    (scope || document).querySelectorAll('[data-buy-box]').forEach(function (box) {
      if (box._init) return;
      box._init = true;
      var form = box.querySelector('[data-product-form]') || box.querySelector('form');
      var addBtn = box.querySelector('[data-add-button]');
      var addLabel = box.querySelector('[data-add-label]');
      var errorEl = box.querySelector('[data-form-error]');
      var isMain = !!box.closest('[data-product-main]');

      function selected() { return form.querySelector('input[name="id"]:checked') || form.querySelector('input[name="id"]'); }

      function update() {
        var input = selected();
        if (!input) return;
        form.querySelectorAll('.pack').forEach(function (p) { p.classList.toggle('is-selected', p.contains(input)); });
        var price = input.getAttribute('data-price');
        var available = input.getAttribute('data-available') !== 'false';
        if (price && addLabel) addLabel.textContent = available ? 'Add to cart — ' + price : 'Sold out';
        if (addBtn) addBtn.disabled = !available;

        if (isMain) {
          var priceEl = document.querySelector('[data-price-display]');
          var compareEl = document.querySelector('[data-compare-display]');
          if (priceEl && price) priceEl.textContent = price;
          if (compareEl) {
            var compare = input.getAttribute('data-compare');
            compareEl.textContent = compare || '';
            compareEl.hidden = !compare;
          }
          var sv = document.querySelector('[data-sticky-variant]');
          var sp = document.querySelector('[data-sticky-price]');
          if (sv) sv.textContent = input.getAttribute('data-title') || '';
          if (sp && price) sp.textContent = price;
          if (input.type === 'radio' && window.history.replaceState) {
            var url = new URL(window.location.href);
            url.searchParams.set('variant', input.value);
            window.history.replaceState({}, '', url.toString());
          }
        }
      }

      form.addEventListener('change', function (e) { if (e.target.name === 'id') update(); });

      box.querySelectorAll('[data-qty-step]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var input = box.querySelector('.qty__input');
          var v = Math.max(1, Math.min(20, (parseInt(input.value, 10) || 1) + parseInt(btn.getAttribute('data-qty-step'), 10)));
          input.value = v;
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (addBtn) { addBtn.classList.add('is-loading'); addBtn.disabled = true; }
        if (errorEl) errorEl.hidden = true;
        var data = new FormData(form);
        fetch(root + 'cart/add.js', { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) { return r.json().then(function (json) { return { ok: r.ok, json: json }; }); })
          .then(function (res) {
            if (!res.ok) throw new Error(res.json.description || res.json.message || 'Could not add to cart.');
            return refreshCart(true);
          })
          .catch(function (err) {
            if (errorEl) { errorEl.textContent = err.message; errorEl.hidden = false; }
          })
          .finally(function () {
            if (addBtn) { addBtn.classList.remove('is-loading'); addBtn.disabled = false; }
            update();
          });
      });

      update();
    });
  }

  /* ---------------- Sticky add to cart ---------------- */
  function initStickyAtc() {
    var bar = document.querySelector('[data-sticky-atc]');
    var target = document.querySelector('[data-product-main] [data-buy-box]');
    if (!bar || !target || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      var show = !e.isIntersecting && e.boundingClientRect.top < 0;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    }).observe(target);
    var btn = bar.querySelector('[data-sticky-add]');
    if (btn) btn.addEventListener('click', function () {
      var form = target.querySelector('form');
      if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true }));
    });
  }

  /* ---------------- Gallery ---------------- */
  function initGallery(scope) {
    (scope || document).querySelectorAll('[data-gallery]').forEach(function (g) {
      var slides = g.querySelectorAll('[data-slide]');
      var thumbs = g.querySelectorAll('[data-thumb]');
      function go(i) {
        slides.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-slide') === String(i)); });
        thumbs.forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-thumb') === String(i)); });
      }
      thumbs.forEach(function (t) { t.addEventListener('click', function () { go(t.getAttribute('data-thumb')); }); });
      var stage = g.querySelector('.gallery__stage');
      var startX = null;
      stage.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (startX === null || slides.length < 2) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) {
          var cur = parseInt(g.querySelector('.gallery__slide.is-active').getAttribute('data-slide'), 10);
          go((cur + (dx < 0 ? 1 : -1) + slides.length) % slides.length);
        }
        startX = null;
      });
    });
  }

  /* ---------------- Slip test counter ---------------- */
  function initSlipTest(scope) {
    (scope || document).querySelectorAll('[data-slip-test]').forEach(function (sec) {
      var pad = sec.querySelector('.slip__pad--slide > g');
      var counter = sec.querySelector('[data-slip-count]');
      if (!pad || !counter) return;
      var n = 0;
      pad.addEventListener('animationiteration', function () {
        n += 1;
        counter.textContent = n;
      });
    });
  }

  /* ---------------- Layers highlight ---------------- */
  function initLayers(scope) {
    (scope || document).querySelectorAll('.layers-sec').forEach(function (sec) {
      var triggers = sec.querySelectorAll('[data-layer-trigger]');
      function activate(i) {
        sec.querySelectorAll('[data-layer]').forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-layer') === i); });
        triggers.forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-layer-trigger') === i); });
      }
      triggers.forEach(function (t) {
        t.addEventListener('mouseenter', function () { activate(t.getAttribute('data-layer-trigger')); });
        t.addEventListener('focusin', function () { activate(t.getAttribute('data-layer-trigger')); });
      });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) activate(e.target.getAttribute('data-layer-trigger')); });
        }, { rootMargin: '-45% 0px -45% 0px' });
        triggers.forEach(function (t) { io.observe(t); });
      }
    });
  }

  /* ---------------- Count-up stats ---------------- */
  function initCounters(scope) {
    var els = (scope || document).querySelectorAll('[data-count-to]');
    if (!els.length || reduceMotion || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target;
        var to = parseFloat(el.getAttribute('data-count-to')) || 0;
        var start = null;
        var dur = 1200;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * eased);
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0';
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Boot ---------------- */
  function init(scope) {
    initReveal(scope);
    initWordSwap(scope);
    initBuyBoxes(scope);
    initGallery(scope);
    initSlipTest(scope);
    initLayers(scope);
    initCounters(scope);
  }

  document.addEventListener('DOMContentLoaded', function () {
    init(document);
    initStickyAtc();
  });

  // Theme editor support
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });

  window.HoldfastTheme = { refreshCart: refreshCart, formatMoney: formatMoney };
})();
