'use strict';

(function () {
  var container = document.getElementById('post-toc-left');
  var article = document.querySelector('.post_page .post_content');
  if (!container || !article) return;

  var headings = Array.prototype.slice.call(article.querySelectorAll('h2, h3'));
  if (!headings.length) {
    container.remove();
    return;
  }

  var details = container.querySelector('details');
  var list = container.querySelector('.toc-list');
  if (!details || !list) return;

  var usedIds = Object.create(null);
  var items = [];

  headings.forEach(function (h, idx) {
    var id = h.id;
    if (!id) {
      id = 'section-' + (idx + 1);
      h.id = id;
    }
    if (usedIds[id]) {
      id = id + '-' + (idx + 1);
      h.id = id;
    }
    usedIds[id] = true;

    var li = document.createElement('li');
    li.className = h.tagName.toLowerCase() === 'h3' ? 'toc-h3' : 'toc-h2';

    var a = document.createElement('a');
    a.href = '#' + encodeURIComponent(id);
    a.textContent = h.textContent.trim();
    a.addEventListener('click', function (e) {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.replaceState) {
        history.replaceState(null, '', '#' + encodeURIComponent(id));
      }
      setActive(id);
    });

    li.appendChild(a);
    list.appendChild(li);
    items.push({ id: id, el: h, link: a });
  });

  function syncOpenState() {
    if (window.innerWidth >= 1080) {
      details.setAttribute('open', 'open');
    } else {
      details.removeAttribute('open');
    }
  }
  syncOpenState();
  window.addEventListener('resize', syncOpenState);

  function setActive(activeId) {
    items.forEach(function (item) {
      if (item.id === activeId) {
        item.link.classList.add('is-active');
      } else {
        item.link.classList.remove('is-active');
      }
    });
  }

  if (items.length) {
    setActive(items[0].id);
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    }, { rootMargin: '-12% 0px -75% 0px', threshold: 0 });

    items.forEach(function (item) {
      observer.observe(item.el);
    });
  }

  document.body.classList.add('has-post-toc');
  container.classList.add('is-ready');
})();
