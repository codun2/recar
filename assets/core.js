/* سيّار — shared dashboard core: API client, i18n (ar/en), helpers.
   Each page sets window.AREA = 'admin' | 'super' | 'customer' before loading. */
(function () {
  const AREA = window.AREA || 'admin';
  const TOKEN_KEY = 'recar_' + AREA + '_token';
  const LOGIN_URL = { admin: '/admin/login.html', super: '/super/', customer: '/account/login.html' }[AREA];
  const API_BASE = '/api';

  /* ---------- i18n ---------- */
  const DICT = {
    ar: {
      app: 'سيّار', dashboard: 'لوحة التحكم', cars: 'السيارات', categories: 'التصنيفات',
      bookings: 'الحجوزات', customers: 'العملاء', invoices: 'الفواتير', payments: 'المدفوعات',
      notifications: 'الإشعارات', staff: 'الموظفون', settings: 'الإعدادات', logout: 'خروج',
      companies: 'الشركات', plans: 'الخطط', login: 'تسجيل الدخول', email: 'البريد الإلكتروني',
      password: 'كلمة المرور', signin: 'دخول', loading: 'جارٍ التحميل…', save: 'حفظ', cancel: 'إلغاء',
      add: 'إضافة', edit: 'تعديل', delete: 'حذف', confirm: 'تأكيد', search: 'بحث…', actions: 'إجراءات',
      status: 'الحالة', name: 'الاسم', phone: 'الهاتف', total: 'الإجمالي', revenue: 'الإيرادات',
      available: 'متاحة', rented: 'مؤجّرة', maintenance: 'صيانة', hidden: 'مخفية', all: 'الكل',
      daily_price: 'السعر اليومي', deposit: 'التأمين', category: 'التصنيف', plate: 'اللوحة',
      year: 'السنة', seats: 'المقاعد', transmission: 'ناقل الحركة', fuel: 'الوقود',
      auto: 'أوتوماتيك', manual: 'عادي', petrol: 'بنزين', diesel: 'ديزل', electric: 'كهرباء', hybrid: 'هايبرد',
      featured: 'مميّزة', image: 'الصورة', description: 'الوصف', customer: 'العميل', car: 'السيارة',
      start_date: 'من', end_date: 'إلى', days: 'الأيام', subtotal: 'المجموع', discount: 'الخصم',
      tax: 'الضريبة', pending: 'قيد الانتظار', confirmed: 'مؤكّد', active: 'نشِط', completed: 'مكتمل',
      cancelled: 'ملغي', unpaid: 'غير مدفوعة', partial: 'جزئي', paid: 'مدفوعة', void: 'ملغاة',
      national_id: 'الهوية', license: 'رخصة القيادة', city: 'المدينة', address: 'العنوان', notes: 'ملاحظات',
      invoice: 'فاتورة', number: 'الرقم', issue_date: 'تاريخ الإصدار', due_date: 'الاستحقاق',
      amount: 'المبلغ', method: 'الطريقة', cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل', other: 'أخرى',
      paid_amount: 'المدفوع', remaining: 'المتبقّي', add_payment: 'إضافة دفعة', print: 'طباعة',
      role: 'الصلاحية', admin: 'مدير', staff_role: 'موظف', permissions: 'الصلاحيات', title: 'المسمّى',
      company: 'الشركة', approve: 'اعتماد', suspend: 'إيقاف', activate: 'تفعيل', plan: 'الخطة',
      suspended: 'موقوفة', mark_all_read: 'تعليم الكل مقروء', no_data: 'لا توجد بيانات',
      new_car: 'سيارة جديدة', new_booking: 'حجز جديد', new_customer: 'عميل جديد', new_invoice: 'فاتورة جديدة',
      new_category: 'تصنيف جديد', new_staff: 'موظف جديد', new_company: 'شركة جديدة', new_plan: 'خطة جديدة',
      saved: 'تم الحفظ', deleted: 'تم الحذف', error: 'حدث خطأ', confirm_delete: 'هل أنت متأكد من الحذف؟',
      welcome: 'أهلاً', overview: 'نظرة عامة', monthly_revenue: 'إيرادات آخر 6 أشهر', latest: 'الأحدث',
      max_cars: 'أقصى سيارات', max_staff: 'أقصى موظفين', price_monthly: 'سعر شهري', price_yearly: 'سعر سنوي',
      features: 'المزايا', unlimited: 'غير محدود', items: 'البنود', qty: 'الكمية', unit_price: 'سعر الوحدة',
      from_booking: 'من حجز', select: 'اختر…', platform: 'منصّة سيّار', currency: 'العملة',
      tax_rate: 'نسبة الضريبة %', invoice_prefix: 'بادئة الفاتورة', logo: 'الشعار', profile: 'الملف',
      my_bookings: 'حجوزاتي', my_invoices: 'فواتيري', browse_cars: 'تصفّح السيارات', book_now: 'احجز الآن',
      register: 'تسجيل', signup: 'إنشاء حساب', have_account: 'لديك حساب؟', no_account: 'ليس لديك حساب؟',
      per_day: '/يوم', rent: 'استئجار', back: 'رجوع', cancel_booking: 'إلغاء الحجز',
    },
    en: {
      app: 'Sayyar', dashboard: 'Dashboard', cars: 'Cars', categories: 'Categories',
      bookings: 'Bookings', customers: 'Customers', invoices: 'Invoices', payments: 'Payments',
      notifications: 'Notifications', staff: 'Staff', settings: 'Settings', logout: 'Logout',
      companies: 'Companies', plans: 'Plans', login: 'Login', email: 'Email',
      password: 'Password', signin: 'Sign in', loading: 'Loading…', save: 'Save', cancel: 'Cancel',
      add: 'Add', edit: 'Edit', delete: 'Delete', confirm: 'Confirm', search: 'Search…', actions: 'Actions',
      status: 'Status', name: 'Name', phone: 'Phone', total: 'Total', revenue: 'Revenue',
      available: 'Available', rented: 'Rented', maintenance: 'Maintenance', hidden: 'Hidden', all: 'All',
      daily_price: 'Daily price', deposit: 'Deposit', category: 'Category', plate: 'Plate',
      year: 'Year', seats: 'Seats', transmission: 'Transmission', fuel: 'Fuel',
      auto: 'Automatic', manual: 'Manual', petrol: 'Petrol', diesel: 'Diesel', electric: 'Electric', hybrid: 'Hybrid',
      featured: 'Featured', image: 'Image', description: 'Description', customer: 'Customer', car: 'Car',
      start_date: 'From', end_date: 'To', days: 'Days', subtotal: 'Subtotal', discount: 'Discount',
      tax: 'Tax', pending: 'Pending', confirmed: 'Confirmed', active: 'Active', completed: 'Completed',
      cancelled: 'Cancelled', unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid', void: 'Void',
      national_id: 'National ID', license: 'License', city: 'City', address: 'Address', notes: 'Notes',
      invoice: 'Invoice', number: 'Number', issue_date: 'Issue date', due_date: 'Due date',
      amount: 'Amount', method: 'Method', cash: 'Cash', card: 'Card', transfer: 'Transfer', other: 'Other',
      paid_amount: 'Paid', remaining: 'Remaining', add_payment: 'Add payment', print: 'Print',
      role: 'Role', admin: 'Admin', staff_role: 'Staff', permissions: 'Permissions', title: 'Title',
      company: 'Company', approve: 'Approve', suspend: 'Suspend', activate: 'Activate', plan: 'Plan',
      suspended: 'Suspended', mark_all_read: 'Mark all read', no_data: 'No data',
      new_car: 'New car', new_booking: 'New booking', new_customer: 'New customer', new_invoice: 'New invoice',
      new_category: 'New category', new_staff: 'New staff', new_company: 'New company', new_plan: 'New plan',
      saved: 'Saved', deleted: 'Deleted', error: 'Something went wrong', confirm_delete: 'Delete this item?',
      welcome: 'Welcome', overview: 'Overview', monthly_revenue: 'Revenue (last 6 months)', latest: 'Latest',
      max_cars: 'Max cars', max_staff: 'Max staff', price_monthly: 'Monthly price', price_yearly: 'Yearly price',
      features: 'Features', unlimited: 'Unlimited', items: 'Items', qty: 'Qty', unit_price: 'Unit price',
      from_booking: 'From booking', select: 'Select…', platform: 'Sayyar Platform', currency: 'Currency',
      tax_rate: 'Tax rate %', invoice_prefix: 'Invoice prefix', logo: 'Logo', profile: 'Profile',
      my_bookings: 'My bookings', my_invoices: 'My invoices', browse_cars: 'Browse cars', book_now: 'Book now',
      register: 'Register', signup: 'Create account', have_account: 'Have an account?', no_account: 'No account?',
      per_day: '/day', rent: 'Rent', back: 'Back', cancel_booking: 'Cancel booking',
    },
  };

  let LANG = localStorage.getItem('recar_lang') || 'ar';
  function t(k) { return (DICT[LANG] && DICT[LANG][k]) || (DICT.ar[k]) || k; }
  function applyLang(lang) {
    LANG = lang; localStorage.setItem('recar_lang', lang);
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    document.querySelectorAll('.rc-lang-opt').forEach(function (o) { o.classList.toggle('on', o.dataset.lang === lang); });
    if (window.PAGE && typeof window.PAGE.onLang === 'function') window.PAGE.onLang(lang);
  }
  function initLang() {
    applyLang(LANG);
    document.querySelectorAll('.rc-lang-opt').forEach(function (o) {
      o.addEventListener('click', function () { applyLang(o.dataset.lang); });
    });
  }

  /* ---------- localized field ---------- */
  function L(obj, base) { return (LANG === 'en' ? obj[base + '_en'] : obj[base + '_ar']) || obj[base + '_ar'] || obj[base + '_en'] || ''; }

  /* ---------- token ---------- */
  const token = {
    get: function () { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(TOKEN_KEY, v); } catch (e) {} },
    clear: function () { try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} },
  };

  /* ---------- API ---------- */
  async function api(method, path, body) {
    const opts = { method: method, headers: { Accept: 'application/json' } };
    const tk = token.get();
    if (tk) opts.headers.Authorization = 'Bearer ' + tk;
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res = await fetch(API_BASE + path, opts);
    if (res.status === 401) { token.clear(); location.href = LOGIN_URL; throw new Error('unauthorized'); }
    const data = res.status === 204 ? null : await res.json().catch(function () { return null; });
    if (!res.ok) { const e = new Error((data && data.message) || t('error')); e.data = data; e.status = res.status; throw e; }
    return data;
  }
  async function apiForm(method, path, formData) {
    const opts = { method: method, headers: { Accept: 'application/json' }, body: formData };
    const tk = token.get();
    if (tk) opts.headers.Authorization = 'Bearer ' + tk;
    const res = await fetch(API_BASE + path, opts);
    if (res.status === 401) { token.clear(); location.href = LOGIN_URL; throw new Error('unauthorized'); }
    const data = await res.json().catch(function () { return null; });
    if (!res.ok) { const e = new Error((data && data.message) || t('error')); e.data = data; throw e; }
    return data;
  }

  function guard() { if (!token.get()) { location.href = LOGIN_URL; } }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  let CURRENCY = localStorage.getItem('recar_currency') || 'SAR';
  function setCurrency(c) { if (c) { CURRENCY = c; localStorage.setItem('recar_currency', c); } }
  function money(n) { const v = Number(n || 0); return v.toLocaleString(LANG === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ' + CURRENCY; }
  function date(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }); }
  function toast(msg, type) {
    let box = document.getElementById('rc-toasts');
    if (!box) { box = document.createElement('div'); box.id = 'rc-toasts'; document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'rc-toast ' + (type || 'ok'); el.textContent = msg;
    box.appendChild(el); setTimeout(function () { el.classList.add('show'); }, 10);
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }, 3000);
  }
  function modal(title, bodyHtml, footerHtml) {
    closeModal();
    const wrap = document.createElement('div'); wrap.className = 'rc-modal-wrap'; wrap.id = 'rc-modal';
    wrap.innerHTML = '<div class="rc-modal"><div class="rc-modal-head"><h3>' + esc(title) + '</h3><button class="rc-x" aria-label="close">✕</button></div><div class="rc-modal-body">' + bodyHtml + '</div>' + (footerHtml ? '<div class="rc-modal-foot">' + footerHtml + '</div>' : '') + '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) closeModal(); });
    wrap.querySelector('.rc-x').addEventListener('click', closeModal);
    return wrap;
  }
  function closeModal() { const m = document.getElementById('rc-modal'); if (m) m.remove(); }
  function confirmDialog(msg) {
    return new Promise(function (resolve) {
      const w = modal(t('confirm'), '<p style="margin:0 0 4px">' + esc(msg) + '</p>',
        '<button class="rc-btn ghost" id="rc-cno">' + t('cancel') + '</button><button class="rc-btn danger" id="rc-cyes">' + t('delete') + '</button>');
      w.querySelector('#rc-cno').onclick = function () { closeModal(); resolve(false); };
      w.querySelector('#rc-cyes').onclick = function () { closeModal(); resolve(true); };
    });
  }
  function badge(status) { return '<span class="rc-badge s-' + status + '">' + t(status) + '</span>'; }

  /* ---------- custom select (progressive enhancement over native <select>) ---------- */
  const CHEV = '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  const CHECK = '<svg class="ck" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  function buildSelect(select) {
    if (!select || select._rcEnh || select.multiple) return;
    select._rcEnh = true;
    const wrap = document.createElement('div');
    wrap.className = 'rc-ss';
    if (select.style.maxWidth) wrap.style.maxWidth = select.style.maxWidth;
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('rc-ss-native');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rc-ss-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span class="lbl"></span>' + CHEV;
    wrap.appendChild(trigger);

    let menu = null, activeIdx = -1, cleanup = null;

    function syncLabel() {
      const o = select.options[select.selectedIndex] || null;
      const lbl = trigger.querySelector('.lbl');
      const txt = o ? (o.textContent || '').trim() : '';
      lbl.textContent = txt || '—';
      lbl.classList.toggle('ph', !o || o.value === '');
    }
    syncLabel();
    select.addEventListener('change', syncLabel);

    function choose(val) {
      if (String(select.value) !== String(val)) {
        select.value = val;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      syncLabel();
    }

    function position() {
      const r = trigger.getBoundingClientRect();
      menu.style.width = r.width + 'px';
      menu.style.left = r.left + 'px';
      const mh = menu.offsetHeight, below = window.innerHeight - r.bottom;
      if (below < mh + 8 && r.top > below) menu.style.top = (r.top - mh - 4) + 'px';
      else menu.style.top = (r.bottom + 4) + 'px';
    }

    function setActive(i) {
      if (!menu) return;
      const items = menu.children;
      if (activeIdx >= 0 && items[activeIdx]) items[activeIdx].classList.remove('active');
      activeIdx = i;
      if (items[i]) { items[i].classList.add('active'); items[i].scrollIntoView({ block: 'nearest' }); }
    }

    function close() {
      if (!menu) return;
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      const m = menu; menu = null;
      m.classList.remove('show');
      if (cleanup) { cleanup(); cleanup = null; }
      setTimeout(function () { m.remove(); }, 150);
    }

    function open() {
      if (menu) { close(); return; }
      menu = document.createElement('div');
      menu.className = 'rc-ss-menu';
      menu.setAttribute('role', 'listbox');
      Array.prototype.forEach.call(select.options, function (opt, i) {
        const o = document.createElement('div');
        o.className = 'rc-ss-opt' + (i === select.selectedIndex ? ' sel' : '') + (opt.value === '' ? ' ph' : '');
        o.setAttribute('role', 'option');
        o.innerHTML = '<span class="tx">' + esc((opt.textContent || '').trim() || '—') + '</span>' + CHECK;
        o.addEventListener('mouseenter', function () { setActive(i); });
        o.addEventListener('click', function () { choose(opt.value); close(); });
        menu.appendChild(o);
      });
      document.body.appendChild(menu);
      wrap.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      position();
      requestAnimationFrame(function () { menu.classList.add('show'); });
      setActive(select.selectedIndex);

      function onDown(e) { if (menu && !menu.contains(e.target) && !wrap.contains(e.target)) close(); }
      function onScroll(e) { if (menu && !menu.contains(e.target)) close(); }
      document.addEventListener('mousedown', onDown, true);
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', close);
      cleanup = function () {
        document.removeEventListener('mousedown', onDown, true);
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', close);
      };
    }

    trigger.addEventListener('click', function (e) { e.preventDefault(); open(); });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!menu) { open(); return; }
        const n = select.options.length;
        setActive(e.key === 'ArrowDown' ? Math.min(n - 1, activeIdx + 1) : Math.max(0, activeIdx - 1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!menu) open(); else if (activeIdx >= 0) { choose(select.options[activeIdx].value); close(); }
      } else if (e.key === 'Escape') { close(); }
    });
  }

  function enhanceSelects(root) { (root || document).querySelectorAll('select.rc-select').forEach(buildSelect); }
  function initSelectEnhancer() {
    enhanceSelects(document);
    const mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes || [], function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches('select.rc-select')) buildSelect(n);
          if (n.querySelectorAll) n.querySelectorAll('select.rc-select').forEach(buildSelect);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSelectEnhancer);
  else initSelectEnhancer();

  window.RC = {
    AREA: AREA, api: api, apiForm: apiForm, token: token, guard: guard,
    t: t, L: L, lang: function () { return LANG; }, applyLang: applyLang, initLang: initLang,
    esc: esc, money: money, date: date, setCurrency: setCurrency, toast: toast,
    modal: modal, closeModal: closeModal, confirm: confirmDialog, badge: badge,
    enhanceSelects: enhanceSelects,
    LOGIN_URL: LOGIN_URL,
  };
})();
