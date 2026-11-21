const DEFAULT_PREFS = {
  theme: "midnight",
  fontFamily: "serif",
  fontSize: 19,
  lineHeight: 1.7,
  maxWidth: 700,
  bionic: false,
  autoHosts: []
};

chrome.runtime.onInstalled.addListener(async () => {
  const { cr_prefs } = await chrome.storage.local.get("cr_prefs");
  if (!cr_prefs) await chrome.storage.local.set({ cr_prefs: DEFAULT_PREFS });
});

async function toggleReaderOnTab(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["reader.js"]
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "CLARITYREAD_TOGGLE") {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !/^https?:/.test(tab.url || "")) {
        return sendResponse({ ok: false, error: "Open an HTTP/HTTPS article page first." });
      }
      await toggleReaderOnTab(tab.id);
      sendResponse({ ok: true });
    })().catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd === "toggle-reader") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && /^https?:/.test(tab.url || "")) {
      await toggleReaderOnTab(tab.id).catch(() => {});
    }
  }
});

// Pro persistent auto-reader when navigating across articles on a saved host
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab?.url || !/^https?:/.test(tab.url)) return;
  const { cr_prefs = DEFAULT_PREFS, aris_pro_clarityread } = await chrome.storage.local.get(["cr_prefs", "aris_pro_clarityread"]);
  if (aris_pro_clarityread?.tier !== "pro") return;
  try {
    const host = new URL(tab.url).hostname.replace(/^www\./, "");
    if ((cr_prefs.autoHosts || []).includes(host)) {
      await toggleReaderOnTab(tabId);
    }
  } catch { /* ignore */ }
});
