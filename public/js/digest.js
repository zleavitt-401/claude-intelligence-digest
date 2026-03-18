/* ================================================================
   digest.js — Digest page rendering for Claude Intelligence Digest
   ================================================================ */

(function () {
  'use strict';

  /* Project color map */
  var PROJECT_COLORS = {
    'Smart Tutor': '#3B82F6',
    'Claude Intelligence Digest': '#8B5CF6',
    'Conglomerate App': '#10B981',
    'TrailLink': '#F59E0B',
    'Bionic Line Reader': '#EF4444',
    'Moon Publishing': '#6366F1',
    'Roost': '#EC4899',
    'Pearler of Africa': '#14B8A6'
  };

  /* Format YYYY-MM-DD into a newspaper-style date */
  function formatNewspaperDate(dateStr) {
    var parts = dateStr.split('-');
    var d = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  /* Compute headline font-size from score */
  function headlineFontSize(score) {
    if (score >= 10) return 60;
    if (score <= 5) return 21;
    return Math.round(28 + (score - 7) * 10.67);
  }

  /* Score CSS class */
  function scoreClass(score) {
    var s = Math.max(5, Math.min(10, Math.round(score)));
    return 'score-' + s;
  }

  /* Create a project pill element */
  function createPill(projectName) {
    var pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = projectName;
    pill.style.backgroundColor = PROJECT_COLORS[projectName] || '#888';
    return pill;
  }

  /* Create a story DOM element */
  function createStoryElement(item, isTopStory) {
    var el = document.createElement('article');
    el.className = isTopStory ? 'top-story' : 'story-item';

    // Headline
    var headline = document.createElement('h3');
    headline.className = 'story-headline ' + scoreClass(item.score);
    if (isTopStory) {
      headline.style.fontSize = headlineFontSize(item.score) + 'px';
    }
    headline.textContent = item.headline || 'Untitled';
    el.appendChild(headline);

    // Byline
    if (item.byline) {
      var byline = document.createElement('p');
      byline.className = 'story-byline';
      byline.textContent = item.byline;
      el.appendChild(byline);
    }

    // Meta row: pills + source
    var meta = document.createElement('div');
    meta.className = 'story-meta';

    var projects = item.affectedProjects || item.affected_projects || [];
    projects.forEach(function (proj) {
      meta.appendChild(createPill(proj));
    });

    if (item.sourceUrl || item.source_url) {
      var src = document.createElement('a');
      src.className = 'story-source';
      src.href = item.sourceUrl || item.source_url;
      src.target = '_blank';
      src.rel = 'noopener noreferrer';
      src.textContent = 'Source';
      meta.appendChild(src);
    }

    el.appendChild(meta);

    return el;
  }

  /* Main load function */
  function loadDigest(date) {
    var container = document.getElementById('digest-content');
    if (!container) return;

    // Loading state
    var loadingEl = document.createElement('p');
    loadingEl.className = 'loading';
    loadingEl.textContent = 'Loading digest\u2026';
    container.appendChild(loadingEl);

    App.authFetch('/api/digest?date=' + encodeURIComponent(date))
      .then(function (res) {
        if (!res.ok) {
          throw new Error('not-found');
        }
        return res.json();
      })
      .then(function (digest) {
        container.textContent = '';

        // Date header
        var dateHeader = document.createElement('div');
        dateHeader.className = 'digest-date-header';
        var dateH2 = document.createElement('h2');
        dateH2.textContent = formatNewspaperDate(date);
        dateHeader.appendChild(dateH2);
        container.appendChild(dateHeader);

        var items = digest.items || digest.stories || [];
        if (items.length === 0) {
          var empty = document.createElement('p');
          empty.className = 'empty-state';
          empty.textContent = 'No stories in this digest.';
          container.appendChild(empty);
          return;
        }

        // Sort by score descending
        items.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });

        // Top story — full width
        container.appendChild(createStoryElement(items[0], true));

        // Remaining stories in grid
        if (items.length > 1) {
          var grid = document.createElement('div');
          grid.className = 'story-grid';

          for (var i = 1; i < items.length; i++) {
            grid.appendChild(createStoryElement(items[i], false));
          }

          container.appendChild(grid);
        }
      })
      .catch(function (err) {
        container.textContent = '';
        if (err.message === 'Unauthorized') return;

        var errEl = document.createElement('p');
        errEl.className = 'empty-state';
        errEl.textContent = 'Digest not found for this date.';
        container.appendChild(errEl);
      });
  }

  /* ---- Init ---- */

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var date = params.get('date');

    if (!date) {
      window.location.href = 'index.html';
      return;
    }

    // Set chat panel date attribute
    var chatPanel = document.getElementById('chat-panel');
    if (chatPanel) {
      chatPanel.setAttribute('data-digest-date', date);
    }

    // Update page title
    document.title = date + ' \u2014 Claude Intelligence Digest';

    App.checkAuth(function () {
      loadDigest(date);
    });
  });
})();
