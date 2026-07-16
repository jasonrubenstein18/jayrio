(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Scroll progress + has-scrolled flag                                 */
  /* ------------------------------------------------------------------ */

  var progressBar = document.querySelector(".scroll-progress");
  var scrollTicking = false;

  function updateScrollProgress() {
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0;
    if (progressBar) progressBar.style.width = pct + "%";
    document.body.classList.toggle("has-scrolled", scrollTop > 120);
    scrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateScrollProgress);
      }
    },
    { passive: true }
  );
  updateScrollProgress();

  /* ------------------------------------------------------------------ */
  /* Word-level rise-in for headlines and pull quotes                    */
  /* ------------------------------------------------------------------ */

  var wordTargets = document.querySelectorAll(".word-reveal");
  wordTargets.forEach(function (el) {
    var text = el.textContent;
    var words = text.trim().split(/\s+/);
    el.innerHTML = words
      .map(function (word, i) {
        return (
          '<span class="word"><span class="word-inner" style="transition-delay:' +
          (i * 35).toString() +
          'ms">' +
          word +
          "</span></span>"
        );
      })
      .join(" ");
  });

  if ("IntersectionObserver" in window && wordTargets.length) {
    var wordObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            wordObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    wordTargets.forEach(function (el) {
      wordObserver.observe(el);
    });
  } else {
    wordTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Mobile nav toggle                                                   */
  /* ------------------------------------------------------------------ */

  var navToggle = document.querySelector(".site-nav__toggle");
  var navLinks = document.querySelector(".site-nav__links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                       */
  /* ------------------------------------------------------------------ */

  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");

  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });

    // Fallback safety net: catches elements missed by very fast, jump-style
    // scrolling (e.g. End key, large trackpad flicks) that can skip frames.
    var fallbackCheck = function () {
      var vh = window.innerHeight;
      revealEls.forEach(function (el) {
        if (el.classList.contains("is-visible")) return;
        var rect = el.getBoundingClientRect();
        if (rect.top < vh && rect.bottom > 0) {
          el.classList.add("is-visible");
          revealObserver.unobserve(el);
        }
      });
    };
    var fallbackTimer = null;
    window.addEventListener(
      "scroll",
      function () {
        if (fallbackTimer) return;
        fallbackTimer = setTimeout(function () {
          fallbackCheck();
          fallbackTimer = null;
        }, 200);
      },
      { passive: true }
    );
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll-driven timelines                                             */
  /* ------------------------------------------------------------------ */

  document.querySelectorAll(".timeline").forEach(function (timeline) {
    var stages = Array.prototype.slice.call(timeline.querySelectorAll(".timeline__stage"));
    var fill = timeline.querySelector(".timeline__spine-fill");
    if (!stages.length) return;

    function setActive(index) {
      stages.forEach(function (stage, i) {
        stage.classList.toggle("is-active", i === index);
      });
      if (fill) {
        var pct = stages.length > 1 ? (index / (stages.length - 1)) * 100 : 100;
        fill.style.height = pct + "%";
      }
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var idx = stages.indexOf(entry.target);
              if (idx !== -1) setActive(idx);
            }
          });
        },
        { threshold: 0.5, rootMargin: "-15% 0px -35% 0px" }
      );
      stages.forEach(function (stage) {
        observer.observe(stage);
      });
    }

    setActive(0);
  });

  /* ------------------------------------------------------------------ */
  /* Tabs                                                                 */
  /* ------------------------------------------------------------------ */

  document.querySelectorAll(".tabs").forEach(function (tabsEl) {
    var btns = Array.prototype.slice.call(tabsEl.querySelectorAll(".tabs__btn"));
    var panels = Array.prototype.slice.call(tabsEl.querySelectorAll(".tabs__panel"));

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-tab");
        btns.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        panels.forEach(function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-tab-panel") === target);
        });
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Accordions                                                           */
  /* ------------------------------------------------------------------ */

  document.querySelectorAll(".accordion__item").forEach(function (item) {
    var trigger = item.querySelector(".accordion__trigger");
    var panel = item.querySelector(".accordion__panel");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      var parentAccordion = item.closest(".accordion");
      var singleOpen = parentAccordion && parentAccordion.hasAttribute("data-single-open");

      if (singleOpen && !isOpen) {
        parentAccordion.querySelectorAll(".accordion__item.is-open").forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove("is-open");
            openItem.querySelector(".accordion__panel").style.maxHeight = null;
            openItem.querySelector(".accordion__trigger").setAttribute("aria-expanded", "false");
          }
        });
      }

      item.classList.toggle("is-open", !isOpen);
      trigger.setAttribute("aria-expanded", !isOpen ? "true" : "false");
      panel.style.maxHeight = !isOpen ? panel.scrollHeight + "px" : null;
    });
  });

  /* ------------------------------------------------------------------ */
  /* Dial explainer                                                       */
  /* ------------------------------------------------------------------ */

  document.querySelectorAll(".dial-explainer").forEach(function (explainer) {
    var slider = explainer.querySelector("input[type='range']");
    var dials = Array.prototype.slice.call(explainer.querySelectorAll(".dial"));
    var frozenP = explainer.querySelector(".state-frozen");
    var liveP = explainer.querySelector(".state-live");

    dials.forEach(function (dial, i) {
      var seed = Math.sin(i * 12.9898) * 43758.5453;
      seed = seed - Math.floor(seed);
      dial.dataset.seed = seed.toFixed(3);
      dial.style.setProperty("--dial-rot", (seed * 40 - 20) + "deg");
    });

    function update(value) {
      var t = value / 100;
      dials.forEach(function (dial, i) {
        var seed = parseFloat(dial.dataset.seed || "0.5");
        var baseRot = seed * 40 - 20;
        var liveRot = baseRot + t * (seed * 320 - 60);
        dial.style.setProperty("--dial-rot", liveRot + "deg");
        dial.classList.toggle("is-live", t > 0.08 && seed < t + 0.15);
      });
      explainer.style.setProperty("--frozen-opacity", String(1 - t));
      explainer.style.setProperty("--live-opacity", String(t));
      if (frozenP) frozenP.style.setProperty("opacity", String(Math.max(0, 1 - t * 1.6)));
      if (liveP) liveP.style.setProperty("opacity", String(Math.min(1, t * 1.6)));
    }

    if (slider) {
      slider.addEventListener("input", function () {
        update(parseFloat(slider.value));
      });
      update(parseFloat(slider.value));
    }
  });

  /* ------------------------------------------------------------------ */
  /* Company / map cards (click to expand)                               */
  /* ------------------------------------------------------------------ */

  document.querySelectorAll(".company-card").forEach(function (card) {
    var head = card.querySelector(".company-card__head");
    var body = card.querySelector(".company-card__body");
    if (!head || !body) return;

    head.addEventListener("click", function () {
      var isOpen = card.classList.contains("is-open");
      card.classList.toggle("is-open", !isOpen);
      head.setAttribute("aria-expanded", !isOpen ? "true" : "false");
      body.style.maxHeight = !isOpen ? body.scrollHeight + "px" : null;
    });
  });

  document.querySelectorAll(".map-card").forEach(function (card) {
    card.addEventListener("click", function () {
      var wasOpen = card.classList.contains("is-open");
      document.querySelectorAll(".map-card.is-open").forEach(function (open) {
        if (open !== card) open.classList.remove("is-open");
      });
      card.classList.toggle("is-open", !wasOpen);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Market map filter toggle                                            */
  /* ------------------------------------------------------------------ */

  document.querySelectorAll(".filter-toggle").forEach(function (toggle) {
    var btns = Array.prototype.slice.call(toggle.querySelectorAll(".filter-toggle__btn"));
    var targetSelector = toggle.getAttribute("data-controls");
    var views = targetSelector ? document.querySelectorAll(targetSelector + " [data-view]") : [];

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var view = btn.getAttribute("data-view-target");
        btns.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        views.forEach(function (v) {
          v.style.display = v.getAttribute("data-view") === view ? "" : "none";
        });
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Collision diagram trigger                                           */
  /* ------------------------------------------------------------------ */

  var collisionEls = document.querySelectorAll(".collision");
  if ("IntersectionObserver" in window && collisionEls.length) {
    var collisionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-active");
          }
        });
      },
      { threshold: 0.4 }
    );
    collisionEls.forEach(function (el) {
      collisionObserver.observe(el);
    });
  } else {
    collisionEls.forEach(function (el) {
      el.classList.add("is-active");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Animated bar fills on scroll into view                               */
  /* ------------------------------------------------------------------ */

  var bars = document.querySelectorAll(".bar-row__fill, .cost-flow__seg[data-value]");
  if ("IntersectionObserver" in window && bars.length) {
    var barObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var target = entry.target.getAttribute("data-value");
            entry.target.style.width = target + "%";
            barObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    bars.forEach(function (bar) {
      barObserver.observe(bar);
    });
  } else {
    bars.forEach(function (bar) {
      bar.style.width = bar.getAttribute("data-value") + "%";
    });
  }
})();
