'use strict';

/**
 * meguri.js - 「めぐり」および「交換手帖」特設ページ用共通スクリプト
 */

(function () {
  // スクロール復元設定
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('js-enabled');

    var isKokantecho = window.location.pathname.indexOf('kokantecho') !== -1;

    /* ===== util ===== */
    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) {
      var nodes = (c || document).querySelectorAll(s);
      return Array.prototype.slice.call(nodes);
    };
    var hasMM = (typeof matchMedia === 'function');
    var prefersReduced = hasMM && matchMedia('(prefers-reduced-motion: reduce)').matches === true;

    /* ===== 年号表示 ===== */
    var y = $('#y');
    if (y) y.textContent = String(new Date().getFullYear());

    /* ===== ナビ・メニュー制御 ===== */
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
    var closeSub = function () {
      if (aboutSub) {
        aboutSub.classList.remove('open');
        aboutSub.setAttribute('aria-hidden', 'true');
      }
      if (aboutBtn) aboutBtn.setAttribute('aria-expanded', 'false');
    };
    var closeMenu = function () {
      if (menu) menu.classList.remove('open');
      if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
      body.classList.remove('no-scroll');
      closeSub();
    };
    var toggleMenu = function () {
      if (menu && menu.classList.contains('open')) closeMenu(); else openMenu();
    };

    if (hamburger) hamburger.addEventListener('click', toggleMenu);

    var openSub = function () {
      if (aboutSub) {
        aboutSub.classList.add('open');
        aboutSub.setAttribute('aria-hidden', 'false');
      }
      if (aboutBtn) aboutBtn.setAttribute('aria-expanded', 'true');
    };
    var toggleSub = function () {
      if (!aboutSub) return;
      if (aboutSub.classList.contains('open')) closeSub(); else openSub();
    };

    if (aboutBtn) {
      aboutBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleSub(); });
    }

    document.addEventListener('click', function (e) {
      if (aboutSub && aboutSub.classList.contains('open')) {
        var inside = aboutSub.contains(e.target) || (aboutBtn && aboutBtn.contains(e.target));
        if (!inside) closeSub();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeSub(); closeMenu(); }
    });

    if (menu) {
      var links = menu.querySelectorAll('a');
      for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function () { closeMenu(); });
      }
    }

    /* ===== ヘッダー高さをCSS変数へ反映 ===== */
    var setNavH = function () {
      var nav = $('#nav');
      var h = nav ? nav.offsetHeight : 60;
      document.documentElement.style.setProperty('--nav-h', h + 'px');
    };
    setNavH();
    window.addEventListener('resize', setNavH);

    /* ===== スムーズスクロール ===== */
    var nav = $('#nav');
    var headerHeight = function () { return nav ? nav.offsetHeight : 0; };

    var getExtraOffset = function (hash) {
      if (!isKokantecho) return 0;
      var isMobile = window.innerWidth <= 880;
      if (isMobile) {
        if (hash === '#concept') return -110;
        if (hash === '#voices') return 28;
      } else {
        if (hash === '#concept') return -36;
        if (hash === '#voices') return 14;
      }
      return 0;
    };

    var smoothScrollToHash = function (hash) {
      if (!hash || hash === '#') return;
      var target = document.querySelector(hash);
      if (!target) return;

      closeSub();
      closeMenu();

      setTimeout(function () {
        var extra = getExtraOffset(hash);
        var rectTop = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
        var offset = headerHeight() + 8 - extra;
        var targetPosition = rectTop - offset;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        if (isKokantecho) {
          setTimeout(function () {
            var recompute = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - offset;
            if (Math.abs((window.pageYOffset || document.documentElement.scrollTop) - recompute) > 4) {
              window.scrollTo(0, recompute);
            }
          }, 450);
        }
      }, 0);
    };

    var anchorLinks = document.querySelectorAll('a[href^="#"]');
    for (var j = 0; j < anchorLinks.length; j++) {
      anchorLinks[j].addEventListener('click', function (e) {
        var a = e.currentTarget;
        var href = a.getAttribute('href');
        if (href === '#') return;
        var url;
        try { url = new URL(href, window.location.href); } catch (_) { return; }
        if (url.pathname === window.location.pathname) {
          e.preventDefault();
          smoothScrollToHash(url.hash);
          if (history.pushState) history.pushState(null, null, url.hash);
        }
      });
    }

    if (window.location.hash) {
      setTimeout(function () { smoothScrollToHash(window.location.hash); }, 500);
    } else if (isKokantecho) {
      window.scrollTo(0, 0);
    }

    /* ===== スクロール連動：ナビ影 & パララックス ===== */
    var photo = $('.photo-ph');
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var sy = window.scrollY || document.documentElement.scrollTop || 0;
        if (nav) nav.classList.toggle('is-scrolled', sy > 6);
        if (photo && !prefersReduced) {
          photo.style.transform = 'translateY(' + (sy * 0.15) + 'px)';
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ===== フェードイン演出 (IntersectionObserver) ===== */
    var heroFadeIns = $$('.hero .fade-in');
    for (var k = 0; k < heroFadeIns.length; k++) {
      heroFadeIns[k].classList.add('appear');
    }

    var items = $$('.section.fade-in, .section .fade-in, .section .sec-title, .tagline');
    if (items.length > 0) {
      if (prefersReduced) {
        for (var l = 0; l < items.length; l++) items[l].classList.add('appear');
      } else if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries, obs) {
          for (var m = 0; m < entries.length; m++) {
            if (entries[m].isIntersecting) {
              entries[m].target.classList.add('appear');
              obs.unobserve(entries[m].target);
            }
          }
        }, { threshold: 0.1, rootMargin: '0px 0px -10%' });
        for (var n = 0; n < items.length; n++) io.observe(items[n]);
      } else {
        var onScrollFade = function () {
          var vh = window.innerHeight;
          for (var o = 0; o < items.length; o++) {
            if (items[o].getBoundingClientRect().top < vh * 0.9) items[o].classList.add('appear');
          }
        };
        window.addEventListener('scroll', onScrollFade, { passive: true });
        onScrollFade();
      }
    }

    /* ===== 寄付・外部リンクのパス修正 ===== */
    document.addEventListener('click', function (ev) {
      var a = ev.target;
      while (a && a.tagName !== 'A') a = a.parentNode;
      if (!a) return;

      var href = a.getAttribute('href') || '';
      var text = (a.textContent || '').trim();

      if (href === '#donate' || (href === '#' && /寄付|応援の方法/.test(text)) || (href === '#' && (a.closest && a.closest('#donate')))) {
        ev.preventDefault();
        window.location.href = isKokantecho ? './donate.html' : '../support.html';
      }
    });
  });
})();
