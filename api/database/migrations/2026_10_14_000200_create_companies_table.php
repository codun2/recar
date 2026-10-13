<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            // pending | active | suspended
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('plan_id')->nullable()->index();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('logo')->nullable();
            $table->string('currency', 8)->default('SAR');
            $table->string('locale', 5)->default('ar');
            $table->decimal('tax_rate', 5, 2)->default(0);     // VAT %
            $table->string('invoice_prefix', 12)->default('INV');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
