<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Car;
use App\Models\CarCategory;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Subscription plans (global) ----
        $plans = [
            ['name_ar' => 'تجريبي', 'name_en' => 'Trial', 'slug' => 'trial', 'price_monthly' => 0, 'price_yearly' => 0, 'max_cars' => 5, 'max_staff' => 2, 'features' => ['لوحة تحكم', 'حجوزات', 'فواتير'], 'sort' => 1],
            ['name_ar' => 'أساسي', 'name_en' => 'Basic', 'slug' => 'basic', 'price_monthly' => 199, 'price_yearly' => 1990, 'max_cars' => 25, 'max_staff' => 5, 'features' => ['كل مزايا التجريبي', 'إشعارات', 'تقارير'], 'sort' => 2],
            ['name_ar' => 'احترافي', 'name_en' => 'Pro', 'slug' => 'pro', 'price_monthly' => 499, 'price_yearly' => 4990, 'max_cars' => null, 'max_staff' => null, 'features' => ['سيارات غير محدودة', 'موظفون غير محدودين', 'دعم أولوية'], 'sort' => 3],
        ];
        foreach ($plans as $p) {
            SubscriptionPlan::updateOrCreate(['slug' => $p['slug']], $p);
        }
        $proPlan = SubscriptionPlan::where('slug', 'pro')->first();

        // ---- Platform owner ----
        User::updateOrCreate(
            ['company_id' => null, 'email' => 'super@recar.sa'],
            ['name' => 'مالك المنصّة', 'role' => 'super', 'status' => 'active', 'password' => 'password']
        );

        // ---- Demo rental company ----
        $company = Company::updateOrCreate(
            ['slug' => 'sayyar-demo'],
            [
                'name' => 'سيّار التجريبية', 'status' => 'active', 'plan_id' => $proPlan?->id,
                'phone' => '+966500000000', 'email' => 'info@sayyar.sa', 'city' => 'الرياض',
                'address' => 'طريق الملك فهد', 'currency' => 'SAR', 'locale' => 'ar',
                'tax_rate' => 15, 'invoice_prefix' => 'SYR',
                'subscription_ends_at' => Carbon::now()->addYear(),
            ]
        );

        // Company admin + a staff member
        User::updateOrCreate(
            ['company_id' => $company->id, 'email' => 'admin@sayyar.sa'],
            ['name' => 'مدير سيّار', 'role' => 'admin', 'status' => 'active', 'phone' => '+966500000001', 'password' => 'password']
        );
        User::updateOrCreate(
            ['company_id' => $company->id, 'email' => 'staff@sayyar.sa'],
            ['name' => 'موظف الحجوزات', 'role' => 'staff', 'status' => 'active',
             'permissions' => ['cars', 'bookings', 'customers', 'invoices'], 'password' => 'password']
        );

        // ---- Categories ----
        $cats = [
            ['name_ar' => 'اقتصادية', 'name_en' => 'Economy', 'icon' => 'car', 'sort' => 1],
            ['name_ar' => 'دفع رباعي', 'name_en' => 'SUV', 'icon' => 'suv', 'sort' => 2],
            ['name_ar' => 'فاخرة', 'name_en' => 'Luxury', 'icon' => 'star', 'sort' => 3],
        ];
        $catIds = [];
        foreach ($cats as $c) {
            $cat = CarCategory::updateOrCreate(
                ['company_id' => $company->id, 'name_en' => $c['name_en']],
                array_merge($c, ['company_id' => $company->id])
            );
            $catIds[$c['name_en']] = $cat->id;
        }

        // ---- Cars ----
        $cars = [
            ['name_ar' => 'هيونداي إلنترا', 'name_en' => 'Hyundai Elantra', 'cat' => 'Economy', 'make' => 'Hyundai', 'model' => 'Elantra', 'year' => 2024, 'plate_number' => 'ر ب ح 1234', 'transmission' => 'auto', 'fuel' => 'petrol', 'seats' => 5, 'daily_price' => 120, 'weekly_price' => 700, 'monthly_price' => 2500, 'deposit' => 500, 'featured' => true],
            ['name_ar' => 'تويوتا كامري', 'name_en' => 'Toyota Camry', 'cat' => 'Economy', 'make' => 'Toyota', 'model' => 'Camry', 'year' => 2023, 'plate_number' => 'س ع د 5678', 'transmission' => 'auto', 'fuel' => 'petrol', 'seats' => 5, 'daily_price' => 160, 'weekly_price' => 980, 'monthly_price' => 3600, 'deposit' => 700, 'featured' => true],
            ['name_ar' => 'تويوتا لاند كروزر', 'name_en' => 'Toyota Land Cruiser', 'cat' => 'SUV', 'make' => 'Toyota', 'model' => 'Land Cruiser', 'year' => 2024, 'plate_number' => 'ل ا ن 9012', 'transmission' => 'auto', 'fuel' => 'petrol', 'seats' => 7, 'daily_price' => 450, 'weekly_price' => 2900, 'monthly_price' => 11000, 'deposit' => 2000, 'featured' => true],
            ['name_ar' => 'كيا بيغاس', 'name_en' => 'Kia Pegas', 'cat' => 'Economy', 'make' => 'Kia', 'model' => 'Pegas', 'year' => 2023, 'plate_number' => 'ب ي غ 3456', 'transmission' => 'manual', 'fuel' => 'petrol', 'seats' => 5, 'daily_price' => 90, 'weekly_price' => 560, 'monthly_price' => 2000, 'deposit' => 400],
            ['name_ar' => 'مرسيدس E200', 'name_en' => 'Mercedes E200', 'cat' => 'Luxury', 'make' => 'Mercedes', 'model' => 'E200', 'year' => 2024, 'plate_number' => 'م ر س 7890', 'transmission' => 'auto', 'fuel' => 'petrol', 'seats' => 5, 'daily_price' => 650, 'weekly_price' => 4200, 'monthly_price' => 16000, 'deposit' => 3000, 'featured' => true],
            ['name_ar' => 'هيونداي ستاريا', 'name_en' => 'Hyundai Staria', 'cat' => 'SUV', 'make' => 'Hyundai', 'model' => 'Staria', 'year' => 2023, 'plate_number' => 'س ت ا 2345', 'transmission' => 'auto', 'fuel' => 'diesel', 'seats' => 9, 'daily_price' => 300, 'weekly_price' => 1900, 'monthly_price' => 7200, 'deposit' => 1200],
        ];
        $carModels = [];
        foreach ($cars as $c) {
            $car = Car::updateOrCreate(
                ['company_id' => $company->id, 'name_en' => $c['name_en']],
                [
                    'company_id' => $company->id, 'category_id' => $catIds[$c['cat']] ?? null,
                    'name_ar' => $c['name_ar'], 'name_en' => $c['name_en'],
                    'make' => $c['make'], 'model' => $c['model'], 'year' => $c['year'],
                    'plate_number' => $c['plate_number'], 'transmission' => $c['transmission'],
                    'fuel' => $c['fuel'], 'seats' => $c['seats'], 'daily_price' => $c['daily_price'],
                    'weekly_price' => $c['weekly_price'], 'monthly_price' => $c['monthly_price'],
                    'deposit' => $c['deposit'], 'status' => 'available', 'featured' => $c['featured'] ?? false,
                    'description_ar' => 'سيارة بحالة ممتازة وجاهزة للإيجار.',
                    'description_en' => 'Excellent condition, ready to rent.',
                ]
            );
            $carModels[$c['name_en']] = $car;
        }

        // ---- Customers ----
        $cust1 = Customer::updateOrCreate(
            ['company_id' => $company->id, 'phone' => '+966551112222'],
            ['company_id' => $company->id, 'name' => 'أحمد العتيبي', 'email' => 'ahmed@example.com',
             'national_id' => '1090000001', 'license_number' => 'DL-555', 'city' => 'الرياض', 'status' => 'active']
        );
        Customer::updateOrCreate(
            ['company_id' => $company->id, 'phone' => '+966553334444'],
            ['company_id' => $company->id, 'name' => 'سارة القحطاني', 'email' => 'sara@example.com',
             'national_id' => '1090000002', 'license_number' => 'DL-777', 'city' => 'جدة', 'status' => 'active']
        );

        // A demo customer with a portal login
        $portalUser = User::updateOrCreate(
            ['company_id' => $company->id, 'email' => 'customer@sayyar.sa'],
            ['name' => 'عميل تجريبي', 'role' => 'customer', 'status' => 'active', 'phone' => '+966555556666', 'password' => 'password']
        );
        Customer::updateOrCreate(
            ['company_id' => $company->id, 'user_id' => $portalUser->id],
            ['company_id' => $company->id, 'name' => 'عميل تجريبي', 'email' => 'customer@sayyar.sa', 'phone' => '+966555556666', 'status' => 'active']
        );

        // ---- A sample booking + invoice + payment ----
        $car = $carModels['Hyundai Elantra'];
        $start = Carbon::today();
        $end = Carbon::today()->addDays(3);
        $days = max(1, $start->diffInDays($end));
        $subtotal = (float) $car->daily_price * $days;
        $tax = round($subtotal * 0.15, 2);

        $booking = Booking::updateOrCreate(
            ['company_id' => $company->id, 'reference' => 'BK-00001'],
            [
                'company_id' => $company->id, 'customer_id' => $cust1->id, 'car_id' => $car->id,
                'start_date' => $start->toDateString(), 'end_date' => $end->toDateString(),
                'days' => $days, 'daily_price' => $car->daily_price, 'subtotal' => $subtotal,
                'discount' => 0, 'tax' => $tax, 'total' => $subtotal + $tax, 'deposit' => $car->deposit,
                'status' => 'active', 'pickup_location' => 'فرع الرياض',
            ]
        );
        $car->update(['status' => 'rented']);

        $invoice = Invoice::updateOrCreate(
            ['company_id' => $company->id, 'number' => 'SYR-00001'],
            [
                'company_id' => $company->id, 'customer_id' => $cust1->id, 'booking_id' => $booking->id,
                'issue_date' => $start->toDateString(), 'due_date' => $end->toDateString(),
                'subtotal' => $subtotal, 'discount' => 0, 'tax' => $tax, 'total' => $subtotal + $tax,
                'paid_amount' => 0, 'status' => 'unpaid',
            ]
        );
        if ($invoice->items()->count() === 0) {
            $invoice->items()->create([
                'description' => "{$car->name_ar} — {$days} أيام (BK-00001)",
                'quantity' => $days, 'unit_price' => $car->daily_price, 'amount' => $subtotal,
            ]);
        }
        if ($invoice->payments()->count() === 0) {
            Payment::create([
                'company_id' => $company->id, 'invoice_id' => $invoice->id, 'customer_id' => $cust1->id,
                'amount' => round(($subtotal + $tax) / 2, 2), 'method' => 'cash', 'paid_at' => Carbon::now(),
            ]);
            $invoice->syncPaymentState();
        }
    }
}
