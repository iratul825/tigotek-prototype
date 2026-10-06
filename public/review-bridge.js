// Same-origin review bridge. Attach data-feedback="stable-element-id" to reviewable elements.
(() => {
  let comment = false,
    pins = [];
  const allowedOrigin = location.origin;
  function draw() {
    document
      .querySelectorAll(".pin[data-review-pin]")
      .forEach((n) => n.remove());
    for (const [index, pin] of pins.entries()) {
      const target = document.querySelector(
        '[data-feedback="' + CSS.escape(pin.target) + '"]',
      );
      if (!target) continue;
      const r = target.getBoundingClientRect();
      const b = document.createElement("button");
      b.className = "pin" + (pin.status === "Resolved" ? " resolved" : "");
      b.dataset.reviewPin = "true";
      b.textContent = String(index + 1);
      b.title = pin.text;
      b.setAttribute(
        "aria-label",
        "Open feedback " + (index + 1) + ": " + pin.text,
      );
      b.style.left = r.left + scrollX + (r.width * pin.x) / 100 + "px";
      b.style.top = r.top + scrollY + (r.height * pin.y) / 100 + "px";
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        parent.postMessage(
          { source: "fabri-preview", type: "open-pin", id: pin.id },
          allowedOrigin,
        );
      });
      document.body.appendChild(b);
    }
  }
  addEventListener("message", (e) => {
    if (
      e.origin !== allowedOrigin ||
      e.source !== parent ||
      e.data?.source !== "tigotek-portal" ||
      e.data.type !== "review-state"
    )
      return;
    comment = !!e.data.comment;
    pins = Array.isArray(e.data.pins) ? e.data.pins : [];
    document.body.classList.toggle("review-mode", comment);
    draw();
  });
  document.addEventListener(
    "click",
    (e) => {
      if (!comment || e.target.closest("[data-review-pin]")) return;
      const target = e.target.closest("[data-feedback]");
      if (!target) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const r = target.getBoundingClientRect();
      parent.postMessage(
        {
          source: "fabri-preview",
          type: "pin",
          target: target.dataset.feedback,
          x: ((e.clientX - r.left) / r.width) * 100,
          y: ((e.clientY - r.top) / r.height) * 100,
        },
        allowedOrigin,
      );
    },
    true,
  );
  new ResizeObserver(draw).observe(document.body);
  addEventListener("resize", draw);
})();
