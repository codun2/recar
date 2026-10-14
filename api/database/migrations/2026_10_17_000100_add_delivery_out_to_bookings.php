<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Delivery-out record: when the car is handed TO the renter (rental starts).
            $table->string('delivered_by')->nullable()->after('handover_notes');
            $table->timestamp('delivered_at')->nullable()->after('delivered_by');
            $table->integer('delivered_mileage')->nullable()->after('delivered_at');
            $table->text('delivered_notes')->nullable()->after('delivered_mileage');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['delivered_by', 'delivered_at', 'delivered_mileage', 'delivered_notes']);
        });
    }
};
