/* ================================================================
   archive.js — Archive page logic for Claude Intelligence Digest
   ================================================================ */

(function () {
  'use strict';

  /* Set masthead date */
  function setMastheadDate() {
    var el = document.getElementById('masthead-date');
    if (!el) return;
    var now = new Date();
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    el.textContent = now.toLocaleDateString('en-US', options);
  }

  /* Format a date string YYYY-MM-DD into a readable form */
  function formatDate(dateStr) {
    var parts = dateStr.split('-');
    var d = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  /* Load and render the archive */
  function loadArchive() {
    var container = document.getElementById('archive-content');
    if (!container) return;

    // Show loading
    var loadingEl = document.createElement('p');
    loadingEl.className = 'loading';
    loadingEl.textContent = 'Loading archive\u2026';
    container.appendChild(loadingEl);

    App.authFetch('/api/digests')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        container.textContent = '';

        var dates = data.dates || [];
        var topHeadlines = data.topHeadlines || {};

        if (dates.length === 0) {
          var empty = document.createElement('p');
          empty.className = 'empty-state';
          empty.textContent = 'No digests yet. Check back after the morning briefing.';
          container.appendChild(empty);
          return;
        }

        var list = document.createElement('ul');
        list.className = 'archive-list';

        dates.forEach(function (dateStr) {
          var li = document.createElement('li');
          li.className = 'archive-entry';

          var link = document.createElement('a');
          link.className = 'archive-link';
          link.href = 'digest.html?date=' + encodeURIComponent(dateStr);

          var dateEl = document.createElement('div');
          dateEl.className = 'archive-date';
          dateEl.textContent = formatDate(dateStr);

          var headlineEl = document.createElement('div');
          headlineEl.className = 'archive-headline';
          headlineEl.textContent = topHeadlines[dateStr] || '';

          link.appendChild(dateEl);
          link.appendChild(headlineEl);
          li.appendChild(link);
          list.appendChild(li);
        });

        container.appendChild(list);
      })
      .catch(function (err) {
        container.textContent = '';
        if (err.message !== 'Unauthorized') {
          var errEl = document.createElement('p');
          errEl.className = 'empty-state';
          errEl.textContent = 'Unable to load archive. Please try again later.';
          container.appendChild(errEl);
        }
      });
  }

  /* ---- Init ---- */

  document.addEventListener('DOMContentLoaded', function () {
    setMastheadDate();
    App.checkAuth(loadArchive);
  });
})();
