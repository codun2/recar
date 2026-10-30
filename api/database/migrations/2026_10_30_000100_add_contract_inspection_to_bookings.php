<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // --- Insurance (per rental agreement) ---
            // none | third_party | comprehensive
            $table->string('insurance_type')->nullable()->after('notes');
            $table->string('insurance_company')->nullable()->after('insurance_type');
            $table->string('insurance_policy')->nullable()->after('insurance_company');
            $table->decimal('insurance_excess', 10, 2)->default(0)->after('insurance_policy'); // التحمّل / deductible
            $table->decimal('insurance_fee', 10, 2)->default(0)->after('insurance_excess');     // add-on charged like delivery

            // --- Additional authorised driver ---
            $table->string('second_driver_name')->nullable()->after('insurance_fee');
            $table->string('second_driver_license')->nullable()->after('second_driver_name');

            // --- Mileage policy ---
            $table->integer('km_limit')->nullable()->after('second_driver_license');       // allowed km / day (null = unlimited)
            $table->decimal('extra_km_price', 8, 2)->default(0)->after('km_limit');         // charge per extra km

            // --- Condition / inspection at hand-OUT (delivery to renter) ---
            $table->unsignedTinyInteger('delivered_fuel')->nullable()->after('delivered_mileage'); // 0..8 eighths
            $table->json('delivered_photos')->nullable()->after('delivered_fuel');
            $table->json('delivered_checklist')->nullable()->after('delivered_photos');

            // --- Condition / inspection at hand-IN (return) ---
            $table->unsignedTinyInteger('handover_fuel')->nullable()->after('handover_mileage'); // 0..8 eighths
            $table->json('handover_photos')->nullable()->after('handover_fuel');
            $table->json('handover_checklist')->nullable()->after('handover_photos');

            // --- Contract signature (e-sign) ---
            $table->string('signature')->nullable()->after('handover_checklist'); // customer signature image
            $table->timestamp('contract_signed_at')->nullable()->after('signature');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'insurance_type', 'insurance_company', 'insurance_policy', 'insurance_excess', 'insurance_fee',
                'second_driver_name', 'second_driver_license',
                'km_limit', 'extra_km_price',
                'delivered_fuel', 'delivered_photos', 'delivered_checklist',
                'handover_fuel', 'handover_photos', 'handover_checklist',
                'signature', 'contract_signed_at',
            ]);
        });
    }
};
