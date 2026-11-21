import { BillingManager } from "./lib/billing.js";
import { BILLING_CONFIG } from "./lib/billing-config.js";

const DEFAULT_PREFS = { theme: "midnight", fontFamily: "serif", fontSize: 19, lineHeight: 1.7, maxWidth: 700, bionic: false, autoHosts: [] };
const billing = new BillingManager(BILLING_CONFIG);
let prefs = structuredClone(DEFAULT_PREFS);
let activeHost = "";
let toastTimer = null;

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === `panel-${name}`));
}

async function save() {
  await chrome.storage.local.set({ cr_prefs: prefs });
  render();
}

function render() {
  const pill = document.getElementById("tierPill");
  pill.textContent = billing.isPro() ? "PRO" : "FREE";
  pill.classList.toggle("pro", billing.isPro());

  document.querySelectorAll("[data-theme]").forEach(b => b.classList.toggle("btn-primary", b.dataset.theme === prefs.theme));
  document.getElementById("fontSelect").value = prefs.fontFamily;
  document.getElementById("fsRange").value = prefs.fontSize;
  document.getElementById("fsVal").textContent = `${prefs.fontSize}px`;
  document.getElementById("widthRange").value = prefs.maxWidth;
  document.getElementById("widthVal").textContent = `${prefs.maxWidth}px`;
  document.getElementById("bionicToggle").checked = !!prefs.bionic;

  const autoList = document.getElementById("autoList");
  autoList.innerHTML = prefs.autoHosts.length ? "" : `<div class="muted" style="text-align:center;padding:12px;">No auto-reader sites saved yet.</div>`;
  for (const h of prefs.autoHosts) {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `<span class="truncate">${h}</span><button class="btn btn-danger btn-sm">Remove</button>`;
    div.querySelector("button").addEventListener("click", () => {
      prefs.autoHosts = prefs.autoHosts.filter(x => x !== h);
      save();
    });
    autoList.appendChild(div);
  }
}

async function init() {
  await billing.init();
  const { cr_prefs } = await chrome.storage.local.get("cr_prefs");
  if (cr_prefs) prefs = { ...DEFAULT_PREFS, ...cr_prefs };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    if (tab?.url && /^https?:/.test(tab.url)) {
      activeHost = new URL(tab.url).hostname.replace(/^www\./, "");
      document.getElementById("siteHost").textContent = activeHost;
    }
  } catch { /* ignore */ }

  document.querySelectorAll(".tab-btn").forEach(b => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  document.getElementById("tierPill").addEventListener("click", () => switchTab("pro"));
  billing.mountProPanel(document.getElementById("panel-pro"), { onToast: showToast, onTierChange: render });

  document.getElementById("toggleReaderBtn").addEventListener("click", async () => {
    const res = await chrome.runtime.sendMessage({ type: "CLARITYREAD_TOGGLE" });
    if (res?.ok) window.close();
    else showToast(res?.error || "Unable to open reader on this page.");
  });

  document.querySelectorAll("[data-theme]").forEach(b => b.addEventListener("click", () => {
    prefs.theme = b.dataset.theme;
    save();
    showToast(`Theme set to ${prefs.theme}`);
  }));

  document.getElementById("fontSelect").addEventListener("change", e => { prefs.fontFamily = e.target.value; save(); });
  document.getElementById("fsRange").addEventListener("input", e => { prefs.fontSize = Number(e.target.value); save(); });
  document.getElementById("widthRange").addEventListener("input", e => { prefs.maxWidth = Number(e.target.value); save(); });

  document.getElementById("bionicToggle").addEventListener("change", e => {
    if (e.target.checked && !billing.isPro()) {
      e.target.checked = false;
      showToast("Bionic reading assist requires ClarityRead Pro.");
      return switchTab("pro");
    }
    prefs.bionic = e.target.checked;
    save();
  });

  document.getElementById("addAutoSiteBtn").addEventListener("click", () => {
    if (!billing.isPro()) {
      showToast("Persistent Auto-Reader requires ClarityRead Pro.");
      return switchTab("pro");
    }
    if (!activeHost) return showToast("Open an HTTP/HTTPS article first.");
    if (!prefs.autoHosts.includes(activeHost)) {
      prefs.autoHosts.unshift(activeHost);
      save();
      showToast(`Auto-Reader enabled for ${activeHost}`);
    }
  });

  render();
}

init();
