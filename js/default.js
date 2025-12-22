// =========================
// default.js 置き換え版
// 変更点はハンバーガー開閉まわりのみ（他ロジックは同一）
// =========================

// --- ハンバーガー開閉（堅牢化） ---
document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const navbar = document.querySelector(".navbar");
  if (!menuToggle || !navbar) return;

  const mq = window.matchMedia("(max-width: 768px)");

  const openMenu = () => {
    navbar.classList.add("active");
    menuToggle.setAttribute("aria-expanded", "true");
    if (mq.matches) document.body.style.overflow = "hidden"; // モバイル時は背面スクロール防止
  };

  const closeMenu = () => {
    navbar.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = ""; // 復帰
  };

  const toggleMenu = () => {
    if (navbar.classList.contains("active")) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // 既存のクリックでのトグルを拡張
  menuToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  // メニュー内リンクをクリックしたら閉じる
  navbar.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) closeMenu();
  });

  // ヘッダー外クリックで閉じる（モバイル時のみ）
  document.addEventListener("click", (e) => {
    if (!mq.matches) return;
    const header = document.querySelector("header");
    if (header && !header.contains(e.target)) {
      closeMenu();
    }
  });

  // Escキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // 画面幅がPCに戻ったら状態リセット（はみ出し防止）
  const handleChange = () => {
    if (!mq.matches) {
      closeMenu();
      document.body.style.overflow = "";
    }
  };
  if (mq.addEventListener) {
    mq.addEventListener("change", handleChange);
  } else {
    // 古いブラウザ向けフォールバック
    window.addEventListener("resize", handleChange);
  }

  // 初期状態：モバイルでは閉じておく
  closeMenu();
});

// =========================
// 以下：記事/タグ/件数/戻るボタン（変更なし）
// =========================

let allArticles = [];
let selectedTags = []; // 現在選択中のタグ

fetch('articles.json')
  .then(res => res.json())
  .then(articles => {
    allArticles = articles;
    displayArticles(articles);
    displayTags(articles);
    updateHitCount(articles.length);
  });

// 記事リスト表示
function displayArticles(articles) {
  const list = document.getElementById('latest-reports');
  list.innerHTML = '';

  articles.forEach(article => {
    const li = document.createElement('li');
    li.classList.add('article-item');

    const tagsHTML = article.tag.map(t => `<span class="tag">${t}</span>`).join(' ');

    li.innerHTML = `
      <img src="${article.img}" alt="${article.title}" class="article-img">
      <div class="article-content">
        <div class="article-meta">
          <span class="article-date">${article.date}</span>
          <div class="article-tags">${tagsHTML}</div>
        </div>
        <a href="${article.url}" class="article-title">${article.title}</a>
      </div>
    `;
    list.appendChild(li);
  });

  updateHitCount(articles.length);
}

// タグ一覧表示
function displayTags(articles) {
  const tagSet = new Set();
  articles.forEach(a => a.tag.forEach(t => tagSet.add(t)));

  const tagList = document.getElementById('tag-list');
  tagList.innerHTML = '';

  tagSet.forEach(tag => {
    const span = document.createElement('span');
    span.classList.add('tag');
    span.textContent = tag;

    span.addEventListener('click', () => {
      toggleTag(tag, span);
    });

    tagList.appendChild(span);
  });
}

function toggleTag(tag, element) {
  const index = selectedTags.indexOf(tag);
  if (index === -1) {
    // 選択追加
    selectedTags.push(tag);
    element.classList.add('selected');
  } else {
    // 選択解除
    selectedTags.splice(index, 1);
    element.classList.remove('selected');
  }

  // 検索バーに表示（spanタグで追加）
  const searchDiv = document.getElementById('search-input');
  searchDiv.innerHTML = ''; // クリア

  selectedTags.forEach(t => {
    const span = document.createElement('span');
    span.classList.add('tag', 'selected');
    span.textContent = t;
    searchDiv.appendChild(span);
  });

  // 選択タグでOR検索（仕様通り）
  filterBySelectedTags();
}

// OR検索
function filterBySelectedTags() {
  if (selectedTags.length === 0) {
    displayArticles(allArticles);
    return;
  }

  // どれか1つでもタグが含まれる記事を抽出
  const filtered = allArticles.filter(article =>
    article.tag.some(t => selectedTags.includes(t))
  );

  displayArticles(filtered);
}

// ヒット件数更新
function updateHitCount(count) {
  const el = document.getElementById('hit-count');
  if (el) el.textContent = `ヒット件数: ${count}`;
}

// 「お知らせ一覧に戻る」ボタンの動作
document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      // report.html へ戻る（お知らせ一覧ページ）
      window.location.href = '/report.html';
    });
  }
});
