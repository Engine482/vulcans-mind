/* Vulcan's Mind — chat widget
 *
 * Vanilla JS, no framework. Privacy contract:
 * - Messages live in memory only; cleared on page unload or via Clear button.
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

  var COPY = {
    uk: {
      title: "Vulcan's Mind",
      launcher: "Відкрити чат Vulcan's Mind",
      close: "Закрити чат",
      clear: "Очистити чат",
      greeting:
        "Вітаю. Я Vulcan's Mind — AI-бот у контексті роботи, досвіду та дослідницьких інтересів Володимира «Вулкана» Моторного. Спираюсь на обмежену базу публічних джерел.",
      disclaimer:
        "Не є медичним сервісом. Відповіді мають інформаційний характер і спираються на обмежену базу джерел. Не діагностую і не призначаю лікування.",
      suggestedTitle: "Спробуйте запитати:",
      suggested: [
        "Що таке Vulcan's Mind?",
        "Що таке RAG і чому він важливий для AI-ботів?",
        "Як AI може допомогти у ментальному здоров'ї під час війни?",
        "Що таке «Люстерко» як ідея цифрового скринінгу станів?",
        "Які апаратні методики досліджують для ПТСР і депресії?",
        "Чому військовий контекст змінює дизайн цифрових інструментів?",
      ],
      placeholder: "Напишіть запитання…",
      send: "Надіслати",
      sending: "Шукаю в базі джерел…",
      sourcesLabel: "Джерела",
      errorRate: "Забагато запитів. Спробуйте трохи пізніше.",
      errorBad: "Не вдалося прийняти запит. Перевірте формулювання.",
      errorNetwork: "Сервіс недоступний. Спробуйте пізніше.",
      tooLong: "Максимум 1500 символів.",
    },
    en: {
      title: "Vulcan's Mind",
      launcher: "Open Vulcan's Mind chat",
      close: "Close chat",
      clear: "Clear chat",
      greeting:
        "Hi. I'm Vulcan's Mind — an AI chatbot in the public context of Volodymyr \"Vulcan\" Motornyi's work, experience, and research interests. I draw on a limited curated source library.",
      disclaimer:
        "Not a medical service. Answers are informational and grounded in a limited library. I do not diagnose or prescribe treatment.",
      suggestedTitle: "Try asking:",
      suggested: [
        "What is Vulcan's Mind?",
        "What is RAG and why does it matter for AI chatbots?",
        "How can AI help with wartime mental health?",
        "What is Lusterko as a digital screening idea?",
        "What device-based methods are studied for PTSD and depression?",
        "How does military context change the design of digital tools?",
      ],
      placeholder: "Type a question…",
      send: "Send",
      sending: "Searching the source library…",
      sourcesLabel: "Sources",
      errorRate: "Too many requests. Please try again shortly.",
      errorBad: "Could not accept that request. Try rephrasing.",
      errorNetwork: "Service unavailable. Please try again later.",
      tooLong: "1500 character maximum.",
    },
  };

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

    var root = el("div", { class: "vm-root", "data-lang": lang });

    var launcher = el("button", {
      type: "button",
      class: "vm-launcher",
      "aria-label": t.launcher,
      "aria-expanded": "false",
    });

    if (CONFIG.iconUrl) {
      launcher.appendChild(
        el("img", { src: CONFIG.iconUrl, alt: "" }),
      );
    } else {
      // Inline fallback glyph: simple brain-volcano abstraction.
      launcher.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">' +
        '<path d="M8 22c-2.5-3-2-7 1-9 1-3 4-5 7-4.5 3-2 7 0 8 3 3 0 5 3 4 6-1 3-3 4-5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M11 28l3-6h8l3 6H11z" fill="currentColor"/>' +
        '<path d="M17 22l1-4M19 22l-1-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        "</svg>";
    }

    var panel = el("div", {
      class: "vm-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": t.title,
      hidden: true,
    });

    var headerTitle = el("h2", { id: "vm-title", text: t.title });
    var clearBtn = el("button", {
      type: "button",
      class: "vm-icon-btn",
      "aria-label": t.clear,
      title: t.clear,
      html:
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l1 9a1 1 0 001 1h2a1 1 0 001-1l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        "</svg>",
    });
    var closeBtn = el("button", {
      type: "button",
      class: "vm-icon-btn",
      "aria-label": t.close,
      title: t.close,
      text: "×",
    });
    var header = el("header", { class: "vm-header" }, [
      headerTitle,
      clearBtn,
      closeBtn,
    ]);

    var greeting = el("div", { class: "vm-greeting", text: t.greeting });
    var disclaimer = el("div", {
      class: "vm-disclaimer",
      role: "note",
      text: t.disclaimer,
    });
    var suggestedTitle = el("div", {
      class: "vm-suggested-title vm-disclaimer",
      text: t.suggestedTitle,
    });
    var suggested = el("div", {
      class: "vm-suggested",
      role: "group",
      "aria-label": t.suggestedTitle,
    });
    t.suggested.forEach(function (q) {
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

    var messagesEl = el("div", {
      class: "vm-messages",
      role: "log",
      "aria-live": "polite",
      "aria-relevant": "additions",
    });

    var body = el("div", { class: "vm-body" }, [
      greeting,
      disclaimer,
      suggestedTitle,
      suggested,
      messagesEl,
    ]);

    var textarea = el("textarea", {
      class: "vm-textarea",
      rows: 2,
      maxlength: String(MAX_MESSAGE),
      placeholder: t.placeholder,
      "aria-label": t.placeholder,
    });
    var counter = el("div", {
      class: "vm-counter",
      "aria-live": "off",
      text: "0/" + MAX_MESSAGE,
    });
    var sendBtn = el("button", {
      type: "submit",
      class: "vm-send",
      text: t.send,
    });
    var form = el("form", { class: "vm-input" }, [textarea, counter, sendBtn]);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(form);
    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);

    function updateCounter() {
      counter.textContent = textarea.value.length + "/" + MAX_MESSAGE;
    }

    function scrollMessages() {
      body.scrollTop = body.scrollHeight;
    }

    function renderUser(text) {
      var bubble = el("div", { class: "vm-bubble", text: text });
      var msg = el("div", { class: "vm-msg vm-msg-user" }, [bubble]);
      messagesEl.appendChild(msg);
      scrollMessages();
    }

    function renderLoading() {
      var bubble = el("div", {
        class: "vm-bubble vm-bubble-loading",
        text: t.sending,
      });
      var msg = el("div", { class: "vm-msg vm-msg-bot" }, [bubble]);
      msg.dataset.role = "loading";
      messagesEl.appendChild(msg);
      scrollMessages();
      return msg;
    }

    function renderBotAnswer(answer, sources) {
      var bubble = el("div", { class: "vm-bubble", text: answer });
      var children = [bubble];
      if (sources && sources.length) {
        var label = el("div", { class: "vm-sources-label", text: t.sourcesLabel });
        var list = el("div", { class: "vm-sources" }, [label]);
        sources.forEach(function (s) {
          var meta = [s.authors, s.year, s.sourceType]
            .filter(Boolean)
            .join(" · ");
          var titleEl = el("div", { class: "vm-source-title", text: s.title });
          var metaEl = meta
            ? el("div", { class: "vm-source-meta", text: meta })
            : null;
          var node;
          if (s.url) {
            node = el(
              "a",
              {
                class: "vm-source",
                href: s.url,
                target: "_blank",
                rel: "noopener noreferrer",
              },
              [titleEl, metaEl],
            );
          } else {
            node = el("div", { class: "vm-source" }, [titleEl, metaEl]);
          }
          list.appendChild(node);
        });
        children.push(list);
      }
      var msg = el("div", { class: "vm-msg vm-msg-bot" }, children);
      messagesEl.appendChild(msg);
      scrollMessages();
    }

    function renderError(text) {
      var bubble = el("div", {
        class: "vm-bubble vm-bubble-error",
        role: "alert",
        text: text,
      });
      var msg = el("div", { class: "vm-msg vm-msg-bot" }, [bubble]);
      messagesEl.appendChild(msg);
      scrollMessages();
    }

    function clearChat() {
      messages.length = 0;
      while (messagesEl.firstChild) messagesEl.removeChild(messagesEl.firstChild);
      textarea.focus();
    }

    function setPending(p) {
      pending = p;
      sendBtn.disabled = p;
      textarea.disabled = p;
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
    clearBtn.addEventListener("click", clearChat);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        e.stopPropagation();
        closePanel();
      }
    });

    textarea.addEventListener("input", updateCounter);
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
      messages.push({ role: "user", text: raw });
      renderUser(raw);
      textarea.value = "";
      updateCounter();
      var loadingNode = renderLoading();
      setPending(true);

      try {
        var data = await callApi(raw);
        loadingNode.remove();
        messages.push({ role: "bot", text: data.answer });
        renderBotAnswer(data.answer, data.sources || []);
      } catch (err) {
        loadingNode.remove();
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

    updateCounter();

    return {
      open: openPanel,
      close: closePanel,
      clear: clearChat,
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
