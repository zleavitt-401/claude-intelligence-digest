/* ================================================================
   chat.js — Inline chat panel for Claude Intelligence Digest
   Mounts into #chat-panel, reads data-digest-date attribute,
   sends questions to /api/chat with conversation history.
   ================================================================ */

(function () {
  'use strict';

  var panel = document.getElementById('chat-panel');
  if (!panel) return;

  var digestDate = panel.getAttribute('data-digest-date');
  var history = [];
  var isLoading = false;

  // Build chat UI using safe DOM methods only
  function render() {
    // Clear panel safely
    while (panel.firstChild) {
      panel.removeChild(panel.firstChild);
    }
    panel.className = 'chat-panel';

    var container = document.createElement('div');
    container.className = 'container';

    // Header
    var header = document.createElement('div');
    header.className = 'chat-header';

    var title = document.createElement('h3');
    title.className = 'chat-title';
    title.textContent = 'Ask about today\u2019s digest';

    var subtitle = document.createElement('p');
    subtitle.className = 'chat-subtitle';
    subtitle.textContent = 'Claude has full context of this digest and your projects.';

    header.appendChild(title);
    header.appendChild(subtitle);
    container.appendChild(header);

    // Messages area
    var messages = document.createElement('div');
    messages.id = 'chat-messages';
    messages.className = 'chat-messages';
    container.appendChild(messages);

    // Input area
    var inputRow = document.createElement('form');
    inputRow.className = 'chat-input-row';
    inputRow.autocomplete = 'off';

    var input = document.createElement('input');
    input.id = 'chat-input';
    input.type = 'text';
    input.className = 'chat-input';
    input.placeholder = 'How does this affect my projects?';

    var btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'chat-send';
    btn.textContent = 'Send';

    inputRow.appendChild(input);
    inputRow.appendChild(btn);
    container.appendChild(inputRow);

    panel.appendChild(container);

    // Event handler
    inputRow.addEventListener('submit', function (e) {
      e.preventDefault();
      var question = input.value.trim();
      if (!question || isLoading) return;
      input.value = '';
      sendMessage(question);
    });
  }

  function appendMessage(role, text) {
    var messages = document.getElementById('chat-messages');
    if (!messages) return;

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble--' + role;

    var label = document.createElement('span');
    label.className = 'chat-label';
    label.textContent = role === 'user' ? 'You' : 'Claude';

    var content = document.createElement('div');
    content.className = 'chat-content';
    content.textContent = text;

    bubble.appendChild(label);
    bubble.appendChild(content);
    messages.appendChild(bubble);

    // Scroll to bottom
    messages.scrollTop = messages.scrollHeight;
  }

  function showLoading() {
    var messages = document.getElementById('chat-messages');
    if (!messages) return;

    var loader = document.createElement('div');
    loader.id = 'chat-loading';
    loader.className = 'chat-bubble chat-bubble--assistant';

    var label = document.createElement('span');
    label.className = 'chat-label';
    label.textContent = 'Claude';

    var dots = document.createElement('div');
    dots.className = 'chat-content chat-typing';
    dots.textContent = 'Thinking\u2026';

    loader.appendChild(label);
    loader.appendChild(dots);
    messages.appendChild(loader);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideLoading() {
    var loader = document.getElementById('chat-loading');
    if (loader) loader.remove();
  }

  function sendMessage(question) {
    isLoading = true;
    appendMessage('user', question);
    showLoading();

    // Disable input while loading
    var input = document.getElementById('chat-input');
    if (input) input.disabled = true;

    App.authFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        date: digestDate,
        history: history
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (data) {
            throw new Error(data.error || 'Chat request failed');
          });
        }
        return res.json();
      })
      .then(function (data) {
        hideLoading();

        // Update history
        history.push({ role: 'user', content: question });
        history.push({ role: 'assistant', content: data.answer });

        appendMessage('assistant', data.answer);
      })
      .catch(function (err) {
        hideLoading();
        appendMessage('assistant', 'Sorry, something went wrong. Please try again.');
        console.error('Chat error:', err);
      })
      .finally(function () {
        isLoading = false;
        var inputEl = document.getElementById('chat-input');
        if (inputEl) {
          inputEl.disabled = false;
          inputEl.focus();
        }
      });
  }

  // Initialize when digest date is set
  function init() {
    var date = panel.getAttribute('data-digest-date');
    if (date) {
      digestDate = date;
      render();
    }
  }

  // Watch for data-digest-date to be set by digest.js
  if (digestDate) {
    init();
  } else {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === 'data-digest-date') {
          var newDate = panel.getAttribute('data-digest-date');
          if (newDate) {
            digestDate = newDate;
            observer.disconnect();
            render();
            break;
          }
        }
      }
    });
    observer.observe(panel, { attributes: true });
  }
})();
