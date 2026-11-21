(() => {
  const OVERLAY_ID = "clarityread-overlay-host";
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
    document.documentElement.style.removeProperty("overflow");
    return;
  }

  const THEMES = {
    paper: { bg: "#ffffff", fg: "#1e293b", muted: "#64748b", bar: "#f8fafc", border: "#e2e8f0", accent: "#d97706" },
    sepia: { bg: "#f5ecd7", fg: "#2d2417", muted: "#78664c", bar: "#efe2c4", border: "#dfd0ad", accent: "#b45309" },
    midnight: { bg: "#0f172a", fg: "#e2e8f0", muted: "#94a3b8", bar: "#111827", border: "#1e293b", accent: "#fbbf24" },
    oled: { bg: "#000000", fg: "#e5e5e5", muted: "#8a8a8a", bar: "#0a0a0a", border: "#222222", accent: "#fbbf24" }
  };

  const FONTS = {
    serif: 'Georgia, "Charter", "Times New Roman", serif',
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
    mono: '"SFMono-Regular", Consolas, Menlo, monospace'
  };

  function extractArticle() {
    const title = document.querySelector("h1")?.textContent?.trim() || document.title || "Article";
    const candidates = [
      document.querySelector("article"),
      document.querySelector("main"),
      document.querySelector("[role='main']"),
      document.querySelector(".post-content, .article-content, .entry-content, #content")
    ].filter(Boolean);

    let root = candidates.sort((a, b) => (b.innerText?.length || 0) - (a.innerText?.length || 0))[0];
    if (!root || (root.innerText?.trim().length || 0) < 200) {
      let best = document.body;
      let bestScore = 0;
      document.querySelectorAll("div, section").forEach(el => {
        const ps = el.querySelectorAll("p").length;
        const len = (el.innerText || "").trim().length;
        const score = ps * 120 + Math.min(len, 10000);
        if (score > bestScore && len < 120000) {
          bestScore = score;
          best = el;
        }
      });
      root = best;
    }

    const clone = root.cloneNode(true);
    clone.querySelectorAll("script, style, noscript, iframe, nav, footer, aside, form, button, svg, [class*='ad-'], [id*='ad-'], [class*='cookie'], [class*='popup']").forEach(n => n.remove());
    const text = (clone.innerText || "").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const blocks = [];
    clone.querySelectorAll("h1,h2,h3,h4,p,blockquote,pre,ul,ol,img").forEach(el => {
      if (el.tagName === "IMG") {
        if (el.src && (el.naturalWidth === 0 || el.naturalWidth > 120)) {
          blocks.push({ tag: "img", src: el.src, alt: el.alt || "" });
        }
      } else {
        const t = el.innerText?.trim();
        if (t && t.length > 2) blocks.push({ tag: el.tagName.toLowerCase(), text: t });
      }
    });
    if (!blocks.length && text) {
      text.split(/\n{2,}/).forEach(p => { if (p.trim()) blocks.push({ tag: "p", text: p.trim() }); });
    }
    return { title, url: location.href, words, readMin: Math.max(1, Math.round(words / 220)), blocks };
  }

  function applyBionicText(str) {
    return str.replace(/\b([A-Za-z]{3,})\b/g, (w) => {
      const cut = Math.ceil(w.length * 0.42);
      return `<strong>${w.slice(0, cut)}</strong>${w.slice(cut)}`;
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function toMarkdown(art) {
    const lines = [`# ${art.title}`, "", `> Source: ${art.url}`, ""];
    for (const b of art.blocks) {
      if (b.tag === "h1" || b.tag === "h2") lines.push(`## ${b.text}`, "");
      else if (b.tag === "h3" || b.tag === "h4") lines.push(`### ${b.text}`, "");
      else if (b.tag === "blockquote") lines.push(`> ${b.text}`, "");
      else if (b.tag === "pre") lines.push("```", b.text, "```", "");
      else if (b.tag === "img") lines.push(`![${b.alt}](${b.src})`, "");
      else lines.push(b.text, "");
    }
    return lines.join("\n");
  }

  chrome.storage.local.get(["cr_prefs", "aris_pro_clarityread"], ({ cr_prefs, aris_pro_clarityread }) => {
    const prefs = {
      theme: "midnight", fontFamily: "serif", fontSize: 19, lineHeight: 1.7, maxWidth: 700, bionic: false,
      ...(cr_prefs || {})
    };
    const isPro = aris_pro_clarityread?.tier === "pro";
    const article = extractArticle();

    const host = document.createElement("div");
    host.id = OVERLAY_ID;
    host.style.cssText = "position:fixed;inset:0;z-index:2147483647;";
    const shadow = host.attachShadow({ mode: "open" });

    function render() {
      const t = THEMES[prefs.theme] || THEMES.midnight;
      const bodyHtml = article.blocks.map(b => {
        if (b.tag === "img") return `<img src="${escapeHtml(b.src)}" alt="${escapeHtml(b.alt)}">`;
        const safe = escapeHtml(b.text);
        const content = (prefs.bionic && isPro && b.tag === "p") ? applyBionicText(safe) : safe;
        return `<${b.tag}>${content}</${b.tag}>`;
      }).join("\n");

      shadow.innerHTML = `
        <style>
          .wrap { position:fixed; inset:0; overflow-y:auto; background:${t.bg}; color:${t.fg}; font-family:${FONTS[prefs.fontFamily] || FONTS.serif}; }
          .progress { position:fixed; top:0; left:0; height:3px; background:${t.accent}; width:0%; z-index:10; transition:width 0.1s; }
          .bar { position:sticky; top:0; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 20px; background:${t.bar}; border-bottom:1px solid ${t.border}; font-family:system-ui,sans-serif; font-size:12px; }
          .controls { display:flex; flex-wrap:wrap; align-items:center; gap:6px; }
          button { background:transparent; color:${t.fg}; border:1px solid ${t.border}; border-radius:6px; padding:5px 9px; font-size:12px; cursor:pointer; }
          button.active { border-color:${t.accent}; color:${t.accent}; font-weight:700; }
          article { max-width:${prefs.maxWidth}px; margin:38px auto 80px; padding:0 24px; font-size:${prefs.fontSize}px; line-height:${prefs.lineHeight}; }
          h1.title { font-size:1.85em; line-height:1.22; margin:0 0 10px; }
          .meta { font-family:system-ui,sans-serif; font-size:13px; color:${t.muted}; margin-bottom:28px; }
          img { max-width:100%; border-radius:8px; margin:16px 0; }
          blockquote { border-left:3px solid ${t.accent}; padding-left:14px; color:${t.muted}; margin:18px 0; }
          pre { background:${t.bar}; border:1px solid ${t.border}; padding:12px; border-radius:8px; overflow-x:auto; font-size:0.85em; }
        </style>
        <div class="progress" id="prog"></div>
        <div class="wrap" id="scrollWrap">
          <div class="bar">
            <strong style="color:${t.accent};">ClarityRead</strong>
            <div class="controls">
              ${["paper","sepia","midnight","oled"].map(th => `<button data-th="${th}" class="${prefs.theme===th?"active":""}">${th[0].toUpperCase()+th.slice(1)}</button>`).join("")}
              <button id="smallerBtn">A-</button>
              <button id="largerBtn">A+</button>
              <button id="bionicBtn" class="${prefs.bionic && isPro ? "active" : ""}">Bionic${isPro ? "" : " (Pro)"}</button>
              <button id="mdBtn">Export .md${isPro ? "" : " (Pro)"}</button>
              <button id="printBtn">Print</button>
              <button id="closeBtn">✕ Exit</button>
            </div>
          </div>
          <article>
            <h1 class="title">${escapeHtml(article.title)}</h1>
            <div class="meta">${article.words.toLocaleString()} words · ${article.readMin} min read · ${location.hostname}</div>
            ${bodyHtml}
          </article>
        </div>
      `;

      const wrap = shadow.getElementById("scrollWrap");
      const prog = shadow.getElementById("prog");
      wrap.addEventListener("scroll", () => {
        const max = wrap.scrollHeight - wrap.clientHeight;
        prog.style.width = max > 0 ? `${Math.min(100, (wrap.scrollTop / max) * 100)}%` : "0%";
      });

      shadow.querySelectorAll("[data-th]").forEach(b => b.addEventListener("click", () => {
        prefs.theme = b.dataset.th;
        chrome.storage.local.set({ cr_prefs: prefs });
        render();
      }));
      shadow.getElementById("smallerBtn").addEventListener("click", () => {
        prefs.fontSize = Math.max(13, prefs.fontSize - 2);
        chrome.storage.local.set({ cr_prefs: prefs });
        render();
      });
      shadow.getElementById("largerBtn").addEventListener("click", () => {
        prefs.fontSize = Math.min(30, prefs.fontSize + 2);
        chrome.storage.local.set({ cr_prefs: prefs });
        render();
      });
      shadow.getElementById("bionicBtn").addEventListener("click", () => {
        if (!isPro) return alert("Bionic reading assist requires ClarityRead Pro. Open the ClarityRead popup -> Pro tab to upgrade.");
        prefs.bionic = !prefs.bionic;
        chrome.storage.local.set({ cr_prefs: prefs });
        render();
      });
      shadow.getElementById("mdBtn").addEventListener("click", () => {
        if (!isPro) return alert("Markdown export requires ClarityRead Pro. Open the ClarityRead popup -> Pro tab to upgrade.");
        const blob = new Blob([toMarkdown(article)], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${article.title.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "article"}.md`;
        a.click();
        URL.revokeObjectURL(url);
      });
      shadow.getElementById("printBtn").addEventListener("click", () => window.print());
      shadow.getElementById("closeBtn").addEventListener("click", () => {
        host.remove();
        document.documentElement.style.removeProperty("overflow");
      });
    }

    document.documentElement.style.setProperty("overflow", "hidden", "important");
    document.documentElement.appendChild(host);
    render();
  });
})();
