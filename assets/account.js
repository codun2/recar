/* سيّار — customer portal (single page, tabs). AREA='customer'. */
(function () {
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const t = RC.t, esc = RC.esc, L = RC.L;
  let USER = null, COMPANY = null;

  function field(label, inner) { return '<div class="rc-field"><label>' + esc(label) + '</label>' + inner + '</div>'; }
  function input(n, v, ty) { return '<input class="rc-input" name="' + n + '" type="' + (ty || 'text') + '" value="' + esc(v == null ? '' : v) + '">'; }
  function formData(form) { const o = {}; new FormData(form).forEach(function (v, k) { o[k] = v; }); return o; }
  function err(e, f) { if (f && e.data && e.data.errors) Object.keys(e.data.errors).forEach(function (k) { const el = f.querySelector('[name="' + k + '"]'); if (el) { const d = document.createElement('div'); d.className = 'err'; d.textContent = e.data.errors[k][0]; el.parentNode.appendChild(d); } }); RC.toast(e.message || t('error'), 'err'); }
  function price(c) { return (c.offer_price && +c.offer_price > 0) ? +c.offer_price : +c.daily_price; }

  async function boot() {
    RC.guard();
    try { const r = await RC.api('GET', '/customer/me'); USER = r.user; COMPANY = r.company; if (COMPANY) RC.setCurrency(COMPANY.currency); } catch (e) { return; }
    renderShell();
  }

  const TABS = [{ k: 'browse_cars', ic: 'cars', v: 'browse' }, { k: 'my_bookings', ic: 'bookings', v: 'bookings' }, { k: 'my_invoices', ic: 'invoices', v: 'invoices' }];
  let current = 'browse';

  function renderShell() {
    document.body.innerHTML =
      '<div class="rc-shell"><aside class="rc-side" id="rc-side"><div class="brand"><span class="mark">' + RC.icon('car', 20) + '</span><div>' + t('app') + '<small>' + esc(USER.name) + '</small></div></div>' +
      '<nav class="rc-nav" id="rc-nav"></nav><div class="foot"><a href="#" id="rc-logout" style="display:flex;gap:10px;align-items:center;color:#c5d2e6;padding:10px 14px"><span class="ic">' + RC.icon('logout') + '</span>' + t('logout') + '</a></div></aside>' +
      '<div class="rc-main"><div class="rc-top"><button class="rc-burger" id="rc-burger">☰</button><h1 id="rc-title"></h1><div class="sp"></div>' +
      '<div class="rc-lang"><button class="rc-lang-opt" data-lang="ar">ع</button><button class="rc-lang-opt" data-lang="en">EN</button></div></div>' +
      '<div class="rc-content" id="rc-view"></div></div></div>';
    $('#rc-nav').innerHTML = TABS.map(function (tb) { return '<a href="#" data-tab="' + tb.v + '" class="' + (tb.v === current ? 'on' : '') + '"><span class="ic">' + RC.icon(tb.ic) + '</span>' + t(tb.k) + '</a>'; }).join('');
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
      const off = c.offer_price && +c.offer_price > 0;
      return '<div class="car-card">' + (off ? '<span class="offer-badge">' + esc(c.offer_label || t('offer')) + '</span>' : '') +
        '<div class="thumb" ' + (c.image ? 'style="background-image:url(' + esc(c.image) + ')"' : '') + '>' + (c.image ? '' : RC.icon('car', 36)) + '</div>' +
        '<div class="body"><div class="nm">' + esc(L(c, 'name')) + '</div><div class="meta"><span>' + esc(c.category ? L(c.category, 'name') : '') + '</span><span>' + (c.seats || 5) + ' ' + t('seats') + '</span><span>' + t(c.transmission) + '</span></div>' +
        '<div class="price">' + (off ? '<span class="price-was">' + RC.money(c.daily_price) + '</span>' : '') + RC.money(price(c)) + '<small>' + t('per_day') + '</small></div>' +
        '<div style="display:flex;gap:8px"><button class="rc-btn ghost sm" data-detail="' + c.id + '">' + t('details') + '</button><button class="rc-btn sm" data-book="' + c.id + '">' + t('book_now') + '</button></div></div></div>';
    }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>') + '</div>';
    document.querySelectorAll('[data-book]').forEach(function (b) { b.onclick = function () { bookForm(cars.find(function (c) { return c.id == b.dataset.book; })); }; });
    document.querySelectorAll('[data-detail]').forEach(function (b) { b.onclick = function () { carDetail(b.dataset.detail); }; });
  };

  async function carDetail(id) {
    const c = await RC.api('GET', '/customer/cars/' + id);
    const imgs = (c.images || []).map(function (im) { return im.path; });
    const gallery = (c.image ? [c.image] : []).concat(imgs.filter(function (p) { return p !== c.image; }));
    const off = c.offer_price && +c.offer_price > 0;
    const spec = function (k, v) { return '<div class="spec"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; };
    const body = '<div class="car-detail"><div>' +
      '<div class="hero-img" id="hero" ' + (gallery[0] ? 'style="background-image:url(' + esc(gallery[0]) + ')"' : '') + '>' + (gallery[0] ? '' : RC.icon('car', 44)) + '</div>' +
      (gallery.length > 1 ? '<div class="thumbs" id="thumbs">' + gallery.map(function (g, i) { return '<img src="' + esc(g) + '" class="' + (i === 0 ? 'on' : '') + '" data-g="' + esc(g) + '">'; }).join('') + '</div>' : '') +
      '</div><div>' +
      '<h2 style="font-size:1.4rem">' + esc(L(c, 'name')) + '</h2>' +
      '<div class="price" style="font-size:1.4rem;font-weight:900;color:var(--navy);margin:6px 0">' + (off ? '<span class="price-was">' + RC.money(c.daily_price) + '</span>' : '') + RC.money(price(c)) + '<small style="font-size:.7rem;color:var(--muted)">' + t('per_day') + '</small></div>' +
      '<div class="spec-grid">' + spec(t('category'), esc(c.category ? L(c.category, 'name') : '—')) + spec(t('transmission'), t(c.transmission)) + spec(t('fuel'), t(c.fuel)) + spec(t('seats'), c.seats || 5) + spec(t('year'), c.year || '—') + spec(t('deposit'), RC.money(c.deposit)) + '</div>' +
      (L(c, 'description') ? '<p style="color:var(--muted);font-size:.9rem">' + esc(L(c, 'description')) + '</p>' : '') +
      '<button class="rc-btn" id="bkd" style="width:100%;justify-content:center;margin-top:8px">' + t('book_now') + '</button>' +
      '</div></div>';
    const w = RC.modal(L(c, 'name'), body);
    const hero = $('#hero', w);
    w.querySelectorAll('#thumbs img').forEach(function (im) { im.onclick = function () { hero.style.backgroundImage = 'url(' + im.dataset.g + ')'; hero.innerHTML = ''; w.querySelectorAll('#thumbs img').forEach(function (x) { x.classList.remove('on'); }); im.classList.add('on'); }; });
    $('#bkd', w).onclick = function () { RC.closeModal(); bookForm(c); };
  }

  function bookForm(car) {
    const body = '<form class="rc-form" id="bf"><div style="font-weight:800;margin-bottom:4px">' + esc(L(car, 'name')) + ' — ' + RC.money(price(car)) + t('per_day') + '</div>' +
      '<div class="row">' + field(t('start_date'), input('start_date', '', 'date')) + field(t('end_date'), input('end_date', '', 'date')) + '</div>' +
      '<label class="chk"><input type="checkbox" name="delivery" id="delc"> ' + t('request_delivery') + '</label>' +
      '<div id="delbox" style="display:none">' + field(t('delivery_address'), input('delivery_address', '')) + '<p class="muted" style="font-size:.78rem;margin:0">' + t('full_payment_required') + '</p></div>' +
      field(t('notes'), '<textarea class="rc-input" name="notes" rows="2"></textarea>') +
      '<div id="q" style="font-weight:800;color:var(--navy)"></div>' +
      '<input type="hidden" name="car_id" value="' + car.id + '"></form>';
    const w = RC.modal(t('book_now'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="bs">' + t('rent') + '</button>');
    const f = $('#bf', w);
    $('#delc', w).onchange = function () { $('#delbox', w).style.display = this.checked ? '' : 'none'; };
    function quote() { if (f.start_date.value && f.end_date.value) { const d1 = new Date(f.start_date.value), d2 = new Date(f.end_date.value); const days = Math.max(1, Math.round((d2 - d1) / 86400000)); $('#q', w).textContent = days + ' ' + t('days') + ' · ' + RC.money(days * price(car)); } }
    f.start_date.onchange = quote; f.end_date.onchange = quote;
    $('#bs', w).onclick = async function () { f.querySelectorAll('.err').forEach(function (e) { e.remove(); }); const d = formData(f); d.delivery = f.delivery.checked ? 1 : 0; try { await RC.api('POST', '/customer/bookings', d); RC.closeModal(); RC.toast(t('saved')); go('bookings'); } catch (e) { err(e, f); } };
  }

  VIEWS.bookings = async function () {
    view().innerHTML = t('loading');
    const res = await RC.api('GET', '/customer/bookings');
    const bs = res.data || res;
    view().innerHTML = bs.length ? bs.map(function (b) {
      const remaining = b.total - (b.deposit_paid || 0);
      const canPay = ['pending', 'confirmed'].indexOf(b.status) >= 0 && remaining > 0;
      return '<div class="rc-card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><b>' + esc(b.reference || '#' + b.id) + '</b> — ' + esc(b.car ? L(b.car, 'name') : '') + (b.delivery ? ' · ' + t('delivery') : '') + '<div class="muted" style="font-size:.82rem">' + RC.date(b.start_date) + ' → ' + RC.date(b.end_date) + ' · ' + t('total') + ': ' + RC.money(b.total) + ' · ' + t('remaining') + ': ' + RC.money(remaining) + '</div></div>' +
        '<div style="display:flex;gap:8px;align-items:center">' + RC.badge(b.status) +
        (canPay ? '<button class="rc-btn sm" data-pay="' + b.id + '">' + t('pay') + '</button>' : '') +
        (['pending', 'confirmed'].indexOf(b.status) >= 0 ? '<button class="rc-btn danger sm" data-cancel="' + b.id + '">' + t('cancel_booking') + '</button>' : '') +
        '</div></div></div>';
    }).join('') : '<div class="rc-empty">' + t('no_data') + '</div>';
    document.querySelectorAll('[data-cancel]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('cancel_booking') + '؟')) { try { await RC.api('POST', '/customer/bookings/' + b.dataset.cancel + '/cancel'); RC.toast(t('saved')); VIEWS.bookings(); } catch (e) { err(e); } } }; });
    document.querySelectorAll('[data-pay]').forEach(function (b) { b.onclick = function () { payForm(bs.find(function (x) { return x.id == b.dataset.pay; })); }; });
  };

  function payForm(b) {
    const remaining = b.total - (b.deposit_paid || 0);
    const C = COMPANY || {};
    const bankBox = (C.iban || C.stc_pay || C.bank_name) ?
      '<div class="bank-box">' + RC.icon('bank', 16) + ' <b>' + t('payment_details') + '</b><br>' +
      (C.bank_name ? t('bank_name') + ': <b>' + esc(C.bank_name) + '</b><br>' : '') +
      (C.account_name ? t('account_name') + ': ' + esc(C.account_name) + '<br>' : '') +
      (C.iban ? t('iban') + ': <b>' + esc(C.iban) + '</b><br>' : '') +
      (C.stc_pay ? 'STC Pay: <b>' + esc(C.stc_pay) + '</b>' : '') + '</div>' :
      '<p class="muted">' + t('payment_details') + ' —</p>';
    const body = '<div style="margin-bottom:10px">' + bankBox + '</div>' +
      (b.delivery ? '<p style="color:var(--orange);font-weight:700;font-size:.85rem">' + t('full_payment_required') + '</p>' : '') +
      '<form class="rc-form" id="pf">' +
      field(t('amount'), input('amount', remaining.toFixed(2), 'number')) +
      field(t('upload_receipt'), '<input class="rc-input" type="file" name="receipt" accept="image/*" required>') +
      '</form>';
    const w = RC.modal(t('pay') + ' — ' + (b.reference || '#' + b.id), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="ps">' + t('pay_now') + '</button>');
    $('#ps', w).onclick = async function () {
      const f = $('#pf', w); f.querySelectorAll('.err').forEach(function (e) { e.remove(); });
      if (!f.receipt.files.length) { RC.toast(t('upload_receipt'), 'err'); return; }
      const fd = new FormData(); fd.append('amount', f.amount.value); fd.append('receipt', f.receipt.files[0]);
      try { await RC.apiForm('POST', '/customer/bookings/' + b.id + '/pay', fd); RC.closeModal(); RC.toast(t('awaiting_confirmation')); VIEWS.bookings(); } catch (e) { err(e, f); }
    };
  }

  VIEWS.invoices = async function () {
    view().innerHTML = t('loading');
    const res = await RC.api('GET', '/customer/invoices');
    const iv = res.data || res;
    view().innerHTML = iv.length ? '<div class="rc-table-wrap"><table class="rc-table"><thead><tr><th>' + t('number') + '</th><th>' + t('issue_date') + '</th><th>' + t('total') + '</th><th>' + t('remaining') + '</th><th>' + t('status') + '</th></tr></thead><tbody>' +
      iv.map(function (i) { return '<tr><td><b>' + esc(i.number) + '</b></td><td>' + RC.date(i.issue_date) + '</td><td>' + RC.money(i.total) + '</td><td style="color:var(--red)">' + RC.money(i.total - i.paid_amount) + '</td><td>' + RC.badge(i.status) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' : '<div class="rc-empty">' + t('no_data') + '</div>';
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
