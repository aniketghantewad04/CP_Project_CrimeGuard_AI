(function () {
  const form = document.getElementById("predict-form");
  if (!form) return;

  const endpoint = form.dataset.endpoint;
  const reportUrl = form.dataset.reportUrl;
  const btn = document.getElementById("analyze-btn");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const originalLabel = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "Analyzing…";

    try {
      const formData = new FormData(form);
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Prediction failed");
      const result = await res.json();

      result.timestamp = new Date().toISOString();
      cgSaveCase(result);

      window.location.href = `${reportUrl}?id=${result.id}`;
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalLabel;
      alert("Something went wrong while analyzing the case. Please try again.");
      console.error(err);
    }
  });
})();
