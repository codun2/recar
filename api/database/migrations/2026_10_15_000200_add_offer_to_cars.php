<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            // Promotional price (lower than daily_price); offer_label e.g. "خصم الصيف".
            $table->decimal('offer_price', 10, 2)->nullable()->after('daily_price');
            $table->string('offer_label')->nullable()->after('offer_price');
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn(['offer_price', 'offer_label']);
        });
    }
};
