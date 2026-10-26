// import-service/appearance.mjs
var appearanceFields = {
  theme: { label: "Tema halaman", options: { classic: "Klasik \xB7 krim & hijau", dark: "Gelap \xB7 arang & putih", bright: "Ceria \xB7 putih & warna jenama" } },
  accent: { label: "Warna utama", type: "color" },
  cover: { label: "Cover tersimpan", type: "url", max: 500 },
  menuLabel: { label: "Nama butang menu / katalog", max: 40 },
  menu: { label: "Pautan menu / katalog", type: "url", max: 500 },
  directions: { label: "Pautan lokasi Google Maps", type: "url", max: 500 },
  address: { label: "Alamat perniagaan", max: 240 },
  hours: { label: "Waktu operasi", max: 240 },
  promoTitle: { label: "Tajuk promosi", max: 70 },
  promoText: { label: "Penerangan promosi", max: 180 },
  promoURL: { label: "Pautan promosi", type: "url", max: 500 },
  promoStart: { label: "Promosi bermula (waktu Malaysia)", type: "datetime-local" },
  promoEnd: { label: "Promosi tamat (waktu Malaysia)", type: "datetime-local" }
};
function promotionVisible(profile, now = Date.now()) {
  if (!profile.promoTitle) return false;
  const start = profile.promoStart ? Date.parse(profile.promoStart + "+08:00") : -Infinity;
  const end = profile.promoEnd ? Date.parse(profile.promoEnd + "+08:00") : Infinity;
  return now >= start && now < end;
}
function validateAppearance(profile) {
  for (const [key, spec] of Object.entries(appearanceFields)) {
    const value = profile[key];
    if (value === void 0 || value === "") continue;
    if (typeof value !== "string" || value.length > (spec.max || 40)) throw new Error("Medan paparan tidak sah: " + spec.label);
    if (spec.options && !Object.hasOwn(spec.options, value)) throw new Error("Tema tidak sah.");
    if (key === "accent" && !/^#[a-fA-F0-9]{6}$/.test(value)) throw new Error("Warna tidak sah.");
    if (spec.type === "datetime-local" && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + "+08:00")) || new Date(Date.parse(value + "+08:00") + 8 * 36e5).toISOString().slice(0, 16) !== value)) throw new Error("Tarikh promosi tidak sah.");
  }
  if (profile.promoStart && profile.promoEnd && profile.promoEnd <= profile.promoStart) throw new Error("Tarikh tamat mesti selepas tarikh mula.");
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
function renderCard(document2, profile, now = Date.now()) {
  const el = (tag, cls, text) => {
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
    const a = el("a", cls);
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (mark) a.append(icon(mark));
    a.append(el("span", "", text));
    return a;
  };
  const main = el("main", "business-page");
  main.dataset.theme = profile.theme || "classic";
  if (profile.accent) {
    main.style.setProperty("--accent", profile.accent);
    const rgb = profile.accent.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255).map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    const light = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    main.style.setProperty("--on-accent", light > 0.179 ? "#14281f" : "#ffffff");
  }
  const card = el("article", "business-card"), cover = el("div", "business-cover");
  if (profile.cover) {
    const img = el("img");
    img.src = profile.cover;
    img.alt = "Gambar cover " + profile.name;
    img.referrerPolicy = "no-referrer";
    img.fetchPriority = "high";
    img.onerror = () => img.remove();
    cover.append(img);
  }
  const content = el("div", "business-content"), avatar = el("div", "business-avatar", profile.name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase());
  if (profile.logo) {
    const img = el("img");
    img.alt = "Logo " + profile.name;
    img.referrerPolicy = "no-referrer";
    img.onload = () => avatar.replaceChildren(img);
    img.src = profile.logo;
  }
  const identity = el("header", "business-identity");
  identity.append(avatar, el("h1", "", profile.name));
  if (profile.tagline) identity.append(el("p", "business-tagline", profile.tagline));
  content.append(identity);
  if (profile.google) {
    const review = el("section", "business-review");
    review.setAttribute("aria-label", "Ulasan Google");
    review.append(el("h2", "", "Pernah singgah di sini?"), el("p", "", "Kongsikan pengalaman anda di Google."), link(profile.google, "Tulis ulasan di Google", "business-action review-action", "star"));
    content.append(review);
  }
  if (profile.whatsapp) content.append(link(profile.whatsapp, "Hubungi melalui WhatsApp", "business-action whatsapp-action", "whatsapp"));
  const quick = el("div", "business-quick");
  if (profile.menu) quick.append(link(profile.menu, profile.menuLabel || "Lihat menu / katalog", "business-action outline-action", "menu"));
  if (profile.directions) quick.append(link(profile.directions, "Arah ke lokasi", "business-action outline-action", "pin"));
  if (quick.childElementCount) content.append(quick);
  if (promotionVisible(profile, now)) {
    const promo = el("section", "business-promo");
    promo.append(el("h2", "", profile.promoTitle));
    if (profile.promoText) promo.append(el("p", "", profile.promoText));
    if (profile.promoURL) {
      const a = link(profile.promoURL, "Lihat promosi", "promo-link");
      a.append(icon("arrow"));
      promo.append(a);
    }
    content.append(promo);
  }
  const social = el("nav", "business-social");
  social.setAttribute("aria-label", "Media sosial");
  for (const name of ["facebook", "instagram", "tiktok", "threads", "x"]) if (profile[name] && (name !== "threads" || threadsProfile(profile[name])) && (name !== "x" || xProfile(profile[name]))) {
    const a = link(profile[name], name === "x" ? "X" : name[0].toUpperCase() + name.slice(1), "social-link", name);
    a.title = name;
    a.setAttribute("aria-label", name);
    social.append(a);
  }
  if (social.childElementCount) content.append(social);
  if (profile.website) content.append(link(profile.website, "Lawati laman web", "business-action website-action", "website"));
  if (profile.address || profile.hours) {
    const details = el("details", "business-details"), summary = el("summary");
    summary.append(icon("clock"), el("span", "", "Alamat & waktu operasi"), icon("chevron"));
    details.append(summary);
    if (profile.address) details.append(el("p", "", profile.address));
    if (profile.hours) details.append(el("p", "", profile.hours));
    content.append(details);
  }
  const footer = el("footer", "business-footer");
  footer.append(el("span", "", "POWERED BY SMARTTAP"));
  content.append(footer);
  card.append(cover, content);
  main.append(card);
  return main;
}

// src/public-profile.mjs
function profileURL(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || globalThis.location?.hostname === "127.0.0.1" && url.origin === globalThis.location.origin) && !url.username && !url.password && (!url.port || url.port === "443" || globalThis.location?.hostname === "127.0.0.1" && url.origin === globalThis.location.origin) && url.href.length <= 500 ? url.href : null;
  } catch {
    return null;
  }
}
function decodeProfilePayload(payload) {
  try {
    if (typeof payload !== "string" || payload.length > 16384 || !/^[A-Za-z0-9_-]+$/.test(payload)) throw 0;
    const bytes = Uint8Array.from(atob(payload.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
    const raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (raw?.v !== 1 || typeof raw.name !== "string" || !raw.name.trim() || [...raw.name].length > 80) throw 0;
    const profile = { v: 1, name: raw.name.trim(), tagline: typeof raw.tagline === "string" ? raw.tagline.slice(0, 140) : "" };
    validateAppearance(raw);
    for (const key of Object.keys(appearanceFields)) if (raw[key]) profile[key] = raw[key];
    for (const key of ["google", "instagram", "facebook", "tiktok", "whatsapp", "website", "logo", "threads", "x", "cover", "menu", "directions", "promoURL"]) {
      if (raw[key] && (!profileURL(raw[key]) || typeof raw[key] !== "string")) throw 0;
      if (raw[key]) profile[key] = profileURL(raw[key]);
    }
    if (profile.x && !xProfile(profile.x)) throw 0;
    if (raw.googleStatus !== void 0 && raw.googleStatus !== "pending") throw 0;
    if (raw.googleStatus === "pending") {
      if (profile.google) throw 0;
      profile.googleStatus = "pending";
      return profile;
    }
    const review = new URL(profile.google);
    const host = review.hostname;
    if (!((host === "google.com" || host.endsWith(".google.com") || host === "google.com.my" || host.endsWith(".google.com.my")) && review.pathname.includes("/local/writereview") && review.searchParams.get("placeid") || host === "g.page" && /\/r\/[^/]+\/review\/?$/i.test(review.pathname))) throw 0;
    return profile;
  } catch {
    throw new Error("Pautan profil ini tidak sah. Sila dapatkan pautan baharu daripada perniagaan.");
  }
}

// src/public.js
var root = document.getElementById("root");
var params = new URLSearchParams(location.search);
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function status(message, error = false) {
  const box = element("p", "", message);
  box.setAttribute("role", error ? "alert" : "status");
  box.style.cssText = "margin:15vh auto;padding:24px;max-width:640px;text-align:center;font:16px/1.7 system-ui";
  if (error) box.style.cssText += ";color:#b42318;font-weight:750;background:#fff0ee;border:1px solid #efc2bd;border-radius:12px";
  if (error) {
    const id = params.get("s"), owned = /^[A-Za-z0-9_-]{16}$/.test(id || "");
    const link = element("a", "", owned ? "Login pemilik halaman" : "Buka SmartTap");
    link.href = owned ? "/edit/?s=" + encodeURIComponent(id) : "./setup.html";
    link.style.display = "block";
    box.append(link);
  }
  root.replaceChildren(box);
}
function render(profile) {
  root.replaceChildren(renderCard(document, profile));
  document.title = profile.name + " \u2014 SmartTap";
}
async function openPage() {
  const id = params.get("s");
  const payload = params.get("p");
  if (id === null && !payload) {
    root.hidden = true;
    location.replace(new URL("./setup.html", location.href).href);
    return;
  }
  try {
    if (id === null) throw new Error("Gunakan URL pendek SmartTap untuk membuka halaman ini.");
    status("Sedang membuka halaman SmartTap\u2026");
    if (!/^[A-Za-z0-9_-]{16}$/.test(id)) throw new Error("Pautan pendek ini tidak sah.");
    const endpoint = location.hostname === "127.0.0.1" ? location.origin : window.SMARTTAP_IMPORT_CONFIG?.endpoint;
    if (!endpoint) throw new Error("Perkhidmatan pautan pendek belum tersedia.");
    const response = await fetch(new URL("/api/links/" + id, endpoint), { signal: AbortSignal.timeout(15e3) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Pautan pendek tidak dapat dibuka. Cuba lagi.");
    const target = new URL(data.url);
    if (target.origin !== location.origin || target.pathname !== "/" || target.hash || [...target.searchParams.keys()].join() !== "p") throw new Error("Destinasi pautan tidak sah.");
    render(decodeProfilePayload(target.searchParams.get("p")));
  } catch (error) {
    status(error.name === "TimeoutError" ? "Sambungan mengambil masa terlalu lama. Muat semula untuk mencuba lagi." : error.message, true);
  }
}
openPage();
