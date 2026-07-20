(function () {
  const listEl = document.getElementById("history-list");
  const emptyEl = document.getElementById("history-empty");
  if (!listEl) return;

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "numeric", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  function render() {
    const cases = cgGetHistory();
    listEl.innerHTML = "";

    if (!cases.length) {
      emptyEl.style.display = "block";
      listEl.style.display = "none";
      return;
    }
    emptyEl.style.display = "none";
    listEl.style.display = "flex";

    cases.forEach((c) => {
      const li = document.createElement("li");
      li.className = "card";
      li.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; padding:16px 20px;";

      li.innerHTML = `
        <div style="display:flex; align-items:center; gap:14px; min-width:0;">
          <span style="font-size:20px;">${cgRiskEmoji(c.risk_key)}</span>
          <div style="min-width:0;">
            <div class="mono" style="font-size:13px; font-weight:600;">
              Case #${c.id} <span class="text-muted" style="font-weight:400;">&middot; ${c.inputs.crime_type}</span>
            </div>
            <div class="text-muted mono" style="font-size:11px; margin-top:3px;">
              ${c.inputs.area_type} &middot; ${c.inputs.country} &middot; sev ${Number(c.inputs.crime_severity_score).toFixed(1)}
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:18px;">
          <span class="text-muted mono" style="font-size:11px; white-space:nowrap;">${fmtDate(c.timestamp)}</span>
          <a href="/case-report?id=${c.id}" class="btn btn-ghost btn-sm">View</a>
          <button class="btn btn-ghost btn-sm" data-del="${c.id}" style="color:var(--siren);">Delete</button>
        </div>
      `;
      listEl.appendChild(li);
    });

    listEl.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        cgDeleteCase(btn.dataset.del);
        render();
      });
    });
  }

  render();
})();
