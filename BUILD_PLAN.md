# سيّار (recar) — SaaS Build Plan & Progress

نظام SaaS لتأجير السيارات — Laravel 13 + Sanctum API + واجهات ثابتة (super/admin/account) + MySQL، عربي/إنجليزي RTL. مستنسخ الأعراف من ستاك vet-clinic. يُبنى على فرع `backend` بدون المساس بـ main/الموقع الحي حتى الـ cutover النهائي.

- Domain: recar.smartunita.com — Internal port: **8010** (web) / 8011 (api) / 33010 (db, محلي فقط)
- Tenant = RentalCompany · trait BelongsToCompany · middleware SetCompanyContext
- Areas: `super/` (منصّة) · `admin/` (شركة) · `account/` (زبون)

## Phases
- [x] 0. دراسة القالب + نسخ الهيكل + تنظيف كود vet
- [ ] 1. البنية: tenancy trait + middleware + bootstrap aliases + config + User/Company
- [ ] 2. Migrations لكل الكيانات (companies, plans, categories, cars, customers, bookings, invoices, invoice_items, payments, notifications, settings)
- [ ] 3. Models + العلاقات
- [ ] 4. Controllers — Super (auth, companies, plans, dashboard)
- [ ] 5. Controllers — Admin (dashboard, cars, categories, customers, bookings, invoices, payments, notifications, staff, settings)
- [ ] 6. Controllers — Account/Public (auth, browse cars, bookings, invoices, company registration)
- [ ] 7. routes/api.php
- [ ] 8. Seeders (خطة + منصّة + شركة تجريبية ببيانات)
- [ ] 9. Frontend — index.html (تسويق) يبقى + تحديث روابط
- [ ] 10. Frontend — admin/ (dashboard + كل الصفحات) ثنائي اللغة
- [ ] 11. Frontend — super/ + account/
- [ ] 12. Infra — docker-compose (dev+prod) + Dockerfile + .nginx + .env
- [ ] 13. بناء الحاوية والاختبار على بورت مؤقت + migrate/seed
- [ ] 14. deploy.sh (docker) + تحديث PORTS.md (نسخ محلية جاهزة للـ cutover)
- [ ] 15. Cutover: merge→main + host deploy.sh + host nginx vhost + reload

## Conventions
- الصلاحيات (staff perms): cars, categories, bookings, customers, invoices, notifications, staff, settings
- الأدوار: super / admin / staff / customer
- الحقول ثنائية اللغة: name_ar/name_en, description_ar/description_en
