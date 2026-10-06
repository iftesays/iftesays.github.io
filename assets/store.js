(function () {
  var cfg = window.STORE_CONFIG;
  var selected = cfg.offers[1] || cfg.offers[0];

  function money(n) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cfg.currency }).format(n);
  }

  function checkoutUrl(offer) {
    if (!cfg.shopDomain || !offer.variantId) return null;
    var url = "https://" + cfg.shopDomain + "/cart/" + offer.variantId + ":" + offer.quantity;
    var params = [];
    if (cfg.discountCode) params.push("discount=" + encodeURIComponent(cfg.discountCode));
    var utm = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
      if (utm.get(k)) params.push(k + "=" + encodeURIComponent(utm.get(k)));
    });
    return params.length ? url + "?" + params.join("&") : url;
  }

  function renderOffers() {
    var wrap = document.getElementById("offers");
    wrap.innerHTML = "";
    cfg.offers.forEach(function (offer) {
      var label = document.createElement("label");
      label.className = "offer" + (offer === selected ? " is-selected" : "");
      var savings = offer.compareAt ? Math.round((1 - offer.price / offer.compareAt) * 100) : 0;
      label.innerHTML =
        '<input type="radio" name="offer" value="' + offer.id + '"' + (offer === selected ? " checked" : "") + ">" +
        '<span class="offer-main"><strong>' + offer.label + "</strong><small>" + offer.sublabel + "</small></span>" +
        '<span class="offer-price">' +
        (offer.compareAt ? "<s>" + money(offer.compareAt) + "</s>" : "") +
        "<strong>" + money(offer.price) + "</strong>" +
        (savings ? '<em>Save ' + savings + "%</em>" : "") +
        "</span>" +
        (offer.badge ? '<span class="offer-badge">' + offer.badge + "</span>" : "");
      label.querySelector("input").addEventListener("change", function () {
        selected = offer;
        renderOffers();
        updateButtons();
      });
      wrap.appendChild(label);
    });
  }

  function updateButtons() {
    document.querySelectorAll("[data-buy]").forEach(function (btn) {
      btn.textContent = btn.hasAttribute("data-short")
        ? "Buy — " + money(selected.price)
        : "Get " + selected.label + " — " + money(selected.price);
    });
    document.querySelectorAll("[data-from-price]").forEach(function (el) {
      el.textContent = money(cfg.offers[0].price);
    });
  }

  function buy(e) {
    e.preventDefault();
    var url = checkoutUrl(selected);
    if (url) {
      location.href = url;
      return;
    }
    var note = document.getElementById("setup-note");
    note.hidden = false;
    note.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderOffers();
    updateButtons();
    document.querySelectorAll("[data-buy]").forEach(function (btn) {
      btn.addEventListener("click", buy);
    });
    document.querySelectorAll("[data-guarantee-days]").forEach(function (el) {
      el.textContent = cfg.guaranteeDays;
    });
    document.querySelectorAll("[data-shipping-note]").forEach(function (el) {
      el.textContent = cfg.shippingNote;
    });
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
    var support = document.querySelector("[data-support]");
    if (support && cfg.supportEmail) {
      support.innerHTML = 'Questions? <a href="mailto:' + cfg.supportEmail + '">' + cfg.supportEmail + "</a>";
    }

    // Sticky mobile buy bar appears once the main buy box scrolls away.
    var bar = document.getElementById("sticky-buy");
    var box = document.getElementById("buy-box");
    if ("IntersectionObserver" in window && bar && box) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle("is-visible", !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0);
      }).observe(box);
    }
  });
})();
