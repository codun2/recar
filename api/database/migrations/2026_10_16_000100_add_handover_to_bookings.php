<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Handover record: when the car is physically handed over to the renter.
            $table->string('handover_by')->nullable()->after('receipt');       // staff who handed it over
            $table->timestamp('handover_at')->nullable()->after('handover_by');
            $table->string('handover_receipt')->nullable()->after('handover_at'); // voucher image/doc
            $table->integer('handover_mileage')->nullable()->after('handover_receipt');
            $table->text('handover_notes')->nullable()->after('handover_mileage');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['handover_by', 'handover_at', 'handover_receipt', 'handover_mileage', 'handover_notes']);
        });
    }
};
