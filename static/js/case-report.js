(function () {
  const root = document.getElementById("report-root");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const c = id ? cgFindCase(id) : null;

  if (!c) {
    root.innerHTML = `
      <div class="card stack-center" style="padding:60px 20px;">
        <p class="text-muted">No case found. It may have been deleted, or you followed a stale link.</p>
        <a href="/" class="btn btn-primary mt-4">Analyze a New Case</a>
      </div>`;
    return;
  }

  const RING_COLORS = { low: "#10b981", mod: "#f59e0b", high: "#f59e0b", crit: "#ef4444" };
  const riskClass = { low: "risk-low", mod: "risk-mod", high: "risk-high", crit: "risk-crit" }[c.risk_key] || "";
  const riskDesc = {
    low: "Signals strongly favour resolution. Maintain standard procedure and preserve evidence chain.",
    mod: "Moderate confidence. Standard follow-up should be sufficient, keep evidence chain intact.",
    high: "Elevated risk of an unresolved case. Prioritise the recommended actions below.",
    crit: "Critical risk of an unresolved case. Deploy the full action plan immediately — evidence quality and suspect visibility are low.",
  }[c.risk_key] || "";

  // ---- Hero card ----
  const heroCard = document.getElementById("hero-card");
  heroCard.setAttribute("data-risk", c.risk_key || "low");

  document.getElementById("case-id").textContent = c.id;
  document.getElementById("verdict-title").textContent = c.verdict;

  const riskBadge = document.getElementById("risk-badge");
  riskBadge.className = `risk-pill mono ${riskClass}`;
  riskBadge.textContent = c.risk;

  document.getElementById("severity-val").textContent = Number(c.inputs.crime_severity_score).toFixed(1);
  document.getElementById("verdict-desc").textContent = riskDesc;

  // ---- Stat cards ----
  document.getElementById("officers-value").textContent = c.officers;
  document.getElementById("suspect-value").textContent = c.inputs.suspect_status;
  document.getElementById("weapon-value").textContent = c.inputs.weapon_used;
  document.getElementById("location-value").textContent = `${c.inputs.area_type}, ${c.inputs.country}`;

  // ---- Probability ring (animated) ----
  const ringColor = RING_COLORS[c.risk_key] || RING_COLORS.low;
  const ringFill = document.getElementById("prob-ring-fill");
  const ringWrap = document.querySelector(".prob-ring-wrap");
  ringWrap.style.setProperty("--ring-color", ringColor);
  const circumference = 2 * Math.PI * 60; // r=60
  const targetPct = Math.max(0, Math.min(100, Number(c.probability)));
  const valueEl = document.getElementById("prob-value");

  requestAnimationFrame(() => {
    ringFill.style.strokeDashoffset = String(circumference - (targetPct / 100) * circumference);
  });

  const animDuration = 1100;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / animDuration);
    const eased = 1 - Math.pow(1 - t, 3);
    valueEl.textContent = (targetPct * eased).toFixed(0);
    if (t < 1) requestAnimationFrame(tick);
    else valueEl.textContent = targetPct.toFixed(0);
  }
  requestAnimationFrame(tick);

  // ---- Signal Contribution (interactive horizontal bars) ----
  const chartEl = document.getElementById("contribution-chart");
  chartEl.classList.add("contrib-chart");
  const sorted = [...c.contributions].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const maxAbs = Math.max(...sorted.map((s) => Math.abs(s.value)), 0.0001);

  chartEl.innerHTML = sorted.map((s, i) => {
    const pct = Math.max(4, (Math.abs(s.value) / maxAbs) * 100);
    const isTop = i === 0;
    const barColor = isTop ? ringColor : "#3b82f6";
    const sign = s.value >= 0 ? "+" : "";
    return `
      <div class="contrib-row" style="--bar-color:${barColor}; --bar-glow:${barColor}55;">
        <span class="contrib-name">${s.label}</span>
        <div class="contrib-track">
          <div class="contrib-fill" data-target-width="${pct}"></div>
          <div class="contrib-tooltip">${sign}${s.value.toFixed(3)}</div>
        </div>
      </div>`;
  }).join("");

  // animate bars in, staggered
  requestAnimationFrame(() => {
    chartEl.querySelectorAll(".contrib-fill").forEach((el, i) => {
      setTimeout(() => { el.style.width = el.getAttribute("data-target-width") + "%"; }, i * 70);
    });
  });

  // ---- Action Plan ----
  const planEl = document.getElementById("action-plan");
  if (c.recommendations.length) {
    planEl.innerHTML = c.recommendations.map((r, i) => `
      <li class="action-item">
        <span class="action-num mono">${String(i + 1).padStart(2, "0")}</span>
        <span class="action-text is-urgent">${r}</span>
      </li>`).join("");
  } else {
    planEl.innerHTML = `<li class="text-muted" style="font-size:14px;">No special actions flagged — standard procedure applies.</li>`;
  }

  // ---- Session Trace Log (typewriter) ----
  const t = new Date(c.timestamp);
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");
  const stamp = `${hh}:${mm}:${ss}`;

  const lines = [
    `> [${stamp}] Case data received: ${c.inputs.crime_type.toLowerCase()} in ${c.inputs.area_type.toLowerCase()} ${c.inputs.country}`,
    `> [${stamp}] Features encoded (9 input variables)`,
    `> [${stamp}] Running Logistic Regression model...`,
    `> [${stamp}] Prediction complete. Resolution Probability= ${c.probability.toFixed(1)}% & risk= ${c.risk.replace(" Risk", "")}`,
    `> [${stamp}] Officer allocation: ${c.officers} · Recommendations Actions: ${c.recommendations.length}`,
  ];

  const logEl = document.getElementById("trace-log");
  let i = 0;
  function typeLine() {
    if (i >= lines.length) return;
    logEl.textContent += (i ? "\n" : "") + lines[i];
    i++;
    setTimeout(typeLine, 260);
  }
  typeLine();

  // ---- Print-only Case Ticket ----
  const TELEMETRY_FIELDS = [
    ["country", "Country"],
    ["area_type", "Area Type"],
    ["crime_type", "Crime Type"],
    ["crime_severity_score", "Crime Severity Score"],
    ["weapon_used", "Weapon Used"],
    ["cctv_coverage", "CCTV Coverage"],
    ["gang_related", "Gang Related"],
    ["suspect_status", "Suspect Status"],
    ["lighting_condition", "Lighting Condition"],
  ];

  const ticketRisk = document.getElementById("ticket-risk");
  ticketRisk.className = `ticket-risk ${riskClass}`;
  ticketRisk.textContent = c.risk;

  document.getElementById("ticket-case-id").textContent = c.id;
  document.getElementById("ticket-timestamp").textContent = new Date(c.timestamp).toLocaleString();
  document.getElementById("ticket-prob-value").textContent = Number(c.probability).toFixed(0);

  const isFavourable = c.risk_key === "low" || c.risk_key === "mod";
  document.getElementById("ticket-verdict").textContent = `${isFavourable ? "✅" : "⚠️"} ${c.verdict}`;
  document.getElementById("ticket-officers").textContent = c.officers;

  const tbody = document.getElementById("ticket-table-body");
  tbody.innerHTML = TELEMETRY_FIELDS.map(([key, label]) => {
    let val = c.inputs[key];
    if (key === "crime_severity_score") val = Number(val).toFixed(1);
    return `<tr><td class="ticket-label">${label}</td><td class="ticket-val">${val}</td></tr>`;
  }).join("");

  const ticketActions = document.getElementById("ticket-actions");
  ticketActions.innerHTML = c.recommendations.length
    ? c.recommendations.map((r, idx) => `
        <li><span class="ticket-action-num">${String(idx + 1).padStart(2, "0")}</span><span>${r}</span></li>`).join("")
    : `<li style="color:#6b7280;">No special actions flagged — standard procedure applies.</li>`;
})();
