// src/public-profile.mjs
function profileURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") && url.href.length <= 500 ? url.href : null;
  } catch {
    return null;
  }
}
function decodeProfilePayload(payload) {
  try {
    if (typeof payload !== "string" || payload.length > 4096 || !/^[A-Za-z0-9_-]+$/.test(payload)) throw 0;
    const bytes = Uint8Array.from(atob(payload.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
    const raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (raw?.v !== 1 || typeof raw.name !== "string" || !raw.name.trim() || [...raw.name].length > 80) throw 0;
    const profile = { v: 1, name: raw.name.trim(), tagline: typeof raw.tagline === "string" ? raw.tagline.slice(0, 140) : "" };
    for (const key of ["google", "instagram", "facebook", "tiktok", "whatsapp", "website", "logo", "threads"]) {
      if (raw[key] && (!profileURL(raw[key]) || typeof raw[key] !== "string")) throw 0;
      if (raw[key]) profile[key] = profileURL(raw[key]);
    }
    const review = new URL(profile.google);
    const host = review.hostname;
    if (!((host === "google.com" || host.endsWith(".google.com") || host === "google.com.my" || host.endsWith(".google.com.my")) && review.pathname.includes("/local/writereview") && review.searchParams.get("placeid") || host === "g.page" && /\/r\/[^/]+\/review\/?$/i.test(review.pathname))) throw 0;
    return profile;
  } catch {
    throw new Error("Pautan profil ini tidak sah. Sila dapatkan pautan baharu daripada perniagaan.");
  }
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
  if (error) {
    const link = element("a", "", "Buka SmartTap");
    link.href = "./setup.html";
    link.style.display = "block";
    box.append(link);
  }
  root.replaceChildren(box);
}
function render(profile) {
  const main = element("main", "public-body");
  main.append(element("div", "public-bg"));
  const card = element("section", "public-card");
  const avatar = element("div", "avatar", profile.name.charAt(0).toLocaleUpperCase());
  if (profile.logo) {
    const image = element("img");
    image.alt = "Logo " + profile.name;
    image.referrerPolicy = "no-referrer";
    image.style.cssText = "width:100%;height:100%;object-fit:contain;border-radius:inherit;background:white";
    image.onload = () => avatar.replaceChildren(image);
    image.src = profile.logo;
  }
  card.append(avatar, element("div", "eyebrow", "WELCOME TO"), element("h1", "", profile.name));
  if (profile.tagline) card.append(element("p", "public-tagline", profile.tagline));
  const links = element("div", "public-links");
  const platforms = [["google", "Google Review", "\u2605"], ["instagram", "Instagram", "\u25CE"], ["facebook", "Facebook", "f"], ["tiktok", "TikTok", "\u266A"], ["whatsapp", "WhatsApp", "\u2197"], ["website", "Website", "\u2301"], ["threads", "Threads", "@"]];
  for (const [key, label, mark] of platforms) {
    if (!profile[key] || key === "threads" && !threadsProfile(profile[key])) continue;
    const link = element("a", "public-link" + (key === "google" ? " primary" : ""));
    link.href = profile[key];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(element("span", "link-icon", mark), element("span", "", key === "google" ? "Leave us a Google Review" : "Follow us on " + label), element("span", "link-arrow", "\u2197"));
    links.append(link);
  }
  card.append(links, element("p", "small-note", "Every review and follow means the world to us. Thank you for your support."));
  const footer = element("footer", "public-footer");
  const brand = element("span", "", "POWERED BY ");
  brand.append(element("b", "", "SMARTTAP"));
  const create = element("a", "", "Create your own page \u2197");
  create.href = "./setup.html";
  footer.append(brand, create);
  main.append(card, footer);
  root.replaceChildren(main);
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
    if (id === null) {
      render(decodeProfilePayload(payload));
      return;
    }
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
