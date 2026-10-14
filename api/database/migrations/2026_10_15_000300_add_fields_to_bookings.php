<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('receipt')->nullable()->after('notes');       // uploaded transfer receipt
            $table->decimal('deposit_paid', 10, 2)->default(0)->after('deposit');
            $table->boolean('delivery')->default(false)->after('dropoff_location');
            $table->string('delivery_address')->nullable()->after('delivery');
            $table->decimal('delivery_fee', 10, 2)->default(0)->after('delivery_address');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['receipt', 'deposit_paid', 'delivery', 'delivery_address', 'delivery_fee']);
        });
    }
};
