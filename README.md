# ClarityRead

> **Distraction-Free Reader Mode with Free Themes & Markdown Export**

A fast, privacy-first Chrome Manifest V3 extension built by **ARIS PARTY LLC** to outperform **Just Read** (`dgmanlpmmkibanfdgjocnabmcaclkmod`, 200K+ users, 4.4★).

- **Product Page:** https://arisparty.org/extensions/clarityread
- **Privacy Policy:** https://arisparty.org/extensions/clarityread/privacy
- **Support & Setup:** https://arisparty.org/extensions/clarityread/support (`support@arisparty.org`)

## Competitive Advantages
- Replaces Just Read (200K users, 3.24MB, basic themes gated behind Premium)
- Includes all 4 polished light/sepia/dark themes completely FREE
- Supports persistent site auto-reader so navigating multi-page articles stays in reader mode
- Zero external AI API calls or 20-domain bloat

## Free vs ClarityRead Pro
### Free
- 1-click distraction-free article reader stripping ads, sidebars, and sticky clutter
- 4 FREE built-in themes: Paper, Sepia, Midnight, and OLED Pitch
- Live typography controls: Serif/Sans/Mono, font size, line height, and column width
- Automatic word count, reading-time estimate, scroll progress bar & clean Print

### Pro (Monetized via Stripe)
- Persistent Auto-Reader rules per domain or URL path
- Bionic / Focus-line reading guide highlight
- Inline text highlighting & saved reading notes
- 1-click Markdown (.md) and clean HTML export

| Plan | Price | Stripe Product / Price ID | Live Checkout Link |
|---|---|---|---|
| Monthly | $2.99/mo | `price_1UeE3OFtqvN4GZH3QstBnMjX` | [Checkout](https://buy.stripe.com/14AeVdb7F7BT51ZgTgg3607) |
| Yearly | $19.99/yr | `price_1UeE4MFtqvN4GZH3kZmlu8tj` | [Checkout](https://buy.stripe.com/14A9ATgrZcWd0LJgTgg360h) |
| Lifetime | $29.99 one-time | `price_1UeE5XFtqvN4GZH319I7UPLY` | [Checkout](https://buy.stripe.com/8x28wPejRaO57a78mKg360r) |

- **Stripe Product ID:** `prod_VfZAU36JDMI1BF`

## Local Installation (Chrome)
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this repository root

## Verification & Chrome Web Store Packaging
```bash
node tests/verify.mjs .
```
Outputs a store-ready archive with 56 `_locales` at `dist/clarityread-extension-v1.0.0.zip`.
