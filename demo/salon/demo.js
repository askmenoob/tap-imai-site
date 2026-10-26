// import-service/appearance.mjs
function promotionVisible(profile2, now = Date.now()) {
  if (!profile2.promoTitle) return false;
  const start = profile2.promoStart ? Date.parse(profile2.promoStart + "+08:00") : -Infinity;
  const end2 = profile2.promoEnd ? Date.parse(profile2.promoEnd + "+08:00") : Infinity;
  return now >= start && now < end2;
}

// import-service/contacts.mjs
function threadsProfile(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && ["threads.net", "www.threads.net", "threads.com", "www.threads.com"].includes(url.hostname) && /^\/@[\w.]+\/?$/.test(url.pathname) ? url.href : null;
  } catch {
    return null;
  }
}
function xProfile(value) {
  try {
    const url = new URL(value);
    const reserved = /* @__PURE__ */ new Set(["home", "explore", "search", "notifications", "messages", "i", "intent", "share", "login", "logout", "signup", "settings", "compose", "hashtag", "tos", "privacy", "about", "help", "jobs", "download"]);
    const handle = url.pathname.replace(/^\//, "").replace(/\/$/, "");
    return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") && !url.search && !url.hash && ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname) && /^\/[A-Za-z0-9_]{1,15}\/?$/.test(url.pathname) && !reserved.has(handle.toLowerCase()) ? url.href : null;
  } catch {
    return null;
  }
}

// src/public-card.mjs
var paths = { x: "M4 3h4l12 18h-4L4 3ZM20 3 4 21", star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z", arrow: "M7 17 17 7M7 7h10v10", menu: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4", pin: "M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0", clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2", chevron: "m6 9 6 6 6-6", website: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18", whatsapp: "M21 11.5a9 9 0 0 1-13 8L3 21l1.5-5a9 9 0 1 1 16.5-4.5ZM8 7c0 5 4 9 9 9l1-3-3-1-1 1-3-3 1-1-1-3Z", instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17 7h.01", facebook: "M14 21v-8h3l1-4h-4V7c0-1 1-2 2-2h2V2h-3c-4 0-5 2-5 5v2H7v4h3v8", tiktok: "M14 3v12a4 4 0 1 1-4-4M14 3c1 4 3 5 7 5", threads: "M18 7C16 1 5 2 4 11c-1 11 16 14 17 4 1-7-13-8-12-1 1 5 9 3 8-3 0-4-3-5-6-4" };
function renderCard(document2, profile2, now = Date.now()) {
  const el = (tag, cls, text2) => {
    const node = document2.createElement(tag);
    if (cls) node.className = cls;
    if (text2) node.textContent = text2;
    return node;
  };
  const icon = (name) => {
    const svg = document2.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", name === "star" ? "currentColor" : "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    const path = document2.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", paths[name] || paths.arrow);
    svg.append(path);
    return svg;
  };
  const link = (url, text2, cls, mark) => {
    const a = el("a", cls);
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (mark) a.append(icon(mark));
    a.append(el("span", "", text2));
    return a;
  };
  const main = el("main", "business-page");
  main.dataset.theme = profile2.theme || "classic";
  if (profile2.accent) {
    main.style.setProperty("--accent", profile2.accent);
    const rgb = profile2.accent.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255).map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    const light = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    main.style.setProperty("--on-accent", light > 0.179 ? "#14281f" : "#ffffff");
  }
  const card = el("article", "business-card"), cover = el("div", "business-cover");
  if (profile2.cover) {
    const img = el("img");
    img.src = profile2.cover;
    img.alt = "Gambar cover " + profile2.name;
    img.referrerPolicy = "no-referrer";
    img.fetchPriority = "high";
    img.onerror = () => img.remove();
    cover.append(img);
  }
  const content2 = el("div", "business-content"), avatar = el("div", "business-avatar", profile2.name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase());
  if (profile2.logo) {
    const img = el("img");
    img.alt = "Logo " + profile2.name;
    img.referrerPolicy = "no-referrer";
    img.onload = () => avatar.replaceChildren(img);
    img.src = profile2.logo;
  }
  const identity = el("header", "business-identity");
  identity.append(avatar, el("h1", "", profile2.name));
  if (profile2.tagline) identity.append(el("p", "business-tagline", profile2.tagline));
  content2.append(identity);
  if (profile2.google) {
    const review = el("section", "business-review");
    review.setAttribute("aria-label", "Ulasan Google");
    review.append(el("h2", "", "Pernah singgah di sini?"), el("p", "", "Kongsikan pengalaman anda di Google."), link(profile2.google, "Tulis ulasan di Google", "business-action review-action", "star"));
    content2.append(review);
  }
  if (profile2.whatsapp) content2.append(link(profile2.whatsapp, "Hubungi melalui WhatsApp", "business-action whatsapp-action", "whatsapp"));
  const quick = el("div", "business-quick");
  if (profile2.menu) quick.append(link(profile2.menu, profile2.menuLabel || "Lihat menu / katalog", "business-action outline-action", "menu"));
  if (profile2.directions) quick.append(link(profile2.directions, "Arah ke lokasi", "business-action outline-action", "pin"));
  if (quick.childElementCount) content2.append(quick);
  if (promotionVisible(profile2, now)) {
    const promo = el("section", "business-promo");
    promo.append(el("h2", "", profile2.promoTitle));
    if (profile2.promoText) promo.append(el("p", "", profile2.promoText));
    if (profile2.promoURL) {
      const a = link(profile2.promoURL, "Lihat promosi", "promo-link");
      a.append(icon("arrow"));
      promo.append(a);
    }
    content2.append(promo);
  }
  const social = el("nav", "business-social");
  social.setAttribute("aria-label", "Media sosial");
  for (const name of ["facebook", "instagram", "tiktok", "threads", "x"]) if (profile2[name] && (name !== "threads" || threadsProfile(profile2[name])) && (name !== "x" || xProfile(profile2[name]))) {
    const a = link(profile2[name], name === "x" ? "X" : name[0].toUpperCase() + name.slice(1), "social-link", name);
    a.title = name;
    a.setAttribute("aria-label", name);
    social.append(a);
  }
  if (social.childElementCount) content2.append(social);
  if (profile2.website) content2.append(link(profile2.website, "Lawati laman web", "business-action website-action", "website"));
  if (profile2.address || profile2.hours) {
    const details = el("details", "business-details"), summary = el("summary");
    summary.append(icon("clock"), el("span", "", "Alamat & waktu operasi"), icon("chevron"));
    details.append(summary);
    if (profile2.address) details.append(el("p", "", profile2.address));
    if (profile2.hours) details.append(el("p", "", profile2.hours));
    content2.append(details);
  }
  const footer = el("footer", "business-footer");
  footer.append(el("span", "", "POWERED BY SMARTTAP"));
  content2.append(footer);
  card.append(cover, content2);
  main.append(card);
  return main;
}

// src/salon-demo.mjs
var root = "/demo/salon/";
var dialog = document.querySelector("#demo-dialog");
var content = document.querySelector("#demo-dialog-content");
var title = document.querySelector("#demo-dialog-title");
var language = "ms";
var active = "";
var opener;
var selectedService = "";
try {
  if (localStorage.getItem("smarttap.language") === "en") language = "en";
} catch {
}
var L = (ms, en) => language === "en" ? en : ms;
var categories = { cut: ["Potongan", "Haircuts"], colour: ["Warna", "Colour"], care: ["Rawatan", "Treatments"], style: ["Penggayaan", "Styling"] };
var services = [
  { id: "cut", category: "cut", name: ["Potong, cuci & blow", "Cut, wash & blow-dry"], description: ["Konsultasi gaya, cucian dan kemasan harian.", "Style consultation, wash and everyday finish."], price: 55, duration: "60" },
  { id: "kids", category: "cut", name: ["Potongan kanak-kanak", "Children\u2019s haircut"], description: ["Potongan ringkas untuk kanak-kanak bawah 12 tahun.", "A simple cut for children under 12."], price: 30, duration: "30" },
  { id: "colour", category: "colour", name: ["Warna rambut", "Hair colour"], description: ["Pilihan tona selepas konsultasi. Harga mengikut panjang dan keadaan rambut.", "Choose a tone after consultation. Price depends on hair length and condition."], price: 150, from: true, duration: "120\u2013180" },
  { id: "keratin", category: "care", name: ["Rawatan keratin", "Keratin treatment"], description: ["Rawatan untuk kemasan rambut yang lebih mudah diurus.", "A treatment for a more manageable finish."], price: 280, from: true, duration: "120\u2013180" },
  { id: "scalp", category: "care", name: ["Penjagaan kulit kepala", "Scalp care"], description: ["Konsultasi, cucian dan penjagaan kulit kepala.", "Consultation, cleansing and scalp care."], price: 120, duration: "60" },
  { id: "event", category: "style", name: ["Gaya untuk acara", "Event styling"], description: ["Penggayaan mengikut acara dan pilihan anda. Bincang keperluan dengan stylist.", "Styling for your occasion and preferences. Discuss your needs with the stylist."], price: null, duration: null }
];
var end = new Date(Date.now() + 30 * 864e5 + 8 * 36e5).toISOString().slice(0, 10);
var text = (tag, value, cls) => {
  const n = document.createElement(tag);
  if (value) n.textContent = value;
  if (cls) n.className = cls;
  return n;
};
var copy = (value) => language === "en" ? value[1] : value[0];
var price = (item) => item.price === null ? L("Minta sebut harga", "Request a quote") : (item.from ? L("Bermula ", "From ") : "") + "RM" + item.price.toFixed(2);
function paragraph(value, cls) {
  content.append(text("p", value, cls));
}
function note() {
  paragraph(L("Ini ialah demo. Semua harga, alamat dan profil ialah contoh. Tiada tempahan, mesej, ulasan atau bayaran sebenar dihantar.", "This is a demo. Prices, addresses and profiles are examples. No real booking, message, review or payment is submitted."), "demo-note");
}
function profile() {
  return {
    v: 1,
    name: "Ruang Rambut",
    theme: "bright",
    accent: "#80503d",
    logo: root + "logo.svg",
    cover: root + "cover.webp",
    tagline: L("Gaya yang serasi. Ruang untuk diri sendiri.\nPotongan, warna dan penjagaan rambut dalam suasana santai.", "A style that feels like you. A little time for yourself.\nHaircuts, colour and hair care in a relaxed setting."),
    google: root + "#review",
    whatsapp: root + "#whatsapp",
    menu: root + "#services",
    menuLabel: L("Servis & harga", "Services & prices"),
    directions: root + "#location",
    website: root + "#about",
    instagram: root + "#instagram",
    facebook: root + "#facebook",
    tiktok: root + "#tiktok",
    address: L("Lot Demo 8, Jalan Seri 2\nSeksyen 13, 40100 Shah Alam, Selangor\nAlamat contoh \u2014 bukan premis sebenar.", "Demo Lot 8, Jalan Seri 2\nSection 13, 40100 Shah Alam, Selangor\nExample address \u2014 not a real business."),
    hours: L("Selasa\u2013Jumaat: 10:00\u201319:00\nSabtu\u2013Ahad: 10:00\u201320:00\nIsnin: Tutup\nTemu janji disyorkan. Walk-in mengikut kekosongan.", "Tuesday\u2013Friday: 10:00\u201319:00\nSaturday\u2013Sunday: 10:00\u201320:00\nMonday: Closed\nAppointments recommended. Walk-ins subject to availability."),
    promoTitle: L("Hari untuk gaya baharu \xB7 RM49", "A day for a fresh style \xB7 RM49"),
    promoText: L("Potong, cuci & blow untuk pelanggan baharu.\nSelasa\u2013Khamis, 10 pagi hingga 3 petang.\nTawaran contoh sehingga ", "Cut, wash & blow-dry for new customers.\nTuesday\u2013Thursday, 10 am to 3 pm.\nExample offer until ") + (/* @__PURE__ */ new Date(end + "T12:00:00+08:00")).toLocaleDateString(language === "en" ? "en-MY" : "ms-MY", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }) + ".",
    promoURL: root + "#promotion",
    promoStart: "2026-01-01T00:00",
    promoEnd: end + "T23:59"
  };
}
function render() {
  const p = profile(), page = renderCard(document, p);
  document.querySelector("#root").replaceChildren(page);
  for (const a of page.querySelectorAll("a")) {
    const key = new URL(a.href, location.href).hash.slice(1);
    a.removeAttribute("target");
    a.addEventListener("click", (event) => {
      event.preventDefault();
      selectedService = "";
      show(key);
    });
    if (key === "whatsapp") a.querySelector("span").textContent = L("Tempah sesi melalui WhatsApp", "Book a session on WhatsApp");
  }
  document.querySelector(".demo-banner strong").textContent = L("DEMO SALON", "SALON DEMO");
  document.querySelector(".demo-banner span").textContent = L("Salon rekaan \xB7 Harga & maklumat contoh", "Fictional salon \xB7 Sample prices & details");
  document.querySelector("#demo-home").textContent = L("Kembali ke SmartTap", "Back to SmartTap");
  document.querySelector("#demo-close").setAttribute("aria-label", L("Tutup contoh", "Close example"));
  document.title = L("Ruang Rambut \u2014 Demo Salon SmartTap", "Ruang Rambut \u2014 SmartTap Salon Demo");
  if (dialog.open) show(active, true);
}
function show(key, refresh = false) {
  if (!dialog.open) opener = document.activeElement;
  active = key;
  content.replaceChildren();
  const names = { services: L("Servis & harga", "Services & prices"), whatsapp: L("Tempahan salon", "Salon appointments"), review: L("Ulasan Google", "Google reviews"), location: L("Lokasi & waktu operasi", "Location & opening hours"), promotion: L("Pakej gaya baharu RM49", "Fresh style package RM49"), about: L("Tentang Ruang Rambut", "About Ruang Rambut"), instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };
  title.textContent = names[key] || "Ruang Rambut";
  if (key === "services") {
    let draw = function() {
      list.replaceChildren();
      for (const item of services) {
        if (filter.value && item.category !== filter.value) continue;
        const card = text("article", null, "demo-menu-item"), head = text("div", null, "demo-menu-heading");
        head.append(text("h3", copy(item.name)), text("strong", price(item)));
        card.append(head, text("p", copy(item.description)));
        if (item.duration) card.append(text("p", L("Anggaran ", "Approx. ") + item.duration + L(" minit", " minutes"), "demo-service-meta"));
        const ask = text("button", L("Contoh pertanyaan \u2197", "Example enquiry \u2197"), "demo-service-enquiry");
        ask.type = "button";
        ask.onclick = () => {
          selectedService = copy(item.name);
          show("whatsapp");
        };
        card.append(ask);
        list.append(card);
      }
    };
    paragraph(L("Pilih servis yang sesuai dengan anda. Harga dan tempoh di bawah ialah contoh untuk demonstrasi.", "Find a service that suits you. Prices and durations below are demonstration examples."));
    const filter = text("select");
    filter.id = "demo-menu-category";
    const label = text("label", L("Kategori servis", "Service category"));
    label.htmlFor = filter.id;
    for (const [value, labels] of [["", ["Semua servis", "All services"]], ...Object.entries(categories)]) {
      const o = text("option", copy(labels));
      o.value = value;
      filter.append(o);
    }
    content.append(label, filter);
    const list = text("div", null, "demo-menu-list");
    list.id = "demo-services";
    content.append(list);
    filter.onchange = draw;
    draw();
    note();
  } else if (key === "whatsapp" || key === "promotion") {
    if (key === "promotion") paragraph(profile().promoText, "demo-preserve");
    paragraph(L("Contoh mesej yang disediakan untuk pelanggan:", "Example message prepared for a customer:"));
    content.append(text("blockquote", L("Salam Ruang Rambut, saya ingin menempah ", "Hello Ruang Rambut, I would like to book ") + (selectedService || (key === "promotion" ? L("pakej RM49", "the RM49 package") : L("sesi potong, cuci & blow", "a cut, wash & blow-dry"))) + L(". Adakah Sabtu jam 11 pagi masih tersedia? Nama saya: ____.", ". Is Saturday at 11 am available? My name is: ____.")));
    paragraph(L("Pada halaman sebenar, pautan membuka WhatsApp salon. Pelanggan menyemak dan menghantar mesej sendiri; salon mengesahkan kekosongan.", "On a real page, the link opens the salon\u2019s WhatsApp. Customers review and send the message themselves; the salon confirms availability."));
    note();
  } else if (key === "location") {
    paragraph(profile().address, "demo-preserve");
    paragraph(profile().hours, "demo-preserve");
    paragraph(L("Contoh kemudahan: parkir berdekatan, ruang menunggu selesa dan konsultasi gaya sebelum servis.", "Example amenities: nearby parking, a comfortable waiting area and a style consultation before service."));
    note();
  } else if (key === "review") {
    paragraph(L("Ceritakan pengalaman anda: gaya rambut baharu, layanan stylist dan suasana salon.", "Share your experience: your new hairstyle, the stylist\u2019s service and the salon atmosphere."));
    paragraph(L("Halaman sebenar membuka borang ulasan Google bagi lokasi salon yang telah disambungkan. Demo ini tidak mempunyai penyenaraian Google sebenar.", "A real page opens the Google review form for the connected salon location. This demo has no real Google listing."));
    note();
  } else if (["instagram", "facebook", "tiktok"].includes(key)) {
    content.append(text("strong", "@ruangrambut.demo", "demo-handle"));
    paragraph(L("Contoh kandungan salon: hasil potongan, inspirasi warna, tip penjagaan dan promosi bermusim.", "Example salon content: haircut results, colour inspiration, care tips and seasonal promotions."));
    paragraph(L("Nama profil ini ialah contoh sahaja.", "This profile name is an example only."));
    note();
  } else {
    paragraph(L("Ruang Rambut ialah salon rekaan yang mengutamakan gaya praktikal dan pengalaman yang santai.", "Ruang Rambut is a fictional salon focused on practical styles and a relaxed experience."));
    paragraph(L("Demo ini menunjukkan bagaimana satu halaman SmartTap menggabungkan cover, identiti salon, katalog servis, harga, promosi, lokasi dan media sosial.", "This demo shows how one SmartTap page brings together a cover, salon identity, service catalogue, prices, promotions, location and social media."));
    note();
  }
  if (!refresh && !dialog.open) dialog.showModal();
}
document.querySelector("#demo-close").onclick = () => dialog.close();
dialog.addEventListener("close", () => {
  if (opener?.isConnected) opener.focus();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }
});
window.addEventListener("smarttap:language", (event) => {
  language = event.detail.language === "en" ? "en" : "ms";
  render();
});
render();
