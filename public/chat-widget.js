/* Vulcan's Mind — chat widget
 *
 * Vanilla JS, no framework. Privacy contract:
 * - Messages live in memory only; cleared on page unload or via reset button.
 * - localStorage is never used.
 * - sessionStorage stores only an anonymous session id (`vm_sid`).
 * - The widget never logs message text or answer text to the console.
 *
 * Configure via:
 *   window.VULCANS_MIND_CONFIG = { apiBaseUrl: "https://api.example", language: "uk" };
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;
  if (window.__VULCANS_MIND_LOADED__) return;
  window.__VULCANS_MIND_LOADED__ = true;

  var CONFIG = Object.assign(
    { apiBaseUrl: "", language: "auto", iconUrl: "" },
    window.VULCANS_MIND_CONFIG || {},
  );

  var MAX_MESSAGE = 1500;
  var COUNTER_WARN_AT = 1200;
  var SUGGESTED_VISIBLE = 3;
  var TYPEWRITER_WORDS_PER_TICK_SHORT = 3;
  var TYPEWRITER_WORDS_PER_TICK_LONG = 8;
  var TYPEWRITER_INTERVAL_MS = 40;
  var TYPEWRITER_MAX_DURATION_MS = 5000;

  var COPY = {
    uk: {
      title: "Vulcan's Mind",
      launcher: "Відкрити чат Vulcan's Mind",
      close: "Закрити чат",
      reset: "Нова розмова",
      greeting:
        "Вітаю. Я Vulcan's Mind — AI-бот про роботу, проєкти, досвід і дослідницькі інтереси Володимира «Вулкана» Моторного. Можу пояснити ідеї «Люстерка», Vulcan's Mind, підходи до AI-автоматизації, психометрики, RAG/LLM, ментального здоров'я та human–AI взаємодії.",
      disclaimer:
        "Не є медичним сервісом і не замінює професійну консультацію.",
      suggested: [
        "Що таке Vulcan's Mind і для чого він потрібен?",
        "Над якими проєктами працює Вулкан?",
        "Що таке «Люстерко» і яку проблему воно вирішує?",
        "Як AI можна використати в охороні ментального здоров'я?",
        "Що таке RAG і чому він важливий для AI-ботів?",
        "Як військовий контекст змінює дизайн цифрових інструментів?",
        "Які підходи можуть допомагати з увагою, стресом і продуктивністю?",
        "Чим Vulcan's Mind відрізняється від звичайного чат-бота?",
        "Як AI може допомогти командиру краще бачити стан підрозділу?",
        "Чому цифровий скринінг не має перетворюватися на автоматичну діагностику?",
        "Як поєднати психометрику, когнітивні тести й AI без зайвого хайпу?",
        "Що означає human–AI взаємодія в практичних продуктах?",
      ],
      placeholder: "Напишіть запитання…",
      send: "Надіслати",
      errorRate: "Забагато запитів. Спробуйте трохи пізніше.",
      errorBad: "Не вдалося прийняти запит. Перевірте формулювання.",
      errorNetwork:
        "Не вдалося отримати відповідь. Спробуйте ще раз або переформулюй питання.",
      tooLong: "Запит задовгий. Скороти його до 1500 символів.",
    },
    en: {
      title: "Vulcan's Mind",
      launcher: "Open Vulcan's Mind chat",
      close: "Close chat",
      reset: "New conversation",
      greeting:
        "Hi. I'm Vulcan's Mind — an AI chatbot about the work, projects, experience and research interests of Volodymyr \"Vulcan\" Motornyi. I can explain the ideas behind Lusterko, Vulcan's Mind, AI automation, psychometrics, RAG/LLM, mental health and human–AI interaction.",
      disclaimer:
        "Not a medical service. Does not replace professional consultation.",
      suggested: [
        "What is Vulcan's Mind and what is it for?",
        "What projects is Vulcan working on?",
        "What is Lusterko and what problem does it solve?",
        "How can AI be used in mental health support?",
        "What is RAG and why does it matter for AI chatbots?",
        "How does military context change the design of digital tools?",
        "What approaches can help with attention, stress and productivity?",
        "How does Vulcan's Mind differ from a generic chatbot?",
        "How can AI help a commander see the state of a unit more clearly?",
        "Why shouldn't digital screening turn into automatic diagnosis?",
        "How to combine psychometrics, cognitive tests and AI without hype?",
        "What does human–AI interaction mean in practical products?",
      ],
      placeholder: "Type a question…",
      send: "Send",
      errorRate: "Too many requests. Please try again shortly.",
      errorBad: "Could not accept that request. Try rephrasing.",
      errorNetwork:
        "Couldn't get a response. Try again or rephrase your question.",
      tooLong: "Message is too long. Trim it to 1500 characters.",
    },
  };

  // SVG icons. aria-hidden so screen readers fall back to the button label.
  var ICON_ROTATE_CCW =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 12a9 9 0 1 0 3-6.7"/>' +
    '<polyline points="3 4 3 10 9 10"/>' +
    "</svg>";
  var ICON_CLOSE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="6" y1="6" x2="18" y2="18"/>' +
    '<line x1="18" y1="6" x2="6" y2="18"/>' +
    "</svg>";
  var ICON_ARROW_UP =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="12" y1="19" x2="12" y2="5"/>' +
    '<polyline points="5 12 12 5 19 12"/>' +
    "</svg>";
  var ICON_LAUNCHER =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">' +
    '<path d="M8 22c-2.5-3-2-7 1-9 1-3 4-5 7-4.5 3-2 7 0 8 3 3 0 5 3 4 6-1 3-3 4-5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M11 28l3-6h8l3 6H11z" fill="currentColor"/>' +
    '<path d="M17 22l1-4M19 22l-1-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    "</svg>";

  function detectLang() {
    var c = (CONFIG.language || "auto").toLowerCase();
    if (c === "uk" || c === "en") return c;
    var docLang = (
      document.documentElement.getAttribute("lang") || ""
    ).toLowerCase();
    if (docLang.indexOf("uk") === 0) return "uk";
    if (docLang.indexOf("en") === 0) return "en";
    var nav = (navigator.language || "").toLowerCase();
    return nav.indexOf("uk") === 0 ? "uk" : "en";
  }

  function getSessionId() {
    try {
      var existing = window.sessionStorage.getItem("vm_sid");
      if (existing) return existing;
      var fresh =
        "anon_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 10);
      window.sessionStorage.setItem("vm_sid", fresh);
      return fresh;
    } catch (_) {
      return undefined;
    }
  }

  function pickRandom(list, n) {
    var copy = list.slice();
    var out = [];
    while (copy.length > 0 && out.length < n) {
      var idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k.indexOf("on") === 0 && typeof v === "function")
          node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function VulcansMindWidget() {
    var lang = detectLang();
    var t = COPY[lang];
    var messages = []; // in memory only, never persisted
    var pending = false;
    var hasUserSent = false;
    var typewriterTimer = null;

    var root = el("div", { class: "vm-root", "data-lang": lang });

    var launcher = el("button", {
      type: "button",
      class: "vm-launcher",
      "aria-label": t.launcher,
      "aria-expanded": "false",
    });

    if (CONFIG.iconUrl) {
      launcher.appendChild(el("img", { src: CONFIG.iconUrl, alt: "" }));
    } else {
      launcher.innerHTML = ICON_LAUNCHER;
    }

    var panel = el("div", {
      class: "vm-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": t.title,
      hidden: true,
    });

    var headerTitle = el("h2", { id: "vm-title", text: t.title });
    var resetBtn = el("button", {
      type: "button",
      class: "vm-icon-btn",
      "aria-label": t.reset,
      title: t.reset,
      html: ICON_ROTATE_CCW,
    });
    var closeBtn = el("button", {
      type: "button",
      class: "vm-icon-btn",
      "aria-label": t.close,
      title: t.close,
      html: ICON_CLOSE,
    });
    var header = el("header", { class: "vm-header" }, [
      headerTitle,
      resetBtn,
      closeBtn,
    ]);

    var greeting = el("div", { class: "vm-greeting", text: t.greeting });
    var disclaimer = el("div", {
      class: "vm-disclaimer",
      role: "note",
      text: t.disclaimer,
    });

    var suggested = el("div", {
      class: "vm-suggested",
      role: "group",
      "aria-label": t.title,
    });

    function renderSuggested() {
      while (suggested.firstChild) suggested.removeChild(suggested.firstChild);
      var picks = pickRandom(t.suggested, SUGGESTED_VISIBLE);
      picks.forEach(function (q) {
        suggested.appendChild(
          el("button", {
            type: "button",
            class: "vm-chip",
            text: q,
            onclick: function () {
              textarea.value = q;
              updateCounter();
              send();
            },
          }),
        );
      });
    }

    var messagesEl = el("div", {
      class: "vm-messages",
      role: "log",
      "aria-live": "polite",
      "aria-relevant": "additions",
    });

    var body = el("div", { class: "vm-body" }, [
      greeting,
      disclaimer,
      suggested,
      messagesEl,
    ]);

    var textarea = el("textarea", {
      class: "vm-textarea",
      rows: 1,
      maxlength: String(MAX_MESSAGE),
      placeholder: t.placeholder,
      "aria-label": t.placeholder,
    });
    var counter = el("div", {
      class: "vm-counter",
      "aria-live": "off",
      hidden: true,
    });
    var sendBtn = el("button", {
      type: "submit",
      class: "vm-send",
      "aria-label": t.send,
      title: t.send,
      html: ICON_ARROW_UP,
    });
    var form = el("form", { class: "vm-input" }, [textarea, sendBtn, counter]);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(form);
    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);

    function updateCounter() {
      var len = textarea.value.length;
      if (len < COUNTER_WARN_AT) {
        counter.hidden = true;
        counter.classList.remove("is-error");
        return;
      }
      counter.hidden = false;
      counter.textContent = len + "/" + MAX_MESSAGE;
      counter.classList.toggle("is-error", len > MAX_MESSAGE);
    }

    function autoResizeTextarea() {
      textarea.style.height = "auto";
      var next = Math.min(textarea.scrollHeight, 140);
      textarea.style.height = next + "px";
    }

    function isNearBottom() {
      var threshold = 80;
      return body.scrollTop + body.clientHeight >= body.scrollHeight - threshold;
    }

    function scrollToBottom(force) {
      if (force || isNearBottom()) {
        body.scrollTop = body.scrollHeight;
      }
    }

    function hideSuggestedAfterFirstSend() {
      if (!hasUserSent) {
        hasUserSent = true;
        suggested.hidden = true;
      }
    }

    function renderUser(text) {
      var bubble = el("div", { class: "vm-bubble", text: text });
      var msg = el("div", { class: "vm-msg vm-msg-user" }, [bubble]);
      messagesEl.appendChild(msg);
      scrollToBottom(true);
    }

    function renderTyping() {
      var typing = el("div", { class: "vm-bubble vm-typing" }, [
        el("span", { class: "vm-typing-dot" }),
        el("span", { class: "vm-typing-dot" }),
        el("span", { class: "vm-typing-dot" }),
      ]);
      var msg = el("div", { class: "vm-msg vm-msg-bot" }, [typing]);
      msg.dataset.role = "typing";
      messagesEl.appendChild(msg);
      scrollToBottom(true);
      return msg;
    }

    function stopTypewriter() {
      if (typewriterTimer != null) {
        clearInterval(typewriterTimer);
        typewriterTimer = null;
      }
    }

    function renderBotAnswer(answer) {
      var bubble = el("div", { class: "vm-bubble", text: "" });
      var msg = el("div", { class: "vm-msg vm-msg-bot" }, [bubble]);
      messagesEl.appendChild(msg);
      scrollToBottom(false);
      runTypewriter(bubble, answer);
    }

    function runTypewriter(target, answer) {
      stopTypewriter();
      var words = answer.split(/(\s+)/);
      var idx = 0;
      var chunkSize =
        answer.length > 600
          ? TYPEWRITER_WORDS_PER_TICK_LONG
          : TYPEWRITER_WORDS_PER_TICK_SHORT;
      var startedAt = Date.now();

      function finishNow() {
        target.textContent = answer;
        stopTypewriter();
        scrollToBottom(false);
      }

      typewriterTimer = setInterval(function () {
        if (Date.now() - startedAt > TYPEWRITER_MAX_DURATION_MS) {
          finishNow();
          return;
        }
        idx += chunkSize * 2; // *2 because split keeps whitespace tokens
        if (idx >= words.length) {
          finishNow();
          return;
        }
        target.textContent = words.slice(0, idx).join("");
        scrollToBottom(false);
      }, TYPEWRITER_INTERVAL_MS);
    }

    function renderError(text) {
      var bubble = el("div", {
        class: "vm-bubble vm-bubble-error",
        role: "alert",
        text: text,
      });
      var msg = el("div", { class: "vm-msg vm-msg-bot" }, [bubble]);
      messagesEl.appendChild(msg);
      scrollToBottom(true);
    }

    function resetChat() {
      stopTypewriter();
      messages.length = 0;
      while (messagesEl.firstChild) messagesEl.removeChild(messagesEl.firstChild);
      hasUserSent = false;
      suggested.hidden = false;
      renderSuggested();
      textarea.value = "";
      autoResizeTextarea();
      updateCounter();
      textarea.focus();
    }

    function setPending(p) {
      pending = p;
      sendBtn.disabled = p || textarea.value.trim().length === 0;
    }

    function openPanel() {
      panel.hidden = false;
      launcher.setAttribute("aria-expanded", "true");
      setTimeout(function () {
        textarea.focus();
      }, 0);
    }

    function closePanel() {
      panel.hidden = true;
      launcher.setAttribute("aria-expanded", "false");
      launcher.focus();
    }

    function togglePanel() {
      if (panel.hidden) openPanel();
      else closePanel();
    }

    launcher.addEventListener("click", togglePanel);
    closeBtn.addEventListener("click", closePanel);
    resetBtn.addEventListener("click", resetChat);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        e.stopPropagation();
        closePanel();
      }
    });

    textarea.addEventListener("input", function () {
      updateCounter();
      autoResizeTextarea();
      sendBtn.disabled = pending || textarea.value.trim().length === 0;
    });
    textarea.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      send();
    });

    async function send() {
      if (pending) return;
      var raw = textarea.value.trim();
      if (raw.length === 0) return;
      if (raw.length > MAX_MESSAGE) {
        renderError(t.tooLong);
        return;
      }
      hideSuggestedAfterFirstSend();
      messages.push({ role: "user", text: raw });
      renderUser(raw);
      textarea.value = "";
      autoResizeTextarea();
      updateCounter();
      var typingNode = renderTyping();
      setPending(true);

      try {
        var data = await callApi(raw);
        typingNode.remove();
        var answer = (data && data.answer) || "";
        messages.push({ role: "bot", text: answer });
        renderBotAnswer(answer);
      } catch (err) {
        typingNode.remove();
        stopTypewriter();
        var msg;
        if (err && err.status === 429) msg = t.errorRate;
        else if (err && err.status === 400) msg = t.errorBad;
        else msg = t.errorNetwork;
        renderError(msg);
      } finally {
        setPending(false);
        textarea.focus();
      }
    }

    function callApi(message) {
      var url = (CONFIG.apiBaseUrl || "").replace(/\/+$/, "") + "/api/chat";
      var body = {
        message: message,
        language: CONFIG.language || "auto",
      };
      var sid = getSessionId();
      if (sid) body.sessionId = sid;
      return fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(function (res) {
        if (!res.ok) {
          var err = new Error("api_error");
          err.status = res.status;
          throw err;
        }
        return res.json();
      });
    }

    renderSuggested();
    updateCounter();
    autoResizeTextarea();
    setPending(false);

    return {
      open: openPanel,
      close: closePanel,
      reset: resetChat,
      element: root,
    };
  }

  function init() {
    try {
      window.VulcansMind = VulcansMindWidget();
    } catch (_) {
      // Fail closed: never break the host page.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
