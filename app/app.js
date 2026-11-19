/* Leonida Platinum — tracker logic. Loads app/data/trophies.json, saves progress in
   localStorage, exports/imports it as JSON. No network request besides the app's own files. */
(function () {
  'use strict';

  var STORAGE_KEY = 'gta6-trophy-guide-01-progress-v1';
  var DATA_URL = 'data/trophies.json';
  var DEMO_EARNED = [
    'Just Like Paradise', 'Paradise Lost', 'Trust', 'Break the Bank',
    'Master of None', 'Baited My Tackle', 'Stick Fiddler', 'Whip It Good',
    'Gunslinger', 'Treat Yo Self', 'On the Spot', 'Earn Cash, Not Kudos',
    'Personal Best'
  ];
  var ROADMAP_STAGES = [
    { n: 1, title: 'Play the story, save every chapter', text: 'Chapters 1–4 plus the final mission: 12 story trophies, all unmissable. Keep a manual save at the start of each chapter. Start Positive Mental Attitude here — Lucia’s balcony meditation in Chapter 1 is the one thing that can be missed.' },
    { n: 2, title: 'Finish the side stories', text: 'Six stranger strands end in their own finales: Andy, Kenton, Billy, Randy, Tyrone and Bret’s hunt. They stay open after the story, so there is no rush — but finish each strand, not just its early missions.' },
    { n: 3, title: 'Partner robberies', text: 'Once Jason and Lucia can team up, rob shops, jewelry stores, bank vaults and armored trucks together. Vaults unlock near the end of Chapter 4; jewelry robberies open in Chapter 3. Escaping with your partner also earns Hot Together.' },
    { n: 4, title: 'Activities, races and the odd ones', text: 'The 9 activity types, drone races at every location, 42 Shooting Range gold medals, 250 stunts, fishing against Cal, an arcade game, the tank, the airliner, the gym, the bowling alley — and the hidden trophies whose descriptions are riddles.' },
    { n: 5, title: 'Collectibles, money and the map', text: 'Three card sets, 100 WAiNK tags, 100 vehicles discovered, all of Leonida explored, eight garages bought, ten cars registered, $250,000 laundered and $100,000 spent. These fill up steadily while you travel.' },
    { n: 6, title: 'The long grinds', text: '50 Challenges (70 of 80 for 100%), 8 stranger strands, 500 Criminal Profile actions. Check Progress > Challenges and the trophy counters after each strand — several of these pop while you do everything else.' },
    { n: 7, title: '100% completion, then the platinum', text: 'After the credits the 100% checklist appears under Progress > Stats > 100% Completion: 300 stunts, 70 of 80 Challenges, 200 of 277 vehicles, all 8 vaults, all 39 illegal operations. Finish it for A Long Road — then Vice Got a Price! pops on its own.' }
  ];

  var trophies = [];
  var state = { earned: {}, spoiler: false, hideEarned: false };
  var kind = 'all';
  var query = '';
  var openIndex = -1;

  var listEl = document.getElementById('trophyList');
  var progressText = document.getElementById('progressText');
  var gradeText = document.getElementById('gradeText');
  var progressFill = document.getElementById('progressFill');
  var countLine = document.getElementById('countLine');
  var emptyNote = document.getElementById('emptyNote');
  var onlineNote = document.getElementById('onlineNote');

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.earned && typeof parsed.earned === 'object') state.earned = parsed.earned;
        if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
        if (typeof parsed.hideEarned === 'boolean') state.hideEarned = parsed.hideEarned;
      }
    } catch (e) { /* corrupt save: start fresh */ }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }

  function seedDemoProgress() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('demo') !== '1') return;
    try { if (localStorage.getItem(STORAGE_KEY)) return; } catch (e) { return; }
    DEMO_EARNED.forEach(function (name) { state.earned[name] = true; });
    saveState();
  }

  function isEarned(t) { return !!state.earned[t.name]; }

  function earnedCount() {
    return trophies.filter(isEarned).length;
  }

  function gradeCounts() {
    var c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    trophies.forEach(function (t) { if (isEarned(t)) c[t.grade]++; });
    return c;
  }

  function isSpoilerHidden(t) {
    return state.spoiler && t.kind === 'story' && t.hidden && !isEarned(t);
  }

  function matchesKind(t) {
    if (kind === 'all') return true;
    if (kind === 'missable') return !!t.missable;
    if (kind === 'online') return false;
    return t.kind === kind;
  }

  function matchesQuery(t) {
    if (!query) return true;
    var hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind).toLowerCase();
    return hay.indexOf(query) !== -1;
  }

  function visibleTrophies() {
    return trophies.filter(function (t) {
      if (!matchesKind(t)) return false;
      if (!matchesQuery(t)) return false;
      if (state.hideEarned && isEarned(t)) return false;
      return true;
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function gradeLabel(g) {
    return g.charAt(0).toUpperCase() + g.slice(1);
  }

  function trophyRow(t, index, idPrefix) {
    var li = el('li', 'row' + (isEarned(t) ? ' earned' : '') + (openIndex === index ? ' open' : ''));
    li.id = (idPrefix || '') + 'trophy-' + index;
    li.dataset.name = t.name;
    var head = el('div', 'rowHead');
    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('click', function (ev) {
      ev.stopPropagation();
      setEarned(t, box.checked);
    });
    head.appendChild(box);
    head.appendChild(el('span', 'medal ' + t.grade));
    var main = el('div', 'rowMain');
    var hidden = isSpoilerHidden(t);
    var name = el('div', 'rowName', hidden ? 'Hidden story trophy' : t.name);
    if (t.hidden && !hidden) name.appendChild(el('span', 'hiddenTag', 'Hidden'));
    main.appendChild(name);
    main.appendChild(el('div', 'rowDesc', hidden ? 'Hidden on PlayStation until earned. Turn the spoiler setting off, or earn it, to reveal it.' : t.description));
    var meta = el('div', 'rowMeta');
    meta.appendChild(el('span', 'tag grade-' + t.grade, gradeLabel(t.grade)));
    meta.appendChild(el('span', 'tag', t.kind));
    if (t.missable) meta.appendChild(el('span', 'tag missable', 'Missable'));
    if (t.targetLabel) meta.appendChild(el('span', 'tag', t.targetLabel));
    main.appendChild(meta);
    head.appendChild(main);
    head.addEventListener('click', function () { toggleDetail(index); });
    li.appendChild(head);
    if (!hidden) {
      var detail = el('div', 'rowDetail');
      detail.appendChild(el('h4', null, 'Guide'));
      detail.appendChild(el('p', null, t.guide));
      if (t.targetLabel) detail.appendChild(el('p', 'targetLine', 'Target: ' + t.targetLabel + '.'));
      detail.appendChild(el('h4', null, 'Sources'));
      var srcList = el('ul', 'sources');
      (t.sources || []).forEach(function (s) {
        var item = el('li');
        var a = el('a', null, s.name);
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'noopener';
        item.appendChild(a);
        srcList.appendChild(item);
      });
      detail.appendChild(srcList);
      li.appendChild(detail);
    }
    return li;
  }

  function renderProgress() {
    var n = earnedCount();
    var total = trophies.length || 55;
    var pct = total ? Math.round((n / total) * 100) : 0;
    progressText.textContent = n + ' / ' + total + ' earned — ' + pct + '% to the platinum';
    var g = gradeCounts();
    gradeText.textContent = 'Platinum ' + g.platinum + '/1 · Gold ' + g.gold + '/2 · Silver ' + g.silver + '/6 · Bronze ' + g.bronze + '/46';
    progressFill.style.width = pct + '%';
  }

  function renderList() {
    var shown = visibleTrophies();
    listEl.innerHTML = '';
    shown.forEach(function (t) {
      listEl.appendChild(trophyRow(t, trophies.indexOf(t)));
    });
    countLine.textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies' +
      (kind !== 'all' ? ' · filter: ' + kind : '') + (query ? ' · search: "' + query + '"' : '');
    emptyNote.hidden = shown.length !== 0;
    onlineNote.hidden = kind !== 'online';
    renderProgress();
  }

  function renderRoadmap() {
    var ol = document.getElementById('roadmapList');
    ol.innerHTML = '';
    ROADMAP_STAGES.forEach(function (stage) {
      var li = document.createElement('li');
      li.appendChild(el('h4', null, stage.title));
      li.appendChild(el('p', null, stage.text));
      var chips = el('div', 'stageTrophies');
      trophies.filter(function (t) { return t.roadmap === stage.n; }).forEach(function (t) {
        chips.appendChild(el('span', null, (isEarned(t) ? '✓ ' : '') + t.name));
      });
      li.appendChild(chips);
      ol.appendChild(li);
    });
  }

  function renderMissables() {
    var ul = document.getElementById('missableList');
    ul.innerHTML = '';
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      ul.appendChild(trophyRow(t, trophies.indexOf(t), 'm-'));
    });
  }

  function setEarned(t, value) {
    if (value) state.earned[t.name] = true; else delete state.earned[t.name];
    saveState();
    renderList();
    renderRoadmap();
    renderMissables();
  }

  function toggleDetail(index) {
    openIndex = (openIndex === index) ? -1 : index;
    renderList();
    renderMissables();
    if (openIndex >= 0) {
      var node = document.getElementById('trophy-' + openIndex);
      if (node) node.scrollIntoView({ block: 'nearest' });
    }
  }

  function setView(name) {
    ['Tracker', 'Roadmap', 'Missables'].forEach(function (v) {
      document.getElementById('tab' + v).classList.toggle('active', v.toLowerCase() === name);
      document.getElementById('view' + v).hidden = v.toLowerCase() !== name;
    });
    if (name === 'roadmap') renderRoadmap();
    if (name === 'missables') renderMissables();
  }

  function setKindFilter(next) {
    kind = next;
    document.querySelectorAll('#kindFilters .chip').forEach(function (b) {
      b.classList.toggle('active', b.dataset.kind === next);
    });
    renderList();
  }

  function exportProgress() {
    var payload = { app: 'gta6-trophy-guide-01', exportedAt: new Date().toISOString(), earned: Object.keys(state.earned).sort(), spoiler: state.spoiler };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophies-progress.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var names = data.earned || data.trophies || data;
        if (!Array.isArray(names)) throw new Error('no earned list');
        var next = {};
        var known = {};
        trophies.forEach(function (t) { known[t.name] = true; });
        names.forEach(function (name) { if (known[name]) next[name] = true; });
        state.earned = next;
        if (typeof data.spoiler === 'boolean') state.spoiler = data.spoiler;
        saveState();
        syncToggles();
        renderList(); renderRoadmap(); renderMissables();
      } catch (e) {
        window.alert('That file is not a progress export from this guide.');
      }
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    if (!window.confirm('Clear all earned trophies? This cannot be undone.')) return;
    state.earned = {};
    saveState();
    renderList(); renderRoadmap(); renderMissables();
  }

  function syncToggles() {
    document.getElementById('spoilerToggle').checked = state.spoiler;
    document.getElementById('hideEarnedToggle').checked = state.hideEarned;
  }

  function applyHash() {
    var h = window.location.hash || '';
    var m = h.match(/^#trophy-(\d+)$/);
    if (m) {
      var i = parseInt(m[1], 10);
      if (trophies[i]) { setView('tracker'); openIndex = i; renderList(); return; }
    }
    if (h === '#roadmap') setView('roadmap');
    else if (h === '#missables') setView('missables');
    else setView('tracker');
  }

  function loadTrophies() {
    return fetch(DATA_URL).then(function (r) {
      if (!r.ok) throw new Error('trophies.json not found');
      return r.json();
    }).then(function (data) {
      trophies = data.trophies || data;
    });
  }

  function boot() {
    loadState();
    seedDemoProgress();
    syncToggles();
    document.getElementById('spoilerToggle').addEventListener('change', function (ev) {
      state.spoiler = ev.target.checked; saveState(); renderList(); renderMissables();
    });
    document.getElementById('hideEarnedToggle').addEventListener('change', function (ev) {
      state.hideEarned = ev.target.checked; saveState(); renderList();
    });
    document.getElementById('searchBox').addEventListener('input', function (ev) {
      query = ev.target.value.trim().toLowerCase(); renderList();
    });
    document.querySelectorAll('#kindFilters .chip').forEach(function (b) {
      b.addEventListener('click', function () { setKindFilter(b.dataset.kind); });
    });
    document.getElementById('tabTracker').addEventListener('click', function () { setView('tracker'); });
    document.getElementById('tabRoadmap').addEventListener('click', function () { setView('roadmap'); });
    document.getElementById('tabMissables').addEventListener('click', function () { setView('missables'); });
    document.getElementById('exportBtn').addEventListener('click', exportProgress);
    document.getElementById('importBtn').addEventListener('click', function () {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
      ev.target.value = '';
    });
    document.getElementById('resetBtn').addEventListener('click', resetProgress);
    window.addEventListener('hashchange', applyHash);
    loadTrophies().then(function () {
      renderList(); renderRoadmap(); renderMissables(); applyHash();
    }).catch(function () {
      progressText.textContent = 'Could not load app/data/trophies.json. Serve the app/ folder with a static server.';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
