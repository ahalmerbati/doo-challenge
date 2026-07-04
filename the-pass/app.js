// Tracks any manual staff overrides: { [req.id]: "auto" | "escalate" | "assign" }
let overrides = {};

const BUCKET_LABELS = {
  auto: "Auto-resolve",
  escalate: "Escalate",
  assign: "Assign",
};

// What the "owner" becomes when a human forces a different bucket than the AI picked
const OVERRIDE_OWNER = {
  auto: "AI system (forced by staff)",
  escalate: "Manager (forced by staff)",
  assign: "Staff on floor (forced by staff)",
};

function setOverride(id, bucket) {
  overrides[id] = bucket;
  runTriage();
}

function clearOverride(id) {
  delete overrides[id];
  runTriage();
}

function renderTicket(rank, req, ev) {
  const bucketLabel = BUCKET_LABELS[ev.bucket];

  const overrideButtons = ["auto", "assign", "escalate"]
    .map((b) => {
      const isActive = ev.bucket === b;
      return `<button class="override-btn ${isActive ? "active " + b : ""}" onclick="setOverride('${req.id}','${b}')">${BUCKET_LABELS[b]}</button>`;
    })
    .join("");

  const resetLink = ev.overridden
    ? `<button class="override-reset" onclick="clearOverride('${req.id}')">↺ Reset to AI (${BUCKET_LABELS[ev.aiBucket]})</button>`
    : "";

  return `
  <div class="ticket ${ev.bucket}">
    <div class="ticket-head">
      <div class="rank">${rank}</div>
      <div class="head-main">
        <div class="req-title">${req.title}</div>
        <div class="req-meta">${req.who} — "${req.text}"</div>
      </div>
      <div class="badges">
        <span class="badge ${ev.bucket}">${bucketLabel}</span>
        ${ev.overridden ? `<span class="badge overridden">Staff override</span>` : ""}
      </div>
    </div>
    <div class="override-row">
      <span class="override-label">Staff override:</span>
      ${overrideButtons}
      ${resetLink}
    </div>
    <div class="ticket-body">
      <div>
        <div class="field-label">AI confidence</div>
        <div class="field-value">${ev.confidence}%</div>
        <div class="confidence-bar"><div class="confidence-fill" style="width:${ev.confidence}%"></div></div>
      </div>
      <div>
        <div class="field-label">Owner</div>
        <div class="field-value">${ev.owner}</div>
      </div>
      <div style="grid-column:1/-1;">
        <div class="field-label">Recommended action</div>
        <div class="field-value">${ev.action}</div>
      </div>
      <div class="response-block">${ev.response}</div>
      <div class="reason-block">
        <div class="field-label">Why this decision</div>
        <ul>${ev.reasons.map((r) => `<li>${r}</li>`).join("")}</ul>
      </div>
    </div>
  </div>`;
}

function runTriage() {
  const threshold = Number(document.getElementById("threshold").value) || 0;
  const refundAmt = Number(document.getElementById("refundAmt").value) || 0;

  const evaluated = REQUESTS.map((req) => {
    const aiEval = evaluate(req, threshold, refundAmt);
    const score = priorityScore(req, aiEval);

    const overrideBucket = overrides[req.id];
    let ev = aiEval;

    if (overrideBucket && overrideBucket !== aiEval.bucket) {
      ev = {
        ...aiEval,
        bucket: overrideBucket,
        owner: OVERRIDE_OWNER[overrideBucket],
        overridden: true,
        aiBucket: aiEval.bucket,
      };
    }

    return { req, ev, score };
  });

  evaluated.sort((a, b) => b.score - a.score);

  document.getElementById("tickets").innerHTML = evaluated
    .map((e, i) => renderTicket(i + 1, e.req, e.ev))
    .join("");

  const autoCount = evaluated.filter((e) => e.ev.bucket === "auto").length;
  document.getElementById("autoCount").textContent = autoCount;

  const overThreshold = refundAmt > threshold;
  document.getElementById("refundDecision").textContent = overThreshold
    ? `ESCALATE to manager (over by $${refundAmt - threshold})`
    : `AUTO-REFUND (within limit)`;
  document.getElementById("refundDecision").style.color = overThreshold
    ? "#e9836b"
    : "#8fd19e";
  document.getElementById("thresholdFlag").textContent = overThreshold
    ? `$${refundAmt - threshold} over the limit`
    : `$${threshold - refundAmt} under the limit`;
}

runTriage();
