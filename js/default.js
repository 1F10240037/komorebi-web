/**
 * default.js - 共通の基本スクリプト
 * ハンバーガーメニュー、記事一覧表示、タグ検索などを一括管理します。
 */

document.addEventListener("DOMContentLoaded", function () {
  'use strict';

  /* ============================================================
     1. ハンバーガーメニューの制御
     ============================================================ */
  const initMenu = () => {
    // 複数のセレクタ候補（既存の異なるクラス名に対応）
    const menuToggle = document.querySelector(".menu-toggle, .hamburger");
    const navbar = document.querySelector(".navbar, .menu");
    if (!menuToggle || !navbar) return;

    const mq = window.matchMedia("(max-width: 768px)");

    const openMenu = () => {
      navbar.classList.add("active", "open");
      menuToggle.setAttribute("aria-expanded", "true");
      if (mq.matches) document.body.style.overflow = "hidden";
    };

    const closeMenu = () => {
      navbar.classList.remove("active", "open");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };

    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (navbar.classList.contains("active") || navbar.classList.contains("open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navbar.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", (e) => {
      if (mq.matches) {
        const header = document.querySelector("header, .nav");
        if (header && !header.contains(e.target)) closeMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    const handleChange = () => {
      if (!mq.matches) {
        closeMenu();
        document.body.style.overflow = "";
      }
    };
    if (mq.addEventListener) mq.addEventListener("change", handleChange);
    else window.addEventListener("resize", handleChange);

    // 初期化時に一度リセット
    closeMenu();
  };

  initMenu();

  /* ============================================================
     2. 記事一覧 / タグ検索ロジック
     ============================================================ */
  let allArticles = [];
  let selectedTags = [];

  const listEl = document.getElementById('latest-reports');
  const tagListEl = document.getElementById('tag-list');
  const searchInputEl = document.getElementById('search-input');

  // index.html等の「チェキモード」は別途インラインまたは専用JSで制御される場合があるため、
  // cheki-modeクラスがある場合は標準の描画ロジックを実行しない
  const isChekiMode = listEl && listEl.classList.contains('cheki-mode');

  if (listEl && !isChekiMode) {
    // パス解決：階層に応じて articles.json を探す
    const path = window.location.pathname;
    const isSubdir = path.includes('/report_list/') || path.includes('/kokantecho/') || path.includes('/meguri/');
    const depth = (path.match(/\//g) || []).length;
    let jsonPath = 'articles.json';

    // 簡易的な階層判定
    if (path.includes('/report_list/')) jsonPath = '../../articles.json';
    else if (isSubdir) jsonPath = '../articles.json';

    fetch(jsonPath)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        allArticles = Array.isArray(data) ? data : (data.articles || data.items || []);
        displayArticles(allArticles);
        if (tagListEl) displayTags(allArticles);
      })
      .catch(err => console.warn('Articles could not be loaded:', err));
  }

  function displayArticles(articles) {
    if (!listEl) return;
    listEl.innerHTML = '';

    const path = window.location.pathname;
    const isSubdir = path.includes('/report_list/');

    articles.forEach(article => {
      const li = document.createElement('li');
      li.classList.add('article-item');
      const tagsHTML = (article.tag || []).map(t => `<span class="tag">${t}</span>`).join(' ');

      // パス補正
      let imgPath = article.img;
      let urlPath = article.url;
      if (isSubdir && !imgPath.startsWith('http') && !imgPath.startsWith('/')) imgPath = '../../' + imgPath;
      if (isSubdir && !urlPath.startsWith('http') && !urlPath.startsWith('/')) urlPath = '../../' + urlPath;

      li.innerHTML = `
        <img src="${imgPath}" alt="${article.title}" class="article-img">
        <div class="article-content">
          <div class="article-meta">
            <span class="article-date">${article.date}</span>
            <div class="article-tags">${tagsHTML}</div>
          </div>
          <a href="${urlPath}" class="article-title">${article.title}</a>
        </div>
      `;
      listEl.appendChild(li);
    });
    updateHitCount(articles.length);
  }

  function displayTags(articles) {
    if (!tagListEl) return;
    const tagSet = new Set();
    articles.forEach(a => (a.tag || []).forEach(t => tagSet.add(t)));
    tagListEl.innerHTML = '';

    tagSet.forEach(tag => {
      const span = document.createElement('span');
      span.classList.add('tag');
      span.textContent = tag;
      span.addEventListener('click', () => toggleTag(tag, span));
      tagListEl.appendChild(span);
    });
  }

  function toggleTag(tag, element) {
    const index = selectedTags.indexOf(tag);
    if (index === -1) {
      selectedTags.push(tag);
      element.classList.add('selected');
    } else {
      selectedTags.splice(index, 1);
      element.classList.remove('selected');
    }

    if (searchInputEl) {
      searchInputEl.innerHTML = '';
      selectedTags.forEach(t => {
        const span = document.createElement('span');
        span.classList.add('tag', 'selected');
        span.textContent = t;
        searchInputEl.appendChild(span);
      });
    }
    filterBySelectedTags();
  }

  function filterBySelectedTags() {
    if (selectedTags.length === 0) {
      displayArticles(allArticles);
      return;
    }
    const filtered = allArticles.filter(article =>
      (article.tag || []).some(t => selectedTags.includes(t))
    );
    displayArticles(filtered);
  }

  function updateHitCount(count) {
    const el = document.getElementById('hit-count');
    if (el) el.textContent = `ヒット件数: ${count}`;
  }

  /* ============================================================
     3. 「戻る」ボタンの制御
     ============================================================ */
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      const path = window.location.pathname;
      if (path.includes('/report_list/')) {
        window.location.href = '../../report.html';
      } else if (path.includes('/kokantecho/') || path.includes('/meguri/')) {
        window.location.href = '../report.html';
      } else {
        window.location.href = 'report.html';
      }
    });
  }
});
