'use strict';

/* ========= リロード時は必ず最上部へ（できるだけ早い段階で実行） ========= */
try {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  window.scrollTo(0, 0);
} catch (_) { /* no-op */ }

/* ========= 多重読込でも一回だけ初期化 ========= */
if (!window.__MEGURI_INIT__) {
  window.__MEGURI_INIT__ = true;

  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('js-enabled');

    /* ===== util ===== */
    var $  = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.from((c || document).querySelectorAll(s)); };
    var hasMM = (typeof matchMedia === 'function');
    var prefersReduced = hasMM && matchMedia('(prefers-reduced-motion: reduce)').matches === true;

    /* ===== 年号 ===== */
    var y = $('#y');
    if (y) y.textContent = String(new Date().getFullYear());

    /* ===== ナビ・メニュー ===== */
    var closeMenuFn = function(){};
    var closeSubFn  = function(){};

    (function () {
      var hamburger = $('#hamburger');
      var menu = $('#menu');
      var aboutBtn = $('#aboutBtn');
      var aboutSub = $('#aboutSub');
      var body = document.body;

      var openMenu = function () {
        if (menu) menu.classList.add('open');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
        body.classList.add('no-scroll');
      };
      var closeMenu = function () {
        if (menu) menu.classList.remove('open');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
        body.classList.remove('no-scroll');
        closeSub();
      };
      var toggleMenu = function () {
        if (!menu) return;
        if (menu.classList.contains('open')) closeMenu(); else openMenu();
      };
      if (hamburger) hamburger.addEventListener('click', toggleMenu);

      var openSub = function () {
        if (aboutSub) aboutSub.classList.add('open');
        if (aboutBtn) aboutBtn.setAttribute('aria-expanded', 'true');
        if (aboutSub) aboutSub.setAttribute('aria-hidden', 'false');
      };
      var closeSub = function () {
        if (aboutSub) aboutSub.classList.remove('open');
        if (aboutBtn) aboutBtn.setAttribute('aria-expanded', 'false');
        if (aboutSub) aboutSub.setAttribute('aria-hidden', 'true');
      };
      var toggleSub = function () {
        if (!aboutSub) return;
        if (aboutSub.classList.contains('open')) closeSub(); else openSub();
      };
      if (aboutBtn) {
        aboutBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleSub(); });
      }
      document.addEventListener('click', function (e) {
        if (!aboutSub || !aboutSub.classList.contains('open')) return;
        var inside = aboutSub.contains(e.target) || (aboutBtn && aboutBtn.contains(e.target));
        if (!inside) closeSub();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeSub(); closeMenu(); }
      });

      // 外から呼べるように束縛
      window.__MEGURI_CLOSE_MENU__ = closeMenu;
      window.__MEGURI_CLOSE_SUB__  = closeSub;
      closeMenuFn = closeMenu;
      closeSubFn  = closeSub;
    })();

    /* ===== ヘッダー高さをCSS変数へ反映（scroll-margin-top用） ===== */
    (function () {
      var nav = $('#nav');
      var setNavH = function(){
        var h = nav ? nav.offsetHeight : 60;
        document.documentElement.style.setProperty('--nav-h', h + 'px');
      };
      setNavH();
      window.addEventListener('resize', setNavH);
    })();

    /* ===== スムーズスクロール（固定ヘッダー分補正＋セクション別微調整＋二度補正） ===== */
    (function () {
      var nav = $('#nav');
      var headerHeight = function () { return nav ? nav.offsetHeight : 0; };

      // 端末幅で微調整値を切り替え
      var extraFor = function(hash){
        var mobile = window.innerWidth <= 880;
        if (mobile) {
          switch (hash) {
            case '#concept':  return -110;
            case '#features': return   0;
            case '#voices':   return  28;
            default:          return   0;
          }
        } else {
          switch (hash) {
            case '#concept':  return -36;
            case '#features': return   0;
            case '#voices':   return  14;
            default:          return   0;
          }
        }
      };

      var clampToPage = function(to){
        var maxTo = Math.max(0, (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight);
        return Math.min(Math.max(0, to), maxTo);
      };

      var smoothScrollToHash = function (hash) {
        if (!hash || hash === '#') return;
        var target = document.querySelector(hash);
        if (!target) return;

        // 上部バーを閉じてから計算
        closeSubFn();
        closeMenuFn();

        // レイアウト再計測を待ってからスクロール
        setTimeout(function(){
          var extra = extraFor(hash);

          var computeTop = function(){
            var rectTop = target.getBoundingClientRect().top + window.pageYOffset;
            return clampToPage(rectTop - headerHeight() - 8 + extra);
          };

          var to1 = computeTop();
          try {
            window.scrollTo({ top: to1, behavior: 'smooth' });
          } catch (_) {
            window.scrollTo(0, to1);
          }

          // 画像/フォント読み込み後のズレを再補正
          setTimeout(function(){
            var to2 = computeTop();
            if (Math.abs((window.pageYOffset || 0) - to2) > 4) {
              try { window.scrollTo({ top: to2 }); } catch(_){ window.scrollTo(0, to2); }
            }
          }, 450);
        }, 0);
      };

      // 同一ページ内アンカーのみ補足
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var href = a.getAttribute('href');
          if (!href) return;
          var url;
          try { url = new URL(href, window.location.href); } catch (_) { return; }
          if (url.pathname === window.location.pathname) {
            e.preventDefault();
            smoothScrollToHash(url.hash);
          }
        });
      });

      // 念のため最上部へ
      setTimeout(function(){ window.scrollTo(0, 0); }, 0);
    })();

    /* ===== スクロール：ナビ影 & パララックス ===== */
    (function () {
      var nav = $('#nav');
      var photo = $('.photo-ph');
      var ticking = false;
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var sy = window.scrollY || 0;
          if (nav) nav.classList.toggle('is-scrolled', sy > 6);
          if (photo && !prefersReduced) {
            photo.style.transform = 'translateY(' + (sy * 0.15) + 'px)';
            if (!photo.dataset.wc) { photo.style.willChange = 'transform'; photo.dataset.wc = '1'; }
          }
          ticking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    })();

    /* ===== フェードイン（IntersectionObserver） ===== */
    (function () {
      $$('.hero .fade-in').forEach(function (el) { el.classList.add('appear'); });

      var items = $$('.section.fade-in, .section .fade-in, .section .sec-title');
      if (!items.length) return;

      if (prefersReduced) { items.forEach(function (el) { el.classList.add('appear'); }); return; }

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (ent) {
            if (ent.isIntersecting) { ent.target.classList.add('appear'); obs.unobserve(ent.target); }
          });
        }, { threshold: 0.01, rootMargin: '0px 0px -20%' });
        items.forEach(function (el) { io.observe(el); });
      } else {
        var onScroll = function () {
          var vh = window.innerHeight || document.documentElement.clientHeight;
          items.forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < vh * 0.86) el.classList.add('appear');
          });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }
    })();

    /* === 寄付リンクを新ページへ（ヘッダー/カード/フッター/下部ボタン対応） === */
    (function () {
      var goDonate = function(e){
        if (e) { e.preventDefault(); e.stopPropagation(); }
        try { closeSubFn(); closeMenuFn(); } catch(_) {}
        // カレント階層からの相対遷移（必要に応じてパスを調整）
        window.location.href = './donate.html';
      };

      // デリゲーションで確実に捕捉（DOMContentLoaded 後に有効）
      document.addEventListener('click', function(ev){
        var a = ev.target.closest('a');
        if (!a) return;

        var href = a.getAttribute('href') || '';
        var text = (a.textContent || '').trim();

        // 1) 明示の #donate
        if (href === '#donate') return goDonate(ev);

        // 2) donate セクション内の a[href="#"]
        if (href === '#' && a.closest('#donate')) return goDonate(ev);

        // 3) 文言で拾う（安全に）：寄付 / 応援の方法 のテキストリンクで href="#" のもの
        if (href === '#' && /寄付|応援の方法/.test(text)) return goDonate(ev);
      }, { passive: false });
    })();

  });
}
