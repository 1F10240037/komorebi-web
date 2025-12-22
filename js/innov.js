// ================= Komorebi Innov Layer — Polaroid only (fail-safe) =================
(() => {
  /* ---------- 小さなユーティリティ ---------- */
  const once = (fn) => { let done=false; return (...a)=>{ if(done) return; done=true; try{ fn(...a);}catch(_){} }; };

  /* ---------- 背景スクロール進捗 ---------- */
  const setSkyProgress = () => {
    const scrolled = window.scrollY;
    const max = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const p = Math.min(Math.max(scrolled / max, 0), 1);
    document.documentElement.style.setProperty('--sky-progress', String(p));
    document.body.classList.toggle('scrolled', scrolled > 8);
  };
  setSkyProgress();
  window.addEventListener('scroll', setSkyProgress, { passive: true });
  window.addEventListener('resize', setSkyProgress);

  /* ---------- 夜モード + 星空（不要なら丸ごと削除OK） ---------- */
  const applyNightTheme = () => {
    const h = new Date().getHours();
    const isNight = (h >= 18 || h < 6);
    document.body.setAttribute('data-theme', isNight ? 'night' : 'day');
    ensureStars(isNight);
  };
  applyNightTheme();
  setInterval(applyNightTheme, 30 * 60 * 1000);

  function ensureStars(isNight) {
    let el = document.getElementById('night-stars');
    if (!isNight) { if (el) el.remove(); return; }
    if (el) return;
    const svgNS = 'http://www.w3.org/2000/svg';
    el = document.createElementNS(svgNS, 'svg');
    el.setAttribute('id', 'night-stars');
    el.setAttribute('width', '100%'); el.setAttribute('height', '100%');
    el.setAttribute('viewBox', '0 0 100 100'); el.setAttribute('preserveAspectRatio', 'none');
    const R = () => Math.random();
    for (let i = 0; i < 48; i++) {
      const c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', (R()*100).toFixed(2));
      c.setAttribute('cy', (R()*100).toFixed(2));
      c.setAttribute('r', (R()*0.35 + 0.15).toFixed(2));
      c.setAttribute('fill', i%7===0 ? '#f6ebaf' : '#e8f5ef');
      c.setAttribute('opacity', (R()*0.6 + 0.4).toFixed(2));
      el.appendChild(c);
    }
    document.body.appendChild(el);
  }

  /* ---------- 出現アニメ ---------- */
  const toReveal = Array.from(document.querySelectorAll('main section'))
    .filter(el => !el.closest('header, footer'));
  toReveal.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  toReveal.forEach(el => io.observe(el));

  /* ---------- ハンバーガー ---------- */
  const menuBtn = document.querySelector('.menu-toggle');
  const navbar = document.querySelector('.navbar');
  if (menuBtn && navbar) {
    const closeMenu = () => { navbar.classList.remove('active'); menuBtn.setAttribute('aria-expanded', 'false'); };
    const openMenu  = () => { navbar.classList.add('active');    menuBtn.setAttribute('aria-expanded', 'true');  };
    menuBtn.addEventListener('click', (e) => { (navbar.classList.contains('active') ? closeMenu : openMenu)(); e.stopPropagation(); });
    document.addEventListener('click', (e) => { if (navbar.classList.contains('active') && !navbar.contains(e.target) && e.target !== menuBtn) closeMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    navbar.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeMenu(); });
  }

  /* ===================== 活動報告：チェキ（記事ごとに1枚） ===================== */
  const list = document.getElementById('latest-reports');
  if (!list) return;

  // 1) CSSが display:none !important でも確実に表示させる最終オーバーライド
  (function injectChekiFixStyle(){
    const style = document.createElement('style');
    style.textContent = `
      #latest-reports{display:grid !important}
      #latest-reports .cheki__img{opacity:1 !important;visibility:visible !important;filter:none !important;mix-blend-mode:normal !important}
    `;
    document.head.appendChild(style);
  })();

  // 2) 画像フォールバックとユーティリティ
  const PLACEHOLDER_1 = 'img/cheki-placeholder.jpg';
  const PLACEHOLDER_2 = 'img/hero1.jpg';
  const FALLBACK_DATAURI =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" font-size="26" text-anchor="middle" fill="#667" dy=".3em">No Image</text></svg>');

  const randDeg  = (min=-4, max=4) => (Math.random()*(max-min)+min).toFixed(2);
  const randTilt = () => (Math.random()<0.5 ? 'l' : 'r');

  function buildImageCandidates(a){
    const arr = (v)=> (Array.isArray(v)? v : [v]).filter(Boolean).map(s=>String(s).trim());

    // 明示キー最優先
    const explicit = arr(a?.thumbnail)
      .concat(arr(a?.image), arr(a?.img), arr(a?.cover), arr(a?.picture), arr(a?.photo), arr(a?.src));

    // report_list/<ID> を URL/ID から推測
    const url = String(a?.url || a?.link || '').trim();
    const id  = String(a?.id  || a?.slug || '').trim();
    let folder = '';
    const m1 = url.match(/(report_list\/[^\/?#]+)/);
    const m2 = id.match(/^([0-9A-Za-z\-_]+)$/);
    if (m1) folder = m1[1];
    else if (m2) folder = `report_list/${m2[1]}`;

    // 代表名推測 + 任意指定（photo/filename/coverName）
    const overrides = arr(a?.photo || a?.filename || a?.coverName);
    const defaultNames = ['1','main','cover','0','first','monzen'];
    const names = [...overrides, ...defaultNames];
    const exts  = ['jpg','jpeg','png','webp'];

    const guessed = [];
    if (folder){
      names.forEach(n => exts.forEach(ext => guessed.push(`${folder}/${n}.${ext}`)));
    }

    // 明示がファイル名だけならフォルダと合成
    const explicitWithFolder = [];
    if (folder){
      explicit.forEach(p=>{
        if (!/^(https?:|data:|blob:|\/)/i.test(p) && !p.includes('/')) explicitWithFolder.push(`${folder}/${p}`);
      });
    }

    const normalizedExplicit = explicit.map(p => p.replace(/^\.\//,''));
    const candidates = [
      ...explicitWithFolder,
      ...normalizedExplicit,
      ...guessed,
      PLACEHOLDER_1,
      PLACEHOLDER_2,
      FALLBACK_DATAURI
    ];
    return Array.from(new Set(candidates));
  }

  function setImgWithFallback(imgEl, candidates){
    let i = 0;
    const tryNext = ()=> { imgEl.src = candidates[i++]; };
    imgEl.onerror = ()=> { if (i < candidates.length) tryNext(); };
    tryNext();
  }

  function render(items){
    list.innerHTML = '';
    (items || []).forEach(a=>{
      const li = document.createElement('li');
      li.className = 'cheki';
      const deg = randDeg();
      li.style.setProperty('--rot', `${deg}deg`);
      li.dataset.rot = deg;
      li.dataset.tilt = randTilt();

      const title = (a?.title || '（無題）').trim();
      const url   = (a?.url   || '#').trim();
      const date  = (a?.date  || '').trim();
      const alt   = (a?.alt || title || '活動写真');

      li.innerHTML = `
        <figure class="cheki__window">
          <img class="cheki__img" alt="${alt}" loading="lazy">
        </figure>
        <div class="cheki__caption">
          <a class="cheki__title" href="${url}">${title}</a>
          <span class="cheki__meta">${date}</span>
        </div>
      `;
      const img = li.querySelector('.cheki__img');
      setImgWithFallback(img, buildImageCandidates(a));

      requestAnimationFrame(()=>{ // 念のため可視化
        img.style.opacity='1'; img.style.visibility='visible';
        img.style.filter='none'; img.style.mixBlendMode='normal'; img.decoding='async';
      });

      list.appendChild(li);
    });

    if (!list.children.length){
      // ダミー1枚（必ず何か表示）
      const li = document.createElement('li');
      li.className = 'cheki';
      li.style.setProperty('--rot','1.2deg'); li.dataset.tilt='l';
      li.innerHTML = `
        <figure class="cheki__window">
          <img class="cheki__img" src="${PLACEHOLDER_2}" alt="活動写真" loading="lazy">
        </figure>
        <div class="cheki__caption">
          <span class="cheki__title" role="text">活動記録を準備中です</span>
          <span class="cheki__meta">${new Date().toLocaleDateString('ja-JP')}</span>
        </div>
      `;
      list.appendChild(li);
    }
  }

  // 3) データ取得：articles.json がダメでも「既知の3件」を必ず表示
  const renderKnownThree = once(() => {
    const fallbackItems = [
      { date:'2025.02.18', title:'スタディツアー',   url:'/report_list/250218/index.html', photo:'1.jpg' },
      { date:'2025.05.04', title:'清掃活動',         url:'/report_list/250504/index.html', photo:'1.jpg' },
      { date:'2025.08.11', title:'門前での活動',     url:'/report_list/250811/index.html', photo:'monzen.jpg' }
    ];
    render(fallbackItems);
  });

  fetch('articles.json')
    .then(r => r.json())
    .then(data => {
      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data?.articles)) arr = data.articles;
      else if (Array.isArray(data?.items)) arr = data.items;

      if (!arr || !arr.length) { renderKnownThree(); return; }
      render(arr.slice(0, 12));
    })
    .catch(() => renderKnownThree()); // 失敗時は既知の3件

  /* ---------- 自動レイアウト：活動報告セクションは除外 ---------- */
  const reportSection = list.closest('section.about-details');
  const secs = Array.from(document.querySelectorAll('main section.about-details'))
    .filter(sec => sec !== reportSection);
  if (secs.length) {
    secs.forEach((sec, idx) => {
      if (sec.dataset.enhanced === '1') return;
      const type = idx % 4; // 0 split, 1 zigzag, 2 timeline, 3 split-reverse
      if (type === 0) makeSplit(sec, false);
      if (type === 1) makeZigzag(sec);
      if (type === 2) makeTimeline(sec);
      if (type === 3) makeSplit(sec, true);
      sec.dataset.enhanced = '1';
    });
  }

  function makeSplit(sec, reverse = false) {
    if (sec.querySelector('.split-grid')) return;
    const grid = document.createElement('div'); grid.className = 'split-grid';
    const main = document.createElement('div'); main.className = 'split-main';
    const side = document.createElement('aside'); side.className = 'split-side';
    const h2 = sec.querySelector(':scope > h2'); if (h2) main.appendChild(h2);
    Array.from(sec.querySelectorAll(':scope > :not(.split-grid):not(h2)')).forEach(ch => main.appendChild(ch));
    grid.appendChild(reverse ? side : main);
    grid.appendChild(reverse ? main : side);
    sec.appendChild(grid);
  }
  function makeZigzag(sec) {
    if (sec.querySelector('.zig-list')) return;
    const d = document.createElement('div'); d.className = 'zig-list';
    Array.from(sec.querySelectorAll(':scope > :not(h2)')).forEach(el => { const it = document.createElement('article'); it.className='zig-item'; it.appendChild(el); d.appendChild(it); });
    sec.appendChild(d); sec.classList.add('layout-zigzag');
  }
  function makeTimeline(sec) {
    let ul = sec.querySelector('ul,ol');
    if (!ul) {
      const ps = Array.from(sec.querySelectorAll(':scope > p')); if (!ps.length) return;
      ul = document.createElement('ul'); ps.forEach(p => { const li = document.createElement('li'); li.textContent = p.textContent; ul.appendChild(li); p.remove(); });
      sec.appendChild(ul);
    }
    ul.classList.add('tl');
    ul.querySelectorAll('li').forEach((li, i) => { li.classList.add('tl-item'); li.style.setProperty('--i', String(i)); });
    sec.classList.add('layout-timeline');
  }

  /* ---------- トップへ戻る ---------- */
  const toTop = document.getElementById('toTop');
  const toggleToTop = () => {
    if (!toTop) return;
    if (window.scrollY > 400) { toTop.classList.remove('hide'); toTop.classList.add('show'); }
    else { toTop.classList.add('hide'); toTop.classList.remove('show'); }
  };
  toggleToTop();
  window.addEventListener('scroll', toggleToTop, { passive: true });
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
