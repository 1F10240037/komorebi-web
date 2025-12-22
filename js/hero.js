// js/hero.js (with fade-in effect)
window.addEventListener('DOMContentLoaded', () => {
  // --- ヘッダー高さをCSS変数へ反映（余白補正）---
  (function fixHeaderGap() {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    if (!header || !main) return;
    const apply = () => {
      const h = Math.round(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--header-h', `${h}px`);
    };
    apply();
    window.addEventListener('resize', apply);
  })();

  // --- スライドショー ---
  const hero = document.getElementById('hero');   // ← 追加
  const track = document.getElementById('slides');
  const slides = Array.from(track.querySelectorAll('.slide'));
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const dots = document.getElementById('dots');

  let index = 0;
  const AUTO_MS = 5000;

  dots.innerHTML = slides
    .map((_, i) => `<button class="dot" aria-selected="${i === 0}"></button>`)
    .join('');
  const dotEls = dots.querySelectorAll('.dot');

  function update() {
    track.style.transform = `translateX(${-100 * index}%)`;
    dotEls.forEach((d, i) => d.setAttribute('aria-selected', i === index));
  }

  prev.addEventListener('click', () => {
    index = (index - 1 + slides.length) % slides.length;
    update();
  });
  next.addEventListener('click', () => {
    index = (index + 1) % slides.length;
    update();
  });
  dotEls.forEach((d, i) =>
    d.addEventListener('click', () => {
      index = i;
      update();
    })
  );

  setInterval(() => {
    index = (index + 1) % slides.length;
    update();
  }, AUTO_MS);

  update();

  // --- ここが「ふわっと」登場するための追加部分 ---
  requestAnimationFrame(() => {
    hero.classList.add('is-ready');
  });
});