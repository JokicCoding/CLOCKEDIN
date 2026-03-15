const DEFAULT_EDUCATIONAL_SITES = [
  // Knowledge & Learning
  "https://www.wikipedia.org/",
  "https://www.britannica.com/",
  "https://www.edx.org/",
  "https://ocw.mit.edu/",
  "https://www.freecodecamp.org/learn/",
  "https://www.coursera.org/",
  "https://www.codecademy.com/",
  "https://www.khanacademy.org/",
  "https://www.skillshare.com/",
  "https://www.udemy.com/",

  // News & Current Events
  "https://www.bbc.com/news",
  "https://www.reuters.com/",
  "https://apnews.com/",
  "https://www.theguardian.com/",
  "https://www.nationalgeographic.com/",

  // Science & Nature
  "https://www.nasa.gov/",
  "https://www.scientificamerican.com/",
  "https://www.newscientist.com/",
  "https://www.nature.com/",

  // Health & Fitness
  "https://www.healthline.com/",
  "https://www.webmd.com/",
  "https://www.nhs.uk/",
  "https://www.mayoclinic.org/",

  // Finance & Investing
  "https://www.investopedia.com/",
  "https://www.moneysavingexpert.com/",
  "https://www.nerdwallet.com/",

  // Language Learning
  "https://www.duolingo.com/",
  "https://www.babbel.com/",
  "https://www.memrise.com/",

  // Meditation & Mindfulness
  "https://www.headspace.com/meditation/meditation-for-beginners",
  "https://www.calm.com/",
  "https://www.mindful.org/",
  "https://www.tenpercent.com/",

  // Motivation & Self Improvement
  "https://www.ted.com/talks",
  "https://jamesclear.com/articles",
  "https://www.markmanson.net/articles",
  "https://www.success.com/",
  "https://www.entrepreneur.com/",
  "https://medium.com/self-improvement",
];

const COUNTDOWN_SECONDS = 3;

function todayKey() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (s < 60) return `${s}s`;
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  if (minutes < 60) {
    return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (remMinutes === 0) return `${hours}h`;
  return `${hours}h ${remMinutes}m`;
}

function uniqueSites(primary, others) {
  const seen = new Set();
  const all = [];

  function add(url) {
    try {
      if (!url) return;
      const trimmed = String(url).trim();
      if (!trimmed) return;
      new URL(trimmed);
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        all.push(trimmed);
      }
    } catch (e) {}
  }

  add(primary);
  (others || []).forEach(add);
  return all.length > 0 ? all : DEFAULT_EDUCATIONAL_SITES;
}

function startCountdown(targetSeconds, onDone) {
  const countEl = document.getElementById("count");
  const progressEl = document.getElementById("progress");
  const totalMs = targetSeconds * 1000;
  const started = Date.now();

  function tick() {
    const elapsed = Date.now() - started;
    const remainingMs = Math.max(0, totalMs - elapsed);
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    if (countEl) countEl.textContent = String(remainingSeconds);
    if (progressEl) {
      const ratio = Math.min(1, elapsed / totalMs);
      progressEl.style.transform = `scaleX(${ratio})`;
    }

    if (remainingMs <= 0) {
      if (typeof onDone === "function") onDone();
    } else {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

document.addEventListener("DOMContentLoaded", () => {
  const sitesListEl = document.getElementById("sitesList");
  const rescuedTimeEl = document.getElementById("rescuedTime");

  chrome.storage.sync.get(
    {
      redirectUrl: DEFAULT_EDUCATIONAL_SITES[0],
      educationalIndex: 0,
      rescuedSecondsToday: 0,
      rescuedDate: ""
    },
    (items) => {
      const pool = uniqueSites(items.redirectUrl, DEFAULT_EDUCATIONAL_SITES);
      const index = Math.abs(Number(items.educationalIndex || 0)) % pool.length;
      const nextIndex = (index + 1) % pool.length;
      const target = pool[index];

      const today = todayKey();
      const alreadyToday = items.rescuedDate === today;
      const rescuedSecondsBase = alreadyToday ? Number(items.rescuedSecondsToday || 0) : 0;

      if (rescuedTimeEl) rescuedTimeEl.textContent = formatDuration(rescuedSecondsBase);

      if (sitesListEl) {
        const sample = pool.slice(0, 4).map(url => new URL(url).hostname.replace("www.", ""));
        sitesListEl.textContent = `${sample.join(", ")}${pool.length > sample.length ? ", and more." : "."}`;
      }

      startCountdown(COUNTDOWN_SECONDS, () => {
        const updatedSeconds = rescuedSecondsBase + COUNTDOWN_SECONDS;
        chrome.storage.sync.set(
          { educationalIndex: nextIndex, rescuedSecondsToday: updatedSeconds, rescuedDate: today },
          () => {
            if (rescuedTimeEl) rescuedTimeEl.textContent = formatDuration(updatedSeconds);
            window.location.replace(target);
          }
        );
      });
    }
  );
});
