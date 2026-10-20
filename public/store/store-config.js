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

  A LA CARTE SERVICES: a service with a buy address (a live Stripe Payment Link) shows a Buy now button on the home page
  Shop tab. A service without one shows Request. Only live links go here, never a test link. The invite-only offers
  (Getting Started, The Basics, The Full Playbook) are NOT here; their links stay on the server in lib/offers.js.

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
      links: { site: "https://buy.stripe.com/9B628tcoD1ZMbMsczqefC00", payhip: "", gumroad: "", podia: "", etsy: "" } },
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
    "intake-setup": { name: "Intake automation, set up for you" },

    // A LA CARTE: one job, one price. Shown on the home page Shop tab. Prices set Oct 10.
    // hours = Cris's time target (not shown on the site). Twice over target = raise the price.
    "session-60": { menu: true, buy: "https://buy.stripe.com/6oUeVfbkzeMy17OczqefC09", name: "Working session", price: 97, unit: "60 min", hours: 1,
      what: "We work on whatever is next for you, live and screen-shared. You keep the recording and a short to-do list." },
    "quick-fix": { menu: true, buy: "https://buy.stripe.com/9B66oJ0FVgUG5o4ariefC08", name: "Quick fix", price: 49, unit: "30 min", hours: 0.5,
      what: "One problem fixed live: a broken form, a link that won't work, a setting you can't find." },
    "intake-form": { menu: true, buy: "https://buy.stripe.com/bJecN74WbgUG6s80QIefC07", name: "Intake form + auto-reply", price: 147, hours: 2,
      what: "A form that saves every answer to your sheet and sends each person an automatic reply." },
    "booking-page": { menu: true, buy: "https://buy.stripe.com/9B67sNbkzcEqeYEfLCefC06", name: "Booking page", price: 97, hours: 1,
      what: "A booking page for your calls, connected to your calendar and your intake form." },
    "email-welcome": { menu: true, buy: "https://buy.stripe.com/7sY4gB1JZdIueYE6b2efC05", name: "Email list + welcome emails", price: 147, hours: 2,
      what: "Your email account, a sign-up form on your site, and 3 welcome emails drafted for you to approve." },
    "follow-up": { menu: true, buy: "https://buy.stripe.com/aFa00lcoD1ZM7wcgPGefC04", name: "Follow-up automation", price: 197, hours: 2.5,
      what: "A reminder before each call, a reschedule message for no-shows, and a next-step email after." },
    "one-page-site": { menu: true, buy: "https://buy.stripe.com/7sY5kFbkzfQC8Ag0QIefC03", name: "One-page website", price: 297, hours: 4,
      what: "A fast one-page site on your own domain, hosted free on Cloudflare, with your sign-up form built in." },
    "video-edit": { menu: true, buy: "https://buy.stripe.com/5kQ3cx3S7awiaIoeHyefC02", name: "Video or podcast edit", price: 89, unit: "per episode", hours: 1,
      what: "One episode up to 20 minutes, edited with my own workflow, plus 3 Shorts cut from it." },
    "shorts-pack": { menu: true, buy: "https://buy.stripe.com/8x26oJ0FVgUG5o48jaefC01", name: "Shorts pack", price: 49, hours: 0.75,
      what: "5 vertical Shorts with captions, cut from one of your long videos." }
  };
  var MENU_ORDER = ["session-60", "quick-fix", "intake-form", "booking-page", "email-welcome", "follow-up", "one-page-site", "video-edit", "shorts-pack"];

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


  // GEAR: the three-lane list on the home page (Gear tab). Every link goes through /go/<slug> in data/links.json,
  // so swapping in an affiliate link later is a one-line change there. No slug = no button (generic items).
  // kind: "own" = I use this, "used" = I've used it, "research" = researched, not used ("the strong option I'd consider").
  var GEAR = [
    // FREE: costs nothing to start
    { lane: "free", name: "Your phone", kind: "own", pitch: "The camera you already own is enough to start. Good light and a steady hand put you ahead of most first videos." },
    { lane: "free", name: "Window light", kind: "own", pitch: "Face a window and your video looks better instantly. Free, and in daytime it beats a cheap ring light." },
    { lane: "free", name: "Mic placement", kind: "own", pitch: "Before you buy a mic, move the one you have closer. In Episode 2 the phone wasn't the problem, the distance was.", links: [{ url: "/setup/audio/", label: "Read the audio setup" }] },
    { lane: "free", name: "CapCut", kind: "used", pitch: "A free editor with auto captions, templates and a phone app. The easiest way to learn editing without paying.", links: [{ slug: "capcut", label: "Visit CapCut" }] },
    { lane: "free", name: "Claude or ChatGPT, free plan", kind: "own", pitch: "Scripts, titles, outlines and research help. The free plans have message limits, but they show you how you'll use AI before you pay.", links: [{ slug: "claude", label: "Visit Claude" }, { slug: "chatgpt", label: "Visit ChatGPT" }] },
    { lane: "free", name: "Cloudflare", kind: "own", pitch: "Hosting, security and email routing for your website, free. This whole site runs on it.", links: [{ slug: "cloudflare", label: "Visit Cloudflare" }] },
    { lane: "free", name: "Kit, free plan", kind: "own", pitch: "Your email list, sign-up forms and landing pages. Email is the audience no algorithm can take away.", links: [{ slug: "kit", label: "Visit Kit" }] },
    { lane: "free", name: "Tally", kind: "own", pitch: "Free forms with unlimited responses. My client intake runs on it.", links: [{ slug: "tally", label: "Visit Tally" }] },
    { lane: "free", name: "Canva, free plan", kind: "research", pitch: "Thumbnails, banners and social graphics from templates. The strong option I'd consider if you've never used a design tool.", links: [{ slug: "canva", label: "Visit Canva" }] },
    { lane: "free", name: "YouTube Audio Library", kind: "own", pitch: "Music and sound effects cleared for YouTube, free. No copyright claims on your videos.", links: [{ slug: "youtube-audio-library", label: "Open the Audio Library" }] },
    { lane: "free", name: "Google Sheets", kind: "own", pitch: "Where my whole system keeps score: content, links and numbers. Free with a Google account.", links: [{ slug: "google-sheets", label: "Visit Google Sheets" }] },
    { lane: "free", name: "Notion, free plan", kind: "own", pitch: "My command center: plans, scripts and checklists in one place.", links: [{ slug: "notion", label: "Visit Notion" }] },
    { lane: "free", name: "beehiiv", kind: "research", pitch: "A newsletter platform with a free plan to start. The strong option I'd consider if your newsletter is the main product.", links: [{ slug: "beehiiv", label: "Visit beehiiv" }] },
    { lane: "free", name: "systeme.io", kind: "research", pitch: "Funnels, email and courses in one tool, with a free plan. The strong option I'd consider if you want one login for everything.", links: [{ slug: "systeme-io", label: "Visit systeme.io" }] },
    { lane: "free", name: "n8n, self-hosted", kind: "research", pitch: "Automation you run on your own server at no cost. The strong option I'd consider if you're comfortable with some setup.", links: [{ slug: "n8n", label: "Visit n8n" }] },

    // BEST VALUE: low cost, real upgrade
    { lane: "value", name: "Your own domain", kind: "own", cost: "About $10 a year", pitch: "The best money on this list: an address you own that no platform can take away. Mine is registered with Cloudflare.", links: [{ slug: "cloudflare-domains", label: "Find a domain" }] },
    { lane: "value", name: "One AI subscription", kind: "own", cost: "About $20 a month", pitch: "Pick Claude or ChatGPT, not both. The biggest time-saver per dollar on this list.", links: [{ slug: "claude", label: "Visit Claude" }, { slug: "chatgpt", label: "Visit ChatGPT" }] },
    { lane: "value", name: "A ring light", kind: "own", cost: "Under $40", pitch: "For recording at night when the window light is gone. Any brand in this price range is plenty." },
    { lane: "value", name: "Hollyland LARK M2S", kind: "own", cost: "About $120", pitch: "A tiny wireless clip-on mic. You sound close and clear even when the camera is across the room.", links: [{ slug: "hollyland", label: "Visit Hollyland" }] },
    { lane: "value", name: "Neewer X12B teleprompter", kind: "own", cost: "$110 all in", pitch: "Read your script while looking straight into the lens. Useful, not urgent.", links: [{ slug: "neewer-x12b", label: "Visit Neewer" }] },
    { lane: "value", name: "Movavi Video Editor", kind: "used", cost: "One-time purchase", pitch: "A desktop editor that's easy to learn, with no subscription. The best-value step up from a free editor.", links: [{ slug: "movavi", label: "Visit Movavi" }] },
    { lane: "value", name: "Kit, paid plan", kind: "used", pitch: "Automations and email sequences once your list outgrows the free plan. I used it on the trial; upgrade when you need it.", links: [{ slug: "kit", label: "Visit Kit" }] },
    { lane: "value", name: "Make", kind: "research", pitch: "Visual automation that's easier to learn than most. The strong option I'd consider for your first automations.", links: [{ slug: "make", label: "Visit Make" }] },
    { lane: "value", name: "vidIQ", kind: "research", pitch: "Keyword research, title ideas and channel stats for YouTube. The strong option I'd consider for packaging videos.", links: [{ slug: "vidiq", label: "Visit vidIQ" }] },
    { lane: "value", name: "OpusClip", kind: "research", pitch: "Turns one long video into short clips automatically. The strong option I'd consider for Shorts, and I'm testing it soon.", links: [{ slug: "opusclip", label: "Visit OpusClip" }] },
    { lane: "value", name: "Buffer", kind: "research", pitch: "Write one post and schedule it to every platform. The strong option I'd consider for posting consistently.", links: [{ slug: "buffer", label: "Visit Buffer" }] },

    // PREMIUM: costs the most, saves the most time, best quality
    { lane: "premium", name: "Descript", kind: "own", pitch: "What I edit every episode in. You edit the video by editing the transcript, and with my settings an edit now takes me under 15 minutes.", links: [{ slug: "descript", label: "Visit Descript" }] },
    { lane: "premium", name: "Sony ZV-E10 II", kind: "own", cost: "About $700", pitch: "What I film on. A real camera with interchangeable lenses, built for people who film themselves.", links: [{ slug: "sony-zv-e10-ii", label: "Visit Sony" }] },
    { lane: "premium", name: "Claude, higher plan", kind: "own", cost: "$100 a month", pitch: "The plan I run, because the entry plan kept cutting me off mid-build. Upgrade only once you hit the limits.", links: [{ slug: "claude", label: "Visit Claude" }] },
    { lane: "premium", name: "n8n, cloud", kind: "own", pitch: "The automation that runs the business behind the scenes: intake, payments and follow-ups, with no server to manage.", links: [{ slug: "n8n", label: "Visit n8n" }] },
    { lane: "premium", name: "ElevenLabs", kind: "research", pitch: "Realistic AI voices for narration. The strong option I'd consider, and any AI voice on this channel gets disclosed.", links: [{ slug: "elevenlabs", label: "Visit ElevenLabs" }] },
    { lane: "premium", name: "Higgsfield", kind: "research", pitch: "AI images and video for thumbnails and graphics at volume. The strong option I'd consider once you publish a lot.", links: [{ slug: "higgsfield", label: "Visit Higgsfield" }] },
    { lane: "premium", name: "Metricool", kind: "research", pitch: "Scheduling and analytics for every platform in one place. The strong option I'd consider if you want all the numbers together.", links: [{ slug: "metricool", label: "Visit Metricool" }] }
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


    var menu = document.getElementById("menu-list");
    if (menu) {
      var mh = "";
      for (i = 0; i < MENU_ORDER.length; i++) {
        var mk = MENU_ORDER[i], m = SERVICES[mk];
        if (!m) continue;
        mh += '<div class="menu-item"><div><h4>' + m.name + '</h4><p>' + m.what + '</p></div>' +
          '<div class="price">' + fmt(m.price) + (m.unit ? '<small>' + m.unit + '</small>' : '') + '</div>' +
          (m.buy
            ? '<a class="btn btn-sm" href="' + m.buy + '" rel="noopener" data-mode="buy">Buy now</a></div>'
            : '<a class="btn btn-sm btn-line" href="' + (SERVICES["getting-started"].apply || "/start/") + '">Request</a></div>');
      }
      menu.innerHTML = mh;
    }

    var gl = document.getElementById("gear-list");
    if (gl) {
      var gh = "", lanes = { free: "", value: "", premium: "" };
      for (i = 0; i < GEAR.length; i++) {
        var g = GEAR[i], btns = "";
        var gl2 = g.links || [];
        for (var b = 0; b < gl2.length; b++) {
          var L2 = gl2[b], href = L2.slug ? "/go/" + L2.slug : L2.url, ext = !!L2.slug;
          btns += '<a class="btn btn-sm' + (b ? ' btn-line' : '') + '" href="' + href + '"' +
            (ext ? ' target="_blank" rel="sponsored noopener"' : '') + '>' + L2.label + '</a>';
        }
        lanes[g.lane] += '<details class="gi"><summary><span class="gi-name">' + g.name + '</span>' +
          '<span class="pill' + (g.kind in KIND_CLASS ? KIND_CLASS[g.kind] : " clay") + '">' + (KIND_LABEL[g.kind] || KIND_LABEL.research) + '</span>' +
          (g.cost ? '<span class="gi-cost">' + g.cost + '</span>' : '') + '</summary>' +
          '<div class="gi-body"><p>' + g.pitch + '</p>' + (btns ? '<div class="btns">' + btns + '</div>' : '') + '</div></details>';
      }
      for (var ln in lanes) {
        var box = gl.querySelector('[data-lane="' + ln + '"] .lane-items');
        if (box) box.innerHTML = lanes[ln];
      }
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
          ' <span class="pill' + (t2.kind in KIND_CLASS ? KIND_CLASS[t2.kind] : " clay") + '">' +
          (KIND_LABEL[t2.kind] || KIND_LABEL.research) + '</span></div>' +
          '<a class="link-arrow" href="' + (t2.url || ('/go/' + t2.slug)) + '" rel="sponsored noopener" target="_blank">Visit →</a></div>';
      }
      list.innerHTML = html;
      var empty = document.getElementById("tools-empty");
      if (empty) empty.hidden = n > 0;
      list.hidden = n === 0;
    }
  }

  window.BB_STORE = { PRODUCTS: PRODUCTS, SERVICES: SERVICES, TOOLS: TOOLS, GEAR: GEAR };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
