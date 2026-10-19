/* Thank-you pages after a Stripe payment: /booked/, /upload/, /store/audio-kit/download/.
   The page asks the server "was this checkout session really paid?" and only then shows the next step.
   The session id comes from the ?s= value Stripe adds to the redirect. Nothing here trusts the address bar alone. */
(function () {
  var main = document.querySelector("[data-pay]");
  if (!main) return;
  var mode = main.getAttribute("data-pay");
  var cfg = window.BB_STORE || {};
  var email = cfg.EMAIL || "hello@bigbreezoe.com";
  var s = (new URLSearchParams(location.search).get("s") || "").trim();
  var valid = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(s);

  function show(id) {
    ["st-loading", "st-ok", "st-wait", "st-bad"].forEach(function (k) {
      var el = document.getElementById(k);
      if (el) el.hidden = k !== id;
    });
  }
  function setBtn(id, href, label) {
    var b = document.getElementById(id), fb = document.getElementById(id + "-fallback");
    if (!b) return;
    if (href) { b.href = href; if (label) b.textContent = label; b.hidden = false; if (fb) fb.hidden = true; }
    else { b.hidden = true; if (fb) fb.hidden = false; }
  }
  function ok(data) {
    show("st-ok");
    if (mode === "booked") {
      var mins = data.minutes === 30 ? 30 : 60;
      var m = document.getElementById("minutes");
      if (m) m.textContent = String(mins);
      setBtn("action", (cfg.BOOKING || {})[mins === 30 ? "m30" : "m60"] || "");
    } else if (mode === "upload") {
      setBtn("action", cfg.UPLOAD_URL || "");
    } else if (mode === "download") {
      if (data.ready) setBtn("action", "/api/stripe/download?s=" + encodeURIComponent(s));
      else setBtn("action", "");
    }
  }

  if (!valid) { show("st-bad"); return; }
  show("st-loading");
  var tries = 0;
  (function check() {
    fetch("/api/stripe/verify?s=" + encodeURIComponent(s), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.paid) return ok(data);
        if (++tries < 6) return setTimeout(check, 2500); // the signed notice from Stripe can take a few seconds
        show("st-wait");
      })
      .catch(function () { if (++tries < 6) setTimeout(check, 2500); else show("st-wait"); });
  })();
})();
