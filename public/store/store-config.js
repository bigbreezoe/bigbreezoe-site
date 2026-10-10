/*
  BIG BREEZOE STORE — THE ONE FILE YOU EDIT.

  Every Buy button, price and "Available / Opening soon" label on /store reads from here.

  TO TURN A PRODUCT ON:
    1. Open your store listing (Payhip, Gumroad, Etsy, PayPal link, or your own checkout).
    2. Paste its web address between the quotes next to that store's name below.
    3. Save, redeploy. The button on that product's page changes from "Notify me" to "Buy now".

  Order the buttons choose from, first filled-in wins: site, payhip, gumroad, podia, etsy.
  Any other filled-in stores show as small "Also on..." links under the button.
  Leave a link as "" while it is not ready. Nothing breaks.

  PRICES are the proposed ones from the Products Catalog. Change one number here and it changes everywhere
  on the page. Keep it equal to the price on the store listing.

  AFFILIATE TOOLS (bottom of this file): a tool shows on /store/tools.html only when live is true.
  Set live to true only after (1) the program approved you and (2) /go/<slug> redirects to your tracked link.
*/
(function () {
  var EMAIL = "hello@bigbreezoe.com";
  var WAITLIST = ""; // optional: paste a Tally or Kit form address to use instead of email for "Notify me"
  var HELP_FORM = ""; // optional: paste the published Tally form address for /store/help.html. Empty = the email button keeps working.
  var CIRCLE_JOIN = ""; // optional: paste a Kit or Tally form address for /store/circle.html. Empty = the email button keeps working.

  var PRODUCTS = {
    "three-lane-kit-builder": { name: "Three-Lane Kit Builder", price: 12,
      links: { site: "", payhip: "", gumroad: "", podia: "", etsy: "" } },
    "audio-kit": { name: "Phone-First Creator Audio Kit", price: 17,
      links: { site: "", payhip: "", gumroad: "", podia: "", etsy: "" } },
    "weekly-os": { name: "Creator Weekly Operating System", price: 19,
      links: { site: "", payhip: "", gumroad: "", podia: "", etsy: "" } },
    "descript-prompt-pack": { name: "The Prompt Pack for Editing Video in Descript", price: 27,
      // Not for Etsy: Etsy bans standalone AI prompt bundles. Leave etsy empty.
      links: { site: "", payhip: "", gumroad: "", podia: "", etsy: "" } },
    "intake-kit": { name: "Client Intake Automation Kit", price: 47,
      links: { site: "", payhip: "", gumroad: "", podia: "", etsy: "" } },
    "starter-bundle": { name: "Creator Starter Bundle", price: 59,
      // Etsy edition has 3 products (no Descript pack) at its own price.
      etsyPrice: 39,
      links: { site: "", payhip: "", gumroad: "", podia: "", etsy: "" } }
  };

  var SERVICES = {
    // Applications go to the Start page. Edit the address only if your application form moves.
    "getting-started": { name: "Getting Started session", price: 97, apply: "/start/" },
    "the-basics": { name: "The Basics", price: 997, foundingPrice: 499, apply: "/start/" },
    "intake-setup": { name: "Intake automation, set up for you" }
  };

  // A tool can carry its own tracked link in url. If url is empty the button uses /go/<slug>.
  // Tools: kind is "own" (I use it), "used" (I've used it hands-on) or "research" (researched, not used). Tell the truth here.
  var TOOLS = [
    { slug: "descript", name: "Descript", kind: "own", what: "Video and audio editing by editing the transcript.", live: false },
    { slug: "n8n", name: "n8n", kind: "own", what: "The automation tool the kits are built on.", live: false },
    { slug: "tally", name: "Tally", kind: "own", what: "Forms, including the one the Intake Kit uses.", live: true, url: "https://tally.cello.so/6SUK4U1DayB" },
    { slug: "kit", name: "Kit", kind: "own", what: "Email list and newsletter.", live: false },
    { slug: "hollyland-lark-m2s", name: "Hollyland LARK M2S", kind: "own", what: "Wireless clip-on mic.", live: true, url: "/go/hollyland" },
    { slug: "neewer", name: "Neewer", kind: "own", what: "Teleprompter and lighting.", live: false },
    { slug: "movavi", name: "Movavi", kind: "used", what: "One-time-purchase video editor.", live: true },
    { slug: "beehiiv", name: "beehiiv", kind: "research", what: "Newsletter platform.", live: true, url: "https://www.beehiiv.com/?via=cristopher-delerme" },
    { slug: "freshbooks", name: "FreshBooks", kind: "research", what: "Invoicing and accounting for freelancers.", live: false },
    { slug: "shopify", name: "Shopify", kind: "research", what: "Online store.", live: false },
    { slug: "systeme-io", name: "systeme.io", kind: "research", what: "Funnels, email and courses in one tool.", live: true, url: "https://systeme.io/?sa=sa02831573826cc52809d2efac3a5b1cd3222c0a9f" },
    { slug: "hostinger", name: "Hostinger", kind: "research", what: "Low-cost web hosting and site builder.", live: false }
  ];

  var ORDER = ["site", "payhip", "gumroad", "podia", "etsy"];
  var LABEL = { site: "bigbreezoe.com", payhip: "Payhip", gumroad: "Gumroad", podia: "Podia", etsy: "Etsy" };

  function firstLink(p) {
    for (var i = 0; i < ORDER.length; i++) { var u = p.links[ORDER[i]]; if (u) return { store: ORDER[i], url: u }; }
    return null;
  }
  function isLive(p) { return !!firstLink(p); }
  function notify(name) {
    if (WAITLIST) return WAITLIST;
    return "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Notify me: " + name) +
      "&body=" + encodeURIComponent("Please email me when this opens.");
  }
  function fmt(n) { return "$" + n; }

  var PRODUCT_ORDER = ["starter-bundle", "three-lane-kit-builder", "audio-kit", "weekly-os", "descript-prompt-pack", "intake-kit"];
  var KIND_LABEL = { own: "I use this", used: "I've used it", research: "Researched, not used" };
  var KIND_CLASS = { own: "", used: " used", research: " clay" };

  function run() {
    var els, i;

    var plist = document.getElementById("products-list");
    if (plist) {
      var ph = "";
      for (i = 0; i < PRODUCT_ORDER.length; i++) {
        var pk0 = PRODUCT_ORDER[i], p0 = PRODUCTS[pk0];
        if (!p0) continue;
        ph += '<div class="prod"><div class="name"><a href="/store/' + pk0 + '.html">' + p0.name + '</a>' +
          '<span class="state" data-status="' + pk0 + '"></span></div>' +
          '<div class="p" data-price="' + pk0 + '"></div>' +
          '<a data-buy="' + pk0 + '" href="/store/' + pk0 + '.html"></a></div>';
      }
      plist.innerHTML = ph;
    }

    els = document.querySelectorAll("[data-founding]");
    for (i = 0; i < els.length; i++) {
      var fs = SERVICES[els[i].getAttribute("data-founding")];
      if (fs && fs.foundingPrice != null) els[i].textContent = fmt(fs.foundingPrice);
    }

    els = document.querySelectorAll("[data-price]");
    for (i = 0; i < els.length; i++) {
      var k = els[i].getAttribute("data-price"), p = PRODUCTS[k] || SERVICES[k];
      if (p && p.price != null) els[i].textContent = fmt(p.price);
    }

    els = document.querySelectorAll("[data-status]");
    for (i = 0; i < els.length; i++) {
      var pk = PRODUCTS[els[i].getAttribute("data-status")];
      if (!pk) continue;
      var live = isLive(pk);
      els[i].textContent = live ? "Available" : "Opening soon";
      els[i].setAttribute("data-state", live ? "live" : "soon");
    }

    els = document.querySelectorAll("[data-buy]");
    for (i = 0; i < els.length; i++) {
      var key = els[i].getAttribute("data-buy"), pr = PRODUCTS[key];
      if (!pr) continue;
      var f = firstLink(pr);
      if (f) {
        els[i].href = f.url;
        els[i].target = "_blank";
        els[i].rel = "noopener";
        els[i].setAttribute("data-mode", "buy");
        var priceNow = (f.store === "etsy" && pr.etsyPrice) ? pr.etsyPrice : pr.price;
        els[i].textContent = "Buy now — " + fmt(priceNow) + (f.store === "site" ? "" : " on " + LABEL[f.store]);
      } else {
        els[i].href = notify(pr.name);
        els[i].setAttribute("data-mode", "waitlist");
        els[i].textContent = "Notify me when it opens";
      }
    }

    els = document.querySelectorAll("[data-alt]");
    for (i = 0; i < els.length; i++) {
      var ak = els[i].getAttribute("data-alt"), ap = PRODUCTS[ak];
      if (!ap) continue;
      var first = firstLink(ap), out = [];
      for (var j = 0; j < ORDER.length; j++) {
        var s = ORDER[j], u = ap.links[s];
        if (u && (!first || s !== first.store)) {
          var t = "Also on " + LABEL[s];
          if (s === "etsy" && ap.etsyPrice) t += " (3-product edition, " + fmt(ap.etsyPrice) + ")";
          out.push('<a href="' + u + '" target="_blank" rel="noopener">' + t + "</a>");
        }
      }
      els[i].innerHTML = out.join("");
      els[i].hidden = out.length === 0;
    }

    els = document.querySelectorAll("[data-apply]");
    for (i = 0; i < els.length; i++) {
      var sv = SERVICES[els[i].getAttribute("data-apply")];
      if (sv && sv.apply) els[i].href = sv.apply;
    }

    var form = [["data-help", HELP_FORM], ["data-circle", CIRCLE_JOIN]];
    for (var q = 0; q < form.length; q++) {
      if (!form[q][1]) continue;
      var fe = document.querySelectorAll("[" + form[q][0] + "]");
      for (i = 0; i < fe.length; i++) { fe[i].href = form[q][1]; fe[i].target = "_blank"; fe[i].rel = "noopener"; }
    }

    var list = document.getElementById("tools-list");
    if (list) {
      var html = "", n = 0;
      for (i = 0; i < TOOLS.length; i++) {
        var t2 = TOOLS[i];
        if (!t2.live) continue;
        n++;
        html += '<div class="tool"><div class="name">' + t2.name + '</div><div class="what">' + t2.what +
          ' <span class="pill' + (KIND_CLASS[t2.kind] || " clay") + '">' +
          (KIND_LABEL[t2.kind] || KIND_LABEL.research) + '</span></div>' +
          '<a class="link-arrow" href="' + (t2.url || ('/go/' + t2.slug)) + '" rel="sponsored noopener" target="_blank">Visit →</a></div>';
      }
      list.innerHTML = html;
      var empty = document.getElementById("tools-empty");
      if (empty) empty.hidden = n > 0;
      list.hidden = n === 0;
    }
  }

  window.BB_STORE = { PRODUCTS: PRODUCTS, SERVICES: SERVICES, TOOLS: TOOLS };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
