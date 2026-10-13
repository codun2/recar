<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedBigInteger('user_id')->nullable()->index(); // null = company-wide
            $table->string('type')->default('info'); // booking | payment | invoice | car | system | info
            $table->string('title_ar')->nullable();
            $table->string('title_en')->nullable();
            $table->text('body_ar')->nullable();
            $table->text('body_en')->nullable();
            $table->string('link')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
    }
};
