/* سيّار — customer portal (single page, tabs). AREA='customer'. */
(function () {
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const t = RC.t, esc = RC.esc, L = RC.L;
  let USER = null;

  function field(label, inner) { return '<div class="rc-field"><label>' + esc(label) + '</label>' + inner + '</div>'; }
  function input(n, v, ty) { return '<input class="rc-input" name="' + n + '" type="' + (ty || 'text') + '" value="' + esc(v == null ? '' : v) + '">'; }
  function formData(form) { const o = {}; new FormData(form).forEach(function (v, k) { o[k] = v; }); return o; }
  function err(e, f) { if (f && e.data && e.data.errors) Object.keys(e.data.errors).forEach(function (k) { const el = f.querySelector('[name="' + k + '"]'); if (el) { const d = document.createElement('div'); d.className = 'err'; d.textContent = e.data.errors[k][0]; el.parentNode.appendChild(d); } }); RC.toast(e.message || t('error'), 'err'); }

  async function boot() {
    RC.guard();
    try { const r = await RC.api('GET', '/customer/me'); USER = r.user; } catch (e) { return; }
    renderShell();
  }

  const TABS = [{ k: 'browse_cars', ic: '🚗', v: 'browse' }, { k: 'my_bookings', ic: '📅', v: 'bookings' }, { k: 'my_invoices', ic: '🧾', v: 'invoices' }];
  let current = 'browse';

  function renderShell() {
    document.body.innerHTML =
      '<div class="rc-shell"><aside class="rc-side" id="rc-side"><div class="brand"><span class="mark">🚗</span><div>' + t('app') + '<small>' + esc(USER.name) + '</small></div></div>' +
      '<nav class="rc-nav" id="rc-nav"></nav><div class="foot"><a href="#" id="rc-logout" style="display:flex;gap:10px;align-items:center;color:#c5d2e6;padding:10px 14px"><span class="ic">🚪</span>' + t('logout') + '</a></div></aside>' +
      '<div class="rc-main"><div class="rc-top"><button class="rc-burger" id="rc-burger">☰</button><h1 id="rc-title"></h1><div class="sp"></div>' +
      '<div class="rc-lang"><button class="rc-lang-opt" data-lang="ar">ع</button><button class="rc-lang-opt" data-lang="en">EN</button></div></div>' +
      '<div class="rc-content" id="rc-view"></div></div></div>';
    $('#rc-nav').innerHTML = TABS.map(function (tb) { return '<a href="#" data-tab="' + tb.v + '" class="' + (tb.v === current ? 'on' : '') + '"><span class="ic">' + tb.ic + '</span>' + t(tb.k) + '</a>'; }).join('');
    RC.initLang();
    $('#rc-burger').onclick = function () { $('#rc-side').classList.toggle('open'); };
    $('#rc-logout').onclick = async function (e) { e.preventDefault(); try { await RC.api('POST', '/customer/logout'); } catch (x) {} RC.token.clear(); location.href = '/account/login.html'; };
    document.querySelectorAll('[data-tab]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); go(a.dataset.tab); }; });
    go(current);
  }
  function go(tab) { current = tab; document.querySelectorAll('[data-tab]').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === tab); }); const titleKey = { browse: 'browse_cars', bookings: 'my_bookings', invoices: 'my_invoices' }[tab]; $('#rc-title').textContent = t(titleKey); VIEWS[tab](); }
  function view() { return $('#rc-view'); }

  const VIEWS = {};
  VIEWS.browse = async function () {
    view().innerHTML = t('loading');
    const res = await RC.api('GET', '/customer/cars');
    const cars = res.cars.data || res.cars;
    view().innerHTML = '<div class="car-grid">' + (cars.length ? cars.map(function (c) {
      return '<div class="car-card"><div class="thumb" ' + (c.image ? 'style="background-image:url(' + esc(c.image) + ')"' : '') + '>' + (c.image ? '' : '🚗') + '</div><div class="body"><div class="nm">' + esc(L(c, 'name')) + '</div><div class="meta"><span>' + esc(c.category ? L(c.category, 'name') : '') + '</span><span>' + (c.seats || 5) + ' 🪑</span><span>' + t(c.transmission) + '</span></div><div class="price">' + RC.money(c.daily_price) + '<small>' + t('per_day') + '</small></div><button class="rc-btn sm" data-book="' + c.id + '">' + t('book_now') + '</button></div></div>';
    }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>') + '</div>';
    document.querySelectorAll('[data-book]').forEach(function (b) { b.onclick = function () { bookForm(cars.find(function (c) { return c.id == b.dataset.book; })); }; });
  };
  function bookForm(car) {
    const body = '<form class="rc-form" id="bf"><div style="font-weight:800;margin-bottom:4px">' + esc(L(car, 'name')) + ' — ' + RC.money(car.daily_price) + t('per_day') + '</div>' +
      '<div class="row">' + field(t('start_date'), input('start_date', '', 'date')) + field(t('end_date'), input('end_date', '', 'date')) + '</div>' +
      field(t('notes'), '<textarea class="rc-input" name="notes" rows="2"></textarea>') +
      '<div id="q" style="font-weight:800;color:var(--navy)"></div>' +
      '<input type="hidden" name="car_id" value="' + car.id + '"></form>';
    const w = RC.modal(t('book_now'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="bs">' + t('rent') + '</button>');
    const f = $('#bf', w);
    function quote() { if (f.start_date.value && f.end_date.value) { const d1 = new Date(f.start_date.value), d2 = new Date(f.end_date.value); const days = Math.max(1, Math.round((d2 - d1) / 86400000)); $('#q', w).textContent = days + ' ' + t('days') + ' · ' + RC.money(days * car.daily_price); } }
    f.start_date.onchange = quote; f.end_date.onchange = quote;
    $('#bs', w).onclick = async function () { f.querySelectorAll('.err').forEach(function (e) { e.remove(); }); try { await RC.api('POST', '/customer/bookings', formData(f)); RC.closeModal(); RC.toast(t('saved')); go('bookings'); } catch (e) { err(e, f); } };
  }

  VIEWS.bookings = async function () {
    view().innerHTML = t('loading');
    const res = await RC.api('GET', '/customer/bookings');
    const bs = res.data || res;
    view().innerHTML = bs.length ? bs.map(function (b) {
      return '<div class="rc-card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px"><div><b>' + esc(b.reference || '#' + b.id) + '</b> — ' + esc(b.car ? L(b.car, 'name') : '') + '<div class="muted" style="font-size:.82rem">' + RC.date(b.start_date) + ' → ' + RC.date(b.end_date) + ' · ' + RC.money(b.total) + '</div></div><div style="display:flex;gap:8px;align-items:center">' + RC.badge(b.status) + (['pending', 'confirmed'].indexOf(b.status) >= 0 ? '<button class="rc-btn danger sm" data-cancel="' + b.id + '">' + t('cancel_booking') + '</button>' : '') + '</div></div>';
    }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>';
    document.querySelectorAll('[data-cancel]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('cancel_booking') + '؟')) { try { await RC.api('POST', '/customer/bookings/' + b.dataset.cancel + '/cancel'); RC.toast(t('saved')); VIEWS.bookings(); } catch (e) { err(e); } } }; });
  };

  VIEWS.invoices = async function () {
    view().innerHTML = t('loading');
    const res = await RC.api('GET', '/customer/invoices');
    const iv = res.data || res;
    view().innerHTML = iv.length ? '<div class="rc-table-wrap"><table class="rc-table"><thead><tr><th>' + t('number') + '</th><th>' + t('issue_date') + '</th><th>' + t('total') + '</th><th>' + t('paid_amount') + '</th><th>' + t('status') + '</th></tr></thead><tbody>' +
      iv.map(function (i) { return '<tr><td><b>' + esc(i.number) + '</b></td><td>' + RC.date(i.issue_date) + '</td><td>' + RC.money(i.total) + '</td><td>' + RC.money(i.paid_amount) + '</td><td>' + RC.badge(i.status) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' : '<div class="rc-empty">' + t('no_data') + '</div>';
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
