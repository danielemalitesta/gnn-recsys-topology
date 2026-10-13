(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- KaTeX ---------- */
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
      throwOnError: false
    });
  }

  /* ---------- nav ---------- */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav__toggle");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".nav__links a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", false);
    });
  });
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // highlight the section currently in view
  var links = {};
  document.querySelectorAll('.nav__links a[href^="#"]').forEach(function (a) {
    links[a.getAttribute("href").slice(1)] = a;
  });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = links[e.target.id];
        if (a && e.isIntersecting) {
          Object.values(links).forEach(function (l) { l.classList.remove("is-active"); });
          a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });

    /* ---------- reveal on scroll ---------- */
    var targets = document.querySelectorAll(".section__head, .chapter, .topo__card, .callout, .table-card, .fig, .tk, .author, .bib");
    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); rev.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { t.classList.add("reveal"); rev.observe(t); });
  }

  /* ---------- dataset table toggle ---------- */
  document.querySelectorAll(".table-card .seg__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".table-card");
      card.querySelectorAll(".seg__btn").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", b === btn);
      });
      card.querySelectorAll("[data-panel]").forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== btn.getAttribute("data-table");
      });
    });
  });

  /* ---------- impact figure tabs ---------- */
  var impactImg = document.getElementById("impact-img");
  var impactLink = document.getElementById("impact-link");
  document.querySelectorAll(".fig__tabs .seg__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var name = btn.getAttribute("data-img");
      var src = "assets/img/" + name + ".png";
      impactImg.src = src;
      impactImg.alt = "Impact of dataset characteristics on Recall@20 for " + name;
      impactLink.href = src;
      btn.parentNode.querySelectorAll(".seg__btn").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
    });
  });

  /* ---------- lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  var lbImg = lb.querySelector("img");
  document.querySelectorAll(".zoomable").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      var img = a.querySelector("img");
      lbImg.src = a.getAttribute("href");
      lbImg.alt = img ? img.alt : "";
      lb.hidden = false;
    });
  });
  function closeLb() { lb.hidden = true; lbImg.src = ""; }
  lb.addEventListener("click", closeLb);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  /* ---------- copy BibTeX ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = document.querySelector(btn.getAttribute("data-copy")).innerText;
      var label = btn.querySelector("span");
      function done() {
        btn.classList.add("is-done");
        label.textContent = "Copied!";
        setTimeout(function () { btn.classList.remove("is-done"); label.textContent = "Copy"; }, 1800);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------- hero: animated bipartite user–item graph ---------- */
  var canvas = document.querySelector(".hero__graph");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var css = getComputedStyle(document.documentElement);
  var colors = {
    user: css.getPropertyValue("--user").trim() || "#2a7f7a",
    item: css.getPropertyValue("--item").trim() || "#e0663e",
    edge: css.getPropertyValue("--muted").trim() || "#7a7f8c"
  };
  var nodes = [], edges = [], pulses = [], W = 0, H = 0, dpr = 1;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var n = Math.round(Math.min(70, Math.max(26, W * H / 22000)));
    nodes = []; edges = []; pulses = [];
    for (var k = 0; k < n; k++) {
      var isUser = k % 2 === 0;
      nodes.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-.12, .12), vy: rand(-.12, .12),
        user: isUser, deg: 0
      });
    }
    // bipartite edges, with preferential attachment to mimic a scale-free degree distribution
    var users = nodes.filter(function (d) { return d.user; });
    var items = nodes.filter(function (d) { return !d.user; });
    users.forEach(function (u) {
      var m = 1 + Math.floor(Math.random() * 3);
      for (var j = 0; j < m; j++) {
        var total = items.reduce(function (s, it) { return s + it.deg + 1; }, 0);
        var r = Math.random() * total, pick = items[0];
        for (var q = 0; q < items.length; q++) { r -= items[q].deg + 1; if (r <= 0) { pick = items[q]; break; } }
        if (edges.some(function (e) { return e.a === u && e.b === pick; })) continue;
        edges.push({ a: u, b: pick }); u.deg++; pick.deg++;
      }
    });
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    nodes.forEach(function (d) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < -20 || d.x > W + 20) d.vx *= -1;
      if (d.y < -20 || d.y > H + 20) d.vy *= -1;
    });

    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.edge;
    ctx.globalAlpha = .28;
    ctx.beginPath();
    edges.forEach(function (e) { ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); });
    ctx.stroke();

    // message-passing pulses travelling along edges
    if (!reduceMotion && Math.random() < .06 && edges.length) {
      var e = edges[Math.floor(Math.random() * edges.length)];
      pulses.push({ e: e, t: 0, dir: Math.random() < .5 });
    }
    ctx.globalAlpha = .9;
    pulses = pulses.filter(function (p) {
      p.t += .012;
      var s = p.dir ? p.e.a : p.e.b, t = p.dir ? p.e.b : p.e.a;
      var x = s.x + (t.x - s.x) * p.t, y = s.y + (t.y - s.y) * p.t;
      ctx.fillStyle = s.user ? colors.user : colors.item;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      return p.t < 1;
    });

    nodes.forEach(function (d) {
      var r = 3 + Math.sqrt(d.deg) * 1.6;
      ctx.globalAlpha = .85;
      ctx.fillStyle = d.user ? colors.user : colors.item;
      ctx.beginPath();
      if (d.user) ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      else ctx.rect(d.x - r, d.y - r, r * 2, r * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (!reduceMotion) requestAnimationFrame(step);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { build(); if (reduceMotion) step(); }, 150);
  });
  build();
  step();
})();
