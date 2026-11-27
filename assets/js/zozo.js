'use strict';

(function () {
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
