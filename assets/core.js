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
      tax: 'الضريبة', pending: 'قيد الانتظار', confirmed: 'مؤكّد', active: 'نشِط', completed: 'تم الانتهاء',
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
      offer: 'عرض', offer_price: 'سعر العرض', offer_label: 'عنوان العرض', images: 'الصور', max_images: 'حتى 15 صورة',
      gallery: 'المعرض', main_image: 'الصورة الرئيسية', details: 'التفاصيل', view_details: 'عرض التفاصيل',
      accounts: 'المالية', financial: 'الوضع المالي', receivables: 'المستحقات', deposits_held: 'تأمينات محتجزة',
      invoiced: 'إجمالي الفواتير', collected: 'المحصّل', search_all: 'ابحث في كل شيء…', open_search: 'بحث', whatsapp: 'واتساب', no_phone: 'لا يوجد رقم هاتف', by_method: 'حسب طريقة الدفع', outstanding: 'فواتير غير محصّلة',
      delivery: 'توصيل', delivery_address: 'عنوان التوصيل', delivery_fee: 'رسوم التوصيل', request_delivery: 'طلب توصيل',
      receipt: 'الإيصال', upload_receipt: 'رفع الإيصال', pay: 'دفع', pay_now: 'ادفع الآن', pay_deposit: 'دفع دفعة',
      payment_details: 'بيانات الدفع', bank_name: 'اسم البنك', account_name: 'اسم الحساب', iban: 'الآيبان', stc_pay: 'STC Pay',
      full_payment_required: 'التوصيل يتطلب سداد كامل المبلغ', confirm_booking: 'تأكيد الحجز', awaiting_confirmation: 'بانتظار التأكيد',
      create_invoice: 'إنشاء فاتورة', view_invoice: 'عرض الفاتورة', paid: 'مدفوع', inventory: 'المخزون', transfer_to: 'حوّل إلى',
      rental_history: 'سجلّ التأجير', times_rented: 'مرات التأجير', total_days: 'إجمالي الأيام', no_history: 'لم تُؤجَّر بعد', rented_by: 'المستأجر', period: 'الفترة',
      confirm_handover: 'تأكيد استلام السيارة', handover: 'الاستلام', handover_by: 'اسم الموظف المستلِم', handover_date: 'تاريخ الاستلام', mileage: 'قراءة العدّاد', voucher: 'الوصل', handover_done: 'تم الاستلام', rented_now: 'هذه السيارة مؤجّرة حالياً',
      car_now_available: 'السيارة أصبحت متاحة للتأجير', settle_remaining: 'تخليص المبلغ المتبقّي وإضافته للفاتورة', basic_info: 'البيانات الأساسية', account_info: 'بيانات الحساب', job_title: 'المسمّى الوظيفي',
      deliver_car: 'تسليم السيارة للعميل', delivered_by: 'اسم الموظف المسلِّم', delivered_date: 'تاريخ ووقت التسليم', ready_to_deliver: 'السيارة محجوزة — جاهزة للتسليم', delivered_done: 'تم التسليم للعميل', delivery_info: 'بيانات التسليم', return_info: 'بيانات الاستلام',
      appearance: 'المظهر', theme_template: 'قالب المعرض', theme_hint: 'اختر مظهراً كاملاً لواجهتك بضغطة — يشمل الألوان والزوايا والخط.', theme_active: 'المُفعّل',
      theme_gold: 'ذهبي فاخر', theme_royal: 'أزرق ملكي', theme_mint: 'أخضر عصري', theme_minimal: 'أبيض مينيمال', theme_vivid: 'جريء ملوّن',
      advanced_custom: 'تخصيص متقدّم', advanced_hint: 'لمساً نهائياً: عدّل الألوان والزوايا والخط، أو أضف CSS خاص. اتركه فارغاً لاستخدام القالب كما هو.',
      accent_color: 'اللون الأساسي', accent_dark_color: 'درجة أغمق', sidebar_color: 'لون الشريط الجانبي', on_accent_color: 'لون النص فوق اللون الأساسي',
      corner_radius: 'انحناء الزوايا', font_family: 'الخط', custom_css: 'CSS مخصّص', reset_custom: 'تصفير التخصيص', font_default: 'الافتراضي (حسب القالب)',
      branches: 'الفروع', new_branch: 'فرع جديد', branch: 'الفرع', primary_branch: 'رئيسي', current_branch: 'الفرع الحالي', transfer: 'نقل', transfer_car: 'نقل السيارة', transfer_to: 'نقل إلى فرع', transfer_done: 'تم النقل', no_branch: 'بدون فرع',
      maintenance_log: 'الصيانة', new_maintenance: 'سجلّ صيانة', type: 'النوع', svc_service: 'صيانة دورية', svc_oil: 'تغيير زيت', svc_repair: 'إصلاح', svc_inspection: 'فحص', svc_tires: 'إطارات', svc_battery: 'بطارية', svc_insurance: 'تأمين', svc_other: 'أخرى',
      cost: 'التكلفة', odometer: 'قراءة العدّاد', vendor: 'الورشة/المزوّد', performed_at: 'تاريخ التنفيذ', performed_by: 'نفّذها', next_due_date: 'الاستحقاق القادم', next_due_odometer: 'العدّاد القادم', scheduled: 'مجدولة', done_m: 'منجزة', service_log: 'سجلّ الصيانة',
      damages: 'الأضرار والمطالبات', new_damage: 'تسجيل ضرر', severity: 'الخطورة', sev_minor: 'طفيف', sev_moderate: 'متوسّط', sev_major: 'كبير', st_open: 'مفتوح', st_in_repair: 'قيد الإصلاح', st_resolved: 'مُسوّى', cost_estimate: 'تقدير التكلفة', repair_cost: 'تكلفة الإصلاح', reported_by: 'المُبلِّغ', occurred_at: 'تاريخ الحدوث', insurance_claim: 'مطالبة تأمين', claim_ref: 'رقم المطالبة', claim_amount: 'مبلغ المطالبة', mark_resolved: 'تحديد كمُسوّى', photos: 'صور', svc_title: 'العنوان', details: 'تفاصيل',
      insurance_expiry: 'انتهاء التأمين', registration_expiry: 'انتهاء الاستمارة', inspection_expiry: 'انتهاء الفحص الدوري', next_service: 'الصيانة القادمة', fleet_reminders: 'تنبيهات الأسطول', overdue: 'متأخّر', no_reminders: 'لا تنبيهات قريبة', fleet_compliance: 'تواريخ الأسطول (تأمين/استمارة/فحص)', utilization: 'نسبة تشغيل الأسطول', this_week: 'هذا الأسبوع', delivered_count: 'سُلّمت', returned_count: 'أُرجعت', upcoming_returns: 'إرجاعات قادمة', vs_last_week: 'مقابل الأسبوع السابق', collected: 'المحصّل', search_all: 'ابحث في كل شيء…', open_search: 'بحث', whatsapp: 'واتساب', no_phone: 'لا يوجد رقم هاتف',
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
      tax: 'Tax', pending: 'Pending', confirmed: 'Confirmed', active: 'Active', completed: 'Finished',
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
      offer: 'Offer', offer_price: 'Offer price', offer_label: 'Offer label', images: 'Images', max_images: 'up to 15 images',
      gallery: 'Gallery', main_image: 'Main image', details: 'Details', view_details: 'View details',
      accounts: 'Finance', financial: 'Financial status', receivables: 'Receivables', deposits_held: 'Deposits held',
      invoiced: 'Total invoiced', collected: 'Collected', search_all: 'Search everything…', open_search: 'Search', whatsapp: 'WhatsApp', no_phone: 'No phone number', by_method: 'By method', outstanding: 'Outstanding invoices',
      delivery: 'Delivery', delivery_address: 'Delivery address', delivery_fee: 'Delivery fee', request_delivery: 'Request delivery',
      receipt: 'Receipt', upload_receipt: 'Upload receipt', pay: 'Pay', pay_now: 'Pay now', pay_deposit: 'Pay deposit',
      payment_details: 'Payment details', bank_name: 'Bank name', account_name: 'Account name', iban: 'IBAN', stc_pay: 'STC Pay',
      full_payment_required: 'Delivery requires full payment', confirm_booking: 'Confirm booking', awaiting_confirmation: 'Awaiting confirmation',
      create_invoice: 'Create invoice', view_invoice: 'View invoice', paid: 'Paid', inventory: 'Inventory', transfer_to: 'Transfer to',
      rental_history: 'Rental history', times_rented: 'Times rented', total_days: 'Total days', no_history: 'Not rented yet', rented_by: 'Rented by', period: 'Period',
      confirm_handover: 'Confirm car return', handover: 'Return', handover_by: 'Received by', handover_date: 'Return date', mileage: 'Odometer', voucher: 'Voucher', handover_done: 'Returned', rented_now: 'This car is currently rented',
      car_now_available: 'The car is now available for rent', settle_remaining: 'Settle the remaining balance (add to invoice)', basic_info: 'Basic info', account_info: 'Account', job_title: 'Job title',
      deliver_car: 'Deliver car to renter', delivered_by: 'Delivered by', delivered_date: 'Delivery date/time', ready_to_deliver: 'Reserved — ready to deliver', delivered_done: 'Delivered', delivery_info: 'Delivery details', return_info: 'Return details',
      appearance: 'Appearance', theme_template: 'Storefront template', theme_hint: 'Pick a complete look for your storefront in one click — colors, corners and font.', theme_active: 'Active',
      theme_gold: 'Luxury Gold', theme_royal: 'Royal Blue', theme_mint: 'Modern Mint', theme_minimal: 'Minimal White', theme_vivid: 'Bold Vivid',
      advanced_custom: 'Advanced customization', advanced_hint: 'The finishing touch: tweak colors, corners and font, or add custom CSS. Leave empty to use the template as-is.',
      accent_color: 'Accent color', accent_dark_color: 'Darker shade', sidebar_color: 'Sidebar color', on_accent_color: 'Text on accent',
      corner_radius: 'Corner radius', font_family: 'Font', custom_css: 'Custom CSS', reset_custom: 'Reset customization', font_default: 'Default (from template)',
      branches: 'Branches', new_branch: 'New branch', branch: 'Branch', primary_branch: 'Primary', current_branch: 'Current branch', transfer: 'Transfer', transfer_car: 'Transfer car', transfer_to: 'Transfer to branch', transfer_done: 'Transferred', no_branch: 'No branch',
      maintenance_log: 'Maintenance', new_maintenance: 'Service entry', type: 'Type', svc_service: 'Service', svc_oil: 'Oil change', svc_repair: 'Repair', svc_inspection: 'Inspection', svc_tires: 'Tires', svc_battery: 'Battery', svc_insurance: 'Insurance', svc_other: 'Other',
      cost: 'Cost', odometer: 'Odometer', vendor: 'Vendor/garage', performed_at: 'Date', performed_by: 'Performed by', next_due_date: 'Next due', next_due_odometer: 'Next odometer', scheduled: 'Scheduled', done_m: 'Done', service_log: 'Service log',
      damages: 'Damages & claims', new_damage: 'Report damage', severity: 'Severity', sev_minor: 'Minor', sev_moderate: 'Moderate', sev_major: 'Major', st_open: 'Open', st_in_repair: 'In repair', st_resolved: 'Resolved', cost_estimate: 'Cost estimate', repair_cost: 'Repair cost', reported_by: 'Reported by', occurred_at: 'Occurred on', insurance_claim: 'Insurance claim', claim_ref: 'Claim ref', claim_amount: 'Claim amount', mark_resolved: 'Mark resolved', photos: 'Photos', svc_title: 'Title', details: 'Details',
      insurance_expiry: 'Insurance expiry', registration_expiry: 'Registration expiry', inspection_expiry: 'Inspection expiry', next_service: 'Next service', fleet_reminders: 'Fleet reminders', overdue: 'Overdue', no_reminders: 'No upcoming reminders', fleet_compliance: 'Fleet dates (insurance/registration/inspection)', utilization: 'Fleet utilization', this_week: 'This week', delivered_count: 'Delivered', returned_count: 'Returned', upcoming_returns: 'Upcoming returns', vs_last_week: 'vs last week', collected: 'Collected', search_all: 'Search everything…', open_search: 'Search', whatsapp: 'WhatsApp', no_phone: 'No phone number',
    },
  };

  let LANG = localStorage.getItem('recar_lang') || 'ar';
  function t(k) { return (DICT[LANG] && DICT[LANG][k]) || (DICT.ar[k]) || k; }

  /* ---------- theme (light default; per-browser choice) ---------- */
  let THEME = (function () { try { return localStorage.getItem('recar_theme') || 'light'; } catch (e) { return 'light'; } })();
  // Apply immediately to avoid a flash of the wrong theme.
  try { document.documentElement.setAttribute('data-theme', THEME); } catch (e) {}
  function applyTheme(th) {
    THEME = th; try { localStorage.setItem('recar_theme', th); } catch (e) {}
    document.documentElement.setAttribute('data-theme', th);
    document.querySelectorAll('.rc-theme-opt').forEach(function (o) { o.classList.toggle('on', o.dataset.theme === th); });
  }
  function initTheme() {
    applyTheme(THEME);
    // Inject a light/dark toggle into the topbar (once), next to the lang switch.
    const lang = document.querySelector('.rc-top .rc-lang') || document.querySelector('.rc-auth .rc-lang');
    if (lang && !document.querySelector('.rc-theme')) {
      const box = document.createElement('div');
      box.className = 'rc-theme';
      box.innerHTML = '<button class="rc-theme-opt" data-theme="light" title="فاتح">' + icon('sun', 16) + '</button><button class="rc-theme-opt" data-theme="dark" title="غامق">' + icon('moon', 16) + '</button>';
      lang.parentNode.insertBefore(box, lang);
      box.querySelectorAll('.rc-theme-opt').forEach(function (o) { o.addEventListener('click', function () { applyTheme(o.dataset.theme); }); });
    }
    document.querySelectorAll('.rc-theme-opt').forEach(function (o) { o.classList.toggle('on', o.dataset.theme === THEME); });
  }

  /* ---------- preset (company brand theme; Level 2 presets + Level 3 custom) ---------- */
  const PRESETS = ['gold', 'royal', 'mint', 'minimal', 'vivid'];
  let PRESET = (function () { try { return localStorage.getItem('recar_preset') || 'gold'; } catch (e) { return 'gold'; } })();
  let PRESET_CUSTOM = (function () { try { return JSON.parse(localStorage.getItem('recar_preset_custom') || 'null'); } catch (e) { return null; } })();
  if (PRESETS.indexOf(PRESET) < 0) PRESET = 'gold';
  function hexToRgb(h) {
    h = String(h || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16);
  }
  const CUSTOM_VARS = ['--amber', '--amber-dark', '--navy', '--navy-2', '--on-accent', '--radius', '--accent-rgb', '--font'];
  function applyCustomTokens(custom) {
    const root = document.documentElement;
    CUSTOM_VARS.forEach(function (v) { root.style.removeProperty(v); });
    const old = document.getElementById('rc-custom-css'); if (old) old.remove();
    if (!custom || typeof custom !== 'object') return;
    if (custom.accent) { root.style.setProperty('--amber', custom.accent); const rgb = hexToRgb(custom.accent); if (rgb) root.style.setProperty('--accent-rgb', rgb); }
    if (custom.accent_dark) root.style.setProperty('--amber-dark', custom.accent_dark);
    if (custom.on_accent) root.style.setProperty('--on-accent', custom.on_accent);
    if (custom.sidebar) { root.style.setProperty('--navy', custom.sidebar); root.style.setProperty('--navy-2', custom.sidebar); }
    if (custom.radius) root.style.setProperty('--radius', /^\d+$/.test(custom.radius) ? custom.radius + 'px' : custom.radius);
    if (custom.font) root.style.setProperty('--font', custom.font);
    if (custom.css) { const st = document.createElement('style'); st.id = 'rc-custom-css'; st.textContent = String(custom.css).replace(/<\/?(style|script)[^>]*>/gi, ''); (document.head || document.documentElement).appendChild(st); }
  }
  function applyPreset(name, custom) {
    PRESET = PRESETS.indexOf(name) >= 0 ? name : 'gold';
    PRESET_CUSTOM = (custom && typeof custom === 'object') ? custom : null;
    try { localStorage.setItem('recar_preset', PRESET); localStorage.setItem('recar_preset_custom', JSON.stringify(PRESET_CUSTOM)); } catch (e) {}
    document.documentElement.setAttribute('data-preset', PRESET);
    applyCustomTokens(PRESET_CUSTOM);
  }
  // Apply cached preset immediately (before paint) to avoid a flash of the default brand.
  try { document.documentElement.setAttribute('data-preset', PRESET); applyCustomTokens(PRESET_CUSTOM); } catch (e) {}

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
    initTheme();
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
  // Numbers always use Latin (English) digits, in both languages.
  function money(n) { const v = Number(n || 0); return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ' + CURRENCY; }
  function date(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString(LANG === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }); }
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

  /* ---------- SVG icon set (outline, currentColor) ---------- */
  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    cars: '<path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 13h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1"/><path d="M5 18H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1"/><circle cx="7.5" cy="17.5" r="1.6"/><circle cx="16.5" cy="17.5" r="1.6"/>',
    categories: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h5a2 2 0 0 1 1.4.6l8.4 8.4a1.4 1.4 0 0 1 0 2z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    bookings: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 2.5v4M16 2.5v4"/><path d="M8 13h3M8 16.5h6"/>',
    customers: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M17.5 13.6A5.5 5.5 0 0 1 20.5 18.5"/>',
    invoices: '<path d="M6 2.5h9l4 4V21a.8.8 0 0 1-1.2.7L16 20.5l-2 1.2-2-1.2-2 1.2-2-1.2-1.8 1.2A.8.8 0 0 1 5 21V3.5a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 11.5h6M9 15h4"/>',
    notifications: '<path d="M18 8a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 14 18 8z"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
    staff: '<circle cx="12" cy="7.5" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l1.7-1.3-1.8-3.1-2 .8a7.6 7.6 0 0 0-2.6-1.5l-.3-2.1H8.6l-.3 2.1a7.6 7.6 0 0 0-2.6 1.5l-2-.8-1.8 3.1 1.7 1.3a7.9 7.9 0 0 0 0 3l-1.7 1.3 1.8 3.1 2-.8a7.6 7.6 0 0 0 2.6 1.5l.3 2.1h3.8l.3-2.1a7.6 7.6 0 0 0 2.6-1.5l2 .8 1.8-3.1z"/>',
    accounts: '<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1"/><rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M16 12.5h2"/><circle cx="16.5" cy="13.5" r="0.3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    edit: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17z"/><path d="M14.5 6.5l3 3"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.8"/><path d="M4 18l5-5 4 3 3-3 4 4"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><polyline points="21 3 21 8 16 8"/>',
    companies: '<rect x="4" y="3" width="10" height="18" rx="1.5"/><path d="M14 8h5a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-5"/><path d="M7.5 7h3M7.5 10.5h3M7.5 14h3"/>',
    plans: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/><path d="M6 14.5h4"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>',
    receipt: '<path d="M5 2.5l1.5 1.2L8 2.5l1.5 1.2L11 2.5l1.5 1.2L14 2.5v18l-1.5-1.2L11 20.5l-1.5-1.2L8 20.5l-1.5-1.2L5 20.5z" transform="translate(2.5 0)"/><path d="M9 8h6M9 11.5h6"/>',
    offer: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h5a2 2 0 0 1 1.4.6l8.4 8.4a1.4 1.4 0 0 1 0 2z"/><circle cx="7.5" cy="7.5" r="1.2"/><path d="M9 15l6-6" stroke-width="1.6"/>',
    delivery: '<rect x="1.5" y="6" width="12" height="9" rx="1.5"/><path d="M13.5 9h4l3 3v3h-7z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    bank: '<path d="M4 10h16"/><path d="M4 10l8-6 8 6"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8"/><path d="M3 20h18"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="16.5" cy="14" r="1.3"/>',
    car: '<path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 13h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1"/><path d="M5 18H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1"/><circle cx="7.5" cy="17.5" r="1.6"/><circle cx="16.5" cy="17.5" r="1.6"/>',
    star: '<polygon points="12 3 14.8 8.6 21 9.5 16.5 13.9 17.6 20 12 17.1 6.4 20 7.5 13.9 3 9.5 9.2 8.6"/>',
    upload: '<path d="M12 15V4"/><polyline points="7 9 12 4 17 9"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    phone: '<path d="M6.5 3h3l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 4.5 5a2 2 0 0 1 2-2z"/>',
    history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    wrench: '<path d="M14.6 6.1a4 4 0 0 0-5.2 5l-5.6 5.6a1.5 1.5 0 0 0 0 2.1l1.4 1.4a1.5 1.5 0 0 0 2.1 0l5.6-5.6a4 4 0 0 0 5-5.2l-2.6 2.6-2.1-.5-.5-2.1z"/>',
    branch: '<path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.3"/>',
    damage: '<path d="M12 3l7 3v5c0 4.6-3.1 7.7-7 9-3.9-1.3-7-4.4-7-9V6z"/><path d="M12 8.2v4.2M12 15.4v.2"/>',
    transfer: '<path d="M4 8h13l-3.2-3.2"/><path d="M20 16H7l3.2 3.2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    whatsapp: '<path d="M4 20.5l1.4-4.1a7.5 7.5 0 1 1 2.7 2.7z"/><path d="M9 9.2c.2-.6.5-.6.9-.6.3 0 .6 0 .8.5l.5 1.1c.1.3 0 .5-.1.7l-.4.5c-.1.2-.2.3 0 .6a5 5 0 0 0 2.2 2c.3.1.4.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.1.6c.4.2.5.4.5.7 0 .5-.5 1.2-1 1.3-.5.2-1.2.2-3-.6a7.4 7.4 0 0 1-3.3-3.2c-.6-1.2-.6-1.8-.4-2.3z"/>',
  };
  function icon(name, size) {
    const s = size || 20;
    return '<svg class="rc-ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------- WhatsApp click-to-chat ---------- */
  function wa(phone, msg) {
    let p = String(phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^00/, '');
    if (!p) { toast(t('no_phone') || 'لا يوجد رقم', 'err'); return; }
    window.open('https://wa.me/' + p + (msg ? '?text=' + encodeURIComponent(msg) : ''), '_blank');
  }

  /* ---------- command palette (⌘K / Ctrl+K global search) ---------- */
  function initPalette() {
    if (document.getElementById('rc-cmdk')) return;
    const ov = document.createElement('div');
    ov.id = 'rc-cmdk'; ov.className = 'rc-cmdk';
    ov.innerHTML = '<div class="rc-cmdk-box"><div class="rc-cmdk-top">' + icon('search', 18) + '<input id="rc-cmdk-in" placeholder="' + t('search_all') + '" autocomplete="off"><kbd>Esc</kbd></div><div class="rc-cmdk-res" id="rc-cmdk-res"></div></div>';
    document.body.appendChild(ov);
    const input = ov.querySelector('#rc-cmdk-in'), res = ov.querySelector('#rc-cmdk-res');
    const GROUPS = [['cars', 'car'], ['customers', 'customers'], ['bookings', 'bookings'], ['invoices', 'invoices']];
    let items = [], active = -1, seq = 0, timer;

    function open() { ov.classList.add('show'); input.value = ''; res.innerHTML = ''; items = []; active = -1; setTimeout(function () { input.focus(); }, 30); }
    function close() { ov.classList.remove('show'); }
    function paint() { res.querySelectorAll('.rc-cmdk-it').forEach(function (el) { el.classList.toggle('on', +el.dataset.i === active); const on = +el.dataset.i === active; if (on) el.scrollIntoView({ block: 'nearest' }); }); }
    function go(i) { const it = items[i]; if (it && it.href) { close(); location.href = it.href; } }
    function render(groups) {
      items = []; let h = '';
      GROUPS.forEach(function (g) {
        const arr = groups[g[0]] || []; if (!arr.length) return;
        h += '<div class="rc-cmdk-grp">' + t(g[0]) + '</div>';
        arr.forEach(function (it) {
          const idx = items.length; items.push(it);
          const label = it.label || (LANG === 'en' ? it.en : it.ar) || it.ar || it.en || '';
          h += '<div class="rc-cmdk-it" data-i="' + idx + '">' + icon(g[1], 16) + '<div class="tx"><b>' + esc(label) + '</b>' + (it.sub ? '<span>' + esc(it.sub) + '</span>' : '') + '</div></div>';
        });
      });
      res.innerHTML = h || '<div class="rc-cmdk-empty">' + t('no_data') + '</div>';
      active = items.length ? 0 : -1; paint();
      res.querySelectorAll('.rc-cmdk-it').forEach(function (el) { el.onmouseenter = function () { active = +el.dataset.i; paint(); }; el.onclick = function () { go(+el.dataset.i); }; });
    }
    input.addEventListener('input', function () {
      const q = input.value.trim(); clearTimeout(timer);
      if (!q) { res.innerHTML = ''; items = []; return; }
      timer = setTimeout(function () {
        const my = ++seq;
        api('GET', '/admin/search?q=' + encodeURIComponent(q)).then(function (d) { if (my === seq) render(d); }).catch(function () {});
      }, 180);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(items.length - 1, active + 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(active); }
      else if (e.key === 'Escape') { close(); }
    });
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); ov.classList.contains('show') ? close() : open(); }
    });
    // Topbar trigger (also serves touch devices without a keyboard).
    const top = document.querySelector('.rc-top .sp');
    if (top && !document.querySelector('.rc-cmdk-btn')) {
      const btn = document.createElement('button');
      btn.className = 'rc-cmdk-btn'; btn.type = 'button';
      btn.innerHTML = icon('search', 15) + '<span>' + t('open_search') + '</span><kbd>⌘K</kbd>';
      btn.onclick = open;
      top.parentNode.insertBefore(btn, top.nextSibling);
    }
    RC._openPalette = open;
  }

  window.RC = {
    AREA: AREA, api: api, apiForm: apiForm, token: token, guard: guard,
    t: t, L: L, lang: function () { return LANG; }, applyLang: applyLang, initLang: initLang,
    esc: esc, money: money, date: date, setCurrency: setCurrency, toast: toast,
    modal: modal, closeModal: closeModal, confirm: confirmDialog, badge: badge,
    enhanceSelects: enhanceSelects, icon: icon, applyTheme: applyTheme, initTheme: initTheme,
    applyPreset: applyPreset, PRESETS: PRESETS, initPalette: initPalette, wa: wa,
    LOGIN_URL: LOGIN_URL,
  };
})();
