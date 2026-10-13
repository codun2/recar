/* سيّار — platform super-admin (single page, tabs). AREA='super'. */
(function () {
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const t = RC.t, esc = RC.esc, L = RC.L;

  function formData(form) { const o = {}; new FormData(form).forEach(function (v, k) { o[k] = v; }); return o; }
  function field(label, inner) { return '<div class="rc-field"><label>' + esc(label) + '</label>' + inner + '</div>'; }
  function input(n, v, ty) { return '<input class="rc-input" name="' + n + '" type="' + (ty || 'text') + '" value="' + esc(v == null ? '' : v) + '">'; }
  function select(n, opts, val) { return '<select class="rc-select" name="' + n + '">' + opts.map(function (o) { return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(val) ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select>'; }
  function err(e, f) { if (f && e.data && e.data.errors) Object.keys(e.data.errors).forEach(function (k) { const el = f.querySelector('[name="' + k + '"]'); if (el) { const d = document.createElement('div'); d.className = 'err'; d.textContent = e.data.errors[k][0]; el.parentNode.appendChild(d); } }); RC.toast(e.message || t('error'), 'err'); }

  function boot() {
    RC.initLang();
    if (!RC.token.get()) return renderLogin();
    renderShell();
  }

  function renderLogin() {
    document.body.innerHTML =
      '<div class="rc-auth"><div class="topbar"><div class="rc-lang"><button class="rc-lang-opt" data-lang="ar">ع</button><button class="rc-lang-opt" data-lang="en">EN</button></div></div>' +
      '<div class="rc-auth-card"><div class="brand"><span class="mark">🚗</span>' + t('app') + '</div><div class="sub">' + t('platform') + '</div>' +
      '<form class="rc-form" id="lf"><div class="rc-field"><label>' + t('email') + '</label><input class="rc-input" name="email" type="email" required></div>' +
      '<div class="rc-field"><label>' + t('password') + '</label><input class="rc-input" name="password" type="password" required></div>' +
      '<button class="rc-btn" type="submit">' + t('signin') + '</button></form></div></div>';
    RC.initLang();
    $('#lf').onsubmit = async function (e) { e.preventDefault(); try { const r = await RC.api('POST', '/super/login', { email: e.target.email.value, password: e.target.password.value }); RC.token.set(r.token); renderShell(); } catch (x) { RC.toast(x.message, 'err'); } };
  }

  const TABS = [{ k: 'dashboard', ic: '📊' }, { k: 'companies', ic: '🏢' }, { k: 'plans', ic: '💳' }];
  let current = 'dashboard';

  function renderShell() {
    document.body.innerHTML =
      '<div class="rc-shell"><aside class="rc-side" id="rc-side"><div class="brand"><span class="mark">🚗</span><div>' + t('app') + '<small>PLATFORM</small></div></div>' +
      '<nav class="rc-nav" id="rc-nav"></nav><div class="foot"><a href="#" id="rc-logout" style="display:flex;gap:10px;align-items:center;color:#c5d2e6;padding:10px 14px"><span class="ic">🚪</span>' + t('logout') + '</a></div></aside>' +
      '<div class="rc-main"><div class="rc-top"><button class="rc-burger" id="rc-burger">☰</button><h1 id="rc-title"></h1><div class="sp"></div>' +
      '<div class="rc-lang"><button class="rc-lang-opt" data-lang="ar">ع</button><button class="rc-lang-opt" data-lang="en">EN</button></div></div>' +
      '<div class="rc-content" id="rc-view"></div></div></div>';
    $('#rc-nav').innerHTML = TABS.map(function (tb) { return '<a href="#" data-tab="' + tb.k + '" class="' + (tb.k === current ? 'on' : '') + '"><span class="ic">' + tb.ic + '</span>' + t(tb.k) + '</a>'; }).join('');
    RC.initLang();
    $('#rc-burger').onclick = function () { $('#rc-side').classList.toggle('open'); };
    $('#rc-logout').onclick = async function (e) { e.preventDefault(); try { await RC.api('POST', '/super/logout'); } catch (x) {} RC.token.clear(); renderLogin(); };
    document.querySelectorAll('[data-tab]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); go(a.dataset.tab); }; });
    go(current);
  }
  function go(tab) {
    current = tab;
    document.querySelectorAll('[data-tab]').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === tab); });
    $('#rc-title').textContent = t(tab);
    VIEWS[tab]();
  }
  function view() { return $('#rc-view'); }

  const VIEWS = {};
  VIEWS.dashboard = async function () {
    view().innerHTML = t('loading');
    const d = await RC.api('GET', '/super/dashboard');
    const tile = function (ic, cls, v, k) { return '<div class="rc-tile"><div class="ic ' + cls + '">' + ic + '</div><div><div class="v">' + v + '</div><div class="k">' + k + '</div></div></div>'; };
    view().innerHTML = '<div class="rc-grid tiles" style="margin-bottom:18px">' +
      tile('🏢', 'navy', d.companies.total, t('companies')) +
      tile('✅', 'green', d.companies.active, t('active')) +
      tile('⏳', 'amber', d.companies.pending, t('pending')) +
      tile('🚗', 'navy', d.cars, t('cars')) +
      tile('📅', 'navy', d.bookings, t('bookings')) +
      tile('💰', 'green', RC.money(d.revenue), t('revenue')) +
      '</div><div class="rc-card"><h3>' + t('latest') + ' — ' + t('companies') + '</h3>' +
      d.latest_companies.map(function (c) { return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line)"><b>' + esc(c.name) + '</b>' + RC.badge(c.status === 'active' ? 'active' : (c.status === 'pending' ? 'pending' : 'suspended')) + '</div>'; }).join('') + '</div>';
  };

  VIEWS.companies = async function () {
    view().innerHTML = '<div class="rc-toolbar"><h3 style="font-size:1rem">' + t('companies') + '</h3><div class="sp"></div><button class="rc-btn" id="addc">+ ' + t('new_company') + '</button></div><div id="list">' + t('loading') + '</div>';
    $('#addc').onclick = function () { companyForm(); };
    const res = await RC.api('GET', '/super/companies');
    const rows = res.data.map(function (c) {
      return '<tr><td><b>' + esc(c.name) + '</b><div class="muted" style="font-size:.78rem">' + esc(c.slug) + '</div></td><td>' + esc(c.plan ? L(c.plan, 'name') : '—') + '</td><td>' + (c.cars_count || 0) + '</td><td>' + (c.bookings_count || 0) + '</td><td>' + RC.badge(c.status === 'active' ? 'active' : (c.status === 'pending' ? 'pending' : 'suspended')) + '</td><td>' +
        (c.status !== 'active' ? '<button class="rc-ic-btn" data-act="activate" data-id="' + c.id + '" title="' + t('activate') + '">✅</button> ' : '<button class="rc-ic-btn" data-act="suspend" data-id="' + c.id + '" title="' + t('suspend') + '">⏸️</button> ') +
        '<button class="rc-ic-btn" data-del="' + c.id + '">🗑️</button></td></tr>';
    }).join('');
    $('#list').innerHTML = '<div class="rc-table-wrap"><table class="rc-table"><thead><tr><th>' + t('name') + '</th><th>' + t('plan') + '</th><th>' + t('cars') + '</th><th>' + t('bookings') + '</th><th>' + t('status') + '</th><th>' + t('actions') + '</th></tr></thead><tbody>' + (rows || '<tr><td colspan=6 class="rc-empty">' + t('no_data') + '</td></tr>') + '</tbody></table></div>';
    document.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = async function () { await RC.api('POST', '/super/companies/' + b.dataset.id + '/' + b.dataset.act); RC.toast(t('saved')); VIEWS.companies(); }; });
    document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/super/companies/' + b.dataset.del); RC.toast(t('deleted')); VIEWS.companies(); } }; });
  };
  async function companyForm() {
    const plans = await RC.api('GET', '/super/plans');
    const planOpts = [{ v: '', l: '—' }].concat(plans.map(function (p) { return { v: p.id, l: L(p, 'name') }; }));
    const body = '<form class="rc-form" id="cf">' +
      '<div class="row">' + field(t('name'), input('name', '')) + field(t('plan'), select('plan_id', planOpts, '')) + '</div>' +
      '<div class="row">' + field(t('phone'), input('phone', '')) + field(t('city'), input('city', '')) + '</div>' +
      '<div class="row">' + field(t('email'), input('email', '', 'email')) + field(t('currency'), input('currency', 'SAR')) + '</div>' +
      '<h3 style="font-size:.9rem;color:var(--muted);margin-top:4px">' + t('admin') + '</h3>' +
      '<div class="row">' + field(t('name'), input('admin_name', '')) + field(t('email'), input('admin_email', '', 'email')) + '</div>' +
      field(t('password'), input('admin_password', '', 'password')) + '</form>';
    const w = RC.modal(t('new_company'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="cs">' + t('save') + '</button>');
    $('#cs', w).onclick = async function () { const f = $('#cf', w); f.querySelectorAll('.err').forEach(function (e) { e.remove(); }); try { await RC.api('POST', '/super/companies', formData(f)); RC.closeModal(); RC.toast(t('saved')); VIEWS.companies(); } catch (e) { err(e, f); } };
  }

  VIEWS.plans = async function () {
    view().innerHTML = '<div class="rc-toolbar"><h3 style="font-size:1rem">' + t('plans') + '</h3><div class="sp"></div><button class="rc-btn" id="addp">+ ' + t('new_plan') + '</button></div><div id="list">' + t('loading') + '</div>';
    $('#addp').onclick = function () { planForm(); };
    const plans = await RC.api('GET', '/super/plans');
    $('#list').innerHTML = '<div class="rc-grid tiles">' + plans.map(function (p) {
      return '<div class="rc-card"><div style="display:flex;justify-content:space-between;align-items:start"><h3>' + esc(L(p, 'name')) + '</h3>' + (p.is_active ? RC.badge('active') : RC.badge('suspended')) + '</div>' +
        '<div style="font-size:1.4rem;font-weight:900;color:var(--navy)">' + RC.money(p.price_monthly) + '<small style="font-size:.7rem;color:var(--muted)">/' + t('price_monthly') + '</small></div>' +
        '<div class="muted" style="font-size:.85rem;margin:6px 0">' + t('max_cars') + ': ' + (p.max_cars == null ? t('unlimited') : p.max_cars) + ' · ' + t('max_staff') + ': ' + (p.max_staff == null ? t('unlimited') : p.max_staff) + '</div>' +
        '<div class="muted" style="font-size:.8rem">' + (p.companies_count || 0) + ' ' + t('companies') + '</div>' +
        '<div style="margin-top:10px;display:flex;gap:8px"><button class="rc-btn ghost sm" data-edit="' + p.id + '">' + t('edit') + '</button><button class="rc-ic-btn" data-del="' + p.id + '">🗑️</button></div></div>';
    }).join('') + '</div>';
    document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { planForm(plans.find(function (p) { return p.id == b.dataset.edit; })); }; });
    document.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { if (await RC.confirm(t('confirm_delete'))) { await RC.api('DELETE', '/super/plans/' + b.dataset.del); RC.toast(t('deleted')); VIEWS.plans(); } }; });
  };
  function planForm(p) {
    p = p || {};
    const body = '<form class="rc-form" id="pf">' +
      '<div class="row">' + field(t('name') + ' (ع)', input('name_ar', p.name_ar)) + field(t('name') + ' (EN)', input('name_en', p.name_en)) + '</div>' +
      '<div class="row">' + field(t('price_monthly'), input('price_monthly', p.price_monthly || 0, 'number')) + field(t('price_yearly'), input('price_yearly', p.price_yearly || 0, 'number')) + '</div>' +
      '<div class="row">' + field(t('max_cars'), input('max_cars', p.max_cars, 'number')) + field(t('max_staff'), input('max_staff', p.max_staff, 'number')) + '</div>' +
      '<label class="chk"><input type="checkbox" name="is_active" ' + (p.is_active === false ? '' : 'checked') + '> ' + t('active') + '</label></form>';
    const w = RC.modal(p.id ? t('edit') : t('new_plan'), body, '<button class="rc-btn ghost" onclick="RC.closeModal()">' + t('cancel') + '</button><button class="rc-btn" id="ps">' + t('save') + '</button>');
    $('#ps', w).onclick = async function () { const f = $('#pf', w); f.querySelectorAll('.err').forEach(function (e) { e.remove(); }); const d = formData(f); d.is_active = f.is_active.checked ? 1 : 0; if (d.max_cars === '') delete d.max_cars; if (d.max_staff === '') delete d.max_staff; try { await RC.api(p.id ? 'PATCH' : 'POST', p.id ? '/super/plans/' + p.id : '/super/plans', d); RC.closeModal(); RC.toast(t('saved')); VIEWS.plans(); } catch (e) { err(e, f); } };
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
