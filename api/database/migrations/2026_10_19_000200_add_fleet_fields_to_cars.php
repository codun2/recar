<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->after('company_id')->index();
            // Fleet compliance reminders (dates drive the "due soon" alerts).
            $table->date('insurance_expiry')->nullable()->after('mileage');      // التأمين
            $table->date('registration_expiry')->nullable()->after('insurance_expiry'); // الاستمارة
            $table->date('inspection_expiry')->nullable()->after('registration_expiry'); // الفحص الدوري
            // Next scheduled service (maintenance reminder).
            $table->date('next_service_date')->nullable()->after('inspection_expiry');
            $table->integer('next_service_odometer')->nullable()->after('next_service_date');
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn([
                'branch_id', 'insurance_expiry', 'registration_expiry',
                'inspection_expiry', 'next_service_date', 'next_service_odometer',
            ]);
        });
    }
};
