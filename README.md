# Clocked In – Focus Blocker

Clocked In is a Chrome/Opera extension that **blocks distracting or inappropriate websites** and **redirects them to better, more productive pages** so you stay in a focused, "clocked in" state.

By default it blocks popular social media and entertainment sites like:

- facebook.com
- instagram.com
- tiktok.com
- twitter.com / x.com
- reddit.com
- youtube.com
- netflix.com

And redirects you to productive sites like Wikipedia, Khan Academy, TED Talks, Coursera, Headspace, and more. You can fully customize both the blocked list and the redirect URL.

## Features

- 100+ adult, gambling, and distracting sites blocked by default
- Redirects to a rotating list of productive and educational sites
- Fully customizable blocked sites list
- Fast and lightweight — no slowdown
- Settings sync across devices with your Google account

## How it works

- Uses `chrome.tabs.onUpdated` to intercept navigation in real time
- When you visit a blocked site, the tab is immediately redirected to `blocked.html` which counts down and sends you to a productive page
- Settings are stored in `chrome.storage.sync` so they sync across Chrome if you are signed in

## Files

- `manifest.json` – Chrome extension manifest (MV3)
- `background.js` – Service worker that intercepts and redirects blocked URLs
- `blocked.html` / `blocked.js` – The redirect page shown when a site is blocked
- `options.html` / `options.js` – Settings UI to customize blocked sites and redirect URL

## How to load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Turn on **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Select the `clockedin` folder
5. The extension will now appear in your extensions list

## How to configure

1. Find **Clocked In** in `chrome://extensions/`
2. Click **Details** → **Extension options**
3. Add domains one per line in **Blocked websites**
4. Set **Redirect to** to any full URL (including `https://`)
5. Click **Save & apply**

## Privacy

This extension does not collect, store, or transmit any personal data. All settings are stored locally on your device.
