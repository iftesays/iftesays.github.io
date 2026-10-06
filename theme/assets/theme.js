/* Holdfast theme scripts. No dependencies. */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', function (e) { reduceMotion = e.matches; });

  var root = (window.theme && window.theme.routes && window.theme.routes.root) || '/';
  if (root.slice(-1) !== '/') root += '/';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function safe(fn, arg) { try { fn(arg); } catch (e) { if (window.console) console.error(e); } }

  /* Screen-reader announcements */
  var live = document.createElement('div');
  live.className = 'visually-hidden';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  function announce(message) {
    live.textContent = '';
    setTimeout(function () { live.textContent = message; }, 50);
  }

  /* ---------------------------------------------------------------- Reveal */
  var revealObserver = null;
  function initReveal(scope) {
    var items = $$('.reveal:not(.is-visible)', scope);
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    // Anything already on screen is shown immediately, without animating.
    var fold = window.innerHeight;
    items.forEach(function (el) { if (el.getBoundingClientRect().top < fold) el.classList.add('is-visible'); });
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    }
    items.forEach(function (el) { if (!el.classList.contains('is-visible')) revealObserver.observe(el); });
    document.documentElement.classList.add('reveal-ready');
  }

  /* ------------------------------------------------------ Announcement bar */
  function initAnnouncements(scope) {
    $$('[data-announcement]', scope).forEach(function (bar) {
      if (bar._ready) return;
      bar._ready = true;
      var slides = $$('.announcement__slide', bar);
      if (slides.length < 2) return;
      var index = 0;
      var paused = false;
      function show(i) {
        index = (i + slides.length) % slides.length;
        slides.forEach(function (s, n) {
          var on = n === index;
          s.classList.toggle('is-active', on);
          s.setAttribute('aria-hidden', on ? 'false' : 'true');
          s.inert = !on;
        });
      }
      function tick() { if (!paused && !document.hidden && !reduceMotion) show(index + 1); }
      bar._timer = setInterval(tick, 5000);
      $('[data-announcement-prev]', bar).addEventListener('click', function () { show(index - 1); });
      $('[data-announcement-next]', bar).addEventListener('click', function () { show(index + 1); });
      bar.addEventListener('mouseenter', function () { paused = true; });
      bar.addEventListener('mouseleave', function () { paused = false; });
      bar.addEventListener('focusin', function () { paused = true; });
      bar.addEventListener('focusout', function () { paused = false; });
      bar._show = function (i) { paused = true; show(i); };
      bar._resume = function () { paused = false; };
      show(0);
    });
  }

  /* ---------------------------------------------------------------- Header */
  function initHeader() {
    var header = $('.section-header');
    if (!header) return;
    var lastY = window.scrollY;
    var ticking = false;
    function update() {
      var y = window.scrollY;
      var delta = y - lastY;
      header.classList.toggle('is-scrolled', y > 0);
      var locked = document.body.classList.contains('has-open-drawer') || header.contains(document.activeElement);
      if (y < header.offsetHeight + 40 || locked) {
        header.classList.remove('is-hidden');
      } else if (delta > 8) {
        header.classList.add('is-hidden');
      } else if (delta < -8) {
        header.classList.remove('is-hidden');
      }
      if (Math.abs(delta) > 8 || y === 0) lastY = y;
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* --------------------------------------------------------------- Drawers */
  var activeDrawer = null;
  var returnFocus = null;

  function focusables(el) {
    return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', el)
      .filter(function (n) { return n.offsetWidth > 0 || n.offsetHeight > 0; });
  }

  function openDrawer(name, opener) {
    var drawer = $('[data-drawer="' + name + '"]');
    if (!drawer) return;
    if (activeDrawer && activeDrawer !== drawer) closeDrawer(true);
    returnFocus = opener || document.activeElement;
    activeDrawer = drawer;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-open-drawer');
    $$('[aria-controls="' + drawer.id + '"]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    var close = $('.drawer__panel [data-drawer-close]', drawer);
    setTimeout(function () { (close || drawer).focus(); }, 60);
  }

  function closeDrawer(silent) {
    if (!activeDrawer) return;
    var drawer = activeDrawer;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-open-drawer');
    $$('[aria-controls="' + drawer.id + '"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    activeDrawer = null;
    if (!silent && returnFocus && document.contains(returnFocus) && returnFocus.focus) returnFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-drawer-open]');
    if (opener) { e.preventDefault(); openDrawer(opener.getAttribute('data-drawer-open'), opener); return; }
    if (e.target.closest('[data-drawer-close]')) { e.preventDefault(); closeDrawer(); return; }
    var link = e.target.closest('.drawer a[href*="#"]');
    if (link) closeDrawer(true);
  });

  document.addEventListener('keydown', function (e) {
    if (!activeDrawer) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    var items = focusables($('.drawer__panel', activeDrawer));
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !activeDrawer.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !activeDrawer.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });

  /* ------------------------------------------------------------------ Cart */
  var cartCount = null;

  function setCartCount(count) {
    $$('[data-cart-count]').forEach(function (el) {
      var changed = cartCount !== null && cartCount !== count;
      el.textContent = count;
      el.hidden = count === 0;
      if (changed && count > 0 && !reduceMotion) {
        el.classList.remove('is-updated');
        void el.offsetWidth;
        el.classList.add('is-updated');
      }
      var link = el.closest('a');
      if (link) link.setAttribute('aria-label', 'Cart, ' + count + (count === 1 ? ' item' : ' items'));
    });
    cartCount = count;
  }

  function refreshCart(open, opener) {
    var drawer = $('[data-cart-drawer-inner]');
    var focused = document.activeElement;
    var focusLabel = drawer && drawer.contains(focused) ? focused.getAttribute('aria-label') : null;
    return fetch(root + '?section_id=cart-drawer', { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = $('[data-cart-drawer-inner]', doc);
        var current = $('[data-cart-drawer-inner]');
        if (fresh && current) {
          current.innerHTML = fresh.innerHTML;
          current.setAttribute('data-item-count', fresh.getAttribute('data-item-count'));
          setCartCount(parseInt(fresh.getAttribute('data-item-count'), 10) || 0);
          if (focusLabel) {
            var match = $$('[aria-label]', current).filter(function (n) { return n.getAttribute('aria-label') === focusLabel; })[0];
            (match || $('[data-drawer-close]', current)).focus();
          }
        }
        if (open) openDrawer('cart', opener);
      });
  }

  function postJSON(url, body) {
    return fetch(root + url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (json) {
        if (!r.ok) throw new Error(json.description || json.message || 'Something went wrong. Please try again.');
        return json;
      });
    });
  }

  function busy(promise, success) {
    var panel = $('.cart-drawer');
    if (panel) panel.classList.add('is-busy');
    return promise
      .then(function () { return refreshCart(false); })
      .then(function () { if (success) announce(success); })
      .catch(function (err) { announce(err.message); window.alert(err.message); })
      .then(function () { if (panel) panel.classList.remove('is-busy'); });
  }

  document.addEventListener('click', function (e) {
    var change = e.target.closest('[data-line-change]');
    if (change) {
      e.preventDefault();
      var qty = parseInt(change.getAttribute('data-quantity'), 10);
      busy(postJSON('cart/change.js', { line: parseInt(change.getAttribute('data-line-change'), 10), quantity: qty }),
        qty === 0 ? 'Removed from cart' : 'Quantity updated to ' + qty);
      return;
    }
    var upgrade = e.target.closest('[data-upgrade-to]');
    if (upgrade) {
      e.preventDefault();
      upgrade.disabled = true;
      var updates = {};
      updates[upgrade.getAttribute('data-upgrade-from')] = 0;
      updates[upgrade.getAttribute('data-upgrade-to')] = parseInt(upgrade.getAttribute('data-upgrade-quantity'), 10) || 1;
      busy(postJSON('cart/update.js', { updates: updates }), 'Switched to ' + (upgrade.getAttribute('data-upgrade-title') || 'the larger pack'))
        .then(function () { if (document.contains(upgrade)) upgrade.disabled = false; });
    }
  });

  /* ------------------------------------------------------------ Buy boxes */
  function initBuyBoxes(scope) {
    $$('[data-buy-box]', scope).forEach(function (box) {
      if (box._ready) return;
      box._ready = true;
      var form = $('form[data-product-form]', box) || $('form', box);
      if (!form) return;
      var button = $('[data-add-to-cart]', box);
      var label = $('[data-add-to-cart-label]', box);
      var message = $('[data-form-message]', box);
      var isMain = box.hasAttribute('data-main');
      var scopeEl = box.closest('[data-product]') || document;

      function selected() { return $('input[name="id"]:checked', form) || $('input[name="id"]', form); }

      function update(fromChange) {
        var input = selected();
        if (!input) return;
        $$('.variant-option', form).forEach(function (opt) { opt.classList.toggle('is-selected', opt.contains(input)); });
        var available = input.getAttribute('data-available') !== 'false';
        var price = input.getAttribute('data-price');
        var compare = input.getAttribute('data-compare');
        var save = input.getAttribute('data-save');
        if (label) label.textContent = available ? (label.getAttribute('data-label') || 'Add to cart') : 'Sold out';
        if (button) button.disabled = !available;

        var priceEl = $('[data-price]', scopeEl);
        var compareEl = $('[data-compare-price]', scopeEl);
        var saveEl = $('[data-save-badge]', scopeEl);
        if (priceEl && price) priceEl.textContent = price;
        if (compareEl) { compareEl.textContent = compare || ''; compareEl.hidden = !compare; }
        if (saveEl) { saveEl.textContent = save ? 'Save ' + save + '%' : ''; saveEl.hidden = !save; }

        if (isMain) {
          $$('[data-sticky-price]').forEach(function (el) { el.textContent = price; });
          $$('[data-sticky-variant]').forEach(function (el) { el.textContent = input.getAttribute('data-title') || ''; });
          if (fromChange && input.type === 'radio' && window.history.replaceState) {
            var url = new URL(window.location.href);
            url.searchParams.set('variant', input.value);
            window.history.replaceState({}, '', url.toString());
          }
        }
      }

      form.addEventListener('change', function (e) { if (e.target.name === 'id') update(true); });

      $$('[data-quantity-step]', box).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var input = $('.quantity__input', box);
          var next = (parseInt(input.value, 10) || 1) + parseInt(btn.getAttribute('data-quantity-step'), 10);
          input.value = Math.min(99, Math.max(1, next));
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (button) { button.classList.add('is-loading'); button.setAttribute('aria-disabled', 'true'); }
        if (message) { message.hidden = true; message.textContent = ''; }
        var opener = e.submitter || button;
        fetch(root + 'cart/add.js', { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, credentials: 'same-origin' })
          .then(function (r) { return r.json().then(function (json) { if (!r.ok) throw new Error(json.description || json.message || "Couldn't add to cart. Please try again."); return json; }); })
          .then(function () { announce('Added to cart'); return refreshCart(true, opener); })
          .catch(function (err) {
            if (message) { message.textContent = err.message; message.hidden = false; }
          })
          .then(function () {
            if (button) { button.classList.remove('is-loading'); button.removeAttribute('aria-disabled'); }
          });
      });

      update(false);
    });
  }

  /* -------------------------------------------------------- Sticky ATC bar */
  function initStickyAtc() {
    var bar = $('[data-sticky-atc]');
    var anchor = $('[data-buy-box][data-main] [data-add-to-cart]');
    if (!bar || !anchor || !('IntersectionObserver' in window)) return;
    var footer = $('.footer');
    var pastButton = false;
    var footerVisible = false;
    function sync() {
      var show = pastButton && !footerVisible;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      bar.inert = !show;
    }
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      pastButton = !e.isIntersecting && e.boundingClientRect.top < 0;
      sync();
    }).observe(anchor);
    if (footer) new IntersectionObserver(function (entries) { footerVisible = entries[0].isIntersecting; sync(); }).observe(footer);
    var add = $('[data-sticky-add]', bar);
    if (add) {
      add.removeAttribute('tabindex');
      add.addEventListener('click', function () {
        var form = anchor.closest('form');
        if (form.requestSubmit) form.requestSubmit(anchor);
        else form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    }
    sync();
  }

  /* --------------------------------------------------------------- Gallery */
  function initGalleries(scope) {
    $$('[data-gallery]', scope).forEach(function (gallery) {
      if (gallery._ready) return;
      gallery._ready = true;
      var slides = $$('[data-slide]', gallery);
      var thumbs = $$('[data-thumb]', gallery);
      var dots = $$('[data-dot]', gallery);
      var counter = $('[data-counter]', gallery);
      var viewport = $('.gallery__viewport', gallery);
      var index = 0;
      function go(i) {
        index = (i + slides.length) % slides.length;
        slides.forEach(function (s, n) {
          var on = n === index;
          s.classList.toggle('is-active', on);
          s.inert = !on;
          s.setAttribute('aria-hidden', on ? 'false' : 'true');
          var video = $('video', s);
          if (video && !on) video.pause();
        });
        thumbs.forEach(function (t, n) { t.classList.toggle('is-active', n === index); t.setAttribute('aria-current', n === index ? 'true' : 'false'); });
        dots.forEach(function (d, n) { d.classList.toggle('is-active', n === index); d.setAttribute('aria-current', n === index ? 'true' : 'false'); });
        if (counter) counter.textContent = (index + 1) + ' / ' + slides.length;
      }
      if (slides.length < 2) return;
      thumbs.forEach(function (t, n) { t.addEventListener('click', function () { go(n); }); });
      dots.forEach(function (d, n) { d.addEventListener('click', function () { go(n); }); });
      $$('[data-gallery-prev]', gallery).forEach(function (b) { b.addEventListener('click', function () { go(index - 1); }); });
      $$('[data-gallery-next]', gallery).forEach(function (b) { b.addEventListener('click', function () { go(index + 1); }); });
      viewport.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      });
      var startX = null;
      var startY = null;
      viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
      viewport.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
        startX = null;
      });
      go(0);
    });
  }

  /* -------------------------------------------------------------- Hotspots */
  function initHotspots(scope) {
    $$('[data-hotspots]', scope).forEach(function (wrap) {
      if (wrap._ready) return;
      wrap._ready = true;
      var spots = $$('[data-hotspot]', wrap);
      var items = $$('[data-hotspot-item]', wrap);
      function activate(i) {
        var key = String(i);
        spots.forEach(function (s) {
          var on = s.getAttribute('data-hotspot') === key;
          s.classList.toggle('is-active', on);
          s.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
        items.forEach(function (item) {
          var on = item.getAttribute('data-hotspot-item') === key;
          item.classList.toggle('is-active', on);
          var trigger = $('.hotspots__trigger', item);
          if (trigger) trigger.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
      }
      spots.forEach(function (s) { s.addEventListener('click', function () { activate(s.getAttribute('data-hotspot')); }); });
      items.forEach(function (item) {
        var trigger = $('.hotspots__trigger', item);
        if (trigger) trigger.addEventListener('click', function () { activate(item.getAttribute('data-hotspot-item')); });
      });
      wrap._activate = activate;
      if (items.length) activate(1);
    });
  }

  /* ------------------------------------------------------------- Carousels */
  function initCarousels(scope) {
    $$('[data-carousel]', scope).forEach(function (carousel) {
      if (carousel._ready) return;
      carousel._ready = true;
      var track = $('[data-carousel-track]', carousel);
      var prev = $('[data-carousel-prev]', carousel);
      var next = $('[data-carousel-next]', carousel);
      if (!track) return;
      function step() {
        var slide = $('.carousel__slide', track);
        return slide ? slide.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
      }
      function sync() {
        var max = track.scrollWidth - track.clientWidth - 2;
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= max;
      }
      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
      track.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  /* ------------------------------------------------- Before / after slider */
  function initCompareSliders(scope) {
    $$('[data-compare-slider]', scope).forEach(function (slider) {
      if (slider._ready) return;
      slider._ready = true;
      var input = $('.compare-slider__input', slider);
      function set(v) { slider.style.setProperty('--pos', v + '%'); }
      input.addEventListener('input', function () { slider.classList.remove('is-animating'); set(input.value); });
      // One gentle nudge the first time it scrolls into view, so it's clear it can be dragged.
      if (!reduceMotion && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting) return;
          io.disconnect();
          if (input.value !== '50') return;
          slider.classList.add('is-animating');
          setTimeout(function () { set(32); }, 300);
          setTimeout(function () { set(50); }, 900);
          setTimeout(function () { slider.classList.remove('is-animating'); }, 1450);
        }, { threshold: 0.6 });
        io.observe(slider);
      }
    });
  }

  /* ------------------------------------------------------------ Accordions */
  function initAccordions(scope) {
    if (!Element.prototype.animate) return;
    $$('details.accordion', scope).forEach(function (details) {
      if (details._ready) return;
      details._ready = true;
      var summary = $('summary', details);
      var content = $('.accordion__content', details);
      if (!summary || !content) return;
      var animation = null;
      summary.addEventListener('click', function (e) {
        if (reduceMotion) return;
        e.preventDefault();
        if (animation) animation.cancel();
        details.style.overflow = 'hidden';
        var startHeight = details.offsetHeight;
        var opening = !details.open;
        if (opening) details.open = true;
        var endHeight = opening ? summary.offsetHeight + content.offsetHeight : summary.offsetHeight;
        animation = details.animate({ height: [startHeight + 'px', endHeight + 'px'] }, { duration: 250, easing: 'cubic-bezier(.2,.7,.2,1)' });
        animation.onfinish = function () {
          if (!opening) details.open = false;
          details.style.overflow = '';
          animation = null;
        };
        animation.oncancel = function () { details.style.overflow = ''; };
      });
    });
  }

  /* ------------------------------------------------------------------ Boot */
  function init(scope) {
    [initReveal, initAnnouncements, initBuyBoxes, initGalleries, initHotspots, initCarousels, initCompareSliders, initAccordions]
      .forEach(function (fn) { safe(fn, scope); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(live);
    var count = $('[data-cart-count]');
    if (count) cartCount = parseInt(count.textContent, 10) || 0;
    init(document);
    safe(initHeader);
    safe(initStickyAtc);
  });

  // Theme editor
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
  document.addEventListener('shopify:section:unload', function (e) {
    $$('[data-announcement]', e.target).forEach(function (bar) { if (bar._timer) clearInterval(bar._timer); });
  });
  document.addEventListener('shopify:block:select', function (e) {
    var bar = e.target.closest('[data-announcement]');
    if (bar && bar._show) bar._show($$('.announcement__slide', bar).indexOf(e.target));
    var hotspots = e.target.closest('[data-hotspots]');
    if (hotspots && hotspots._activate) hotspots._activate(e.target.getAttribute('data-hotspot-item'));
  });
  document.addEventListener('shopify:block:deselect', function (e) {
    var bar = e.target.closest('[data-announcement]');
    if (bar && bar._resume) bar._resume();
  });

  window.Holdfast = { refreshCart: refreshCart, openDrawer: openDrawer, closeDrawer: closeDrawer };
})();
