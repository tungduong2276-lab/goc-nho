/* Góc Nhỏ · Living Motion Layer
 * Runtime micro-animation for the existing pre-rendered 3D sprite scenes.
 * No Firebase access, no persistent state, and no scene/schema changes.
 */
(() => {
  "use strict";
  if (window.__GN_MOTION__) return;
  window.__GN_MOTION__ = { version: "1.0.0" };
  document.documentElement.dataset.gnMotion = "ready";

  const style = document.createElement("style");
  style.id = "gn-living-motion";
  style.textContent = `
    /* Ambient life: restrained, asynchronous motion instead of synchronized wobble. */
    .room3d .chr .cstack,
    .garden3d .chr .cstack {
      transform-origin: 50% 94%;
      animation: gnCharacterIdle 5.2s ease-in-out infinite;
      animation-delay: var(--gn-delay, 0s);
      will-change: transform;
    }
    .room3d .chr:nth-of-type(2) .cstack,
    .garden3d .chr:nth-of-type(2) .cstack { animation-duration: 5.8s; }
    .room3d .chr.pet img {
      transform-origin: 50% 92%;
      animation: gnPetIdle 4.6s ease-in-out infinite;
    }
    .world .m-ch {
      transform-origin: 50% 94%;
      animation: gnCharacterIdle 5.6s ease-in-out infinite;
    }
    .world .m-fl {
      transform-origin: 50% 90%;
      animation: gnFlowerIdle 6.4s ease-in-out infinite;
    }
    .garden3d .gfl.growing img { animation: gnFlowerIdle 5.7s ease-in-out infinite !important; animation-delay: var(--gn-delay, 0s); transform-origin: 50% 88%; }\n    .garden3d .gfl img {
      transform-origin: 50% 88%;
      animation: gnFlowerIdle 5.7s ease-in-out infinite;
      animation-delay: var(--gn-delay, 0s);
      will-change: transform;
    }
    .garden3d .gcare img {
      transform-origin: 50% 88%;
      animation: gnPlantIdle 6.3s ease-in-out infinite;
      animation-delay: var(--gn-delay, 0s);
      will-change: transform;
    }
    .garden3d .gcare.wilt img { animation-duration: 8s; }

    /* Touch response: compress first, then spring back. */
    .gn-motion-active.lay.hot img {
      animation: gnObjectPress .62s cubic-bezier(.2,.85,.25,1.25) both;
      transform-origin: 50% 88%;
    }
    .gn-motion-active.chr .cstack,
    .gn-motion-active.chr > img {
      animation: gnCharacterReact .72s cubic-bezier(.2,.9,.25,1.3) both;
      transform-origin: 50% 94%;
    }
    .gn-motion-water img { animation: gnWaterCan .82s ease-in-out both !important; }
    .gn-motion-flower img { animation: gnFlowerReact .82s cubic-bezier(.2,.8,.2,1.2) both !important; }
    .gn-motion-hug .cstack { animation: gnHugReact .9s cubic-bezier(.2,.9,.25,1.25) both !important; }
    .gn-motion-swing img { animation: gnSwingReact .85s ease-in-out both !important; }
    .gn-motion-pet img { animation: gnPetReact .9s cubic-bezier(.2,.9,.25,1.25) both !important; }
    .gn-motion-toggle img { animation: gnToggleReact .55s ease-out both !important; }

    .gn-burst {
      position: absolute; z-index: 5000; width: 1px; height: 1px;
      pointer-events: none; overflow: visible;
    }
    .gn-burst i {
      position: absolute; left: 0; top: 0; display: block;
      font-style: normal; font-size: 22px; line-height: 1;
      opacity: 0; text-shadow: 0 2px 5px rgba(29,43,79,.18);
      animation: gnParticle .92s cubic-bezier(.15,.65,.3,1) forwards;
      animation-delay: var(--gn-particle-delay, 0s);
      transform: translate(-50%,-50%) scale(.45);
      will-change: transform, opacity;
    }

    @keyframes gnCharacterIdle {
      0%,100% { transform: translateY(0) scale(1,1); }
      34% { transform: translateY(-1.5px) scale(1.008,1.012); }
      68% { transform: translateY(.3px) scale(.997,.995); }
    }
    @keyframes gnPetIdle {
      0%,100% { transform: translateY(0) rotate(0); }
      42% { transform: translateY(-2px) rotate(-1.2deg); }
      72% { transform: translateY(0) rotate(.7deg); }
    }
    @keyframes gnFlowerIdle {
      0%,100% { transform: rotate(-.7deg) translateY(0); }
      28% { transform: rotate(.8deg) translateY(-.8px); }
      58% { transform: rotate(1.35deg) translateY(0); }
      82% { transform: rotate(-.25deg) translateY(.4px); }
    }
    @keyframes gnPlantIdle {
      0%,100% { transform: rotate(-.8deg) translateY(0) scale(1); }
      30% { transform: rotate(.75deg) translateY(-1px) scale(1.004); }
      62% { transform: rotate(1.25deg) translateY(0) scale(1); }
      84% { transform: rotate(-.2deg) translateY(.5px) scale(.998); }
    }
    @keyframes gnObjectPress {
      0% { transform: scale(1); }
      24% { transform: scale(.94,.91) translateY(2px); }
      58% { transform: scale(1.035,1.045) translateY(-1px); }
      78% { transform: scale(.99,1.01); }
      100% { transform: scale(1); }
    }
    @keyframes gnCharacterReact {
      0% { transform: translateY(0) scale(1); }
      28% { transform: translateY(-7px) scale(.98,1.04); }
      62% { transform: translateY(1px) scale(1.035,.97); }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes gnWaterCan {
      0%,100% { transform: rotate(0) translateY(0); }
      22% { transform: rotate(-13deg) translateY(-3px); }
      52% { transform: rotate(8deg) translateY(1px); }
      76% { transform: rotate(-3deg); }
    }
    @keyframes gnFlowerReact {
      0% { transform: scale(1) rotate(0); }
      26% { transform: scale(.9,1.06) rotate(-4deg); }
      58% { transform: scale(1.09,.96) rotate(3deg); }
      82% { transform: scale(.99,1.02) rotate(-1deg); }
      100% { transform: scale(1) rotate(0); }
    }
    @keyframes gnHugReact {
      0%,100% { transform: translateY(0) scale(1); }
      24% { transform: translateY(-8px) scale(.96,1.06); }
      48% { transform: translateY(-2px) scale(1.07,.96); }
      72% { transform: translateY(-3px) scale(1.015); }
    }
    @keyframes gnSwingReact {
      0%,100% { transform: rotate(0); }
      30% { transform: rotate(-2.5deg) translateY(-2px); }
      68% { transform: rotate(1.8deg) translateY(1px); }
    }
    @keyframes gnPetReact {
      0%,100% { transform: translateY(0) rotate(0) scale(1); }
      24% { transform: translateY(-8px) rotate(-5deg) scale(1.04); }
      52% { transform: translateY(1px) rotate(4deg) scale(.98); }
      78% { transform: translateY(-2px) rotate(-1deg); }
    }
    @keyframes gnToggleReact {
      0%,100% { transform: scale(1) rotate(0); }
      35% { transform: scale(.94) rotate(-2deg); }
      72% { transform: scale(1.04) rotate(1deg); }
    }
    @keyframes gnParticle {
      0% { opacity: 0; transform: translate(-50%,-50%) scale(.35) rotate(-12deg); }
      18% { opacity: 1; }
      100% { opacity: 0; transform: translate(calc(-50% + var(--gn-dx)),calc(-50% + var(--gn-dy))) scale(1.15) rotate(18deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .room3d .chr .cstack,.garden3d .chr .cstack,.room3d .chr.pet img,
      .world .m-ch,.world .m-fl,.garden3d .gfl img,.garden3d .gcare img,
      .gn-motion-active.lay.hot img,.gn-motion-active.chr .cstack,
      .gn-motion-active.chr > img,.gn-motion-water img,.gn-motion-flower img,
      .gn-motion-hug .cstack,.gn-motion-swing img,.gn-motion-pet img,
      .gn-motion-toggle img,.gn-burst i { animation: none !important; }
      .gn-burst { display: none !important; }
    }
  `;
  document.head.appendChild(style);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const particlesFor = el => {
    if (el.matches(".chr.pet")) return ["♥","✦","♥"];
    if (el.matches(".chr[data-gchar],.chr[data-rhug],.chr[data-rme]")) return ["♥","♡","✦","♥"];
    if (el.matches('[data-gi="cay"],[data-gi="binhtuoi"]')) return ["💧","💧","✦","🌱"];
    if (el.matches(".gfl,.gplant")) return ["✿","✦","♡","✿"];
    if (el.matches('[data-gi="ghe"]')) return ["♥","✦","♡"];
    if (el.matches('[data-gi="bang"],[data-gi="hopgiong"]')) return ["✦","✿","✧"];
    return ["✦","♡","✧"];
  };
  function burst(el, x, y) {
    if (reduced()) return;
    const canvas = el.closest(".wcanvas") || el.closest(".room3d") || el.closest(".world");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = canvas.offsetWidth || rect.width, h = canvas.offsetHeight || rect.height;
    if (!rect.width || !rect.height) return;
    const host = canvas.classList.contains("wcanvas") ? canvas : canvas;
    const fx = document.createElement("span");
    fx.className = "gn-burst";
    fx.setAttribute("aria-hidden", "true");
    fx.style.left = ((x - rect.left) * w / rect.width) + "px";
    fx.style.top = ((y - rect.top) * h / rect.height) + "px";
    const glyphs = particlesFor(el);
    glyphs.forEach((glyph, index) => {
      const p = document.createElement("i");
      const angle = (-Math.PI * .9) + (Math.PI * 1.8 * index / Math.max(1, glyphs.length - 1));
      const distance = 28 + (index % 2) * 14;
      p.textContent = glyph;
      p.style.setProperty("--gn-dx", (Math.cos(angle) * distance) + "px");
      p.style.setProperty("--gn-dy", (Math.sin(angle) * distance - 18) + "px");
      p.style.setProperty("--gn-particle-delay", (index * .035) + "s");
      fx.appendChild(p);
    });
    host.appendChild(fx);
    window.setTimeout(() => fx.remove(), 1250);
  }
  function activate(target, x, y) {
    if (!target || reduced()) return;
    target.classList.remove("gn-motion-active","gn-motion-water","gn-motion-flower","gn-motion-hug","gn-motion-swing","gn-motion-pet","gn-motion-toggle");
    void target.offsetWidth;
    target.classList.add("gn-motion-active");
    if (target.matches('[data-gi="cay"],[data-gi="binhtuoi"]')) target.classList.add("gn-motion-water");
    else if (target.matches(".gfl,.gplant")) target.classList.add("gn-motion-flower");
    else if (target.matches(".chr.pet")) target.classList.add("gn-motion-pet");
    else if (target.matches(".chr[data-gchar],.chr[data-rhug],.chr[data-rme]")) target.classList.add("gn-motion-hug");
    else if (target.matches('[data-gi="ghe"]')) target.classList.add("gn-motion-swing");
    else if (target.matches("[data-ri]")) target.classList.add("gn-motion-toggle");
    burst(target, x, y);
    window.setTimeout(() => target.classList.remove("gn-motion-active","gn-motion-water","gn-motion-flower","gn-motion-hug","gn-motion-swing","gn-motion-pet","gn-motion-toggle"), 1100);
  }
  function findTarget(node) {
    if (!(node instanceof Element)) return null;
    return node.closest(".garden3d .lay.hot,.garden3d .chr,.room3d .lay.hot,.room3d .chr.pet,.room3d .chr[data-rme],.room3d .chr[data-rhug]");
  }
  document.addEventListener("pointerdown", event => {
    if (event.button !== undefined && event.button !== 0) return;
    const target = findTarget(event.target);
    if (target) activate(target, event.clientX, event.clientY);
  }, { capture: true, passive: true });
  document.addEventListener("keydown", event => {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    const target = findTarget(event.target);
    if (!target) return;
    const r = target.getBoundingClientRect();
    activate(target, r.left + r.width / 2, r.top + r.height / 2);
  }, true);

  // Desynchronise plants and character breathing after every rerender.
  const seedDelays = root => {
    root.querySelectorAll(".garden3d .gfl,.garden3d .gcare,.garden3d .chr .cstack").forEach((el, i) => {
      if (!el.style.getPropertyValue("--gn-delay")) el.style.setProperty("--gn-delay", (-((i * 0.73) % 5.2)).toFixed(2) + "s");
    });
  };
  seedDelays(document);
  const observer = new MutationObserver(records => {
    if (records.some(record => record.addedNodes && record.addedNodes.length)) seedDelays(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
