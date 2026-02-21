const DEFAULT_TIMEZONES = [
  { label: "Kyiv", tz: "Europe/Kyiv" },
  { label: "London", tz: "Europe/London" },
  { label: "New York", tz: "America/New_York" },
  { label: "Los Angeles", tz: "America/Los_Angeles" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
];

const els = {
  clocks: document.getElementById("clocks"),
  format: document.getElementById("format"),
  locale: document.getElementById("locale"),
  addTz: document.getElementById("addTz"),
  addBtn: document.getElementById("addBtn"),
  resetBtn: document.getElementById("resetBtn"),
};

function safeParseJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem("clock.locale", JSON.stringify(state.locale));
  localStorage.setItem("clock.hourCycle", JSON.stringify(state.hourCycle));
  localStorage.setItem("clock.zones", JSON.stringify(state.zones));
}

function isValidTimeZone(tz) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function detectLocalTimeZone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof tz === "string" && tz ? tz : null;
  } catch {
    return null;
  }
}

function labelFromTimeZone(tz) {
  return tz.split("/").slice(-1)[0].replaceAll("_", " ");
}

function ensureZonePresent(zones, tz, label = null) {
  if (!tz) return zones;
  if (!isValidTimeZone(tz)) return zones;

  const exists = zones.some(z => (z.tz || "").toLowerCase() === tz.toLowerCase());
  if (exists) return zones;

  return [{ label: label ?? labelFromTimeZone(tz), tz }, ...zones];
}

let state = {
  locale: safeParseJSON("clock.locale", "uk-UA"),
  hourCycle: safeParseJSON("clock.hourCycle", "24"),
  zones: safeParseJSON("clock.zones", DEFAULT_TIMEZONES),
};

(() => {
  const localTz = detectLocalTimeZone();
  state.zones = ensureZonePresent(state.zones, localTz, "Local");
  saveState();
})();

function formatNow(tz) {
  const now = new Date();
  const hour12 = state.hourCycle === "12";

  const timeFmt = new Intl.DateTimeFormat(state.locale, {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12,
  });

  const dateFmt = new Intl.DateTimeFormat(state.locale, {
    timeZone: tz,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return { time: timeFmt.format(now), date: dateFmt.format(now) };
}

function render() {
  els.format.value = state.hourCycle;
  els.locale.value = state.locale;

  els.clocks.innerHTML = "";

  state.zones.forEach((z, idx) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.tz = z.tz;

    const top = document.createElement("div");
    top.className = "top";

    const left = document.createElement("div");

    const city = document.createElement("div");
    city.className = "city";
    city.textContent = z.label || z.tz;

    const tzEl = document.createElement("div");
    tzEl.className = "tz";
    tzEl.textContent = z.tz;

    left.appendChild(city);
    left.appendChild(tzEl);

    const rm = document.createElement("button");
    rm.className = "remove";
    rm.type = "button";
    rm.textContent = "Remove";
    rm.addEventListener("click", () => {
      state.zones.splice(idx, 1);
      saveState();
      render();
    });

    top.appendChild(left);
    top.appendChild(rm);

    const time = document.createElement("div");
    time.className = "time";
    time.textContent = "--:--:--";

    const date = document.createElement("div");
    date.className = "date";

    card.appendChild(top);
    card.appendChild(time);
    card.appendChild(date);
    els.clocks.appendChild(card);
  });

  tick();
}

function tick() {
  els.clocks.querySelectorAll(".card").forEach((card) => {
    const tz = card.dataset.tz;
    const { time, date } = formatNow(tz);
    card.querySelector(".time").textContent = time;
    card.querySelector(".date").textContent = date;
  });
}

function addZoneFromInput() {
  const tz = (els.addTz.value || "").trim();
  if (!tz) return;

  if (!isValidTimeZone(tz)) {
    alert("Невірна таймзона. Приклад: Europe/Kyiv, America/New_York, Asia/Tokyo");
    return;
  }

  state.zones = [...state.zones, { label: labelFromTimeZone(tz), tz }];
  els.addTz.value = "";
  saveState();
  render();
}

function resetToDefault() {
  const localTz = detectLocalTimeZone();
  let zones = [...DEFAULT_TIMEZONES.map(z => ({...z}))];
  zones = ensureZonePresent(zones, localTz, "Local");
  state.zones = zones;
  saveState();
  render();
}

els.format.addEventListener("change", (e) => {
  state.hourCycle = e.target.value;
  saveState();
  tick();
});

els.locale.addEventListener("change", (e) => {
  state.locale = e.target.value;
  saveState();
  tick();
});

els.addBtn.addEventListener("click", addZoneFromInput);

els.addTz.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addZoneFromInput();
});

els.resetBtn.addEventListener("click", resetToDefault);

render();
setInterval(tick, 1000);