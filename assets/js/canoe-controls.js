/* Direct manipulation for the canoe preview; page scrolling stays available on touch. */
(function () {
  "use strict";
  window.enableCanoeRotation = function (canvas, rotate) {
    var pointer = null;
    var lastX = 0;
    var lastY = 0;
    var yaw = 0;
    var tilt = 0;
    var view = "perspective";
    var buttons = document.querySelectorAll("[data-canoe-view]");
    function update() {
      buttons.forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.canoeView === view)); });
      rotate(yaw, tilt, view);
    }
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        view = button.dataset.canoeView; yaw = 0; tilt = 0; update();
      });
    });
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Interactive canoe preview. Drag to rotate, or use the arrow keys. Press Home to reset.");
    canvas.addEventListener("pointerdown", function (event) {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(pointer);
      canvas.classList.add("is-grabbing");
    });
    canvas.addEventListener("pointermove", function (event) {
      if (event.pointerId !== pointer) return;
      view = "perspective";
      yaw += (event.clientX - lastX) * 0.008;
      // Vertical touch gestures remain native page scrolling.
      if (event.pointerType !== "touch") {
        tilt = Math.max(-0.65, Math.min(0.65, tilt + (event.clientY - lastY) * 0.005));
      }
      lastX = event.clientX;
      lastY = event.clientY;
      update();
    });
    function release(event) {
      if (event.pointerId !== pointer) return;
      pointer = null;
      canvas.classList.remove("is-grabbing");
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    }
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("lostpointercapture", release);
    canvas.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") yaw -= 0.15;
      else if (event.key === "ArrowRight") yaw += 0.15;
      else if (event.key === "ArrowUp") tilt = Math.max(-0.65, tilt - 0.1);
      else if (event.key === "ArrowDown") tilt = Math.min(0.65, tilt + 0.1);
      else if (event.key === "Home") { yaw = 0; tilt = 0; }
      else return;
      event.preventDefault();
      update();
    });
    canvas.addEventListener("dragstart", function (event) { event.preventDefault(); });
  };
})();
