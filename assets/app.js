(() => {
  const AR = document.documentElement.lang === 'ar';
  const BASE = document.body.dataset.base || '';
  const EX = window.EXHIBITIONS || [];
  const WORKS = window.WORKS || {};
  const BIOS = window.BIOS || {};

  const T = AR ? {
    no: 'رقم', hosted: 'استضافة', artists: 'فنانًا', artist1: 'فنان', works: 'عملًا', work1: 'عمل',
    artistsWorks: 'الفنانون والأعمال', guest: 'فنانو هذا المعرض من برنامج Art Routes ولا يظهرون في فهرس فنانينا.',
    exhibitedIn: 'شارك في', bio: 'نبذة', open: 'افتح المعرض', empty: 'لا يوجد فنان بهذا الاسم.', close: 'إغلاق',
    keyVisual: 'الهوية البصرية لمعرض', cm: 'سم'
  } : {
    no: 'No.', hosted: 'Hosted', artists: 'artists', artist1: 'artist', works: 'artworks', work1: 'artwork',
    artistsWorks: 'Artists & works', guest: "This exhibition's artists come from Art Routes' programme and are not part of our artist index.",
    exhibitedIn: 'Exhibited in', bio: 'About', open: 'Open exhibition', empty: 'No artist matches that name.', close: 'Close',
    keyVisual: 'Key visual for', cm: 'cm'
  };
  const num = n => AR ? Number(n).toLocaleString('ar-EG') : String(n);
  const pad = n => AR ? num(String(n).padStart(2, '0')) : String(n).padStart(2, '0');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const L = (e, k) => (AR && e[k + 'Ar']) || e[k] || '';
  // Arabic counts: 1 فنان · 2 فنانان · 3–10 فنانين · 11+ فنانًا
  const AR_FORMS = { [T.artists]: ['فنان', 'فنانان', 'فنانين', 'فنانًا'], [T.works]: ['عمل', 'عملان', 'أعمال', 'عملًا'] };
  const plural = (n, one, many) => {
    if (!AR) return `${num(n)} ${n === 1 ? one : many}`;
    const f = AR_FORMS[many]; const m = n % 100;
    if (n === 1) return f[0];
    if (n === 2) return f[1];
    return `${num(n)} ${m >= 3 && m <= 10 ? f[2] : f[3]}`;
  };
  const label = e => e.no ? `${T.no} ${pad(e.no)}` : T.hosted;

  // ---------- Artworks: [artist, title, size, year, medium, notes]
  const worksBy = {};            // artist -> [{ex, row}]
  for (const [exId, rows] of Object.entries(WORKS)) {
    rows.forEach(r => (worksBy[r[0]] = worksBy[r[0]] || []).push({ ex: exId, row: r }));
  }
  const fmtSize = s => !s ? '' : /\d/.test(s) && !/cm|h\b/i.test(s) ? `${s.replace(/x/g, '×')} ${T.cm}` : s.replace(/x/g, '×');
  const workHTML = r => {
    const meta = [fmtSize(r[2]), r[3], r[4], r[5]].filter(Boolean).map(esc).join(' · ');
    return `<li class="work"><span class="wt" dir="auto">${esc(r[1])}</span>${meta ? `<span class="wm" dir="auto">${meta}</span>` : ''}</li>`;
  };

  // ---------- Exhibitions archive (newest first)
  const archive = document.getElementById('archive');
  const sorted = [...EX].sort((a, b) => EX.indexOf(b) - EX.indexOf(a));
  archive.innerHTML = sorted.map(e => `
    <button class="card reveal" type="button" data-ex="${e.id}">
      <span class="img"><img src="${BASE}${e.image}" alt="${esc(T.keyVisual)} ${esc(L(e, 'title'))}" loading="lazy" ${e.imagePos ? `style="object-position:${e.imagePos}"` : ''}></span>
      <span class="info"><span class="no">${label(e)}</span><span class="year">${num(e.year)}</span></span>
      <span class="title">${esc(L(e, 'title'))}</span>
      <span class="meta">${esc(L(e, 'dates'))}${e.artists.length ? ' · ' + plural(e.artists.length, T.artist1, T.artists) : ''}</span>
    </button>`).join('');

  // ---------- Artist index: one entry per artist, every show they were in
  const artists = new Map();
  EX.forEach(e => {
    if (e.index === false) return;
    e.artists.forEach(name => {
      if (!artists.has(name)) artists.set(name, { name, shows: [] });
      artists.get(name).shows.push(e);
    });
  });
  const list = [...artists.values()].sort((a, b) => a.name.localeCompare(b.name));
  const groups = {};
  list.forEach(a => { const k = a.name[0].toUpperCase(); (groups[k] = groups[k] || []).push(a); });

  const az = document.getElementById('az');
  az.innerHTML = Object.keys(groups).sort().map(k => `
    <div class="az-group">
      <h3 class="az-letter">${k}</h3>
      <ul>${groups[k].map(a => `
        <li id="artist-${slug(a.name)}" data-name="${esc(a.name.toLowerCase())}">
          <button class="aname" type="button" data-artist="${esc(a.name)}" dir="ltr">${esc(a.name)}</button>
          <span class="ashows">${a.shows.map(s => `<button type="button" data-ex="${s.id}" title="${esc(L(s, 'title'))}">${s.no ? pad(s.no) : '·'}</button>`).join('')}</span>
        </li>`).join('')}
      </ul>
    </div>`).join('');

  const totalWorks = Object.values(WORKS).reduce((n, rows) => n + rows.reduce((m, r) => m + (parseInt((r[5].match(/(\d+) works/) || [])[1]) || 1), 0), 0);
  const set = (sel, v) => document.querySelectorAll(sel).forEach(el => { el.textContent = v; });
  set('[data-count="artists"]', num(list.length));
  set('[data-count="exhibitions"]', num(EX.filter(e => e.no).length));
  set('[data-count="works"]', num(Math.floor(totalWorks / 50) * 50) + '+');

  // search
  const search = document.getElementById('artist-search');
  const empty = document.getElementById('artist-empty');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    az.querySelectorAll('.az-group').forEach(g => {
      let any = false;
      g.querySelectorAll('li').forEach(li => {
        const hit = !q || li.dataset.name.includes(q);
        li.hidden = !hit; if (hit) { any = true; shown++; }
      });
      g.hidden = !any;
    });
    empty.hidden = shown > 0;
  });

  // ---------- Dialog (exhibitions and artists)
  const dlg = document.getElementById('dialog');
  const body = dlg.querySelector('.dlg-body');
  function show(html, wide) {
    body.innerHTML = html;
    dlg.classList.toggle('is-artist', !wide);
    if (!dlg.open) dlg.showModal();
    body.scrollTop = 0; dlg.scrollTop = 0;
    document.body.classList.add('dialog-open');
  }
  function openEx(id) {
    const e = EX.find(x => x.id === id); if (!e) return;
    const rows = WORKS[e.id] || [];
    const byArtist = {};
    rows.forEach(r => (byArtist[r[0]] = byArtist[r[0]] || []).push(r));
    const names = [...e.artists].sort((a, b) => a.localeCompare(b));
    let people;
    if (!names.length) people = `<p class="note">${esc(L(e, 'artistsNote'))}</p>`;
    else if (e.index === false) people = `<p class="note">${esc(T.guest)}</p><ul class="names">${names.map(n => `<li dir="ltr">${esc(n)}</li>`).join('')}</ul>`;
    else people = `<ul class="ex-artists">${names.map(n => `
        <li>
          <button class="artist-link" type="button" data-artist="${esc(n)}" dir="ltr">${esc(n)}</button>
          ${byArtist[n] ? `<ul class="works">${byArtist[n].map(workHTML).join('')}</ul>` : ''}
        </li>`).join('')}</ul>`;
    show(`
      <div class="ex-layout">
        <div class="ex-visual"><img src="${BASE}${e.image}" alt="${esc(T.keyVisual)} ${esc(L(e, 'title'))}" ${e.imagePos ? `style="object-position:${e.imagePos}"` : ''}></div>
        <div class="ex-info">
          <p class="eyebrow"><span class="level">${label(e)}</span> ${esc(L(e, 'dates'))}</p>
          <h3 class="dlg-title">${esc(L(e, 'title'))}</h3>
          ${AR ? (e.title !== e.titleAr ? `<p class="alt-title" dir="ltr">${esc(e.title)}</p>` : '') : (e.titleAr ? `<p class="alt-title" lang="ar" dir="rtl">${esc(e.titleAr)}</p>` : '')}
          <p class="ex-venue">${esc(L(e, 'venue'))}</p>
          ${e.partner ? `<p class="ex-venue">${esc(L(e, 'partner'))}</p>` : ''}
          ${e.curators ? `<p class="ex-venue">${esc(L(e, 'curators'))}</p>` : ''}
          <p class="ex-blurb">${esc(L(e, 'blurb'))}</p>
          <h4>${esc(T.artistsWorks)} <span>${names.length ? plural(names.length, T.artist1, T.artists) : ''}${rows.length ? ' · ' + plural(rows.length, T.work1, T.works) : ''}</span></h4>
          ${people}
        </div>
      </div>`, true);
  }
  function openArtist(name) {
    const a = artists.get(name); if (!a) return;
    const shows = [...a.shows].reverse();
    show(`
      <div class="artist-layout">
        <p class="eyebrow"><span class="level">${esc(T.exhibitedIn)}</span> ${shows.map(s => esc(L(s, 'title'))).join(' · ')}</p>
        <h3 class="dlg-title" dir="ltr">${esc(name)}</h3>
        ${BIOS[name] ? `<p class="bio" dir="ltr">${esc(BIOS[name])}</p>` : ''}
        ${shows.map(s => {
          const ws = (worksBy[name] || []).filter(w => w.ex === s.id).map(w => w.row);
          return `<section class="artist-show">
            <button class="show-link" type="button" data-ex="${s.id}">
              <span class="no">${label(s)}</span> <span class="t">${esc(L(s, 'title'))}</span> <span class="d">${esc(L(s, 'dates'))}</span>
            </button>
            ${ws.length ? `<ul class="works">${ws.map(workHTML).join('')}</ul>` : ''}
          </section>`;
        }).join('')}
      </div>`, false);
  }
  document.addEventListener('click', ev => {
    const ex = ev.target.closest('[data-ex]');
    const ar = ev.target.closest('[data-artist]');
    if (ar) { ev.preventDefault(); openArtist(ar.dataset.artist); }
    else if (ex) { ev.preventDefault(); openEx(ex.dataset.ex); }
  });
  dlg.querySelector('.close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', ev => { if (ev.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (/^#(ex|artist)-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  });

  // Shareable links: #ex-reverie, #artist-lana-gul
  const byslug = new Map(list.map(a => [slug(a.name), a.name]));
  const setHash = h => history.replaceState(null, '', h);
  const _openEx = openEx, _openArtist = openArtist;
  openEx = id => { _openEx(id); setHash('#ex-' + id); };
  openArtist = name => { _openArtist(name); setHash('#artist-' + slug(name)); };
  const fromHash = () => {
    const m = location.hash.match(/^#(ex|artist)-(.+)$/); if (!m) return;
    if (m[1] === 'ex') openEx(m[2]); else if (byslug.has(m[2])) openArtist(byslug.get(m[2]));
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  // ---------- Mobile menu
  const toggle = document.querySelector('.menu-toggle');
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', false);
  }));

  // ---------- Reveal on scroll
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  set('#year', num(new Date().getFullYear()));
})();
