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
  const el2 = (tag, cls, text) => {
    const node = document2.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
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
  const link = (url, text, cls, mark) => {
    const a = el2("a", cls);
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (mark) a.append(icon(mark));
    a.append(el2("span", "", text));
    return a;
  };
  const main = el2("main", "business-page");
  main.dataset.theme = profile2.theme || "classic";
  if (profile2.accent) {
    main.style.setProperty("--accent", profile2.accent);
    const rgb = profile2.accent.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255).map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    const light = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    main.style.setProperty("--on-accent", light > 0.179 ? "#14281f" : "#ffffff");
  }
  const card = el2("article", "business-card"), cover = el2("div", "business-cover");
  if (profile2.cover) {
    const img = el2("img");
    img.src = profile2.cover;
    img.alt = "Gambar cover " + profile2.name;
    img.referrerPolicy = "no-referrer";
    img.fetchPriority = "high";
    img.onerror = () => img.remove();
    cover.append(img);
  }
  const content2 = el2("div", "business-content"), avatar = el2("div", "business-avatar", profile2.name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase());
  if (profile2.logo) {
    const img = el2("img");
    img.alt = "Logo " + profile2.name;
    img.referrerPolicy = "no-referrer";
    img.onload = () => avatar.replaceChildren(img);
    img.src = profile2.logo;
  }
  const identity = el2("header", "business-identity");
  identity.append(avatar, el2("h1", "", profile2.name));
  if (profile2.tagline) identity.append(el2("p", "business-tagline", profile2.tagline));
  content2.append(identity);
  if (profile2.google) {
    const review = el2("section", "business-review");
    review.setAttribute("aria-label", "Ulasan Google");
    review.append(el2("h2", "", "Pernah singgah di sini?"), el2("p", "", "Kongsikan pengalaman anda di Google."), link(profile2.google, "Tulis ulasan di Google", "business-action review-action", "star"));
    content2.append(review);
  }
  if (profile2.whatsapp) content2.append(link(profile2.whatsapp, "Hubungi melalui WhatsApp", "business-action whatsapp-action", "whatsapp"));
  const quick = el2("div", "business-quick");
  if (profile2.menu) quick.append(link(profile2.menu, profile2.menuLabel || "Lihat menu / katalog", "business-action outline-action", "menu"));
  if (profile2.directions) quick.append(link(profile2.directions, "Arah ke lokasi", "business-action outline-action", "pin"));
  if (quick.childElementCount) content2.append(quick);
  if (promotionVisible(profile2, now)) {
    const promo = el2("section", "business-promo");
    promo.append(el2("h2", "", profile2.promoTitle));
    if (profile2.promoText) promo.append(el2("p", "", profile2.promoText));
    if (profile2.promoURL) {
      const a = link(profile2.promoURL, "Lihat promosi", "promo-link");
      a.append(icon("arrow"));
      promo.append(a);
    }
    content2.append(promo);
  }
  const social = el2("nav", "business-social");
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
    const details = el2("details", "business-details"), summary = el2("summary");
    summary.append(icon("clock"), el2("span", "", "Alamat & waktu operasi"), icon("chevron"));
    details.append(summary);
    if (profile2.address) details.append(el2("p", "", profile2.address));
    if (profile2.hours) details.append(el2("p", "", profile2.hours));
    content2.append(details);
  }
  const footer = el2("footer", "business-footer");
  footer.append(el2("span", "", "POWERED BY SMARTTAP"));
  content2.append(footer);
  card.append(cover, content2);
  main.append(card);
  return main;
}

// src/restaurant-demo.mjs
var root = "/demo/restaurant/";
var end = new Date(Date.now() + 30 * 864e5 + 8 * 36e5).toISOString().slice(0, 10);
var endLabel = (/* @__PURE__ */ new Date(end + "T12:00:00+08:00")).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });
var profile = {
  v: 1,
  name: "Dapur Senja",
  theme: "classic",
  accent: "#20543e",
  logo: root + "logo.svg",
  cover: root + "cover.webp",
  tagline: "Rasa kampung, sentuhan moden.\nHidangan Melayu segar untuk makan bersama yang tersayang.",
  google: root + "#review",
  whatsapp: root + "#whatsapp",
  menu: root + "#menu",
  directions: root + "#location",
  website: root + "#website",
  instagram: root + "#instagram",
  facebook: root + "#facebook",
  tiktok: root + "#tiktok",
  threads: "https://www.threads.net/@dapursenja.demo",
  address: "Lot Demo 12, Jalan Senja\nSeksyen 13, 40100 Shah Alam, Selangor\nAlamat contoh \u2014 bukan premis sebenar.",
  hours: "Isnin\u2013Jumaat: 11:00\u201322:00\nSabtu\u2013Ahad: 09:00\u201323:00\nTempahan terakhir 30 minit sebelum tutup.",
  promoTitle: "Set Tengah Hari \xB7 RM21.90",
  promoText: "Nasi Kerabu Ayam Bakar + Air Limau Ais.\nIsnin\u2013Jumaat, 12 tengah hari hingga 3 petang.\nContoh tawaran hingga " + endLabel + ".",
  promoURL: root + "#promotion",
  promoStart: "2026-01-01T00:00",
  promoEnd: end + "T23:59"
};
var page = renderCard(document, profile);
document.querySelector("#root").append(page);
for (const a of page.querySelectorAll("a")) {
  const key = a.getAttribute("aria-label") === "threads" ? "threads" : new URL(a.href, location.href).hash.slice(1);
  a.href = root + "#" + key;
  a.removeAttribute("target");
  a.addEventListener("click", (event) => {
    event.preventDefault();
    show(key);
  });
}
var dialog = document.querySelector("#demo-dialog");
var content = document.querySelector("#demo-dialog-content");
var title = document.querySelector("#demo-dialog-title");
var opener;
function localizeDemo(language) {
  const en = language === "en";
  document.querySelector(".demo-banner strong").textContent = en ? "RESTAURANT DEMO" : "DEMO RESTORAN";
  document.querySelector(".demo-banner span").textContent = en ? "Fictional restaurant \xB7 Sample details" : "Restoran rekaan \xB7 Maklumat contoh";
  document.querySelector("#demo-close").setAttribute("aria-label", en ? "Close example" : "Tutup contoh");
}
var initialLanguage = "ms";
try {
  if (localStorage.getItem("smarttap.language") === "en") initialLanguage = "en";
} catch {
}
localizeDemo(initialLanguage);
window.addEventListener("smarttap:language", (event) => localizeDemo(event.detail.language));
document.querySelector("#demo-close").onclick = () => dialog.close();
dialog.addEventListener("close", () => opener?.focus());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }
});
function el(tag, text, cls) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function paragraph(text, cls) {
  content.append(el("p", text, cls));
}
function note() {
  paragraph("Ini ialah demonstrasi. Tiada pesanan, mesej, ulasan atau bayaran sebenar dihantar.", "demo-note");
}
var menu = [
  ["Hidangan utama", "Nasi Kerabu Ayam Bakar", "Nasi biru bunga telang, ayam bakar, ulam segar dan sambal.", 18.9],
  ["Hidangan utama", "Nasi Rendang Daging", "Daging dimasak perlahan dengan rempah, nasi panas dan acar.", 22.9],
  ["Hidangan utama", "Laksa Utara", "Kuah ikan pekat, mi laksa, timun, bawang dan limau.", 14.9],
  ["Hidangan utama", "Ayam Percik Kelantan", "Ayam panggang bersalut kuah percik, nasi dan sayur.", 19.9],
  ["Minuman", "Air Limau Ais", "Limau segar, ais dan kemanisan pilihan.", 5.9],
  ["Minuman", "Teh Tarik", "Teh susu ditarik dan disediakan panas.", 4.9],
  ["Minuman", "Kopi Kampung", "Kopi tradisional; pilih panas atau ais.", 5.5],
  ["Pencuci mulut", "Sagu Gula Melaka", "Sagu sejuk, santan dan sirap gula Melaka.", 7.9]
];
function show(key) {
  opener = document.activeElement;
  content.replaceChildren();
  const names = { review: "Ulasan Google", whatsapp: "Tempahan & pertanyaan", menu: "Menu Dapur Senja", location: "Lokasi & waktu operasi", website: "Tentang Dapur Senja", promotion: "Set Tengah Hari RM21.90", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", threads: "Threads" };
  title.textContent = names[key] || "Dapur Senja";
  if (key === "menu") {
    let draw = function() {
      list.replaceChildren();
      for (const [category, name, description, price] of menu) {
        if (filter.value !== "Semua" && filter.value !== category) continue;
        const item = el("article", null, "demo-menu-item"), heading = el("div", null, "demo-menu-heading");
        heading.append(el("h3", name), el("strong", "RM" + price.toFixed(2)));
        item.append(heading, el("p", description));
        list.append(item);
      }
    };
    paragraph("Masakan Melayu segar, disediakan dengan penuh rasa. Semua harga di bawah ialah harga contoh.");
    const label = el("label", "Kategori menu"), filter = el("select");
    filter.id = "demo-menu-category";
    label.htmlFor = filter.id;
    for (const category of ["Semua", "Hidangan utama", "Minuman", "Pencuci mulut"]) {
      const o = el("option", category);
      o.value = category;
      filter.append(o);
    }
    content.append(label, filter);
    const list = el("div", null, "demo-menu-list");
    content.append(list);
    filter.onchange = draw;
    draw();
    note();
  } else if (key === "location") {
    paragraph(profile.address, "demo-preserve");
    paragraph(profile.hours, "demo-preserve");
    paragraph("Parkir dan kemudahan: ruang parkir berdekatan, tempat duduk keluarga dan ruang makan berhawa dingin. Maklumat ini ialah contoh.");
    note();
  } else if (key === "whatsapp" || key === "promotion") {
    if (key === "promotion") paragraph(profile.promoText, "demo-preserve");
    paragraph("Contoh mesej pelanggan:");
    const draft = el("blockquote", key === "promotion" ? "Salam Dapur Senja, saya berminat dengan Set Tengah Hari RM21.90. Boleh saya tempah untuk 2 orang?" : "Salam Dapur Senja, saya ingin menempah meja untuk 4 orang pada jam 7.30 malam. Masih ada tempat?");
    content.append(draft);
    paragraph("Dalam halaman pelanggan sebenar, butang ini membuka WhatsApp perniagaan yang telah didaftarkan.");
    note();
  } else if (key === "review") {
    content.append(el("div", "\u2605\u2605\u2605\u2605\u2605", "demo-stars"));
    paragraph("Kongsikan pengalaman makan anda: hidangan kegemaran, suasana restoran dan layanan yang diterima.");
    paragraph("Dalam halaman sebenar, pelanggan dibawa ke borang ulasan Google bagi perniagaan yang disambungkan oleh super admin. Demo ini tidak mencipta Place ID atau ulasan palsu.");
    note();
  } else if (["instagram", "facebook", "tiktok", "threads"].includes(key)) {
    content.append(el("strong", "@dapursenja.demo", "demo-handle"));
    paragraph("Contoh kandungan: menu harian, video dapur, promosi makan tengah hari dan perkongsian komuniti.");
    paragraph("Ini ialah nama profil contoh. Halaman sebenar menggunakan pautan akaun rasmi perniagaan anda.");
    note();
  } else {
    paragraph("Dapur Senja ialah konsep restoran demo masakan Melayu moden: rasa kampung dalam suasana yang selesa dan mesra keluarga.");
    paragraph("Pilihan hidangan: nasi kerabu, rendang daging, ayam percik dan pencuci mulut tempatan.");
    paragraph("Halaman ini menunjukkan hasil lengkap SmartTap dengan cover, identiti jenama, menu, lokasi, promosi dan media sosial.");
    note();
  }
  content.dataset.noI18n = "";
  dialog.showModal();
}
