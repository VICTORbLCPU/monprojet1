(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  /* ---------- Navigation : état au défilement + menu mobile ---------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");

  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".sr-only").textContent = open ? "Fermer le menu" : "Ouvrir le menu";
    toggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
  }
  toggle.addEventListener("click", function () {
    setMenu(!nav.classList.contains("is-open"));
  });
  links.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* ---------- Année du pied de page ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Graphique : chiffre d'affaires 2021–2024 ---------- */
  var DATA = [
    { year: 2021, ca: 134, rn: 2.0, fp: 7.0 },
    { year: 2022, ca: 150, rn: 2.1, fp: 7.1 },
    { year: 2023, ca: 168, rn: 2.3, fp: 7.4 },
    { year: 2024, ca: 233, rn: 4.1, fp: 9.0 }
  ];
  var fmt = function (n, d) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  };

  var chart = document.getElementById("revenue-chart");
  var tip = document.getElementById("chart-tip");
  var SVG_NS = "http://www.w3.org/2000/svg";

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG_NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function showTip(d, group) {
    tip.textContent = "";
    var head = document.createElement("span");
    head.textContent = String(d.year);
    var value = document.createElement("strong");
    value.textContent = fmt(d.ca) + " M€";
    tip.appendChild(head);
    tip.appendChild(value);
    [["Résultat net", fmt(d.rn, 1) + " M€"], ["Fonds propres", fmt(d.fp, 1) + " M€"]].forEach(function (row) {
      var r = document.createElement("div");
      r.className = "tip-row";
      var a = document.createElement("span");
      a.textContent = row[0];
      var b = document.createElement("b");
      b.textContent = row[1];
      r.appendChild(a);
      r.appendChild(b);
      tip.appendChild(r);
    });
    var bar = group.querySelector(".bar").getBoundingClientRect();
    var host = tip.parentElement.getBoundingClientRect();
    tip.hidden = false;
    var half = tip.offsetWidth / 2;
    var x = bar.left + bar.width / 2 - host.left;
    x = Math.max(half + 8, Math.min(host.width - half - 8, x));
    tip.style.left = x + "px";
    tip.style.top = (bar.top - host.top - 20) + "px";
  }
  function hideTip() { tip.hidden = true; }

  function renderChart() {
    if (!chart) return;
    var W = chart.clientWidth;
    if (!W) return;
    var H = 280, m = { t: 28, r: 4, b: 32, l: 36 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var max = 250;
    var y = function (v) { return m.t + ih - (v / max) * ih; };
    var band = iw / DATA.length;
    var bw = Math.min(24, band * 0.5);

    chart.textContent = "";
    var svg = el("svg", {
      viewBox: "0 0 " + W + " " + H, width: W, height: H,
      role: "group", "aria-label": "Chiffre d'affaires de 2021 à 2024, en millions d'euros"
    }, chart);

    [0, 50, 100, 150, 200, 250].forEach(function (t) {
      el("line", { class: "grid-line", x1: m.l, x2: W - m.r, y1: y(t), y2: y(t) }, svg);
      var lab = el("text", { class: "axis-label", x: m.l - 10, y: y(t) + 4, "text-anchor": "end" }, svg);
      lab.textContent = String(t);
    });

    DATA.forEach(function (d, i) {
      var cx = m.l + band * i + band / 2;
      var top = y(d.ca), base = y(0), r = 4, x0 = cx - bw / 2;
      var g = el("g", { class: "bar-group" }, svg);
      el("path", {
        class: "bar",
        d: "M" + x0 + "," + base +
           "V" + (top + r) +
           "Q" + x0 + "," + top + " " + (x0 + r) + "," + top +
           "H" + (x0 + bw - r) +
           "Q" + (x0 + bw) + "," + top + " " + (x0 + bw) + "," + (top + r) +
           "V" + base + "Z"
      }, g);
      var v = el("text", { class: "value-label", x: cx, y: top - 10, "text-anchor": "middle" }, g);
      v.textContent = fmt(d.ca);
      var xl = el("text", { class: "axis-label", x: cx, y: base + 22, "text-anchor": "middle" }, g);
      xl.textContent = String(d.year);
      var hit = el("rect", {
        class: "bar-hit", x: cx - band / 2 + 2, y: m.t - 20, width: band - 4, height: ih + 20,
        tabindex: "0", role: "img",
        "aria-label": d.year + " : chiffre d'affaires " + fmt(d.ca) + " millions d'euros, résultat net " + fmt(d.rn, 1) + " millions d'euros"
      }, g);
      hit.addEventListener("pointerenter", function () { showTip(d, g); });
      hit.addEventListener("pointerleave", hideTip);
      hit.addEventListener("focus", function () { showTip(d, g); });
      hit.addEventListener("blur", hideTip);
    });
  }

  renderChart();
  if ("ResizeObserver" in window && chart) {
    var lastW = chart.clientWidth;
    new ResizeObserver(function () {
      if (chart.clientWidth !== lastW) {
        lastW = chart.clientWidth;
        hideTip();
        renderChart();
      }
    }).observe(chart);
  }

  /* ---------- Apparition au défilement ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(
    ".section__head, .split__text, .code-card, .card, .products__list, .timeline, .mission__card, .values, .stats, .awards, .accreditation, .easymed-card"
  );
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) {
      t.classList.add("reveal");
      io.observe(t);
    });
  }
})();
