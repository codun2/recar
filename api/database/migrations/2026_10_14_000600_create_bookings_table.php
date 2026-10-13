<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedBigInteger('customer_id')->nullable()->index();
            $table->unsignedBigInteger('car_id')->nullable()->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->string('reference')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('days')->default(1);
            $table->decimal('daily_price', 10, 2)->default(0);
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->decimal('deposit', 10, 2)->default(0);
            // pending | confirmed | active | completed | cancelled
            $table->string('status')->default('pending');
            $table->string('pickup_location')->nullable();
            $table->string('dropoff_location')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
