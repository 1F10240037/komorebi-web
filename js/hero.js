// js/hero.js (Infinite Carousel)
window.addEventListener('DOMContentLoaded', () => {
  // --- ヘッダー高さをCSS変数へ反映 ---
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

  // --- 無限スライドショー ---
  const hero = document.getElementById('hero');
  const track = document.getElementById('slides');
  let slides = Array.from(track.querySelectorAll('.slide'));
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const dots = document.getElementById('dots');

  if (!track || slides.length === 0) return;

  const AUTO_MS = 5000;
  let index = 1; // クローン分ずらすので1から開始
  let isTransitioning = false;
  let timerId = null;

  // クローン作成
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);

  firstClone.classList.add('is-clone');
  lastClone.classList.add('is-clone');

  track.appendChild(firstClone);
  track.insertBefore(lastClone, slides[0]);

  // スライドリスト更新（クローン込み）
  const allSlides = Array.from(track.querySelectorAll('.slide'));
  const originalCount = slides.length;

  // ドット生成
  dots.innerHTML = slides
    .map((_, i) => `<button class="dot" aria-label="Slide ${i + 1}" aria-selected="${i === 0}"></button>`)
    .join('');
  const dotEls = dots.querySelectorAll('.dot');

  function updateDots() {
    // index 1..originalCount を 0..originalCount-1 にマッピング
    let dotIndex = index - 1;
    if (index === 0) dotIndex = originalCount - 1;
    if (index === originalCount + 1) dotIndex = 0;

    dotEls.forEach((d, i) => d.setAttribute('aria-selected', i === dotIndex));
  }

  function move(withAnimation = true) {
    if (withAnimation) {
      track.style.transition = 'transform 0.6s ease';
    } else {
      track.style.transition = 'none';
    }
    track.style.transform = `translateX(${-100 * index}%)`;
    updateDots();
  }

  function jumpCheck() {
    isTransitioning = false;
    // 最後のクローン（中身は最初のスライド）に達したら、本物の最初のスライドへジャンプ
    if (index === allSlides.length - 1) {
      index = 1;
      move(false);
    }
    // 最初のクローン（中身は最後のスライド）に達したら、本物の最後のスライドへジャンプ
    if (index === 0) {
      index = allSlides.length - 2;
      move(false);
    }
  }

  track.addEventListener('transitionend', jumpCheck);

  function handleNext() {
    if (isTransitioning) return;
    isTransitioning = true;
    index++;
    move();
    resetTimer();
  }

  function handlePrev() {
    if (isTransitioning) return;
    isTransitioning = true;
    index--;
    move();
    resetTimer();
  }

  next.addEventListener('click', handleNext);
  prev.addEventListener('click', handlePrev);

  dotEls.forEach((d, i) =>
    d.addEventListener('click', () => {
      if (isTransitioning) return;
      isTransitioning = true;
      index = i + 1;
      move();
      resetTimer();
    })
  );

  function startTimer() {
    timerId = setInterval(handleNext, AUTO_MS);
  }

  function resetTimer() {
    clearInterval(timerId);
    startTimer();
  }

  // 初期位置設定
  move(false);
  startTimer();

  // フェードイン演出
  requestAnimationFrame(() => {
    hero.classList.add('is-ready');
  });
});
