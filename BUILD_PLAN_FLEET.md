# recar — خطة باقة "التفوّق على فليترالي" (فرع feat-fleet)

تُبنى وتُختبر على stack معزول (docker-compose.test.yml، بورت 8020) ثم cutover لـ main.

## الميزات
1. الفروع + نقل السيارات بين الفروع — `branches`, `cars.branch_id`, `car_transfers`.
2. موديول صيانة — `maintenance_records` (service/oil/repair/inspection/tires…).
3. سجلّ صيانة لكل سيارة + تنبيهات دورية — تواريخ next_due + انتهاء التأمين/الاستمارة/الفحص على `cars`.
4. أضرار ومطالبات — `damages`.
5. داشبورد أغنى — نسبة تشغيل الأسطول، ملخّص أسبوعي، إرجاعات قادمة، تنبيهات صيانة.
6. لوحة أوامر ⌘K + بحث شامل — `GET admin/search`.
7. إشعارات واتساب — روابط wa.me برسائل جاهزة (تأكيد/تذكير/جاهزة) + رقم واتساب الشركة.
8. ديمو للقراءة فقط + دخول Google — حارس كتابة للديمو + سكافولد Google (يحتاج credentials).

## الحالة
- [x] بيئة dev (worktree /opt/recar_dev + stack 8020) جاهزة.
- [ ] Backend: migrations + models + controllers + routes.
- [ ] Frontend: nav + pages + dashboard + palette + whatsapp + demo.
- [ ] اختبار ثم cutover (push feat-fleet→main + deploy).
