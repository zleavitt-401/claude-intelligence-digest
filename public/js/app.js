/* ================================================================
   app.js — Shared auth utilities for Claude Intelligence Digest
   ================================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'digest-password';

  /* ---- Session helpers ---- */

  function getPassword() {
    return sessionStorage.getItem(STORAGE_KEY);
  }

  function setPassword(pw) {
    sessionStorage.setItem(STORAGE_KEY, pw);
  }

  function clearPassword() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /* ---- Authenticated fetch ---- */

  function authFetch(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    var pw = getPassword();
    if (pw) {
      options.headers['x-digest-password'] = pw;
    }
    return fetch(url, options).then(function (res) {
      if (res.status === 401) {
        clearPassword();
        window.location.href = '/index.html';
        return Promise.reject(new Error('Unauthorized'));
      }
      return res;
    });
  }

  /* ---- Password gate overlay ---- */

  function createPasswordGateDOM() {
    var overlay = document.createElement('div');
    overlay.id = 'password-gate';
    overlay.className = 'pw-overlay';

    var card = document.createElement('div');
    card.className = 'pw-card';

    var title = document.createElement('h2');
    title.className = 'pw-title';
    title.textContent = 'AUTHENTICATE';

    var subtitle = document.createElement('p');
    subtitle.className = 'pw-subtitle';
    subtitle.textContent = 'Enter your password to continue.';

    var form = document.createElement('form');
    form.id = 'pw-form';
    form.autocomplete = 'off';

    var input = document.createElement('input');
    input.id = 'pw-input';
    input.type = 'password';
    input.className = 'pw-input';
    input.placeholder = 'Password';
    input.autofocus = true;

    var button = document.createElement('button');
    button.type = 'submit';
    button.className = 'pw-button';
    button.textContent = 'Enter';

    var error = document.createElement('p');
    error.id = 'pw-error';
    error.className = 'pw-error';
    error.hidden = true;
    error.textContent = 'Invalid password. Try again.';

    form.appendChild(input);
    form.appendChild(button);
    form.appendChild(error);

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(form);
    overlay.appendChild(card);

    return { overlay: overlay, form: form, input: input, error: error };
  }

  function showPasswordGate(onSuccess) {
    // Remove any existing gate
    var existing = document.getElementById('password-gate');
    if (existing) existing.remove();

    var dom = createPasswordGateDOM();
    document.body.appendChild(dom.overlay);

    dom.form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = dom.input.value.trim();
      if (!pw) return;

      setPassword(pw);

      // Verify against API (raw fetch, no auto-redirect)
      fetch('/api/digests', {
        headers: { 'x-digest-password': pw }
      }).then(function (res) {
        if (res.status === 401) {
          clearPassword();
          dom.error.hidden = false;
          dom.input.value = '';
          dom.input.focus();
          return;
        }
        // Success
        dom.overlay.remove();
        if (typeof onSuccess === 'function') onSuccess();
      }).catch(function () {
        clearPassword();
        dom.error.hidden = false;
        dom.input.value = '';
        dom.input.focus();
      });
    });
  }

  /* ---- Auth check ---- */

  function checkAuth(onSuccess) {
    var pw = getPassword();
    if (!pw) {
      showPasswordGate(onSuccess);
      return;
    }
    // Verify stored password
    fetch('/api/digests', {
      headers: { 'x-digest-password': pw }
    }).then(function (res) {
      if (res.status === 401) {
        clearPassword();
        showPasswordGate(onSuccess);
        return;
      }
      if (typeof onSuccess === 'function') onSuccess();
    }).catch(function () {
      showPasswordGate(onSuccess);
    });
  }

  /* ---- Expose on window ---- */

  window.App = {
    getPassword: getPassword,
    setPassword: setPassword,
    clearPassword: clearPassword,
    authFetch: authFetch,
    showPasswordGate: showPasswordGate,
    checkAuth: checkAuth
  };
})();
