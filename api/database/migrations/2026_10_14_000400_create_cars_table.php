<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedBigInteger('category_id')->nullable()->index();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('make')->nullable();
            $table->string('model')->nullable();
            $table->integer('year')->nullable();
            $table->string('plate_number')->nullable();
            $table->string('color')->nullable();
            // auto | manual
            $table->string('transmission')->default('auto');
            // petrol | diesel | electric | hybrid
            $table->string('fuel')->default('petrol');
            $table->integer('seats')->default(5);
            $table->integer('doors')->default(4);
            $table->decimal('daily_price', 10, 2)->default(0);
            $table->decimal('weekly_price', 10, 2)->nullable();
            $table->decimal('monthly_price', 10, 2)->nullable();
            $table->decimal('deposit', 10, 2)->default(0);
            $table->integer('mileage')->nullable();
            // available | rented | maintenance | hidden
            $table->string('status')->default('available');
            $table->boolean('featured')->default(false);
            $table->string('image')->nullable();
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
