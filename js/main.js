(function () {
  "use strict";

  /* Keep legacy .html entry points on their clean canonical URLs. */
  if (window.history && window.history.replaceState && /\.html$/.test(window.location.pathname)) {
    var cleanPath = window.location.pathname.replace(/(?:index)?\.html$/, "");
    window.history.replaceState(null, "", (cleanPath || "/") + window.location.search + window.location.hash);
  }

  /* ------------------------------------------------------------------ */
  /* Scroll progress + has-scrolled flag                                 */
  /* ------------------------------------------------------------------ */

  var progressBar = document.querySelector(".scroll-progress");
  var scrollTicking = false;

  function updateScrollProgress() {
    var doc = document.documentElement;
    var scrollTop = Math.max(window.scrollY || 0, doc.scrollTop || 0, document.body.scrollTop || 0);
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
  /* Company guide placement + Harmonic enrichment                       */
  /* ------------------------------------------------------------------ */

  document.querySelectorAll("[data-promote-after-intro]").forEach(function (section) {
    var main = section.closest("main");
    var hero = main ? main.querySelector(".hero") : null;
    var intro = hero ? hero.nextElementSibling : null;
    if (intro) intro.insertAdjacentElement("afterend", section);
  });

  var companyData = window.COMPANY_ENRICHMENT || {};

  function fundingLabel(value) {
    return value.charAt(0) === "$" ? value + " funding" : value;
  }

  function websiteLabel(url) {
    try {
      var host = new URL(url).hostname.replace(/^www\./, "");
      var path = new URL(url).pathname.replace(/\/$/, "");
      if (host === "github.com" && path) return host + path;
      return host;
    } catch (err) {
      return url;
    }
  }

  function makeWebsiteLine(url) {
    var line = document.createElement("p");
    line.className = "company-card__site";
    var link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = websiteLabel(url);
    link.appendChild(document.createTextNode(" ↗"));
    line.appendChild(link);
    return line;
  }

  function makeFounderLine(founders) {
    var line = document.createElement("p");
    line.className = "company-card__founders";
    line.appendChild(document.createTextNode((founders.length === 1 ? "Founder: " : "Founders: ")));

    founders.forEach(function (founder, index) {
      if (index) line.appendChild(document.createTextNode(", "));
      var link = document.createElement("a");
      link.href = founder[1];
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = founder[0];
      link.appendChild(document.createTextNode(" ↗"));
      line.appendChild(link);
    });

    return line;
  }

  document.querySelectorAll(".company-card").forEach(function (card) {
    var title = card.querySelector(".card-title");
    var data = title ? companyData[title.textContent.trim()] : null;
    if (!data) return;

    var meta = card.querySelector(".company-card__meta");
    if (meta) {
      meta.innerHTML = "";
      ["Founded " + data.founded, fundingLabel(data.funding), data.headcount.toLocaleString() + " people"].forEach(function (value) {
        var item = document.createElement("span");
        item.textContent = value;
        meta.appendChild(item);
      });
    }

    var body = card.querySelector(".company-card__body-inner");
    var oldFounders = card.querySelector(".company-card__founders");
    var oldSite = card.querySelector(".company-card__site");
    if (oldSite) oldSite.remove();

    if (oldFounders) oldFounders.replaceWith(makeFounderLine(data.founders));
    else if (body) body.appendChild(makeFounderLine(data.founders));

    if (data.website && body) {
      var foundersLine = card.querySelector(".company-card__founders");
      var siteLine = makeWebsiteLine(data.website);
      if (foundersLine) foundersLine.insertAdjacentElement("afterend", siteLine);
      else body.appendChild(siteLine);
    }
  });

  document.querySelectorAll(".map-card").forEach(function (card) {
    var title = card.querySelector(".map-card__title");
    var data = title ? companyData[title.textContent.trim()] : null;
    if (!data) return;

    var label = card.querySelector(".map-card__label");
    if (label) {
      label.textContent =
        "Founded " + data.founded + " · " +
        fundingLabel(data.funding) + " · " +
        data.headcount.toLocaleString() + " people";
    }

    var detail = card.querySelector(".map-card__detail");
    if (!detail) return;

    var oldFounders = detail.querySelector(".company-card__founders");
    var oldSite = detail.querySelector(".company-card__site");
    if (oldFounders) oldFounders.remove();
    if (oldSite) oldSite.remove();

    detail.appendChild(makeFounderLine(data.founders));
    if (data.website) detail.appendChild(makeWebsiteLine(data.website));
  });

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

    var activeIndex = -1;

    function setActive(index) {
      if (index === activeIndex) return;
      activeIndex = index;
      stages.forEach(function (stage, i) {
        stage.classList.toggle("is-active", i === index);
      });
      if (fill) {
        var pct = stages.length > 1 ? (index / (stages.length - 1)) * 100 : 100;
        fill.style.height = pct + "%";
      }
    }

    function updateActiveStage() {
      var focusY = window.innerHeight * 0.38;
      var bestIndex = 0;
      var bestDistance = Infinity;

      stages.forEach(function (stage, index) {
        var rect = stage.getBoundingClientRect();
        // Prefer the stage whose top edge is nearest the focus line, so short
        // stages (like November 2025) still get a turn while scrolling.
        var distance = Math.abs(rect.top - focusY);
        if (rect.bottom > 80 && rect.top < window.innerHeight - 80 && distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      setActive(bestIndex);
    }

    var timelineTicking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (timelineTicking) return;
        timelineTicking = true;
        requestAnimationFrame(function () {
          updateActiveStage();
          timelineTicking = false;
        });
      },
      { passive: true }
    );
    window.addEventListener("resize", updateActiveStage);

    updateActiveStage();
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
      if (!isOpen) {
        panel.style.maxHeight = panel.scrollHeight + "px";
        // Let tall tables finish layout, then unlock height so nested scroll works.
        requestAnimationFrame(function () {
          panel.style.maxHeight = panel.scrollHeight + "px";
          var unlock = function () {
            if (item.classList.contains("is-open")) panel.style.maxHeight = "none";
            panel.removeEventListener("transitionend", unlock);
          };
          panel.addEventListener("transitionend", unlock);
        });
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
        requestAnimationFrame(function () {
          panel.style.maxHeight = null;
        });
      }
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

  /* ------------------------------------------------------------------ */
  /* Pong vs AI                                                         */
  /* ------------------------------------------------------------------ */

  var pongCanvas = document.getElementById("pong-canvas");
  if (pongCanvas) {
    var ctx = pongCanvas.getContext("2d");
    var startButton = document.getElementById("pong-start");
    var resetButton = document.getElementById("pong-reset");
    var overlay = document.getElementById("pong-overlay");
    var status = document.getElementById("pong-status");
    var playerScoreEl = document.getElementById("pong-player-score");
    var aiScoreEl = document.getElementById("pong-ai-score");
    var width = pongCanvas.width;
    var height = pongCanvas.height;
    var winningScore = 7;
    var running = false;
    var serveDelay = 0;
    var lastTime = performance.now();
    var keys = { up: false, down: false };

    var player = { x: 34, y: height / 2 - 46, w: 14, h: 92, score: 0 };
    var ai = { x: width - 48, y: height / 2 - 46, w: 14, h: 92, score: 0 };
    var ball = { x: width / 2, y: height / 2, r: 8, vx: 0, vy: 0 };

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function updateScore() {
      playerScoreEl.textContent = player.score;
      aiScoreEl.textContent = ai.score;
    }

    function resetBall(direction) {
      ball.x = width / 2;
      ball.y = height / 2;
      var angle = (Math.random() * 0.8 - 0.4);
      var speed = 860;
      ball.vx = Math.cos(angle) * speed * direction;
      ball.vy = Math.sin(angle) * speed;
      serveDelay = 0.4;
    }

    function resetMatch() {
      player.score = 0;
      ai.score = 0;
      player.y = height / 2 - player.h / 2;
      ai.y = height / 2 - ai.h / 2;
      running = false;
      resetBall(Math.random() > 0.5 ? 1 : -1);
      updateScore();
      status.textContent = "First to 7 wins";
      startButton.textContent = "Start game";
      overlay.classList.remove("is-hidden");
      draw();
    }

    function startGame() {
      if (player.score >= winningScore || ai.score >= winningScore) {
        player.score = 0;
        ai.score = 0;
        updateScore();
        resetBall(Math.random() > 0.5 ? 1 : -1);
      }
      running = true;
      overlay.classList.add("is-hidden");
      pongCanvas.focus();
    }

    function finishGame(winner) {
      running = false;
      status.textContent = winner === "player" ? "You beat the AI." : "The AI wins. Rematch?";
      startButton.textContent = "Play again";
      overlay.classList.remove("is-hidden");
    }

    function scorePoint(side) {
      if (side === "player") player.score += 1;
      else ai.score += 1;
      updateScore();

      if (player.score >= winningScore) {
        finishGame("player");
      } else if (ai.score >= winningScore) {
        finishGame("ai");
      } else {
        resetBall(side === "player" ? -1 : 1);
      }
    }

    function paddleHit(paddle, isPlayer) {
      var movingTowardPaddle = isPlayer ? ball.vx < 0 : ball.vx > 0;
      var overlapsX = ball.x + ball.r >= paddle.x && ball.x - ball.r <= paddle.x + paddle.w;
      var overlapsY = ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h;
      if (!movingTowardPaddle || !overlapsX || !overlapsY) return;

      var relativeHit = (ball.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2);
      var speed = Math.min(1520, Math.hypot(ball.vx, ball.vy) * 1.055);
      var angle = relativeHit * 0.92;
      ball.vx = Math.cos(angle) * speed * (isPlayer ? 1 : -1);
      ball.vy = Math.sin(angle) * speed;
      ball.x = isPlayer ? paddle.x + paddle.w + ball.r : paddle.x - ball.r;
    }

    function update(dt) {
      if (!running) return;

      var playerSpeed = 1120;
      if (keys.up) player.y -= playerSpeed * dt;
      if (keys.down) player.y += playerSpeed * dt;
      player.y = clamp(player.y, 0, height - player.h);

      var aiCenter = ai.y + ai.h / 2;
      var trackingError = Math.sin(performance.now() / 650) * 22;
      var aiTarget = ball.y + trackingError;
      var aiSpeed = ball.vx > 0 ? 710 : 490;
      ai.y += clamp(aiTarget - aiCenter, -aiSpeed * dt, aiSpeed * dt);
      ai.y = clamp(ai.y, 0, height - ai.h);

      if (serveDelay > 0) {
        serveDelay -= dt;
        return;
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.y - ball.r <= 0) {
        ball.y = ball.r;
        ball.vy = Math.abs(ball.vy);
      } else if (ball.y + ball.r >= height) {
        ball.y = height - ball.r;
        ball.vy = -Math.abs(ball.vy);
      }

      paddleHit(player, true);
      paddleHit(ai, false);

      if (ball.x + ball.r < 0) scorePoint("ai");
      else if (ball.x - ball.r > width) scorePoint("player");
    }

    function drawCourt() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#0e100c";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 14]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 20);
      ctx.lineTo(width / 2, height - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "rgba(219, 234, 172, 0.12)";
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 72, 0, Math.PI * 2);
      ctx.stroke();
    }

    function draw() {
      drawCourt();

      ctx.fillStyle = "#dbeaac";
      ctx.shadowColor = "rgba(219, 234, 172, 0.38)";
      ctx.shadowBlur = 14;
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.fillRect(ai.x, ai.y, ai.w, ai.h);

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = "#f4f5ef";
      ctx.fill();
      ctx.shadowBlur = 0;

      if (running && serveDelay > 0) {
        ctx.fillStyle = "rgba(244, 245, 239, 0.52)";
        ctx.font = "600 13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GET READY", width / 2, height / 2 + 48);
      }
    }

    function gameLoop(now) {
      var dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      update(dt);
      draw();
      requestAnimationFrame(gameLoop);
    }

    function movePlayerFromPointer(event) {
      var rect = pongCanvas.getBoundingClientRect();
      var pointerY = (event.clientY - rect.top) * (height / rect.height);
      player.y = clamp(pointerY - player.h / 2, 0, height - player.h);
    }

    pongCanvas.addEventListener("pointermove", movePlayerFromPointer);
    pongCanvas.addEventListener("pointerdown", function (event) {
      movePlayerFromPointer(event);
      if (!running) startGame();
    });

    window.addEventListener("keydown", function (event) {
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        keys.up = true;
        event.preventDefault();
      }
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        keys.down = true;
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", function (event) {
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") keys.up = false;
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") keys.down = false;
    });

    startButton.addEventListener("click", startGame);
    resetButton.addEventListener("click", resetMatch);
    resetMatch();
    requestAnimationFrame(gameLoop);
  }

  /* ------------------------------------------------------------------ */
  /* Resume — horizontal experience timeline                             */
  /* ------------------------------------------------------------------ */

  var resumeTrack = document.getElementById("resume-track");
  if (resumeTrack) {
    var resumeStops = Array.prototype.slice.call(resumeTrack.querySelectorAll(".resume-stop"));
    var resumeSpacers = Array.prototype.slice.call(resumeTrack.querySelectorAll(".resume-track__spacer"));
    var resumeFill = document.getElementById("resume-spine-fill");
    var resumeProgress = document.getElementById("resume-progress-fill");
    var resumeActive = -1;
    var resumeTicking = false;

    function resumeMaxScroll() {
      return Math.max(0, resumeTrack.scrollWidth - resumeTrack.clientWidth);
    }

    function sizeResumeSpacers() {
      if (!resumeStops.length || !resumeSpacers.length) return;
      var stopWidth = resumeStops[0].getBoundingClientRect().width;
      var pad = Math.max(24, Math.round(resumeTrack.clientWidth / 2 - stopWidth / 2));
      resumeSpacers.forEach(function (spacer) {
        spacer.style.flex = "0 0 " + pad + "px";
        spacer.style.width = pad + "px";
        spacer.style.minWidth = pad + "px";
      });
    }

    function centerResumeStop(index, behavior) {
      var stop = resumeStops[index];
      if (!stop) return;
      var wrapRect = resumeTrack.getBoundingClientRect();
      var stopRect = stop.getBoundingClientRect();
      var delta = stopRect.left + stopRect.width / 2 - (wrapRect.left + wrapRect.width / 2);
      var target = resumeTrack.scrollLeft + delta;
      target = Math.max(0, Math.min(resumeMaxScroll(), target));
      resumeTrack.scrollTo({ left: target, behavior: behavior || "auto" });
    }

    function setResumeActive(index) {
      if (index === resumeActive) return;
      resumeActive = index;
      resumeStops.forEach(function (stop, i) {
        stop.classList.toggle("is-active", i === index);
      });
    }

    function updateResumeTimeline() {
      var max = resumeMaxScroll();
      var scrollLeft = resumeTrack.scrollLeft;
      var pct = max > 0 ? (scrollLeft / max) * 100 : 0;
      if (resumeFill) resumeFill.style.width = pct + "%";
      if (resumeProgress) resumeProgress.style.width = pct + "%";

      var n = resumeStops.length;
      if (!n) {
        resumeTicking = false;
        return;
      }

      // Whichever stop is closest to the viewport center is active. With side
      // spacers, Apple starts centered and the final stop can center at the end.
      var wrapRect = resumeTrack.getBoundingClientRect();
      var focusX = wrapRect.left + wrapRect.width / 2;
      var bestIndex = 0;
      var bestDist = Infinity;

      for (var i = 0; i < n; i++) {
        var stopRect = resumeStops[i].getBoundingClientRect();
        var stopCenter = stopRect.left + stopRect.width / 2;
        var dist = Math.abs(stopCenter - focusX);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }

      if (scrollLeft <= 2) bestIndex = 0;
      if (max > 0 && scrollLeft >= max - 2) bestIndex = n - 1;

      setResumeActive(bestIndex);
      resumeTicking = false;
    }

    function requestResumeUpdate() {
      if (resumeTicking) return;
      resumeTicking = true;
      requestAnimationFrame(updateResumeTimeline);
    }

    function layoutResumeTrack(recenterFirst) {
      sizeResumeSpacers();
      if (recenterFirst) {
        requestAnimationFrame(function () {
          sizeResumeSpacers();
          resumeTrack.scrollLeft = 0;
          centerResumeStop(0, "auto");
          setResumeActive(0);
          updateResumeTimeline();
        });
        return;
      }
      updateResumeTimeline();
    }

    resumeTrack.addEventListener(
      "wheel",
      function (event) {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        var max = resumeMaxScroll();
        if (max <= 0) return;
        var atStart = resumeTrack.scrollLeft <= 0 && event.deltaY < 0;
        var atEnd = resumeTrack.scrollLeft >= max - 1 && event.deltaY > 0;
        if (atStart || atEnd) return;
        event.preventDefault();
        resumeTrack.scrollLeft += event.deltaY;
        requestResumeUpdate();
      },
      { passive: false }
    );

    resumeTrack.addEventListener("scroll", requestResumeUpdate, { passive: true });
    window.addEventListener("resize", function () {
      layoutResumeTrack(false);
    });

    /* Click-and-drag to scrub the timeline (mouse / pen). Touch keeps native swipe. */
    var resumeDrag = null;

    resumeTrack.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch") return;
      if (event.button !== 0) return;
      resumeDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScroll: resumeTrack.scrollLeft,
        moved: false,
      };
      resumeTrack.classList.add("is-dragging");
      resumeTrack.setPointerCapture(event.pointerId);
    });

    resumeTrack.addEventListener("pointermove", function (event) {
      if (!resumeDrag || event.pointerId !== resumeDrag.pointerId) return;
      var dx = event.clientX - resumeDrag.startX;
      if (!resumeDrag.moved && Math.abs(dx) > 4) resumeDrag.moved = true;
      if (!resumeDrag.moved) return;
      event.preventDefault();
      resumeTrack.scrollLeft = resumeDrag.startScroll - dx;
      requestResumeUpdate();
    });

    function endResumeDrag(event) {
      if (!resumeDrag || event.pointerId !== resumeDrag.pointerId) return;
      var moved = resumeDrag.moved;
      resumeDrag = null;
      resumeTrack.classList.remove("is-dragging");
      if (moved) {
        resumeTrack.dataset.dragMoved = "1";
        var snapIndex = resumeActive >= 0 ? resumeActive : 0;
        centerResumeStop(snapIndex, "smooth");
      }
    }

    resumeTrack.addEventListener("pointerup", endResumeDrag);
    resumeTrack.addEventListener("pointercancel", endResumeDrag);

    resumeTrack.addEventListener(
      "click",
      function (event) {
        if (resumeTrack.dataset.dragMoved !== "1") return;
        event.preventDefault();
        event.stopPropagation();
        delete resumeTrack.dataset.dragMoved;
      },
      true
    );

    resumeTrack.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        var next = Math.min(resumeStops.length - 1, Math.max(0, resumeActive) + 1);
        centerResumeStop(next, "smooth");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        var prev = Math.max(0, Math.max(0, resumeActive) - 1);
        centerResumeStop(prev, "smooth");
      } else if (event.key === "Home") {
        event.preventDefault();
        centerResumeStop(0, "smooth");
      } else if (event.key === "End") {
        event.preventDefault();
        centerResumeStop(resumeStops.length - 1, "smooth");
      }
    });

    layoutResumeTrack(true);
  }
})();
