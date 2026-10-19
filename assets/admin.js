/* سيّار — admin dashboard (shell + all pages). AREA='admin'. */
(function () {
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const t = RC.t, esc = RC.esc, L = RC.L;
  let ME = null, COMPANY = null;

  const NAV = [
    { key: 'dashboard', href: 'index.html', ic: 'dashboard', perm: null },
    { key: 'cars', href: 'cars.html', ic: 'cars', perm: 'cars' },
    { key: 'categories', href: 'categories.html', ic: 'categories', perm: 'categories' },
    { key: 'branches', href: 'branches.html', ic: 'branch', perm: 'cars' },
    { key: 'maintenance', href: 'maintenance.html', ic: 'wrench', perm: 'cars' },
    { key: 'damages', href: 'damages.html', ic: 'damage', perm: 'cars' },
    { key: 'bookings', href: 'bookings.html', ic: 'bookings', perm: 'bookings' },
    { key: 'customers', href: 'customers.html', ic: 'customers', perm: 'customers' },
    { key: 'invoices', href: 'invoices.html', ic: 'invoices', perm: 'invoices' },
    { key: 'accounts', href: 'accounts.html', ic: 'accounts', perm: 'invoices' },
    { key: 'notifications', href: 'notifications.html', ic: 'notifications', perm: null },
    { key: 'staff', href: 'staff.html', ic: 'staff', perm: 'staff' },
    { key: 'settings', href: 'settings.html', ic: 'settings', perm: 'settings' },
  ];

  function can(perm) { if (!perm) return true; if (!ME) return false; if (ME.role === 'admin') return true; return (ME.permissions || []).indexOf(perm) >= 0; }

  async function boot() {
    RC.guard();
    buildShell();
    RC.initLang();
    try {
      const r = await RC.api('GET', '/admin/me');
      ME = r.user; COMPANY = r.company; if (COMPANY) { RC.setCurrency(COMPANY.currency); RC.applyPreset(COMPANY.theme, COMPANY.theme_custom); }
    } catch (e) { return; }
    renderNav();
    paintUser();
    RC.initPalette();
    loadBadges();
    const page = document.body.dataset.page;
    if (PAGES[page]) PAGES[page]();
  }

  function buildShell() {
    const page = document.body.dataset.page;
    document.body.innerHTML =
      '<div class="rc-shell">' +
      '<aside class="rc-side" id="rc-side">' +
      '<div class="brand"><span class="mark">' + RC.icon('car', 20) + '</span><div>' + t('app') + '<small>ADMIN</small></div></div>' +
      '<nav class="rc-nav" id="rc-nav"></nav>' +
      '<div class="foot"><a href="#" id="rc-logout" class="rc-nav-link" style="display:flex;gap:10px;align-items:center;color:#c5d2e6;padding:10px 14px"><span class="ic">' + RC.icon('logout') + '</span><span data-i18n="logout"></span></a></div>' +
      '</aside>' +
      '<div class="rc-main">' +
      '<div class="rc-top"><button class="rc-burger" id="rc-burger">☰</button><h1 data-i18n="' + page + '"></h1><div class="sp"></div>' +
      '<div class="rc-lang"><button class="rc-lang-opt" data-lang="ar">ع</button><button class="rc-lang-opt" data-lang="en">EN</button></div>' +
      '<div class="rc-user" id="rc-user"></div></div>' +
      '<div class="rc-content" id="rc-view"></div>' +
      '</div></div>';
    $('#rc-burger').onclick = function () { $('#rc-side').classList.toggle('open'); };
    $('#rc-logout').onclick = async function (e) { e.preventDefault(); try { await RC.api('POST', '/admin/logout'); } catch (x) {} RC.token.clear(); location.href = '/admin/login.html'; };
  }

  function renderNav() {
    const page = document.body.dataset.page;
    $('#rc-nav').innerHTML = NAV.filter(function (n) { return can(n.perm); }).map(function (n) {
      return '<a href="' + n.href + '" class="' + (n.key === page ? 'on' : '') + '" data-key="' + n.key + '"><span class="ic">' + RC.icon(n.ic) + '</span><span data-i18n="' + n.key + '"></span>' + (n.key === 'notifications' ? '<span class="count" id="rc-badge" style="display:none">0</span>' : '') + '</a>';
    }).join('');
    RC.applyLang(RC.lang());
  }

  function paintUser() {
    if (!ME) return;
    $('#rc-user').innerHTML = '<div class="av">' + esc((ME.name || '?').charAt(0)) + '</div><div>' + esc(ME.name) + '<div style="font-size:.72rem;color:var(--muted);font-weight:600">' + esc(COMPANY ? COMPANY.name : '') + '</div></div>';
  }

  async function loadBadges() {
    try { const b = await RC.api('GET', '/admin/badges'); const el = $('#rc-badge'); if (el && b.notifications > 0) { el.textContent = b.notifications; el.style.display = ''; } } catch (e) {}
  }

  /* ---------- shared UI helpers ---------- */
  function view() { return $('#rc-view'); }
  function field(label, inner) { return '<div class="rc-field"><label>' + esc(label) + '</label>' + inner + '</div>'; }
  function input(name, val, type) { return '<input class="rc-input" name="' + name + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '">'; }
  function textarea(name, val) { return '<textarea class="rc-input" name="' + name + '" rows="3">' + esc(val || '') + '</textarea>'; }
  function select(name, opts, val) { return '<select class="rc-select" name="' + name + '">' + opts.map(function (o) { return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(val) ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select>'; }
  function formData(form) { const o = {}; new FormData(form).forEach(function (v, k) { o[k] = v; }); return o; }
  function toolbar(html) { return '<div class="rc-toolbar">' + html + '</div>'; }
  function pager(meta, onGo) {
    if (!meta || meta.last_page <= 1) return '';
    let h = '<div class="rc-pager">';
    for (let p = 1; p <= meta.last_page; p++) h += '<button data-p="' + p + '" class="' + (p === meta.current_page ? 'on' : '') + '">' + p + '</button>';
    h += '</div>';
    setTimeout(function () { document.querySelectorAll('.rc-pager button').forEach(function (b) { b.onclick = function () { onGo(+b.dataset.p); }; }); }, 0);
    return h;
  }
  function tableWrap(headKeys, rows) {
    return '<div class="rc-table-wrap"><table class="rc-table"><thead><tr>' +
      headKeys.map(function (k) { return '<th>' + (k.raw ? esc(k.raw) : t(k)) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + (rows || ('<tr><td colspan="' + headKeys.length + '" class="rc-empty">' + t('no_data') + '</td></tr>')) + '</tbody></table></div>';
  }
  function err(e, form) {
    if (form && e.data && e.data.errors) { Object.keys(e.data.errors).forEach(function (k) { const f = form.querySelector('[name="' + k + '"]'); if (f) { const d = document.createElement('div'); d.className = 'err'; d.textContent = e.data.errors[k][0]; f.parentNode.appendChild(d); } }); }
    RC.toast(e.message || t('error'), 'err');
  }

  /* ========== PAGES ========== */
  const PAGES = {};

  /* ---- Dashboard ---- */
  PAGES.dashboard = async function () {
    view().innerHTML = '<p>' + t('loading') + '</p>';
    const d = await RC.api('GET', '/admin/dashboard');
    const tile = function (ic, cls, v, k) { return '<div class="rc-tile"><div class="ic ' + cls + '">' + ic + '</div><div><div class="v">' + v + '</div><div class="k">' + t(k) + '</div></div></div>'; };
    const maxRev = Math.max.apply(null, d.revenue_series.map(function (s) { return s.value; }).concat([1]));
    const fleet = d.fleet || { utilization: 0, in_use: 0, total: 0, reminders_count: 0, damages_open: 0 };
    const wk = d.week || { collected: 0, prev_collected: 0, delivered: 0, returned: 0 };
    const linkTile = function (ic, cls, v, k, href) { return '<a href="' + href + '" style="text-decoration:none">' + tile(ic, cls, v, k) + '</a>'; };
    view().innerHTML =
      '<div class="rc-grid tiles" style="margin-bottom:16px">' +
      tile(RC.icon('cars'), 'navy', d.cars.total, 'cars') +
      '<div class="rc-tile"><div class="ic amber">' + RC.icon('bookings') + '</div><div style="flex:1"><div class="v">' + fleet.utilization + '%</div><div class="k">' + t('utilization') + '</div><div class="rc-meter" style="margin-top:6px"><span style="width:' + fleet.utilization + '%"></span></div></div></div>' +
      tile(RC.icon('bookings'), 'green', d.bookings.active, 'active') +
      tile(RC.icon('customers'), 'navy', d.customers, 'customers') +
      linkTile(RC.icon('wrench'), 'amber', fleet.reminders_count, 'fleet_reminders', 'maintenance.html') +
      linkTile(RC.icon('damage'), 'red', fleet.damages_open, 'damages', 'damages.html') +
      '</div>' +
      // weekly summary strip
      '<div class="rc-card" style="margin-bottom:16px"><h3>' + RC.icon('calendar', 16) + ' ' + t('this_week') + '</h3><div class="rc-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">' +
      '<div><div class="v" style="font-size:1.4rem;font-weight:900">' + RC.money(wk.collected) + '</div><div class="k" style="color:var(--muted);font-size:.8rem">' + t('collected') + ' · <span style="color:' + (wk.collected >= wk.prev_collected ? 'var(--green)' : 'var(--red)') + '">' + (wk.prev_collected > 0 ? (wk.collected >= wk.prev_collected ? '▲' : '▼') + ' ' : '') + t('vs_last_week') + '</span></div></div>' +
      '<div><div class="v" style="font-size:1.4rem;font-weight:900">' + wk.delivered + '</div><div class="k" style="color:var(--muted);font-size:.8rem">' + t('delivered_count') + '</div></div>' +
      '<div><div class="v" style="font-size:1.4rem;font-weight:900">' + wk.returned + '</div><div class="k" style="color:var(--muted);font-size:.8rem">' + t('returned_count') + '</div></div>' +
      '<div><div class="v" style="font-size:1.4rem;font-weight:900">' + RC.money(d.revenue.month) + '</div><div class="k" style="color:var(--muted);font-size:.8rem">' + t('monthly_revenue') + '</div></div>' +
      '</div></div>' +
      '<div class="rc-grid" style="grid-template-columns:1.4fr 1fr;margin-bottom:16px">' +
      '<div class="rc-card"><h3>' + t('monthly_revenue') + '</h3><div class="rc-bars">' +
      d.revenue_series.map(function (s) { return '<div class="bar"><div class="fill" style="height:' + Math.round(s.value / maxRev * 100) + '%"></div><div class="lb">' + s.label.slice(5) + '</div></div>'; }).join('') +
      '</div></div>' +
      '<div class="rc-card"><h3>' + RC.icon('calendar', 16) + ' ' + t('upcoming_returns') + '</h3>' +
      ((d.upcoming_returns || []).length ? d.upcoming_returns.map(function (b) {
        const late = new Date(b.end_date) < new Date(new Date().toDateString());
        return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line)"><div><b>' + esc(b.car ? L(b.car, 'name') : '') + '</b><div style="font-size:.78rem;color:var(--muted)">' + esc(b.customer ? b.customer.name : '') + ' · ' + esc(b.reference || '') + '</div></div><span style="font-size:.82rem;font-weight:700;color:' + (late ? 'var(--red)' : 'var(--amber)') + '">' + RC.date(b.end_date) + '</span></div>';
      }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>') +
      '</div></div>' +
      '<div class="rc-card"><h3>' + t('latest') + ' — ' + t('bookings') + '</h3>' +
      (d.latest_bookings.length ? d.latest_bookings.map(function (b) {
        return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line)"><div><b>' + esc(b.reference || '#' + b.id) + '</b><div style="font-size:.78rem;color:var(--muted)">' + esc(b.customer ? b.customer.name : '') + ' · ' + esc(b.car ? L(b.car, 'name') : '') + '</div></div>' + RC.badge(b.status) + '</div>';
      }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>') +
      '</div>';
  };

  /* ---- generic list loader ---- */
  function crudList(cfg) {
    let page = 1, q = '', filter = {};
    async function load() {
      view().innerHTML = cfg.toolbar() + '<div id="rc-list">' + t('loading') + '</div>';
      bindToolbar();
      let url = cfg.endpoint + '?page=' + page + (q ? '&q=' + encodeURIComponent(q) : '');
      Object.keys(filter).forEach(function (k) { if (filter[k]) url += '&' + k + '=' + encodeURIComponent(filter[k]); });
      const res = await RC.api('GET', url);
      const data = res.data || res;
      $('#rc-list').innerHTML = cfg.render(data, res) + pager(res.data ? res : null, function (p) { page = p; load(); });
      cfg.bind && cfg.bind(data, reload);
    }
    function reload() { load(); }
    function bindToolbar() {
      const s = $('#rc-search'); if (s) s.oninput = debounce(function () { q = s.value; page = 1; load(); }, 300);
      document.querySelectorAll('[data-filter]').forEach(function (el) { el.onchange = function () { filter[el.dataset.filter] = el.value; page = 1; load(); }; });
      const add = $('#rc-add'); if (add) add.onclick = function () { cfg.form(null, reload); };
    }
    load();
    return reload;
  }
  function debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ---- Cars ---- */
  PAGES.cars = function () {
    crudList({
      endpoint: '/admin/cars',
      toolbar: function () {
        return toolbar('<input class="rc-input rc-search" id="rc-search" data-i18n-ph="search"><select class="rc-select" data-filter="status" style="max-width:160px"><option value="">' + t('all') + '</option><option value="available">' + t('available') + '</option><option value="rented">' + t('rented') + '</option><option value="maintenance">' + t('maintenance') + '</option></select><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_car') + '</button>');
      },
      render: function (cars) {
        const rows = cars.map(function (c) {
          return '<tr><td><div class="car-cell"><div class="car-thumb"' + (c.image ? ' style="background-image:url(' + esc(c.image) + ')"' : '') + '>' + (c.image ? '' : RC.icon('car', 18)) + '</div><div><b class="rc-link" data-hist="' + c.id + '" title="' + t('rental_history') + '">' + esc(L(c, 'name')) + '</b><div class="muted" style="font-size:.78rem">' + esc(c.plate_number || '') + '</div></div></div></td>' +
            '<td>' + esc(c.category ? L(c.category, 'name') : '—') + '</td>' +
            '<td>' + (c.offer_price && +c.offer_price > 0 ? '<span class="price-was">' + RC.money(c.daily_price) + '</span><b style="color:var(--red)">' + RC.money(c.offer_price) + '</b>' : RC.money(c.daily_price)) + (c.images_count ? ' <span class="muted" style="font-size:.72rem">· ' + c.images_count + ' 🖼</span>' : '') + '</td>' +
            '<td>' + RC.badge(c.status) + '</td>' +
            '<td class="rc-actions"><button class="rc-ic-btn" data-hist2="' + c.id + '" title="' + t('rental_history') + '">'+RC.icon('history',16)+'</button> <button class="rc-ic-btn" data-edit="' + c.id + '">'+RC.icon('edit',16)+'</button> <button class="rc-ic-btn danger" data-del="' + c.id + '">'+RC.icon('trash',16)+'</button></td></tr>';
        }).join('');
        return tableWrap(['name', 'category', 'daily_price', 'status', 'actions'], rows);
      },
      bind: function (cars, reload) {
        document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { location.href = 'car-form.html?id=' + b.dataset.edit; }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/cars/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
        document.querySelectorAll('[data-hist],[data-hist2]').forEach(function (b) { b.onclick = function () { PAGES._carHistory(b.dataset.hist || b.dataset.hist2); }; });
      },
      form: function () { location.href = 'car-form.html'; },
    });
  };
  /* ---- Add / edit car — full page with live image gallery (up to 15) ---- */
  const MAX_IMG = 15;
  PAGES['car-form'] = async function () {
    const id = new URLSearchParams(location.search).get('id');
    const cats = await RC.api('GET', '/admin/categories');
    const catOpts = [{ v: '', l: '—' }].concat(cats.map(function (c) { return { v: c.id, l: L(c, 'name') }; }));
    const branches = await RC.api('GET', '/admin/branches').catch(function () { return []; });
    const branchOpts = [{ v: '', l: t('no_branch') }].concat((branches || []).map(function (x) { return { v: x.id, l: x.name }; }));
    let b = {};
    if (id) { b = await RC.api('GET', '/admin/cars/' + id); }
    const h1 = document.querySelector('.rc-top h1'); if (h1) { h1.removeAttribute('data-i18n'); h1.textContent = id ? t('edit') : t('new_car'); }
    document.querySelectorAll('.rc-nav a').forEach(function (a) { a.classList.toggle('on', a.dataset.key === 'cars'); });
    let pending = []; // add-mode staged files: {file, url, main}

    const ab = b.active_booking;
    let handoverBanner = '';
    if (id && ab) {
      const isActive = ab.status === 'active';
      const meta = esc(ab.reference || '') + ' · ' + esc(ab.customer ? ab.customer.name : '') + ' · ' + RC.date(ab.start_date) + ' → ' + RC.date(ab.end_date);
      const action = isActive
        ? '<button class="rc-btn" id="hobtn">' + RC.icon('check', 16) + ' ' + t('confirm_handover') + '</button>'
        : '<button class="rc-btn" id="delbtn">' + RC.icon('check', 16) + ' ' + t('deliver_car') + '</button>';
      const delivered = ab.delivered_by
        ? '<div class="muted" style="font-size:.84rem;margin-top:8px">' + RC.icon('check', 13) + ' ' + t('delivery_info') + ': ' + t('delivered_by') + ' <b>' + esc(ab.delivered_by) + '</b> · ' + t('delivered_date') + ' ' + RC.date(ab.delivered_at) + (ab.delivered_mileage ? ' · ' + t('mileage') + ' ' + ab.delivered_mileage : '') + '</div>'
        : '';
      handoverBanner =
        '<div class="handover-box">' +
        '<div class="hb-row"><div><b>' + (isActive ? t('rented_now') : t('ready_to_deliver')) + '</b><div class="muted" style="font-size:.84rem">' + meta + '</div></div>' + action + '</div>' +
        delivered + '</div>';
    } else if (id && b.status === 'rented') {
      // Manually marked "rented" with no linked booking → offer a simple return to availability.
      handoverBanner =
        '<div class="handover-box">' +
        '<div class="hb-row"><div><b>' + t('rented_now') + '</b></div>' +
        '<button class="rc-btn" id="mret">' + RC.icon('check', 16) + ' ' + t('confirm_handover') + '</button></div></div>';
    }

    view().innerHTML =
      '<a class="pg-back" id="back">‹ ' + t('cars') + '</a>' +
      handoverBanner +
      '<div class="car-form-page">' +
      '<form class="cf-main rc-card rc-form" id="carf">' +
      '<div class="row">' + field(t('name') + ' (ع)', input('name_ar', b.name_ar)) + field(t('name') + ' (EN)', input('name_en', b.name_en)) + '</div>' +
      '<div class="row">' + field(t('category'), select('category_id', catOpts, b.category_id)) + field(t('plate'), input('plate_number', b.plate_number)) + '</div>' +
      '<div class="row">' + field(t('daily_price'), input('daily_price', b.daily_price, 'number')) + field(t('offer_price'), input('offer_price', b.offer_price, 'number')) + '</div>' +
      '<div class="row">' + field(t('offer_label'), input('offer_label', b.offer_label)) + field(t('deposit'), input('deposit', b.deposit, 'number')) + '</div>' +
      '<div class="row">' + field(t('transmission'), select('transmission', [{ v: 'auto', l: t('auto') }, { v: 'manual', l: t('manual') }], b.transmission)) + field(t('fuel'), select('fuel', [{ v: 'petrol', l: t('petrol') }, { v: 'diesel', l: t('diesel') }, { v: 'electric', l: t('electric') }, { v: 'hybrid', l: t('hybrid') }], b.fuel)) + '</div>' +
      '<div class="row">' + field(t('year'), input('year', b.year, 'number')) + field(t('seats'), input('seats', b.seats, 'number')) + '</div>' +
      '<div class="row">' + field(t('status'), select('status', [{ v: 'available', l: t('available') }, { v: 'rented', l: t('rented') }, { v: 'maintenance', l: t('maintenance') }, { v: 'hidden', l: t('hidden') }], b.status || 'available')) + '<div class="rc-field"><label>' + t('featured') + '</label><label class="chk" style="padding-top:8px"><input type="checkbox" name="featured" ' + (b.featured ? 'checked' : '') + '> ' + t('featured') + '</label></div></div>' +
      '<div class="row">' + field(t('branch'), select('branch_id', branchOpts, b.branch_id)) + field(t('mileage'), input('mileage', b.mileage, 'number')) + '</div>' +
      '<div class="cf-sep">' + RC.icon('wrench', 15) + ' ' + t('fleet_compliance') + '</div>' +
      '<div class="row">' + field(t('insurance_expiry'), input('insurance_expiry', (b.insurance_expiry || '').slice(0, 10), 'date')) + field(t('registration_expiry'), input('registration_expiry', (b.registration_expiry || '').slice(0, 10), 'date')) + '</div>' +
      '<div class="row">' + field(t('inspection_expiry'), input('inspection_expiry', (b.inspection_expiry || '').slice(0, 10), 'date')) + field(t('next_service'), input('next_service_date', (b.next_service_date || '').slice(0, 10), 'date')) + '</div>' +
      field(t('description') + ' (ع)', textarea('description_ar', b.description_ar)) +
      field(t('description') + ' (EN)', textarea('description_en', b.description_en)) +
      '</form>' +
      '<div class="cf-side rc-card"><h3>' + t('images') + ' <span class="muted" id="galcount" style="font-weight:600;font-size:.8rem"></span></h3>' +
      '<p class="muted" style="font-size:.78rem;margin:-6px 0 10px">' + t('max_images') + ' · ' + t('main_image') + ' ★</p>' +
      '<div class="gal" id="gal"></div>' +
      '<label class="cf-upload" id="uplab">' + RC.icon('upload', 16) + ' ' + t('add') + '<input type="file" id="imgin" multiple accept="image/*" hidden></label>' +
      '</div></div>' +
      '<div style="display:flex;gap:10px;margin-top:16px"><button class="rc-btn navy" id="save">' + RC.icon('check', 16) + ' ' + t('save') + '</button><button class="rc-btn ghost" id="cancel">' + t('cancel') + '</button>' + (id && branches.length ? '<div style="flex:1"></div><button class="rc-btn ghost" id="trbtn">' + RC.icon('transfer', 16) + ' ' + t('transfer_car') + '</button>' : '') + '</div>' +
      (id ? '<div id="carextra" style="margin-top:18px"></div>' : '');

    $('#back').onclick = function () { location.href = 'cars.html'; };
    $('#cancel').onclick = function () { location.href = 'cars.html'; };
    if ($('#trbtn')) $('#trbtn').onclick = function () { transferForm(); };
    if (id) loadCarExtra();

    function transferForm() {
      const opts = branchOpts.filter(function (o) { return String(o.v) !== String(b.branch_id); });
      const body = '<form class="rc-form" id="trf">' +
        '<div class="muted" style="font-size:.85rem;margin-bottom:6px">' + t('current_branch') + ': <b>' + esc((b.branch && b.branch.name) || t('no_branch')) + '</b></div>' +
        field(t('transfer_to'), select('to_branch_id', opts, '')) +
        field(t('performed_by'), input('transferred_by', (ME && ME.name) || '')) +
        field(t('notes'), input('note', '')) + '</form>';
      const w = RC.modal(t('transfer_car'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="trs">' + t('transfer') + '</button>');
      $('#trs', w).onclick = async function () { const f = $('#trf', w); try { await RC.api('POST', '/admin/cars/' + id + '/transfer', formData(f)); RC.closeModal(); RC.toast(t('transfer_done')); PAGES['car-form'](); } catch (e) { err(e, f); } };
    }

    async function loadCarExtra() {
      let mts = [], dms = [];
      try { mts = await RC.api('GET', '/admin/maintenance?car_id=' + id); } catch (e) {}
      try { dms = await RC.api('GET', '/admin/damages?car_id=' + id); } catch (e) {}
      const mrows = (mts || []).map(function (m) {
        return '<div class="tl-item"><div class="tl-dot"></div><div class="tl-body"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + t('svc_' + (m.type || 'service')) + ' — ' + esc(m.title || '') + '</b><span>' + RC.money(m.cost) + '</span></div><div class="muted" style="font-size:.78rem">' + (m.performed_at ? RC.date(m.performed_at) : '') + (m.odometer ? ' · ' + m.odometer + ' كم' : '') + (m.vendor ? ' · ' + esc(m.vendor) : '') + (m.next_due_date ? ' · ' + t('next_due_date') + ' ' + RC.date(m.next_due_date) : '') + '</div></div></div>';
      }).join('') || '<div class="rc-empty">' + t('no_data') + '</div>';
      const drows = (dms || []).map(function (dm) {
        return '<div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid var(--line)"><div><b>' + esc(dm.title || '') + '</b><div class="muted" style="font-size:.76rem">' + t('sev_' + (dm.severity || 'minor')) + ' · ' + t('st_' + (dm.status || 'open')) + (dm.occurred_at ? ' · ' + RC.date(dm.occurred_at) : '') + '</div></div><span>' + RC.money(dm.repair_cost && +dm.repair_cost > 0 ? dm.repair_cost : dm.cost_estimate) + '</span></div>';
      }).join('') || '<div class="rc-empty">' + t('no_data') + '</div>';
      $('#carextra').innerHTML =
        '<div class="rc-grid" style="grid-template-columns:1fr 1fr;gap:16px">' +
        '<div class="rc-card"><h3>' + RC.icon('wrench', 16) + ' ' + t('service_log') + ' <a href="maintenance.html" class="rc-link" style="font-size:.78rem;font-weight:600;margin-inline-start:auto">' + t('maintenance_log') + ' ›</a></h3><div class="rc-timeline">' + mrows + '</div></div>' +
        '<div class="rc-card"><h3>' + RC.icon('damage', 16) + ' ' + t('damages') + '</h3>' + drows + '</div>' +
        '</div>';
    }
    if ($('#hobtn')) $('#hobtn').onclick = function () { handoverForm(ab); };
    if ($('#delbtn')) $('#delbtn').onclick = function () { deliverForm(ab); };
    if ($('#mret')) $('#mret').onclick = async function () {
      if (!(await RC.confirm(t('confirm_handover') + '؟'))) return;
      try { await RC.api('PATCH', '/admin/cars/' + id + '/status', { status: 'available' }); RC.toast(t('saved')); PAGES['car-form'](); }
      catch (e) { err(e); }
    };

    function deliverForm(booking) {
      const now = new Date(); const todayT = now.toISOString().slice(0, 16);
      const body = '<form class="rc-form" id="dlf">' +
        '<div class="muted" style="font-size:.85rem;margin-bottom:4px">' + esc(booking.reference || '') + ' · ' + esc(booking.customer ? booking.customer.name : '') + '</div>' +
        field(t('delivered_by'), input('delivered_by', (ME && ME.name) || '')) +
        '<div class="row">' + field(t('delivered_date'), input('delivered_at', todayT, 'datetime-local')) + field(t('mileage'), input('delivered_mileage', '', 'number')) + '</div>' +
        field(t('notes'), textarea('delivered_notes', '')) +
        '</form>';
      const w = RC.modal(t('deliver_car'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="dls">' + t('deliver_car') + '</button>');
      $('#dls', w).onclick = async function () {
        const f = $('#dlf', w); f.querySelectorAll('.err').forEach(function (e) { e.remove(); });
        const d = formData(f);
        try { await RC.api('POST', '/admin/bookings/' + booking.id + '/deliver', d); RC.closeModal(); RC.toast(t('saved')); PAGES['car-form'](); }
        catch (e) { err(e, f); }
      };
    }

    function handoverForm(booking) {
      const today = new Date().toISOString().slice(0, 10);
      const remaining = Math.max(0, (booking.total || 0) - (booking.deposit_paid || 0));
      const body = '<form class="rc-form" id="hof">' +
        field(t('handover_by'), input('handover_by', (ME && ME.name) || '')) +
        '<div class="row">' + field(t('handover_date'), input('handover_at', today, 'date')) + field(t('mileage'), input('handover_mileage', '', 'number')) + '</div>' +
        field(t('voucher'), '<input class="rc-input" type="file" name="receipt" accept="image/*">') +
        field(t('notes'), textarea('handover_notes', '')) +
        (remaining > 0.001
          ? '<div class="rc-card" style="box-shadow:none;background:var(--surface-2);padding:12px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>' + t('remaining') + '</span><b style="color:var(--red)">' + RC.money(remaining) + '</b></div>' +
            '<label class="chk"><input type="checkbox" name="settle" id="settlechk"> ' + t('settle_remaining') + '</label>' +
            '<div id="settlebox" style="display:none;margin-top:8px">' + field(t('method'), select('settle_method', [{ v: 'cash', l: t('cash') }, { v: 'card', l: t('card') }, { v: 'transfer', l: t('transfer') }], 'cash')) + '</div></div>'
          : '') +
        '</form>';
      const w = RC.modal(t('confirm_handover'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="hos">' + t('confirm_handover') + '</button>');
      if ($('#settlechk', w)) $('#settlechk', w).onchange = function () { $('#settlebox', w).style.display = this.checked ? '' : 'none'; };
      $('#hos', w).onclick = async function () {
        const f = $('#hof', w); f.querySelectorAll('.err').forEach(function (e) { e.remove(); });
        const fd = new FormData(f);
        if (!fd.get('receipt') || !fd.get('receipt').name) fd.delete('receipt');
        fd.set('settle_remaining', (f.settle && f.settle.checked) ? 1 : 0);
        Array.from(fd.keys()).forEach(function (k) { if (fd.get(k) === '') fd.delete(k); });
        try {
          await RC.apiForm('POST', '/admin/bookings/' + booking.id + '/handover', fd);
          RC.closeModal(); RC.toast(t('saved'));
          // car is now returned → available
          const banner = document.querySelector('.handover-box');
          if (banner) banner.outerHTML = '<div class="handover-box available"><div class="hb-row"><b>' + t('car_now_available') + '</b><span class="rc-badge s-available">' + t('available') + '</span></div></div>';
          const sel = document.querySelector('#carf [name=status]');
          if (sel) { sel.value = 'available'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
        } catch (e) { err(e, f); }
      };
    }

    function count() { return id ? (b.images || []).length : pending.length; }
    function drawGal() {
      const gal = $('#gal');
      let cells;
      if (id) {
        const imgs = b.images || [];
        cells = imgs.map(function (im) {
          const isMain = b.image === im.path;
          return '<div class="cell' + (isMain ? ' main' : '') + '" style="background-image:url(' + esc(im.path) + ')"><button type="button" class="x" data-rm="' + im.id + '">✕</button>' + (isMain ? '<span class="mktag">★</span>' : '<button type="button" class="mk" data-main="' + im.id + '">★</button>') + '</div>';
        }).join('');
      } else {
        cells = pending.map(function (p, i) {
          return '<div class="cell' + (p.main ? ' main' : '') + '" style="background-image:url(' + p.url + ')"><button type="button" class="x" data-rmp="' + i + '">✕</button>' + (p.main ? '<span class="mktag">★</span>' : '<button type="button" class="mk" data-mainp="' + i + '">★</button>') + '</div>';
        }).join('');
      }
      gal.innerHTML = cells || '<span class="muted" style="font-size:.82rem">—</span>';
      $('#galcount').textContent = '(' + count() + ' / ' + MAX_IMG + ')';
      // edit-mode server handlers
      gal.querySelectorAll('[data-rm]').forEach(function (x) { x.onclick = async function () { b = await RC.api('DELETE', '/admin/cars/' + id + '/images/' + x.dataset.rm); drawGal(); }; });
      gal.querySelectorAll('[data-main]').forEach(function (x) { x.onclick = async function () { b = await RC.api('POST', '/admin/cars/' + id + '/images/' + x.dataset.main + '/main'); drawGal(); }; });
      // add-mode staged handlers
      gal.querySelectorAll('[data-rmp]').forEach(function (x) { x.onclick = function () { URL.revokeObjectURL(pending[+x.dataset.rmp].url); pending.splice(+x.dataset.rmp, 1); drawGal(); }; });
      gal.querySelectorAll('[data-mainp]').forEach(function (x) { x.onclick = function () { pending.forEach(function (p, i) { p.main = (i == x.dataset.mainp); }); drawGal(); }; });
    }
    drawGal();

    $('#imgin').onchange = async function () {
      const files = Array.prototype.slice.call(this.files);
      this.value = '';
      if (id) {
        // upload immediately so the merchant sees them right away
        const room = MAX_IMG - count();
        const take = files.slice(0, Math.max(0, room));
        if (!take.length) { RC.toast(t('max_images'), 'err'); return; }
        const fd = new FormData(); take.forEach(function (f) { fd.append('images[]', f); });
        try { b = await RC.apiForm('POST', '/admin/cars/' + id + '/images', fd); drawGal(); } catch (e) { err(e); }
      } else {
        files.forEach(function (f) { if (pending.length < MAX_IMG) pending.push({ file: f, url: URL.createObjectURL(f), main: pending.length === 0 }); });
        drawGal();
      }
    };

    $('#save').onclick = async function () {
      const form = $('#carf'); form.querySelectorAll('.err').forEach(function (e) { e.remove(); });
      const fd = new FormData(form);
      // drop empty fields so DB defaults / nullable apply (e.g. seats)
      Array.from(fd.keys()).forEach(function (k) { if (fd.get(k) === '') fd.delete(k); });
      fd.set('featured', form.featured.checked ? 1 : 0);
      if (!id) {
        // send staged images (main first so it becomes the cover)
        const ordered = pending.slice().sort(function (a, c) { return (c.main ? 1 : 0) - (a.main ? 1 : 0); });
        ordered.forEach(function (p) { fd.append('images[]', p.file); });
      }
      try {
        await RC.apiForm('POST', id ? '/admin/cars/' + id : '/admin/cars', fd);
        RC.toast(t('saved')); location.href = 'cars.html';
      } catch (e) { err(e, form); }
    };
  };

  /* ---- Car rental history (who rented it, when) ---- */
  PAGES._carHistory = async function (id) {
    const w = RC.modal(t('rental_history'), '<p>' + t('loading') + '</p>');
    const d = await RC.api('GET', '/admin/cars/' + id + '/history');
    const s = d.stats;
    const tile = function (ic, v, k) { return '<div class="rc-tile" style="padding:12px"><div class="ic navy" style="width:40px;height:40px;font-size:1rem">' + RC.icon(ic, 18) + '</div><div><div class="v" style="font-size:1.1rem">' + v + '</div><div class="k">' + k + '</div></div></div>'; };
    const bs = d.bookings;
    const body =
      '<div style="font-weight:800;margin-bottom:4px">' + esc(L(d.car, 'name')) + (d.car.plate_number ? ' · ' + esc(d.car.plate_number) : '') + '</div>' +
      '<div class="rc-grid" style="grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">' +
      tile('history', s.total_rentals, t('times_rented')) + tile('calendar', s.days, t('total_days')) +
      tile('wallet', RC.money(s.revenue), t('revenue')) + tile('bookings', s.active, t('active')) +
      '</div>' +
      (bs.length ? '<div class="rc-timeline">' + bs.map(function (b) {
        return '<div class="tl-item s-' + b.status + '"><div class="tl-dot"></div><div class="tl-body"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>' + esc(b.customer ? b.customer.name : '—') + '</b>' + RC.badge(b.status) + '</div>' +
          '<div class="muted" style="font-size:.83rem">' + RC.icon('calendar', 13) + ' ' + RC.date(b.start_date) + ' → ' + RC.date(b.end_date) + ' (' + b.days + ' ' + t('days') + ')' + (b.delivery ? ' · ' + t('delivery') : '') + '</div>' +
          '<div class="muted" style="font-size:.83rem">' + esc(b.reference || '') + (b.customer && b.customer.phone ? ' · ' + esc(b.customer.phone) : '') + ' · ' + t('total') + ': ' + RC.money(b.total) + '</div>' +
          '</div></div>';
      }).join('') + '</div>' : '<div class="rc-empty">' + t('no_history') + '</div>');
    w.querySelector('.rc-modal-body').innerHTML = body;
  };

  /* ---- Categories ---- */
  PAGES.categories = function () {
    crudList({
      endpoint: '/admin/categories',
      toolbar: function () { return toolbar('<h3 style="font-size:1rem">' + t('categories') + '</h3><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_category') + '</button>'); },
      render: function (cats) {
        const rows = cats.map(function (c) { return '<tr><td><b>' + esc(c.name_ar) + '</b></td><td>' + esc(c.name_en) + '</td><td>' + (c.cars_count || 0) + ' ' + t('cars') + '</td><td><button class="rc-ic-btn" data-edit="' + c.id + '">'+RC.icon('edit',16)+'</button> <button class="rc-ic-btn danger" data-del="' + c.id + '">'+RC.icon('trash',16)+'</button></td></tr>'; }).join('');
        return tableWrap([{ raw: t('name') + ' (ع)' }, { raw: t('name') + ' (EN)' }, 'cars', 'actions'], rows);
      },
      bind: function (cats, reload) {
        document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { catForm(cats.find(function (c) { return c.id == b.dataset.edit; }), reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/categories/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
      },
      form: function (_, reload) { catForm(null, reload); },
    });
    function catForm(c, reload) {
      c = c || {};
      const body = '<form class="rc-form" id="catf"><div class="row">' + field(t('name') + ' (ع)', input('name_ar', c.name_ar)) + field(t('name') + ' (EN)', input('name_en', c.name_en)) + '</div></form>';
      const w = RC.modal(c.id ? t('edit') : t('new_category'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="cs">' + t('save') + '</button>');
      $('#cs', w).onclick = async function () { const f = $('#catf', w); try { await RC.api(c.id ? 'PATCH' : 'POST', c.id ? '/admin/categories/' + c.id : '/admin/categories', formData(f)); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e, f); } };
    }
  };

  /* ---- Branches ---- */
  PAGES.branches = function () {
    crudList({
      endpoint: '/admin/branches',
      toolbar: function () { return toolbar('<h3 style="font-size:1rem">' + t('branches') + '</h3><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_branch') + '</button>'); },
      render: function (bs) {
        const rows = bs.map(function (b) { return '<tr><td><b>' + esc(b.name) + '</b>' + (b.is_primary ? ' <span class="rc-badge s-available">' + t('primary_branch') + '</span>' : '') + '</td><td>' + esc(b.city || '—') + '</td><td>' + esc(b.phone || '—') + '</td><td>' + (b.cars_count || 0) + ' ' + t('cars') + '</td><td class="rc-actions"><button class="rc-ic-btn" data-edit="' + b.id + '">' + RC.icon('edit', 16) + '</button> <button class="rc-ic-btn danger" data-del="' + b.id + '">' + RC.icon('trash', 16) + '</button></td></tr>'; }).join('');
        return tableWrap([{ raw: t('name') }, { raw: t('city') }, { raw: t('phone') }, 'cars', 'actions'], rows);
      },
      bind: function (bs, reload) {
        document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { brForm(bs.find(function (x) { return x.id == b.dataset.edit; }), reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/branches/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
      },
      form: function (_, reload) { brForm(null, reload); },
    });
    function brForm(b, reload) {
      b = b || {};
      const body = '<form class="rc-form" id="brf">' +
        field(t('name'), input('name', b.name)) +
        '<div class="row">' + field(t('city'), input('city', b.city)) + field(t('phone'), input('phone', b.phone)) + '</div>' +
        field(t('address'), input('address', b.address)) +
        '<label class="chk"><input type="checkbox" name="is_primary" ' + (b.is_primary ? 'checked' : '') + '> ' + t('primary_branch') + '</label>' +
        '</form>';
      const w = RC.modal(b.id ? t('edit') : t('new_branch'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="brs">' + t('save') + '</button>');
      $('#brs', w).onclick = async function () { const f = $('#brf', w); const d = formData(f); d.is_primary = f.is_primary.checked ? 1 : 0; try { await RC.api(b.id ? 'PATCH' : 'POST', b.id ? '/admin/branches/' + b.id : '/admin/branches', d); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e, f); } };
    }
  };

  // shared: fetch all cars for pickers
  async function allCars() { try { const r = await RC.api('GET', '/admin/cars?per_page=1000'); return r.data || r; } catch (e) { return []; } }
  function carOpts(cars, val) { return [{ v: '', l: '—' }].concat(cars.map(function (c) { return { v: c.id, l: L(c, 'name') + (c.plate_number ? ' · ' + c.plate_number : '') }; })); }

  /* ---- Maintenance / service log ---- */
  const MTYPES = [['service', 'svc_service'], ['oil', 'svc_oil'], ['repair', 'svc_repair'], ['inspection', 'svc_inspection'], ['tires', 'svc_tires'], ['battery', 'svc_battery'], ['insurance', 'svc_insurance'], ['other', 'svc_other']];
  PAGES.maintenance = function () {
    let CARS = [];
    allCars().then(function (c) { CARS = c; });
    crudList({
      endpoint: '/admin/maintenance',
      toolbar: function () { return toolbar('<h3 style="font-size:1rem">' + t('maintenance_log') + '</h3><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_maintenance') + '</button>'); },
      render: function (rows) {
        const tr = rows.map(function (m) {
          return '<tr><td><b>' + esc(m.car ? L(m.car, 'name') : '—') + '</b><div class="muted" style="font-size:.76rem">' + esc(m.car ? (m.car.plate_number || '') : '') + '</div></td>' +
            '<td>' + t('svc_' + (m.type || 'service')) + '<div class="muted" style="font-size:.78rem">' + esc(m.title || '') + '</div></td>' +
            '<td>' + RC.money(m.cost) + '</td>' +
            '<td>' + (m.performed_at ? RC.date(m.performed_at) : '—') + '</td>' +
            '<td>' + (m.next_due_date ? RC.date(m.next_due_date) : '—') + '</td>' +
            '<td class="rc-actions"><button class="rc-ic-btn" data-edit="' + m.id + '">' + RC.icon('edit', 16) + '</button> <button class="rc-ic-btn danger" data-del="' + m.id + '">' + RC.icon('trash', 16) + '</button></td></tr>';
        }).join('');
        return tableWrap([{ raw: t('car') || 'السيارة' }, { raw: t('type') }, { raw: t('cost') }, { raw: t('performed_at') }, { raw: t('next_due_date') }, 'actions'], tr);
      },
      bind: function (rows, reload) {
        document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { mForm(rows.find(function (x) { return x.id == b.dataset.edit; }), reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/maintenance/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
      },
      form: function (_, reload) { mForm(null, reload); },
    });
    function mForm(m, reload) {
      m = m || {};
      const body = '<form class="rc-form" id="mtf">' +
        '<div class="row">' + field(t('car') || 'السيارة', select('car_id', carOpts(CARS), m.car_id)) + field(t('type'), select('type', MTYPES.map(function (x) { return { v: x[0], l: t(x[1]) }; }), m.type || 'service')) + '</div>' +
        field(t('svc_title'), input('title', m.title)) +
        '<div class="row">' + field(t('cost'), input('cost', m.cost, 'number')) + field(t('odometer'), input('odometer', m.odometer, 'number')) + '</div>' +
        '<div class="row">' + field(t('performed_at'), input('performed_at', (m.performed_at || '').slice(0, 10), 'date')) + field(t('vendor'), input('vendor', m.vendor)) + '</div>' +
        '<div class="row">' + field(t('next_due_date'), input('next_due_date', (m.next_due_date || '').slice(0, 10), 'date')) + field(t('next_due_odometer'), input('next_due_odometer', m.next_due_odometer, 'number')) + '</div>' +
        '</form>';
      const w = RC.modal(m.id ? t('edit') : t('new_maintenance'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="mts">' + t('save') + '</button>');
      $('#mts', w).onclick = async function () { const f = $('#mtf', w); const d = formData(f); Object.keys(d).forEach(function (k) { if (d[k] === '') delete d[k]; }); try { await RC.api(m.id ? 'PATCH' : 'POST', m.id ? '/admin/maintenance/' + m.id : '/admin/maintenance', d); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e, f); } };
    }
  };

  /* ---- Damages & claims ---- */
  const SEVS = [['minor', 'sev_minor'], ['moderate', 'sev_moderate'], ['major', 'sev_major']];
  const DSTA = [['open', 'st_open'], ['in_repair', 'st_in_repair'], ['resolved', 'st_resolved']];
  PAGES.damages = function () {
    let CARS = [];
    allCars().then(function (c) { CARS = c; });
    crudList({
      endpoint: '/admin/damages',
      toolbar: function () { return toolbar('<h3 style="font-size:1rem">' + t('damages') + '</h3><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_damage') + '</button>'); },
      render: function (rows) {
        const sevColor = { minor: 'var(--blue)', moderate: 'var(--orange)', major: 'var(--red)' };
        const tr = rows.map(function (dm) {
          return '<tr><td><b>' + esc(dm.car ? L(dm.car, 'name') : '—') + '</b><div class="muted" style="font-size:.76rem">' + esc(dm.car ? (dm.car.plate_number || '') : '') + '</div></td>' +
            '<td>' + esc(dm.title || '') + (dm.insurance_claim ? ' <span class="rc-badge" style="background:rgba(var(--accent-rgb),.14);color:var(--amber)">' + t('insurance_claim') + '</span>' : '') + '</td>' +
            '<td><span class="rc-badge" style="background:' + (sevColor[dm.severity] || 'var(--muted)') + '22;color:' + (sevColor[dm.severity] || 'var(--muted)') + '">' + t('sev_' + (dm.severity || 'minor')) + '</span></td>' +
            '<td>' + RC.money(dm.repair_cost && +dm.repair_cost > 0 ? dm.repair_cost : dm.cost_estimate) + '</td>' +
            '<td>' + t('st_' + (dm.status || 'open')) + '</td>' +
            '<td class="rc-actions">' + (dm.status !== 'resolved' ? '<button class="rc-ic-btn" data-res="' + dm.id + '" title="' + t('mark_resolved') + '">' + RC.icon('check', 16) + '</button> ' : '') + '<button class="rc-ic-btn" data-edit="' + dm.id + '">' + RC.icon('edit', 16) + '</button> <button class="rc-ic-btn danger" data-del="' + dm.id + '">' + RC.icon('trash', 16) + '</button></td></tr>';
        }).join('');
        return tableWrap([{ raw: t('car') || 'السيارة' }, { raw: t('title') || 'الوصف' }, { raw: t('severity') }, { raw: t('cost') }, { raw: t('status') }, 'actions'], tr);
      },
      bind: function (rows, reload) {
        document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { dForm(rows.find(function (x) { return x.id == b.dataset.edit; }), reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/damages/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
        document.querySelectorAll('[data-res]').forEach(function (b) { b.onclick = async function () { const fd = new FormData(); fd.append('_resolve', '1'); await RC.apiForm('POST', '/admin/damages/' + b.dataset.res, fd); RC.toast(t('saved')); reload(); }; });
      },
      form: function (_, reload) { dForm(null, reload); },
    });
    function dForm(dm, reload) {
      dm = dm || {};
      const body = '<form class="rc-form" id="dmf">' +
        '<div class="row">' + field(t('car') || 'السيارة', select('car_id', carOpts(CARS), dm.car_id)) + field(t('severity'), select('severity', SEVS.map(function (x) { return { v: x[0], l: t(x[1]) }; }), dm.severity || 'minor')) + '</div>' +
        field(t('svc_title'), input('title', dm.title)) +
        field(t('details'), textarea('description', dm.description)) +
        '<div class="row">' + field(t('cost_estimate'), input('cost_estimate', dm.cost_estimate, 'number')) + field(t('repair_cost'), input('repair_cost', dm.repair_cost, 'number')) + '</div>' +
        '<div class="row">' + field(t('occurred_at'), input('occurred_at', (dm.occurred_at || '').slice(0, 10), 'date')) + field(t('status'), select('status', DSTA.map(function (x) { return { v: x[0], l: t(x[1]) }; }), dm.status || 'open')) + '</div>' +
        '<label class="chk"><input type="checkbox" name="insurance_claim" ' + (dm.insurance_claim ? 'checked' : '') + '> ' + t('insurance_claim') + '</label>' +
        '<div class="row">' + field(t('claim_ref'), input('claim_ref', dm.claim_ref)) + field(t('claim_amount'), input('claim_amount', dm.claim_amount, 'number')) + '</div>' +
        field(t('photos'), '<input class="rc-input" type="file" name="images[]" accept="image/*" multiple>') +
        '</form>';
      const w = RC.modal(dm.id ? t('edit') : t('new_damage'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="dms">' + t('save') + '</button>');
      $('#dms', w).onclick = async function () {
        const f = $('#dmf', w); const fd = new FormData(f);
        fd.set('insurance_claim', f.insurance_claim.checked ? '1' : '0');
        // strip empty file input so validation doesn't choke
        if (!f['images[]'].files.length) fd.delete('images[]');
        try { await RC.apiForm('POST', dm.id ? '/admin/damages/' + dm.id : '/admin/damages', fd); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e, f); }
      };
    }
  };

  /* ---- Customers ---- */
  PAGES.customers = function () {
    crudList({
      endpoint: '/admin/customers',
      toolbar: function () { return toolbar('<input class="rc-input rc-search" id="rc-search" data-i18n-ph="search"><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_customer') + '</button>'); },
      render: function (cs) {
        const rows = cs.map(function (c) { return '<tr><td><b>' + esc(c.name) + '</b></td><td>' + esc(c.phone || '—') + '</td><td>' + esc(c.national_id || '—') + '</td><td>' + (c.bookings_count || 0) + '</td><td><button class="rc-ic-btn" data-edit="' + c.id + '">'+RC.icon('edit',16)+'</button> <button class="rc-ic-btn danger" data-del="' + c.id + '">'+RC.icon('trash',16)+'</button></td></tr>'; }).join('');
        return tableWrap(['name', 'phone', 'national_id', 'bookings', 'actions'], rows);
      },
      bind: function (cs, reload) {
        document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { custForm(cs.find(function (c) { return c.id == b.dataset.edit; }), reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/customers/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
      },
      form: function (_, reload) { custForm(null, reload); },
    });
    function custForm(c, reload) {
      c = c || {};
      const body = '<form class="rc-form" id="cf">' +
        '<div class="row">' + field(t('name'), input('name', c.name)) + field(t('phone'), input('phone', c.phone)) + '</div>' +
        '<div class="row">' + field(t('email'), input('email', c.email, 'email')) + field(t('national_id'), input('national_id', c.national_id)) + '</div>' +
        '<div class="row">' + field(t('license'), input('license_number', c.license_number)) + field(t('city'), input('city', c.city)) + '</div>' +
        field(t('notes'), textarea('notes', c.notes)) + '</form>';
      const w = RC.modal(c.id ? t('edit') : t('new_customer'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="cs">' + t('save') + '</button>');
      $('#cs', w).onclick = async function () { const f = $('#cf', w); f.querySelectorAll('.err').forEach(function (e) { e.remove(); }); try { await RC.api(c.id ? 'PATCH' : 'POST', c.id ? '/admin/customers/' + c.id : '/admin/customers', formData(f)); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e, f); } };
    }
  };

  /* ---- Bookings ---- */
  PAGES.bookings = function () {
    crudList({
      endpoint: '/admin/bookings',
      toolbar: function () { return toolbar('<input class="rc-input rc-search" id="rc-search" data-i18n-ph="search"><select class="rc-select" data-filter="status" style="max-width:160px"><option value="">' + t('all') + '</option>' + ['pending', 'confirmed', 'active', 'completed', 'cancelled'].map(function (s) { return '<option value="' + s + '">' + t(s) + '</option>'; }).join('') + '</select><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_booking') + '</button>'); },
      render: function (bs) {
        const rows = bs.map(function (b) {
          return '<tr><td><b>' + esc(b.reference || '#' + b.id) + '</b></td><td>' + esc(b.customer ? b.customer.name : '—') + '</td><td>' + esc(b.car ? L(b.car, 'name') : '—') + '</td><td>' + RC.date(b.start_date) + ' → ' + RC.date(b.end_date) + '</td><td>' + RC.money(b.total) + '</td><td>' + RC.badge(b.status) + '</td><td><button class="rc-ic-btn" data-st="' + b.id + '">'+RC.icon('refresh',16)+'</button> <button class="rc-ic-btn" data-inv="' + b.id + '">'+RC.icon('invoices',16)+'</button> <button class="rc-ic-btn danger" data-del="' + b.id + '">'+RC.icon('trash',16)+'</button></td></tr>';
        }).join('');
        return tableWrap(['number', 'customer', 'car', [{ raw: t('start_date') + ' → ' + t('end_date') }][0], 'total', 'status', 'actions'], rows);
      },
      bind: function (bs, reload) {
        document.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () { statusForm(bs.find(function (x) { return x.id == b.dataset.st; }), reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/bookings/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
        document.querySelectorAll('[data-inv]').forEach(function (b) { b.onclick = function () { location.href = 'invoices.html?booking=' + b.dataset.inv; }; });
      },
      form: function (_, reload) { bookingForm(reload); },
    });
    async function statusForm(bRow, reload) {
      const b = await RC.api('GET', '/admin/bookings/' + bRow.id);
      const remaining = (b.total - (b.deposit_paid || 0));
      const info = '<div style="line-height:2;margin-bottom:12px">' +
        '<div><b>' + t('customer') + ':</b> ' + esc(b.customer ? b.customer.name : '') + ' · ' + esc(b.customer ? (b.customer.phone || '') : '') + '</div>' +
        '<div><b>' + t('car') + ':</b> ' + esc(b.car ? L(b.car, 'name') : '') + '</div>' +
        '<div><b>' + t('start_date') + ' → ' + t('end_date') + ':</b> ' + RC.date(b.start_date) + ' → ' + RC.date(b.end_date) + ' (' + b.days + ' ' + t('days') + ')</div>' +
        (b.delivery ? '<div style="color:var(--orange)"><b>' + t('delivery') + ':</b> ' + esc(b.delivery_address || '') + ' (' + RC.money(b.delivery_fee) + ') — ' + t('full_payment_required') + '</div>' : '') +
        '<div><b>' + t('total') + ':</b> ' + RC.money(b.total) + ' · <span style="color:var(--green)">' + t('paid_amount') + ': ' + RC.money(b.deposit_paid || 0) + '</span> · <span style="color:var(--red)">' + t('remaining') + ': ' + RC.money(remaining) + '</span></div>' +
        '</div>' +
        (b.receipt ? '<div style="margin-bottom:12px"><b>' + t('receipt') + ':</b><br><a href="' + esc(b.receipt) + '" target="_blank"><img src="' + esc(b.receipt) + '" class="receipt-thumb" style="max-height:220px"></a></div>' : '');
      const body = info + '<form class="rc-form" id="sf">' + field(t('status'), select('status', ['pending', 'confirmed', 'active', 'completed', 'cancelled'].map(function (s) { return { v: s, l: t(s) }; }), b.status)) + '</form>';
      const foot = '<button class="rc-btn ghost" id="mkinv">' + RC.icon('invoices', 16) + ' ' + t('create_invoice') + '</button><button class="rc-btn" id="ss">' + t('save') + '</button>';
      const w = RC.modal(b.reference || '#' + b.id, body, foot);
      $('#ss', w).onclick = async function () { try { await RC.api('PATCH', '/admin/bookings/' + b.id + '/status', { status: $('#sf', w).status.value }); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e); } };
      $('#mkinv', w).onclick = function () { RC.closeModal(); location.href = 'invoices.html?booking=' + b.id; };
    }
    async function bookingForm(reload) {
      const cs = await RC.api('GET', '/admin/customers?page=1');
      const cars = await RC.api('GET', '/admin/cars?status=available');
      const custOpts = (cs.data || cs).map(function (c) { return { v: c.id, l: c.name + ' — ' + (c.phone || '') }; });
      const carOpts = (cars.data || cars).map(function (c) { return { v: c.id, l: L(c, 'name') + ' (' + RC.money(c.effective ? c.effective : (c.offer_price && +c.offer_price > 0 ? c.offer_price : c.daily_price)) + ')' }; });
      const body = '<form class="rc-form" id="bf">' +
        field(t('customer'), select('customer_id', custOpts, '')) +
        field(t('car'), select('car_id', carOpts, '')) +
        '<div class="row">' + field(t('start_date'), input('start_date', '', 'date')) + field(t('end_date'), input('end_date', '', 'date')) + '</div>' +
        '<div class="row">' + field(t('discount'), input('discount', 0, 'number')) + field(t('deposit_paid') || t('paid_amount'), input('deposit_paid', 0, 'number')) + '</div>' +
        '<label class="chk"><input type="checkbox" name="delivery" id="delchk"> ' + t('request_delivery') + '</label>' +
        '<div id="delbox" style="display:none">' + '<div class="row">' + field(t('delivery_address'), input('delivery_address', '')) + field(t('delivery_fee'), input('delivery_fee', 0, 'number')) + '</div></div>' +
        '<div class="row">' + field(t('status'), select('status', ['pending', 'confirmed', 'active'].map(function (s) { return { v: s, l: t(s) }; }), 'confirmed')) + field(' ', '<div id="priceview" style="font-weight:800;color:var(--amber);padding-top:26px"></div>') + '</div>' +
        field(t('notes'), textarea('notes', '')) + '</form>';
      const w = RC.modal(t('new_booking'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="bs">' + t('save') + '</button>');
      const f = $('#bf', w);
      $('#delchk', w).onchange = function () { $('#delbox', w).style.display = this.checked ? '' : 'none'; quote(); };
      async function quote() { if (f.car_id.value && f.start_date.value && f.end_date.value) { try { const fee = f.delivery.checked ? (f.delivery_fee.value || 0) : 0; const q = await RC.api('GET', '/admin/bookings/availability?car_id=' + f.car_id.value + '&start_date=' + f.start_date.value + '&end_date=' + f.end_date.value + '&delivery_fee=' + fee); $('#priceview', w).textContent = q.days + ' ' + t('days') + ' · ' + RC.money(q.total) + (q.available ? '' : ' ⚠️'); } catch (e) {} } }
      f.car_id.onchange = quote; f.start_date.onchange = quote; f.end_date.onchange = quote; f.delivery_fee.onchange = quote;
      $('#bs', w).onclick = async function () { f.querySelectorAll('.err').forEach(function (e) { e.remove(); }); const d = formData(f); d.delivery = f.delivery.checked ? 1 : 0; try { await RC.api('POST', '/admin/bookings', d); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e, f); } };
    }
  };

  /* ---- Invoices ---- */
  PAGES.invoices = function () {
    const qp = new URLSearchParams(location.search);
    if (qp.get('booking')) { setTimeout(function () { makeFromBooking(qp.get('booking'), function () { location.href = 'invoices.html'; }); }, 300); }
    crudList({
      endpoint: '/admin/invoices',
      toolbar: function () { return toolbar('<input class="rc-input rc-search" id="rc-search" data-i18n-ph="search"><select class="rc-select" data-filter="status" style="max-width:150px"><option value="">' + t('all') + '</option>' + ['unpaid', 'partial', 'paid', 'void'].map(function (s) { return '<option value="' + s + '">' + t(s) + '</option>'; }).join('') + '</select><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_invoice') + '</button>'); },
      render: function (iv) {
        const rows = iv.map(function (i) { return '<tr><td><b>' + esc(i.number) + '</b></td><td>' + esc(i.customer ? i.customer.name : '—') + '</td><td>' + RC.date(i.issue_date) + '</td><td>' + RC.money(i.total) + '</td><td style="color:var(--red)">' + RC.money(i.total - i.paid_amount) + '</td><td>' + RC.badge(i.status) + '</td><td class="rc-actions"><button class="rc-ic-btn go" data-view="' + i.id + '">'+RC.icon('eye',16)+'</button> <button class="rc-ic-btn danger" data-del="' + i.id + '">'+RC.icon('trash',16)+'</button></td></tr>'; }).join('');
        return tableWrap(['number', 'customer', 'issue_date', 'total', 'remaining', 'status', 'actions'], rows);
      },
      bind: function (iv, reload) {
        document.querySelectorAll('[data-view]').forEach(function (b) { b.onclick = function () { invoiceView(b.dataset.view, reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/invoices/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
      },
      form: function (_, reload) { pickBooking(reload); },
    });

    // Rental invoices are generated from a booking (car + period). Pick one.
    async function pickBooking(reload) {
      const res = await RC.api('GET', '/admin/bookings');
      const bs = (res.data || res).filter(function (b) { return b.status !== 'cancelled'; });
      const body = '<form class="rc-form" id="pbf">' + field(t('bookings'), select('booking_id', bs.map(function (b) { return { v: b.id, l: (b.reference || '#' + b.id) + ' — ' + (b.customer ? b.customer.name : '') + ' · ' + (b.car ? L(b.car, 'name') : '') }; }), bs[0] ? bs[0].id : '')) + '<p class="muted" style="font-size:.82rem;margin:0">' + t('from_booking') + ': ' + t('create_invoice') + '</p></form>';
      const w = RC.modal(t('new_invoice'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="pbs">' + t('create_invoice') + '</button>');
      $('#pbs', w).onclick = function () { const bid = $('#pbf', w).booking_id.value; if (!bid) return; RC.closeModal(); makeFromBooking(bid, reload); };
    }
    async function makeFromBooking(bid, reload) {
      try { const inv = await RC.api('POST', '/admin/invoices/from-booking/' + bid); RC.toast(t('saved')); reload && reload(); invoiceView(inv.id, reload); }
      catch (e) { err(e); }
    }

    async function invoiceView(id, reload) {
      const i = await RC.api('GET', '/admin/invoices/' + id);
      const remaining = (i.total - i.paid_amount);
      const body = '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px"><div><h2 style="font-size:1.3rem">' + esc(i.number) + '</h2><div class="muted">' + RC.date(i.issue_date) + '</div></div>' + RC.badge(i.status) + '</div>' +
        '<div style="margin-bottom:10px"><b>' + t('customer') + ':</b> ' + esc(i.customer ? i.customer.name : '') + (i.booking ? ' · <b>' + t('bookings') + ':</b> ' + esc(i.booking.reference || '') : '') + '</div>' +
        '<div class="rc-table-wrap" style="box-shadow:none;margin-bottom:12px"><table class="rc-table"><thead><tr><th>' + t('description') + '</th><th>' + t('total') + '</th></tr></thead><tbody>' +
        i.items.map(function (it) { return '<tr><td>' + esc(it.description) + '</td><td>' + RC.money(it.amount) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div style="text-align:end;line-height:1.9"><div>' + t('subtotal') + ': ' + RC.money(i.subtotal) + '</div>' + (+i.discount > 0 ? '<div>' + t('discount') + ': ' + RC.money(i.discount) + '</div>' : '') + (+i.tax > 0 ? '<div>' + t('tax') + ': ' + RC.money(i.tax) + '</div>' : '') + '<div style="font-weight:900;font-size:1.15rem">' + t('total') + ': ' + RC.money(i.total) + '</div><div style="color:var(--green)">' + t('paid_amount') + ': ' + RC.money(i.paid_amount) + '</div><div style="color:var(--red);font-weight:800">' + t('remaining') + ': ' + RC.money(remaining) + '</div></div>' +
        (i.payments.length ? '<h3 style="margin:14px 0 6px;font-size:.95rem">' + t('payments') + '</h3>' + i.payments.map(function (p) { return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:5px 0"><span>' + RC.date(p.paid_at) + ' · ' + t(p.method) + '</span><span>' + RC.money(p.amount) + '</span></div>'; }).join('') : '');
      const foot = '<button class="rc-btn ghost" id="prn">' + RC.icon('receipt', 16) + ' ' + t('print') + '</button>' + (i.status !== 'paid' && i.status !== 'void' ? '<button class="rc-btn" id="addpay">+ ' + t('add_payment') + '</button>' : '');
      const w = RC.modal(t('invoice') + ' ' + i.number, body, foot);
      $('#prn', w).onclick = function () { printInvoice(i, remaining); };
      const ap = $('#addpay', w);
      if (ap) ap.onclick = function () {
        const pb = '<form class="rc-form" id="pf"><div class="row">' + field(t('amount'), input('amount', remaining.toFixed(2), 'number')) + field(t('method'), select('method', [{ v: 'cash', l: t('cash') }, { v: 'card', l: t('card') }, { v: 'transfer', l: t('transfer') }], 'cash')) + '</div></form>';
        const w2 = RC.modal(t('add_payment'), pb, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="ps">' + t('save') + '</button>');
        $('#ps', w2).onclick = async function () { const f = $('#pf', w2); try { await RC.api('POST', '/admin/invoices/' + id + '/payments', formData(f)); RC.closeModal(); RC.toast(t('saved')); reload && reload(); invoiceView(id, reload); } catch (e) { err(e, f); } };
      };
    }

    function printInvoice(i, remaining) {
      const C = COMPANY || {};
      const rows = i.items.map(function (it) { return '<tr><td>' + esc(it.description) + '</td><td style="text-align:center">' + it.quantity + '</td><td style="text-align:end">' + RC.money(it.unit_price) + '</td><td style="text-align:end">' + RC.money(it.amount) + '</td></tr>'; }).join('');
      const rtl = RC.lang() !== 'en';
      const html = '<!doctype html><html dir="' + (rtl ? 'rtl' : 'ltr') + '" lang="' + RC.lang() + '"><head><meta charset="utf-8"><title>' + esc(i.number) + '</title>' +
        '<style>@import url("https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap");' +
        'body{font-family:Tajawal,sans-serif;color:#1c2733;padding:32px;max-width:720px;margin:auto}' +
        '.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f5a623;padding-bottom:14px;margin-bottom:18px}' +
        '.hd h1{color:#0b1f3a;font-size:1.6rem} .hd .co{text-align:' + (rtl ? 'left' : 'right') + ';font-size:.85rem;color:#64748b;line-height:1.7}' +
        'table{width:100%;border-collapse:collapse;margin:16px 0} th,td{padding:9px 10px;border-bottom:1px solid #e5eaf1;text-align:start} th{background:#f3f6fb;color:#64748b;font-size:.8rem}' +
        '.tot{margin-top:10px;text-align:end;line-height:2} .tot .big{font-size:1.25rem;font-weight:900;color:#0b1f3a} .rem{color:#dc2626;font-weight:800}' +
        '.meta{display:flex;justify-content:space-between;margin-bottom:10px;font-size:.9rem}</style></head><body onload="window.print()">' +
        '<div class="hd"><div><h1>' + esc(C.name || 'سيّار') + '</h1><div style="color:#64748b">' + t('invoice') + ' ' + esc(i.number) + '</div></div>' +
        '<div class="co">' + (C.phone ? esc(C.phone) + '<br>' : '') + (C.city ? esc(C.city) : '') + '</div></div>' +
        '<div class="meta"><div><b>' + t('customer') + ':</b> ' + esc(i.customer ? i.customer.name : '') + '</div><div><b>' + t('issue_date') + ':</b> ' + RC.date(i.issue_date) + '</div></div>' +
        '<table><thead><tr><th>' + t('description') + '</th><th style="text-align:center">' + t('days') + '</th><th style="text-align:end">' + t('daily_price') + '</th><th style="text-align:end">' + t('total') + '</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="tot">' + (+i.discount > 0 ? '<div>' + t('discount') + ': ' + RC.money(i.discount) + '</div>' : '') + (+i.tax > 0 ? '<div>' + t('tax') + ': ' + RC.money(i.tax) + '</div>' : '') +
        '<div class="big">' + t('total') + ': ' + RC.money(i.total) + '</div><div style="color:#16a34a">' + t('paid_amount') + ': ' + RC.money(i.paid_amount) + '</div><div class="rem">' + t('remaining') + ': ' + RC.money(remaining) + '</div></div>' +
        (C.iban || C.stc_pay ? '<div style="margin-top:18px;font-size:.85rem;color:#64748b;border-top:1px dashed #e5eaf1;padding-top:10px">' + (C.bank_name ? t('bank_name') + ': ' + esc(C.bank_name) + ' · ' : '') + (C.iban ? t('iban') + ': ' + esc(C.iban) : '') + (C.stc_pay ? ' · STC Pay: ' + esc(C.stc_pay) : '') + '</div>' : '') +
        '</body></html>';
      const win = window.open('', '_blank');
      win.document.write(html); win.document.close();
    }
  };

  /* ---- Notifications ---- */
  PAGES.notifications = async function () {
    view().innerHTML = toolbar('<h3 style="font-size:1rem">' + t('notifications') + '</h3><div class="sp"></div><button class="rc-btn ghost" id="readall">' + t('mark_all_read') + '</button>') + '<div id="nlist">' + t('loading') + '</div>';
    async function load() {
      const res = await RC.api('GET', '/admin/notifications');
      const items = res.data || res;
      $('#nlist').innerHTML = items.length ? items.map(function (n) {
        const icon = { booking: '📅', payment: '💰', invoice: '🧾', car: '🚗', system: '⚙️' }[n.type] || '🔔';
        return '<div class="rc-card" style="margin-bottom:10px;display:flex;gap:12px;align-items:center;' + (n.read_at ? 'opacity:.6' : 'border-inline-start:3px solid var(--amber)') + '"><div style="font-size:1.5rem">' + icon + '</div><div style="flex:1"><b>' + esc(L(n, 'title')) + '</b><div class="muted" style="font-size:.85rem">' + esc(L(n, 'body')) + '</div></div><div class="muted" style="font-size:.75rem">' + RC.date(n.created_at) + '</div>' + (n.read_at ? '' : '<button class="rc-ic-btn" data-read="' + n.id + '">'+RC.icon('check',16)+'</button>') + '</div>';
      }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>';
      document.querySelectorAll('[data-read]').forEach(function (b) { b.onclick = async function () { await RC.api('PATCH', '/admin/notifications/' + b.dataset.read + '/read'); load(); loadBadges(); }; });
    }
    $('#readall').onclick = async function () { await RC.api('POST', '/admin/notifications/read-all'); load(); loadBadges(); };
    load();
  };

  /* ---- Staff ---- */
  PAGES.staff = function () {
    const PERMS = ['cars', 'categories', 'bookings', 'customers', 'invoices', 'notifications', 'staff', 'settings'];
    crudList({
      endpoint: '/admin/staff',
      toolbar: function () { return toolbar('<h3 style="font-size:1rem">' + t('staff') + '</h3><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_staff') + '</button>'); },
      render: function (st) {
        const rows = (st.data || st).map(function (u) { return '<tr><td><b>' + esc(u.name) + '</b><div class="muted" style="font-size:.78rem">' + esc(u.email) + '</div></td><td>' + t(u.role === 'admin' ? 'admin' : 'staff_role') + '</td><td>' + RC.badge(u.status === 'active' ? 'active' : 'suspended') + '</td><td><button class="rc-ic-btn" data-edit="' + u.id + '">'+RC.icon('edit',16)+'</button> <button class="rc-ic-btn danger" data-del="' + u.id + '">'+RC.icon('trash',16)+'</button></td></tr>'; }).join('');
        return tableWrap(['name', 'role', 'status', 'actions'], rows);
      },
      bind: function (st, reload) {
        document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { location.href = 'staff-form.html?id=' + b.dataset.edit; }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { try { await RC.api('DELETE', '/admin/staff/' + b.dataset.del); RC.toast(t('deleted')); reload(); } catch (e) { err(e); } } }; });
      },
      form: function () { location.href = 'staff-form.html'; },
    });
  };

  /* ---- Add / edit staff — full page with grouped sections ---- */
  PAGES['staff-form'] = async function () {
    const PERMS = ['cars', 'categories', 'bookings', 'customers', 'invoices', 'notifications', 'staff', 'settings'];
    const id = new URLSearchParams(location.search).get('id');
    let u = {};
    if (id) { try { const list = await RC.api('GET', '/admin/staff'); u = (list.data || list).find(function (x) { return x.id == id; }) || {}; } catch (e) {} }
    const h1 = document.querySelector('.rc-top h1'); if (h1) { h1.removeAttribute('data-i18n'); h1.textContent = id ? t('edit') : t('new_staff'); }
    document.querySelectorAll('.rc-nav a').forEach(function (a) { a.classList.toggle('on', a.dataset.key === 'staff'); });
    const perms = u.permissions || [];

    view().innerHTML =
      '<a class="pg-back" id="back">‹ ' + t('staff') + '</a>' +
      '<form class="form-page" id="uf">' +
      '<div class="rc-card sect"><h3>' + RC.icon('staff', 18) + ' ' + t('basic_info') + '</h3><div class="rc-form">' +
      '<div class="row">' + field(t('name'), input('name', u.name)) + field(t('job_title'), input('title', u.title)) + '</div>' +
      '<div class="row">' + field(t('phone'), input('phone', u.phone)) + field(t('role'), select('role', [{ v: 'staff', l: t('staff_role') }, { v: 'admin', l: t('admin') }], u.role || 'staff')) + '</div>' +
      '<div class="row">' + field(t('status'), select('status', [{ v: 'active', l: t('active') }, { v: 'suspended', l: t('suspended') }], u.status || 'active')) + '<div></div></div>' +
      '</div></div>' +
      '<div class="rc-card sect"><h3>' + RC.icon('settings', 18) + ' ' + t('permissions') + '</h3>' +
      '<p class="muted" style="font-size:.8rem;margin:-8px 0 10px">' + t('admin') + ' = كل الصلاحيات</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">' + PERMS.map(function (p) { return '<label class="chk"><input type="checkbox" name="perm" value="' + p + '" ' + (perms.indexOf(p) >= 0 ? 'checked' : '') + '> ' + t(p) + '</label>'; }).join('') + '</div></div>' +
      '<div class="rc-card sect"><h3>' + RC.icon('bank', 18) + ' ' + t('account_info') + '</h3><div class="rc-form">' +
      '<div class="row">' + field(t('email'), input('email', u.email, 'email')) + field(t('password') + (id ? ' (اترك فارغاً لعدم التغيير)' : ''), input('password', '', 'password')) + '</div>' +
      '</div></div>' +
      '<div style="display:flex;gap:10px"><button class="rc-btn navy" id="save" type="button">' + RC.icon('check', 16) + ' ' + t('save') + '</button><button class="rc-btn ghost" id="cancel" type="button">' + t('cancel') + '</button></div>' +
      '</form>';
    $('#back').onclick = function () { location.href = 'staff.html'; };
    $('#cancel').onclick = function () { location.href = 'staff.html'; };
    $('#save').onclick = async function () {
      const f = $('#uf'); f.querySelectorAll('.err').forEach(function (e) { e.remove(); });
      const d = formData(f);
      d.permissions = Array.prototype.map.call(f.querySelectorAll('[name=perm]:checked'), function (c) { return c.value; }); delete d.perm;
      if (!d.password) delete d.password;
      try { await RC.api(id ? 'PATCH' : 'POST', id ? '/admin/staff/' + id : '/admin/staff', d); RC.toast(t('saved')); location.href = 'staff.html'; } catch (e) { err(e, f); }
    };
  };

  /* ---- Settings ---- */
  // preset swatch metadata (keep in sync with dash.css presets)
  const THEMES = [
    { key: 'gold', accent: '#d4af37', side: '#0b1f3a', radius: 14 },
    { key: 'royal', accent: '#2563eb', side: '#0f1b35', radius: 12 },
    { key: 'mint', accent: '#0ea5a0', side: '#0c2622', radius: 18 },
    { key: 'minimal', accent: '#111827', side: '#111827', radius: 8 },
    { key: 'vivid', accent: '#7c3aed', side: '#1e1142', radius: 20 },
  ];
  const FONTS = [
    { v: '', l: 'font_default' }, { v: "'Tajawal',sans-serif", l: 'Tajawal' }, { v: "'Cairo',sans-serif", l: 'Cairo' },
    { v: "'Readex Pro',sans-serif", l: 'Readex Pro' }, { v: "'Almarai',sans-serif", l: 'Almarai' },
  ];

  PAGES.settings = async function () {
    view().innerHTML = '<p>' + t('loading') + '</p>';
    const r = await RC.api('GET', '/admin/settings');
    const c = r.company;
    let selTheme = RC.PRESETS.indexOf(c.theme) >= 0 ? c.theme : 'gold';
    const custom = (c.theme_custom && typeof c.theme_custom === 'object') ? Object.assign({}, c.theme_custom) : {};

    const themeCard = function (m) {
      return '<button type="button" class="theme-card' + (m.key === selTheme ? ' sel' : '') + '" data-theme="' + m.key + '" style="color:' + m.accent + '">' +
        '<div class="tc-prev">' +
        '<div class="tc-side" style="background:' + m.side + '"></div>' +
        '<div class="tc-body"><div class="tc-bar"></div><div class="tc-bar sm"></div>' +
        '<div class="tc-btn" style="background:' + m.accent + ';border-radius:' + Math.min(m.radius, 8) + 'px"></div></div>' +
        '</div>' +
        '<div class="tc-foot"><span class="tc-dot" style="background:' + m.accent + '"></span>' + t('theme_' + m.key) +
        '<span class="tc-check">' + RC.icon('check', 13) + '</span></div>' +
        '</button>';
    };
    const colorRow = function (key, labelKey) {
      const v = custom[key] || '';
      return '<div class="adv-color"><label>' + t(labelKey) + '</label><div class="cwrap">' +
        '<input type="color" data-c="' + key + '" value="' + (/^#[0-9a-fA-F]{6}$/.test(v) ? v : '#000000') + '">' +
        '<input type="text" data-t="' + key + '" value="' + esc(v) + '" placeholder="#______" spellcheck="false">' +
        '<button type="button" class="clr" data-clr="' + key + '" title="×">×</button></div></div>';
    };

    view().innerHTML = '<div class="settings-page"><form id="setf">' +
      '<div class="settings-grid">' +
      '<div class="rc-card set-card"><h3>' + RC.icon('settings', 18) + ' ' + t('company') + '</h3><div class="rc-form">' +
      field(t('name'), input('name', c.name)) +
      '<div class="row">' + field(t('phone'), input('phone', c.phone)) + field(t('email'), input('email', c.email, 'email')) + '</div>' +
      '<div class="row">' + field(t('city'), input('city', c.city)) + field(t('currency'), input('currency', c.currency)) + '</div>' +
      field(t('address'), input('address', c.address)) +
      field(t('logo'), '<input class="rc-input" type="file" name="logo" accept="image/*">') +
      '</div></div>' +
      '<div class="rc-card set-card"><h3>' + RC.icon('bank', 18) + ' ' + t('payment_details') + '</h3><div class="rc-form">' +
      field(t('bank_name'), input('bank_name', c.bank_name)) +
      field(t('account_name'), input('account_name', c.account_name)) +
      '<div class="row">' + field(t('iban'), input('iban', c.iban)) + field(t('stc_pay'), input('stc_pay', c.stc_pay)) + '</div>' +
      '<h3 style="margin-top:6px">' + RC.icon('invoices', 18) + ' ' + t('invoices') + '</h3>' +
      '<div class="row">' + field(t('tax_rate'), input('tax_rate', c.tax_rate, 'number')) + field(t('invoice_prefix'), input('invoice_prefix', c.invoice_prefix)) + '</div>' +
      field(t('delivery_fee'), '<input class="rc-input" name="s_delivery_fee" type="number" value="' + esc((r.settings && r.settings.delivery_fee) || '') + '">') +
      '</div></div>' +
      '</div>' +
      // ---- appearance / theme presets ----
      '<div class="rc-card" style="margin-top:16px"><h3>' + RC.icon('image', 18) + ' ' + t('appearance') + '</h3>' +
      '<p class="muted" style="font-size:.85rem;margin:-6px 0 8px">' + t('theme_hint') + '</p>' +
      '<div class="theme-grid" id="themegrid">' + THEMES.map(themeCard).join('') + '</div>' +
      '<div class="adv-wrap" id="advwrap" style="margin-top:18px;border-top:1px solid var(--line);padding-top:12px">' +
      '<div class="adv-head" id="advhead"><b>' + RC.icon('settings', 16) + ' ' + t('advanced_custom') + '</b><span class="chev">▾</span></div>' +
      '<div class="adv-body">' +
      '<p class="muted" style="font-size:.85rem;margin:2px 0 12px">' + t('advanced_hint') + '</p>' +
      '<div class="adv-colors">' +
      colorRow('accent', 'accent_color') + colorRow('accent_dark', 'accent_dark_color') +
      colorRow('sidebar', 'sidebar_color') + colorRow('on_accent', 'on_accent_color') +
      '</div>' +
      '<div class="row" style="margin-top:12px">' +
      field(t('corner_radius'), '<input class="rc-input" type="number" min="0" max="40" data-radius value="' + esc((custom.radius || '').toString().replace('px', '')) + '" placeholder="—">') +
      field(t('font_family'), '<select class="rc-select" data-font>' + FONTS.map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === (custom.font || '') ? ' selected' : '') + '>' + (o.l === 'font_default' ? t('font_default') : o.l) + '</option>'; }).join('') + '</select>') +
      '</div>' +
      field(t('custom_css'), '<textarea class="rc-input" data-css rows="4" spellcheck="false" placeholder=".rc-btn{ }">' + esc(custom.css || '') + '</textarea>') +
      '<button type="button" class="rc-btn ghost sm" id="advreset" style="margin-top:4px">' + t('reset_custom') + '</button>' +
      '</div></div>' +
      '</div>' +
      '<div style="margin-top:16px"><button class="rc-btn navy" id="setsave" type="button">' + RC.icon('check', 16) + ' ' + t('save') + '</button></div>' +
      '</form></div>';

    function pruneCustom() { Object.keys(custom).forEach(function (k) { if (custom[k] === '' || custom[k] == null) delete custom[k]; }); }
    function preview() { pruneCustom(); RC.applyPreset(selTheme, Object.keys(custom).length ? custom : null); }
    function markCards() { document.querySelectorAll('#themegrid .theme-card').forEach(function (b) { b.classList.toggle('sel', b.dataset.theme === selTheme); }); }

    document.querySelectorAll('#themegrid .theme-card').forEach(function (b) {
      b.onclick = function () { selTheme = b.dataset.theme; markCards(); preview(); };
    });
    const advwrap = $('#advwrap'); $('#advhead').onclick = function () { advwrap.classList.toggle('open'); };
    if (Object.keys(custom).length) advwrap.classList.add('open');
    document.querySelectorAll('.adv-color input[type=color]').forEach(function (ci) {
      ci.oninput = function () { const k = ci.dataset.c; custom[k] = ci.value; const tx = document.querySelector('.adv-color input[data-t="' + k + '"]'); if (tx) tx.value = ci.value; preview(); };
    });
    document.querySelectorAll('.adv-color input[type=text]').forEach(function (tx) {
      tx.oninput = function () { const k = tx.dataset.t; const v = tx.value.trim(); custom[k] = v; if (/^#[0-9a-fA-F]{6}$/.test(v)) { const ci = document.querySelector('.adv-color input[data-c="' + k + '"]'); if (ci) ci.value = v; } preview(); };
    });
    document.querySelectorAll('.adv-color .clr').forEach(function (btn) {
      btn.onclick = function () { const k = btn.dataset.clr; delete custom[k]; const tx = document.querySelector('.adv-color input[data-t="' + k + '"]'); if (tx) tx.value = ''; preview(); };
    });
    const radEl = document.querySelector('[data-radius]'); if (radEl) radEl.oninput = function () { const v = radEl.value.trim(); if (v === '') delete custom.radius; else custom.radius = v + 'px'; preview(); };
    const fontEl = document.querySelector('[data-font]'); if (fontEl) fontEl.onchange = function () { if (fontEl.value) custom.font = fontEl.value; else delete custom.font; preview(); };
    const cssEl = document.querySelector('[data-css]'); if (cssEl) cssEl.oninput = function () { const v = cssEl.value; if (v.trim() === '') delete custom.css; else custom.css = v; preview(); };
    $('#advreset').onclick = function () {
      Object.keys(custom).forEach(function (k) { delete custom[k]; });
      document.querySelectorAll('.adv-color input[data-t]').forEach(function (x) { x.value = ''; });
      if (radEl) radEl.value = '';
      if (fontEl) { fontEl.selectedIndex = 0; const w = fontEl.closest('.rc-ss'); if (w) { const lbl = w.querySelector('.lbl'); if (lbl) lbl.textContent = fontEl.options[0].text; } }
      if (cssEl) cssEl.value = '';
      preview();
    };

    $('#setsave').onclick = async function () {
      const f = $('#setf'); f.querySelectorAll('.err').forEach(function (e) { e.remove(); });
      const logo = f.logo.files[0];
      try {
        const d = formData(f); delete d.logo;
        const deliveryFee = d.s_delivery_fee; delete d.s_delivery_fee;
        d.settings = { delivery_fee: deliveryFee || '0' };
        pruneCustom();
        d.theme = selTheme;
        d.theme_custom = Object.keys(custom).length ? custom : null;
        await RC.api('PATCH', '/admin/settings', d);
        if (logo) { const fd = new FormData(); fd.append('logo', logo); await RC.apiForm('POST', '/admin/settings/logo', fd); }
        RC.applyPreset(selTheme, d.theme_custom);
        RC.toast(t('saved')); RC.setCurrency(f.currency.value);
      } catch (e) { err(e, f); }
    };
  };

  /* ---- Accounts / financial ---- */
  PAGES.accounts = async function () {
    view().innerHTML = '<p>' + t('loading') + '</p>';
    const d = await RC.api('GET', '/admin/accounts');
    const s = d.summary;
    const tile = function (ic, cls, v, k) { return '<div class="rc-tile"><div class="ic ' + cls + '">' + RC.icon(ic) + '</div><div><div class="v">' + v + '</div><div class="k">' + t(k) + '</div></div></div>'; };
    const maxRev = Math.max.apply(null, d.revenue_series.map(function (x) { return x.value; }).concat([1]));
    const methods = d.by_method || {};
    view().innerHTML =
      '<div class="fin-grid" style="margin-bottom:18px">' +
      tile('wallet', 'green', RC.money(s.revenue_total), 'revenue') +
      tile('calendar', 'amber', RC.money(s.revenue_month), 'monthly_revenue') +
      tile('invoices', 'red', RC.money(s.receivables), 'receivables') +
      tile('accounts', 'navy', RC.money(s.deposits_held), 'deposits_held') +
      tile('receipt', 'navy', RC.money(s.invoiced), 'invoiced') +
      tile('check', 'green', RC.money(s.collected), 'collected') +
      '</div>' +
      '<div class="rc-grid" style="grid-template-columns:1.4fr 1fr;margin-bottom:18px">' +
      '<div class="rc-card"><h3>' + t('monthly_revenue') + '</h3><div class="rc-bars">' +
      d.revenue_series.map(function (x) { return '<div class="bar"><div class="fill" style="height:' + Math.round(x.value / maxRev * 100) + '%"></div><div class="lb">' + x.label.slice(5) + '</div></div>'; }).join('') +
      '</div></div>' +
      '<div class="rc-card"><h3>' + t('by_method') + '</h3>' +
      (Object.keys(methods).length ? Object.keys(methods).map(function (m) { return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><span>' + t(m) + '</span><b>' + RC.money(methods[m]) + '</b></div>'; }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>') +
      '</div></div>' +
      '<div class="rc-grid" style="grid-template-columns:1fr 1fr">' +
      '<div class="rc-card"><h3>' + t('outstanding') + '</h3>' +
      (d.outstanding.length ? '<div class="rc-table-wrap" style="box-shadow:none"><table class="rc-table"><tbody>' + d.outstanding.map(function (i) { return '<tr><td><b>' + esc(i.number) + '</b><div class="muted" style="font-size:.76rem">' + esc(i.customer ? i.customer.name : '') + '</div></td><td>' + RC.money(i.total - i.paid_amount) + '</td><td>' + RC.date(i.due_date) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="rc-empty">' + t('no_data') + '</div>') +
      '</div>' +
      '<div class="rc-card"><h3>' + t('latest') + ' — ' + t('payments') + '</h3>' +
      (d.recent_payments.length ? d.recent_payments.map(function (p) { return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><div>' + esc(p.customer ? p.customer.name : '—') + '<div class="muted" style="font-size:.74rem">' + RC.date(p.paid_at) + ' · ' + t(p.method) + '</div></div><b style="color:var(--green)">' + RC.money(p.amount) + '</b></div>'; }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>') +
      '</div></div>';
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
