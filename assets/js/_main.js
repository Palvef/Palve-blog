/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */

$(document).ready(function () {
  // FitVids init
  $("#main").fitVids();

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function () {
    $(".author__urls").toggleClass("is--visible");
    $(".author__urls-wrapper").find("button").toggleClass("open");
  });

  // Close search screen with Esc key
  $(document).keyup(function (e) {
    if (e.keyCode === 27) {
      if ($(".initial-content").hasClass("is--hidden")) {
        $(".search-content").toggleClass("is--visible");
        $(".initial-content").toggleClass("is--hidden");
      }
    }
  });

  // Search toggle
  $(".search__toggle").on("click", function () {
    $(".search-content").toggleClass("is--visible");
    $(".initial-content").toggleClass("is--hidden");
    // set focus on input
    setTimeout(function () {
      $(".search-content input").focus();
    }, 400);
  });

  // Smooth scrolling
  var scroll = new SmoothScroll('a[href*="#"]', {
    offset: 20,
    speed: 400,
    speedAsDuration: true,
    durationMax: 500,
  });
  // Gumshoe scroll spy init
  if ($("nav.toc").length > 0) {
    var spy = new Gumshoe("nav.toc a", {
      // Active classes
      navClass: "active", // applied to the nav list item
      contentClass: "active", // applied to the content

      // Nested navigation
      nested: false, // if true, add classes to parents of active link
      nestedClass: "active", // applied to the parent items

      // Offset & reflow
      offset: function () {
        return Math.max(50, window.innerHeight * 0.1);
      },
      reflow: true, // if true, listen for reflows

      // Event support
      events: true, // if true, emit custom events
    });
  } // Auto scroll sticky ToC with content - improved version
  const scrollTocToContent = function (event) {
    var target = event.target;
    var tocContainer = document.querySelector(
      "aside.sidebar__right.sticky .toc .toc__menu"
    );

    if (!tocContainer || !target) return;

    var tocLink = tocContainer.querySelector('a[href="#' + target.id + '"]');
    if (!tocLink) return;

    var containerRect = tocContainer.getBoundingClientRect();
    var targetRect = tocLink.getBoundingClientRect();

    var needsScroll =
      targetRect.top < containerRect.top + 50 ||
      targetRect.bottom > containerRect.bottom - 50;

    if (needsScroll) {
      var scrollTop = tocContainer.scrollTop;
      var offsetTop = tocLink.offsetTop - tocContainer.offsetTop;
      var containerHeight = tocContainer.clientHeight;
      var targetHeight = tocLink.offsetHeight;

      var newScrollTop = offsetTop - containerHeight / 3;

      tocContainer.scrollTo({
        top: Math.max(0, newScrollTop),
        behavior: "smooth",
      });
    }
  };

  document.addEventListener("gumshoeActivate", scrollTocToContent);

  let scrollTimeout;
  window.addEventListener("scroll", function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () {
      const headings = document.querySelectorAll(
        ".page__content h1[id], .page__content h2[id], .page__content h3[id], .page__content h4[id], .page__content h5[id], .page__content h6[id]"
      );
      const viewportTop = window.pageYOffset + window.innerHeight * 0.1;
      const viewportBottom = window.pageYOffset + window.innerHeight * 0.9;

      let activeHeading = null;
      headings.forEach(function (heading) {
        const rect = heading.getBoundingClientRect();
        const absoluteTop = window.pageYOffset + rect.top;

        if (absoluteTop <= viewportTop + 100) {
          activeHeading = heading;
        }
      });

      if (activeHeading) {
        const tocContainer = document.querySelector(
          "aside.sidebar__right.sticky .toc .toc__menu"
        );
        if (tocContainer) {
          tocContainer.querySelectorAll("a").forEach((link) => {
            link.parentElement.classList.remove("active");
          });

          const activeLink = tocContainer.querySelector(
            'a[href="#' + activeHeading.id + '"]'
          );
          if (activeLink) {
            activeLink.parentElement.classList.add("active");
            scrollTocToContent({ target: activeHeading });
          }
        }
      }
    }, 50);
  });

  // add lightbox class to all image links
  $(
    "a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif'],a[href$='.webp']"
  )
    .has("> img")
    .addClass("image-popup");

  // Magnific-Popup options
  $(".image-popup").magnificPopup({
    // disableOn: function() {
    //   if( $(window).width() < 500 ) {
    //     return false;
    //   }
    //   return true;
    // },
    type: "image",
    tLoading: "Loading image #%curr%...",
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0, 1], // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.',
    },
    removalDelay: 500, // Delay in milliseconds before popup is removed
    // Class that is added to body when popup is open.
    // make it unique to apply your CSS animations just to this exact popup
    mainClass: "mfp-zoom-in",
    callbacks: {
      beforeOpen: function () {
        // just a hack that adds mfp-anim class to markup
        this.st.image.markup = this.st.image.markup.replace(
          "mfp-figure",
          "mfp-figure mfp-with-anim"
        );
      },
    },
    closeOnContentClick: true,
    midClick: true, // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
  });

  // Add anchors for headings
  document
    .querySelector(".page__content")
    .querySelectorAll("h1, h2, h3, h4, h5, h6")
    .forEach(function (element) {
      var id = element.getAttribute("id");
      if (id) {
        var anchor = document.createElement("a");
        anchor.className = "header-link";
        anchor.href = "#" + id;
        anchor.innerHTML =
          '<span class="sr-only">Permalink</span><i class="fas fa-link"></i>';
        anchor.title = "Permalink";
        element.appendChild(anchor);
      }
    });

  // Add copy button for <pre> blocks
  var copyText = function (text) {
    if (document.queryCommandEnabled("copy") && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => true,
        () => console.error("Failed to copy text to clipboard: " + text)
      );
      return true;
    } else {
      var isRTL = document.documentElement.getAttribute("dir") === "rtl";

      var textarea = document.createElement("textarea");
      textarea.className = "clipboard-helper";
      textarea.style[isRTL ? "right" : "left"] = "-9999px";
      // Move element to the same position vertically
      var yPosition = window.pageYOffset || document.documentElement.scrollTop;
      textarea.style.top = yPosition + "px";

      textarea.setAttribute("readonly", "");
      textarea.value = text;
      document.body.appendChild(textarea);

      var success = true;
      try {
        textarea.select();
        success = document.execCommand("copy");
      } catch (e) {
        success = false;
      }
      textarea.parentNode.removeChild(textarea);
      return success;
    }
  };

  var copyButtonEventListener = function (event) {
    var thisButton = event.target;

    // Locate the <code> element
    var codeBlock = thisButton.nextElementSibling;
    while (codeBlock && codeBlock.tagName.toLowerCase() !== "code") {
      codeBlock = codeBlock.nextElementSibling;
    }
    if (!codeBlock) {
      // No <code> found - wtf?
      console.warn(thisButton);
      throw new Error("No code block found for this button.");
    }

    // Skip line numbers if present (i.e. {% highlight lineno %})
    var realCodeBlock = codeBlock.querySelector("td.code, td.rouge-code");
    if (realCodeBlock) {
      codeBlock = realCodeBlock;
    }
    var result = copyText(codeBlock.innerText);
    // Restore the focus to the button
    thisButton.focus();
    if (result) {
      if (thisButton.interval !== null) {
        clearInterval(thisButton.interval);
      }
      thisButton.classList.add("copied");
      thisButton.interval = setTimeout(function () {
        thisButton.classList.remove("copied");
        clearInterval(thisButton.interval);
        thisButton.interval = null;
      }, 1500);
    }
    return result;
  };

  if (window.enable_copy_code_button) {
    document
      .querySelectorAll(".page__content pre.highlight > code")
      .forEach(function (element, index, parentList) {
        // Locate the <pre> element
        var container = element.parentElement;
        // Sanity check - don't add an extra button if there's already one
        if (container.firstElementChild.tagName.toLowerCase() !== "code") {
          return;
        }
        var copyButton = document.createElement("button");
        copyButton.title = "Copy to clipboard";
        copyButton.className = "clipboard-copy-button";
        copyButton.innerHTML =
          '<span class="sr-only">Copy code</span><i class="far fa-fw fa-copy"></i><i class="fas fa-fw fa-check copied"></i>';
        copyButton.addEventListener("click", copyButtonEventListener);
        container.prepend(copyButton);
      });
  }
});
