/**
 * background.js
 * Service worker for Clocked In – Focus Blocker
 * 
 * Listens for tab navigation events and redirects blocked sites
 * to the blocked.html page using chrome.tabs.onUpdated.
 */

// Default sites blocked when the extension is first installed
const DEFAULT_BLOCKED_SITES = [
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "youtube.com",
  "netflix.com"
];

// These sites are always blocked regardless of user settings
const ALWAYS_BLOCKED_SITES = [
  // Adult content
  "pornhub.com", "xvideos.com", "xnxx.com", "onlyfans.com", "redtube.com",
  "youporn.com", "tube8.com", "pornhub.net", "spankbang.com", "xhamster.com",
  "xhamster2.com", "xhamster3.com", "xhamster4.com", "xhamster5.com",
  "beeg.com", "tnaflix.com", "drtuber.com", "nuvid.com", "sunporno.com",
  "porn.com", "sex.com", "pornmd.com", "xtube.com", "slutload.com",
  "porntrex.com", "hclips.com", "hdtube.porn", "porntube.com", "fuq.com",
  "porndig.com", "4tube.com", "hardsextube.com", "ok.xxx", "txxx.com",
  "vporn.com", "boyfriendtv.com", "tubegalore.com", "faphouse.com",
  "eporner.com", "empflix.com", "pornone.com", "youjizz.com", "jizzbunker.com",
  "nudevista.com", "porndoe.com", "fapvid.com", "pornhat.com", "pornktube.com",
  "vidlox.me", "pornrox.com", "desipapa.com", "desi49.com", "anysex.com",
  "sexvid.xxx", "ah-me.com", "cliphunter.com", "pornoxo.com", "pornid.xxx",
  "gotporn.com", "biguz.net", "pornobae.com", "asiantube.xxx", "analdin.com",
  "ashemaletube.com", "shemalestube.com", "cumlouder.com", "alphaporno.com",
  "netfapx.com", "watchmygf.me", "homemoviestube.com", "homepornbay.com",
  "voyeurhit.com", "voyeurweb.com", "cams.com", "chaturbate.com",
  "bongacams.com", "cam4.com", "myfreecams.com", "streamate.com",
  "livejasmin.com", "stripchat.com", "flirt4free.com", "imlive.com",
  "jasmin.com", "rabbitsreviews.com", "adultfriendfinder.com",
  "ashleymadison.com", "fling.com", "alt.com", "fetlife.com",
  "brazzers.com", "bangbros.com", "naughtyamerica.com",
  "digitalplayground.com", "wicked.com", "evilangel.com", "kink.com",
  "mofos.com", "teamskeet.com", "passion-hd.com", "blacked.com",
  "tushy.com", "vixen.com", "deeper.com", "mylf.com", "milfed.com",
  "twistys.com", "penthouse.com", "hustler.com", "playboy.com",
  "hegre.com", "met-art.com", "femjoy.com",
  "clips4sale.com", "manyvids.com", "fancentro.com", "fansly.com",
  "rule34.xxx", "rule34.paheal.net", "gelbooru.com", "danbooru.donmai.us",
  "e-hentai.org", "nhentai.net", "hentaihaven.xxx", "hentaimama.io",
  "hanime.tv", "fakku.net", "tsumino.com", "hentai2read.com",

  // Gambling
  "bet365.com", "draftkings.com", "fanduel.com", "betway.com",
  "888casino.com", "pokerstars.com", "partypoker.com", "ggpoker.com",
  "winamax.fr", "unibet.com", "betfair.com", "williamhill.com",
  "ladbrokes.com", "paddy power.com", "skybet.com",
  "betvictor.com", "mrgreen.com", "casumo.com", "leovegas.com",
  "betsson.com", "casinoroom.com", "spinit.com", "videoslots.com",
  "rizkcasino.com", "jackpotcity.com", "royalvegas.com", "slotsmillion.com",
  "vegascasino.io", "bitstarz.com", "stake.com", "rollbit.com",
  "roobet.com", "csgoempire.com", "csgobig.com", "hypedrop.com",
  "packdraw.com", "bovada.lv", "betonline.ag", "mybookie.ag",
  "sportsbetting.ag", "gtbets.eu", "xbet.ag", "intertops.eu",

  // Drug-related
  "leafly.com", "weedmaps.com", "erowid.org", "shroomery.org",

  // Extremist / hate
  "stormfront.org", "gab.com", "voat.co", "kiwifarms.net"
];

// Default keywords to block URLs containing these words
const DEFAULT_BLOCKED_KEYWORDS = [
  "porn", "xxx", "hentai", "OnlyFans", "camgirl", "livecam",
  "sexcam", "adultchat", "nudecam", "stripshow"
];

const DEFAULT_REDIRECT_URL = "https://www.wikipedia.org/";

/**
 * Fetches blocked sites, keywords, and redirect URL from chrome.storage.sync
 */
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        blockedSites: DEFAULT_BLOCKED_SITES,
        blockedKeywords: DEFAULT_BLOCKED_KEYWORDS,
        redirectUrl: DEFAULT_REDIRECT_URL
      },
      (items) => {
        resolve({
          blockedSites: items.blockedSites || DEFAULT_BLOCKED_SITES,
          blockedKeywords: Array.isArray(items.blockedKeywords) ? items.blockedKeywords : DEFAULT_BLOCKED_KEYWORDS,
          redirectUrl: items.redirectUrl || DEFAULT_REDIRECT_URL
        });
      }
    );
  });
}

/**
 * Checks if a given URL should be blocked
 * @param {string} url - The URL to check
 * @param {string[]} blockedSites - List of blocked domains
 * @param {string[]} blockedKeywords - List of blocked keywords
 * @returns {boolean}
 */
function isBlocked(url, blockedSites, blockedKeywords) {
  if (!url || !url.startsWith("http")) return false;

  const lower = url.toLowerCase();

  // Check against blocked sites and always-blocked sites
  const allSites = [...blockedSites, ...ALWAYS_BLOCKED_SITES];
  for (const site of allSites) {
    if (lower.includes(site.toLowerCase())) return true;
  }

  // Check against blocked keywords
  for (const keyword of blockedKeywords) {
    if (lower.includes(keyword.toLowerCase())) return true;
  }

  return false;
}

/**
 * Fires whenever a tab starts loading a new URL.
 * If the URL is blocked, redirect to blocked.html.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading") return;
  if (!tab.url) return;

  // Don't redirect if already on the blocked page
  if (tab.url.startsWith(chrome.runtime.getURL("blocked.html"))) return;

  const { blockedSites, blockedKeywords } = await getSettings();

  if (isBlocked(tab.url, blockedSites, blockedKeywords)) {
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL("blocked.html")
    });
  }
});

/**
 * On install, set default settings in storage
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    blockedSites: DEFAULT_BLOCKED_SITES,
    blockedKeywords: DEFAULT_BLOCKED_KEYWORDS,
    redirectUrl: DEFAULT_REDIRECT_URL
  });
});
