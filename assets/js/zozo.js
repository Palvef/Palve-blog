'use strict';

(function () {
  var bar = document.getElementById('reading-progress');
  if (bar) {
    if (document.body.classList.contains('is-post-page')) {
      bar.classList.add('is-reading');
      function updateReadingBar() {
        var top = window.scrollY || document.documentElement.scrollTop;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;
        bar.style.transform = 'scaleX(' + ratio + ')';
      }
      window.addEventListener('scroll', updateReadingBar, { passive: true });
      updateReadingBar();
    } else {
      bar.classList.add('is-loading');
    }
  }

  var bt = document.getElementById('back_to_top');
  if (bt) {
    window.addEventListener('scroll', function () {
      if (window.innerWidth > 480 && window.scrollY > 30) {
        bt.style.display = 'block';
      } else {
        bt.style.display = 'none';
      }
    }, { passive: true });

    bt.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var icon = document.getElementById('menu_icon');
  var nav = document.getElementById('site_nav');
  if (icon && nav) {
    icon.addEventListener('click', function (e) {
      e.preventDefault();
      nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
    });
  }
})();
