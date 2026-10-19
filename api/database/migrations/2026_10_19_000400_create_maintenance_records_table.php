<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedBigInteger('car_id')->index();
            // service | oil | repair | inspection | tires | battery | insurance | other
            $table->string('type')->default('service');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('cost', 10, 2)->default(0);
            $table->integer('odometer')->nullable();
            $table->date('performed_at')->nullable();
            $table->string('performed_by')->nullable();
            $table->string('vendor')->nullable();       // الورشة/المزوّد
            // Next due (drives the recurring reminder, e.g. oil every month).
            $table->date('next_due_date')->nullable();
            $table->integer('next_due_odometer')->nullable();
            // done | scheduled
            $table->string('status')->default('done');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_records');
    }
};
