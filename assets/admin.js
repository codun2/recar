/* سيّار — admin dashboard (shell + all pages). AREA='admin'. */
(function () {
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const t = RC.t, esc = RC.esc, L = RC.L;
  let ME = null, COMPANY = null;

  const NAV = [
    { key: 'dashboard', href: 'index.html', ic: '📊', perm: null },
    { key: 'cars', href: 'cars.html', ic: '🚗', perm: 'cars' },
    { key: 'categories', href: 'categories.html', ic: '🏷️', perm: 'categories' },
    { key: 'bookings', href: 'bookings.html', ic: '📅', perm: 'bookings' },
    { key: 'customers', href: 'customers.html', ic: '👥', perm: 'customers' },
    { key: 'invoices', href: 'invoices.html', ic: '🧾', perm: 'invoices' },
    { key: 'notifications', href: 'notifications.html', ic: '🔔', perm: null },
    { key: 'staff', href: 'staff.html', ic: '🧑‍💼', perm: 'staff' },
    { key: 'settings', href: 'settings.html', ic: '⚙️', perm: 'settings' },
  ];

  function can(perm) { if (!perm) return true; if (!ME) return false; if (ME.role === 'admin') return true; return (ME.permissions || []).indexOf(perm) >= 0; }

  async function boot() {
    RC.guard();
    buildShell();
    RC.initLang();
    try {
      const r = await RC.api('GET', '/admin/me');
      ME = r.user; COMPANY = r.company; if (COMPANY) RC.setCurrency(COMPANY.currency);
    } catch (e) { return; }
    renderNav();
    paintUser();
    loadBadges();
    const page = document.body.dataset.page;
    if (PAGES[page]) PAGES[page]();
  }

  function buildShell() {
    const page = document.body.dataset.page;
    document.body.innerHTML =
      '<div class="rc-shell">' +
      '<aside class="rc-side" id="rc-side">' +
      '<div class="brand"><span class="mark">🚗</span><div>' + t('app') + '<small>ADMIN</small></div></div>' +
      '<nav class="rc-nav" id="rc-nav"></nav>' +
      '<div class="foot"><a href="#" id="rc-logout" class="rc-nav-link" style="display:flex;gap:10px;align-items:center;color:#c5d2e6;padding:10px 14px"><span class="ic">🚪</span><span data-i18n="logout"></span></a></div>' +
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
      return '<a href="' + n.href + '" class="' + (n.key === page ? 'on' : '') + '" data-key="' + n.key + '"><span class="ic">' + n.ic + '</span><span data-i18n="' + n.key + '"></span>' + (n.key === 'notifications' ? '<span class="count" id="rc-badge" style="display:none">0</span>' : '') + '</a>';
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
    view().innerHTML =
      '<div class="rc-grid tiles" style="margin-bottom:18px">' +
      tile('🚗', 'navy', d.cars.total, 'cars') +
      tile('✅', 'green', d.cars.available, 'available') +
      tile('📅', 'amber', d.bookings.active, 'active') +
      tile('👥', 'navy', d.customers, 'customers') +
      tile('🧾', 'red', d.invoices.unpaid, 'unpaid') +
      tile('💰', 'green', RC.money(d.revenue.month), 'monthly_revenue') +
      '</div>' +
      '<div class="rc-grid" style="grid-template-columns:1.4fr 1fr">' +
      '<div class="rc-card"><h3>' + t('monthly_revenue') + '</h3><div class="rc-bars">' +
      d.revenue_series.map(function (s) { return '<div class="bar"><div class="fill" style="height:' + Math.round(s.value / maxRev * 100) + '%"></div><div class="lb">' + s.label.slice(5) + '</div></div>'; }).join('') +
      '</div></div>' +
      '<div class="rc-card"><h3>' + t('latest') + ' — ' + t('bookings') + '</h3>' +
      (d.latest_bookings.length ? d.latest_bookings.map(function (b) {
        return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line)"><div><b>' + esc(b.reference || '#' + b.id) + '</b><div style="font-size:.78rem;color:var(--muted)">' + esc(b.customer ? b.customer.name : '') + ' · ' + esc(b.car ? L(b.car, 'name') : '') + '</div></div>' + RC.badge(b.status) + '</div>';
      }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>') +
      '</div></div>';
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
          return '<tr><td><b>' + esc(L(c, 'name')) + '</b><div class="muted" style="font-size:.78rem">' + esc(c.plate_number || '') + '</div></td>' +
            '<td>' + esc(c.category ? L(c.category, 'name') : '—') + '</td>' +
            '<td>' + RC.money(c.daily_price) + '</td>' +
            '<td>' + RC.badge(c.status) + '</td>' +
            '<td><button class="rc-ic-btn" data-edit="' + c.id + '">✏️</button> <button class="rc-ic-btn" data-del="' + c.id + '">🗑️</button></td></tr>';
        }).join('');
        return tableWrap(['name', 'category', 'daily_price', 'status', 'actions'], rows);
      },
      bind: function (cars, reload) {
        document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { PAGES._carForm(cars.find(function (c) { return c.id == b.dataset.edit; }), reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/cars/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
      },
      form: function (_, reload) { PAGES._carForm(null, reload); },
    });
  };
  PAGES._carForm = async function (car, reload) {
    const cats = await RC.api('GET', '/admin/categories');
    const catOpts = [{ v: '', l: '—' }].concat(cats.map(function (c) { return { v: c.id, l: L(c, 'name') }; }));
    const b = car || {};
    const body = '<form class="rc-form" id="carf" enctype="multipart/form-data">' +
      '<div class="row">' + field(t('name') + ' (ع)', input('name_ar', b.name_ar)) + field(t('name') + ' (EN)', input('name_en', b.name_en)) + '</div>' +
      '<div class="row">' + field(t('category'), select('category_id', catOpts, b.category_id)) + field(t('plate'), input('plate_number', b.plate_number)) + '</div>' +
      '<div class="row">' + field(t('daily_price'), input('daily_price', b.daily_price, 'number')) + field(t('deposit'), input('deposit', b.deposit, 'number')) + '</div>' +
      '<div class="row">' + field(t('transmission'), select('transmission', [{ v: 'auto', l: t('auto') }, { v: 'manual', l: t('manual') }], b.transmission)) + field(t('fuel'), select('fuel', [{ v: 'petrol', l: t('petrol') }, { v: 'diesel', l: t('diesel') }, { v: 'electric', l: t('electric') }, { v: 'hybrid', l: t('hybrid') }], b.fuel)) + '</div>' +
      '<div class="row">' + field(t('year'), input('year', b.year, 'number')) + field(t('seats'), input('seats', b.seats, 'number')) + '</div>' +
      '<div class="row">' + field(t('status'), select('status', [{ v: 'available', l: t('available') }, { v: 'rented', l: t('rented') }, { v: 'maintenance', l: t('maintenance') }, { v: 'hidden', l: t('hidden') }], b.status || 'available')) + field(t('image'), '<input class="rc-input" type="file" name="image" accept="image/*">') + '</div>' +
      '<label class="chk"><input type="checkbox" name="featured" ' + (b.featured ? 'checked' : '') + '> ' + t('featured') + '</label>' +
      field(t('description') + ' (ع)', textarea('description_ar', b.description_ar)) +
      '</form>';
    const w = RC.modal(car ? t('edit') : t('new_car'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="carsave">' + t('save') + '</button>');
    $('#carsave', w).onclick = async function () {
      const form = $('#carf', w); form.querySelectorAll('.err').forEach(function (e) { e.remove(); });
      const fd = new FormData(form); fd.set('featured', form.featured.checked ? 1 : 0);
      if (!fd.get('image') || !fd.get('image').name) fd.delete('image');
      try { await RC.apiForm('POST', car ? '/admin/cars/' + car.id : '/admin/cars', fd); RC.closeModal(); RC.toast(t('saved')); reload(); }
      catch (e) { err(e, form); }
    };
  };

  /* ---- Categories ---- */
  PAGES.categories = function () {
    crudList({
      endpoint: '/admin/categories',
      toolbar: function () { return toolbar('<h3 style="font-size:1rem">' + t('categories') + '</h3><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_category') + '</button>'); },
      render: function (cats) {
        const rows = cats.map(function (c) { return '<tr><td><b>' + esc(c.name_ar) + '</b></td><td>' + esc(c.name_en) + '</td><td>' + (c.cars_count || 0) + ' ' + t('cars') + '</td><td><button class="rc-ic-btn" data-edit="' + c.id + '">✏️</button> <button class="rc-ic-btn" data-del="' + c.id + '">🗑️</button></td></tr>'; }).join('');
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

  /* ---- Customers ---- */
  PAGES.customers = function () {
    crudList({
      endpoint: '/admin/customers',
      toolbar: function () { return toolbar('<input class="rc-input rc-search" id="rc-search" data-i18n-ph="search"><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_customer') + '</button>'); },
      render: function (cs) {
        const rows = cs.map(function (c) { return '<tr><td><b>' + esc(c.name) + '</b></td><td>' + esc(c.phone || '—') + '</td><td>' + esc(c.national_id || '—') + '</td><td>' + (c.bookings_count || 0) + '</td><td><button class="rc-ic-btn" data-edit="' + c.id + '">✏️</button> <button class="rc-ic-btn" data-del="' + c.id + '">🗑️</button></td></tr>'; }).join('');
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
          return '<tr><td><b>' + esc(b.reference || '#' + b.id) + '</b></td><td>' + esc(b.customer ? b.customer.name : '—') + '</td><td>' + esc(b.car ? L(b.car, 'name') : '—') + '</td><td>' + RC.date(b.start_date) + ' → ' + RC.date(b.end_date) + '</td><td>' + RC.money(b.total) + '</td><td>' + RC.badge(b.status) + '</td><td><button class="rc-ic-btn" data-st="' + b.id + '">🔄</button> <button class="rc-ic-btn" data-inv="' + b.id + '">🧾</button> <button class="rc-ic-btn" data-del="' + b.id + '">🗑️</button></td></tr>';
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
    function statusForm(b, reload) {
      const body = '<form class="rc-form" id="sf">' + field(t('status'), select('status', ['pending', 'confirmed', 'active', 'completed', 'cancelled'].map(function (s) { return { v: s, l: t(s) }; }), b.status)) + '</form>';
      const w = RC.modal(b.reference || '#' + b.id, body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="ss">' + t('save') + '</button>');
      $('#ss', w).onclick = async function () { try { await RC.api('PATCH', '/admin/bookings/' + b.id + '/status', { status: $('#sf', w).status.value }); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e); } };
    }
    async function bookingForm(reload) {
      const cs = await RC.api('GET', '/admin/customers?page=1');
      const cars = await RC.api('GET', '/admin/cars?status=available');
      const custOpts = (cs.data || cs).map(function (c) { return { v: c.id, l: c.name + ' — ' + (c.phone || '') }; });
      const carOpts = (cars.data || cars).map(function (c) { return { v: c.id, l: L(c, 'name') + ' (' + RC.money(c.daily_price) + ')' }; });
      const body = '<form class="rc-form" id="bf">' +
        field(t('customer'), select('customer_id', custOpts, '')) +
        field(t('car'), select('car_id', carOpts, '')) +
        '<div class="row">' + field(t('start_date'), input('start_date', '', 'date')) + field(t('end_date'), input('end_date', '', 'date')) + '</div>' +
        '<div class="row">' + field(t('discount'), input('discount', 0, 'number')) + field(t('status'), select('status', ['pending', 'confirmed', 'active'].map(function (s) { return { v: s, l: t(s) }; }), 'confirmed')) + '</div>' +
        '<div id="priceview" style="font-weight:800;color:var(--navy)"></div>' +
        field(t('notes'), textarea('notes', '')) + '</form>';
      const w = RC.modal(t('new_booking'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="bs">' + t('save') + '</button>');
      const f = $('#bf', w);
      async function quote() { if (f.car_id.value && f.start_date.value && f.end_date.value) { try { const q = await RC.api('GET', '/admin/bookings/availability?car_id=' + f.car_id.value + '&start_date=' + f.start_date.value + '&end_date=' + f.end_date.value); $('#priceview', w).textContent = q.days + ' ' + t('days') + ' · ' + t('total') + ': ' + RC.money(q.total) + (q.available ? '' : ' ⚠️'); } catch (e) {} } }
      f.car_id.onchange = quote; f.start_date.onchange = quote; f.end_date.onchange = quote;
      $('#bs', w).onclick = async function () { f.querySelectorAll('.err').forEach(function (e) { e.remove(); }); try { await RC.api('POST', '/admin/bookings', formData(f)); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e, f); } };
    }
  };

  /* ---- Invoices ---- */
  PAGES.invoices = function () {
    const qp = new URLSearchParams(location.search);
    if (qp.get('booking')) { setTimeout(function () { invoiceFromBooking(qp.get('booking')); }, 300); }
    crudList({
      endpoint: '/admin/invoices',
      toolbar: function () { return toolbar('<input class="rc-input rc-search" id="rc-search" data-i18n-ph="search"><select class="rc-select" data-filter="status" style="max-width:150px"><option value="">' + t('all') + '</option>' + ['unpaid', 'partial', 'paid', 'void'].map(function (s) { return '<option value="' + s + '">' + t(s) + '</option>'; }).join('') + '</select><div class="sp"></div><button class="rc-btn" id="rc-add">+ ' + t('new_invoice') + '</button>'); },
      render: function (iv) {
        const rows = iv.map(function (i) { return '<tr><td><b>' + esc(i.number) + '</b></td><td>' + esc(i.customer ? i.customer.name : '—') + '</td><td>' + RC.date(i.issue_date) + '</td><td>' + RC.money(i.total) + '</td><td>' + RC.money(i.paid_amount) + '</td><td>' + RC.badge(i.status) + '</td><td><button class="rc-ic-btn" data-view="' + i.id + '">👁️</button> <button class="rc-ic-btn" data-del="' + i.id + '">🗑️</button></td></tr>'; }).join('');
        return tableWrap(['number', 'customer', 'issue_date', 'total', 'paid_amount', 'status', 'actions'], rows);
      },
      bind: function (iv, reload) {
        document.querySelectorAll('[data-view]').forEach(function (b) { b.onclick = function () { invoiceView(b.dataset.view, reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/admin/invoices/' + b.dataset.del); RC.toast(t('deleted')); reload(); } }; });
      },
      form: function (_, reload) { invoiceForm(null, reload); },
    });
    async function invoiceFromBooking(bid) { const draft = await RC.api('GET', '/admin/invoices/from-booking/' + bid); invoiceForm(draft, function () { location.href = 'invoices.html'; }); }
    async function invoiceForm(draft, reload) {
      const cs = await RC.api('GET', '/admin/customers?page=1');
      const custOpts = (cs.data || cs).map(function (c) { return { v: c.id, l: c.name }; });
      const items = (draft && draft.items) || [{ description: '', quantity: 1, unit_price: 0 }];
      function itemRow(it, i) { return '<div class="row" data-item style="grid-template-columns:2fr 70px 1fr auto;align-items:end">' + field(t('description'), '<input class="rc-input" name="d" value="' + esc(it.description) + '">') + field(t('qty'), '<input class="rc-input" name="q" type="number" value="' + (it.quantity || 1) + '">') + field(t('unit_price'), '<input class="rc-input" name="u" type="number" value="' + (it.unit_price || 0) + '">') + '<button type="button" class="rc-ic-btn" data-rm>✕</button></div>'; }
      const body = '<form class="rc-form" id="invf">' +
        '<div class="row">' + field(t('customer'), select('customer_id', custOpts, draft ? draft.customer_id : '')) + field(t('due_date'), input('due_date', '', 'date')) + '</div>' +
        '<div id="items">' + items.map(itemRow).join('') + '</div>' +
        '<button type="button" class="rc-btn ghost sm" id="additem">+ ' + t('items') + '</button>' +
        '<div class="row">' + field(t('discount'), input('discount', draft ? draft.discount : 0, 'number')) + field(t('tax'), input('tax', draft ? draft.tax : 0, 'number')) + '</div>' +
        '<input type="hidden" name="booking_id" value="' + (draft && draft.booking_id ? draft.booking_id : '') + '"></form>';
      const w = RC.modal(t('new_invoice'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="is">' + t('save') + '</button>');
      function bindRows() { w.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { b.closest('[data-item]').remove(); }; }); }
      bindRows();
      $('#additem', w).onclick = function () { const div = document.createElement('div'); div.innerHTML = itemRow({ description: '', quantity: 1, unit_price: 0 }); $('#items', w).appendChild(div.firstChild); bindRows(); };
      $('#is', w).onclick = async function () {
        const f = $('#invf', w);
        const its = Array.prototype.map.call(w.querySelectorAll('[data-item]'), function (r) { return { description: r.querySelector('[name=d]').value, quantity: +r.querySelector('[name=q]').value, unit_price: +r.querySelector('[name=u]').value }; }).filter(function (x) { return x.description; });
        const payload = { customer_id: +f.customer_id.value, due_date: f.due_date.value || null, discount: +f.discount.value, tax: +f.tax.value, items: its, booking_id: f.booking_id.value || null };
        try { await RC.api('POST', '/admin/invoices', payload); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e, f); }
      };
    }
    async function invoiceView(id, reload) {
      const i = await RC.api('GET', '/admin/invoices/' + id);
      const remaining = (i.total - i.paid_amount);
      const body = '<div id="invprint"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px"><div><h2 style="font-size:1.3rem">' + esc(i.number) + '</h2><div class="muted">' + RC.date(i.issue_date) + '</div></div>' + RC.badge(i.status) + '</div>' +
        '<div style="margin-bottom:10px"><b>' + t('customer') + ':</b> ' + esc(i.customer ? i.customer.name : '') + '</div>' +
        '<table class="rc-table" style="margin-bottom:12px"><thead><tr><th>' + t('description') + '</th><th>' + t('qty') + '</th><th>' + t('unit_price') + '</th><th>' + t('total') + '</th></tr></thead><tbody>' +
        i.items.map(function (it) { return '<tr><td>' + esc(it.description) + '</td><td>' + it.quantity + '</td><td>' + RC.money(it.unit_price) + '</td><td>' + RC.money(it.amount) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<div style="text-align:end;line-height:1.9"><div>' + t('subtotal') + ': ' + RC.money(i.subtotal) + '</div><div>' + t('discount') + ': ' + RC.money(i.discount) + '</div><div>' + t('tax') + ': ' + RC.money(i.tax) + '</div><div style="font-weight:900;font-size:1.1rem">' + t('total') + ': ' + RC.money(i.total) + '</div><div style="color:var(--green)">' + t('paid_amount') + ': ' + RC.money(i.paid_amount) + '</div><div style="color:var(--red)">' + t('remaining') + ': ' + RC.money(remaining) + '</div></div>' +
        (i.payments.length ? '<h3 style="margin:14px 0 6px;font-size:.95rem">' + t('payments') + '</h3>' + i.payments.map(function (p) { return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:5px 0"><span>' + RC.date(p.paid_at) + ' · ' + t(p.method) + '</span><span>' + RC.money(p.amount) + '</span></div>'; }).join('') : '') +
        '</div>';
      const foot = '<button class="rc-btn ghost" onclick="window.print()">🖨️ ' + t('print') + '</button>' + (i.status !== 'paid' && i.status !== 'void' ? '<button class="rc-btn" id="addpay">+ ' + t('add_payment') + '</button>' : '');
      const w = RC.modal(t('invoice') + ' ' + i.number, body, foot);
      const ap = $('#addpay', w);
      if (ap) ap.onclick = function () {
        const pb = '<form class="rc-form" id="pf"><div class="row">' + field(t('amount'), input('amount', remaining.toFixed(2), 'number')) + field(t('method'), select('method', [{ v: 'cash', l: t('cash') }, { v: 'card', l: t('card') }, { v: 'transfer', l: t('transfer') }], 'cash')) + '</div></form>';
        const w2 = RC.modal(t('add_payment'), pb, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="ps">' + t('save') + '</button>');
        $('#ps', w2).onclick = async function () { const f = $('#pf', w2); try { await RC.api('POST', '/admin/invoices/' + id + '/payments', formData(f)); RC.closeModal(); RC.toast(t('saved')); reload && reload(); } catch (e) { err(e, f); } };
      };
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
        return '<div class="rc-card" style="margin-bottom:10px;display:flex;gap:12px;align-items:center;' + (n.read_at ? 'opacity:.6' : 'border-inline-start:3px solid var(--amber)') + '"><div style="font-size:1.5rem">' + icon + '</div><div style="flex:1"><b>' + esc(L(n, 'title')) + '</b><div class="muted" style="font-size:.85rem">' + esc(L(n, 'body')) + '</div></div><div class="muted" style="font-size:.75rem">' + RC.date(n.created_at) + '</div>' + (n.read_at ? '' : '<button class="rc-ic-btn" data-read="' + n.id + '">✓</button>') + '</div>';
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
        const rows = (st.data || st).map(function (u) { return '<tr><td><b>' + esc(u.name) + '</b><div class="muted" style="font-size:.78rem">' + esc(u.email) + '</div></td><td>' + t(u.role === 'admin' ? 'admin' : 'staff_role') + '</td><td>' + RC.badge(u.status === 'active' ? 'active' : 'suspended') + '</td><td><button class="rc-ic-btn" data-edit="' + u.id + '">✏️</button> <button class="rc-ic-btn" data-del="' + u.id + '">🗑️</button></td></tr>'; }).join('');
        return tableWrap(['name', 'role', 'status', 'actions'], rows);
      },
      bind: function (st, reload) {
        const arr = st.data || st;
        document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { staffForm(arr.find(function (u) { return u.id == b.dataset.edit; }), reload); }; });
        document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { try { await RC.api('DELETE', '/admin/staff/' + b.dataset.del); RC.toast(t('deleted')); reload(); } catch (e) { err(e); } } }; });
      },
      form: function (_, reload) { staffForm(null, reload); },
    });
    function staffForm(u, reload) {
      u = u || {};
      const perms = u.permissions || [];
      const body = '<form class="rc-form" id="uf">' +
        '<div class="row">' + field(t('name'), input('name', u.name)) + field(t('email'), input('email', u.email, 'email')) + '</div>' +
        '<div class="row">' + field(t('phone'), input('phone', u.phone)) + field(t('role'), select('role', [{ v: 'staff', l: t('staff_role') }, { v: 'admin', l: t('admin') }], u.role || 'staff')) + '</div>' +
        field(t('password'), input('password', '', 'password')) +
        '<div><label style="font-weight:700;font-size:.82rem">' + t('permissions') + '</label><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px">' + PERMS.map(function (p) { return '<label class="chk"><input type="checkbox" name="perm" value="' + p + '" ' + (perms.indexOf(p) >= 0 ? 'checked' : '') + '> ' + t(p) + '</label>'; }).join('') + '</div></div>' +
        '</form>';
      const w = RC.modal(u.id ? t('edit') : t('new_staff'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="us">' + t('save') + '</button>');
      $('#us', w).onclick = async function () {
        const f = $('#uf', w); f.querySelectorAll('.err').forEach(function (e) { e.remove(); });
        const d = formData(f); d.permissions = Array.prototype.map.call(f.querySelectorAll('[name=perm]:checked'), function (c) { return c.value; }); delete d.perm;
        if (!d.password) delete d.password;
        try { await RC.api(u.id ? 'PATCH' : 'POST', u.id ? '/admin/staff/' + u.id : '/admin/staff', d); RC.closeModal(); RC.toast(t('saved')); reload(); } catch (e) { err(e, f); }
      };
    }
  };

  /* ---- Settings ---- */
  PAGES.settings = async function () {
    view().innerHTML = '<p>' + t('loading') + '</p>';
    const r = await RC.api('GET', '/admin/settings');
    const c = r.company;
    view().innerHTML = '<div class="rc-card" style="max-width:720px"><form class="rc-form" id="setf">' +
      '<div class="row">' + field(t('name'), input('name', c.name)) + field(t('phone'), input('phone', c.phone)) + '</div>' +
      '<div class="row">' + field(t('email'), input('email', c.email, 'email')) + field(t('city'), input('city', c.city)) + '</div>' +
      field(t('address'), input('address', c.address)) +
      '<div class="row">' + field(t('currency'), input('currency', c.currency)) + field(t('tax_rate'), input('tax_rate', c.tax_rate, 'number')) + '</div>' +
      '<div class="row">' + field(t('invoice_prefix'), input('invoice_prefix', c.invoice_prefix)) + field(t('logo'), '<input class="rc-input" type="file" name="logo" accept="image/*">') + '</div>' +
      '<button class="rc-btn" id="setsave" type="button">' + t('save') + '</button></form></div>';
    $('#setsave').onclick = async function () {
      const f = $('#setf'); f.querySelectorAll('.err').forEach(function (e) { e.remove(); });
      const logo = f.logo.files[0];
      try {
        const d = formData(f); delete d.logo;
        await RC.api('PATCH', '/admin/settings', d);
        if (logo) { const fd = new FormData(); fd.append('logo', logo); await RC.apiForm('POST', '/admin/settings/logo', fd); }
        RC.toast(t('saved')); RC.setCurrency(f.currency.value);
      } catch (e) { err(e, f); }
    };
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
