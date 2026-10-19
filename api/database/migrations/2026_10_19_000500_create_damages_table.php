<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('damages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedBigInteger('car_id')->index();
            $table->unsignedBigInteger('booking_id')->nullable()->index();
            $table->unsignedBigInteger('customer_id')->nullable()->index();
            $table->string('title');
            $table->text('description')->nullable();
            // minor | moderate | major
            $table->string('severity')->default('minor');
            // open | in_repair | resolved
            $table->string('status')->default('open');
            $table->decimal('cost_estimate', 10, 2)->default(0);
            $table->decimal('repair_cost', 10, 2)->default(0);
            $table->json('images')->nullable();
            $table->string('reported_by')->nullable();
            $table->date('occurred_at')->nullable();
            $table->date('resolved_at')->nullable();
            // Insurance claim tracking.
            $table->boolean('insurance_claim')->default(false);
            $table->string('claim_ref')->nullable();
            $table->decimal('claim_amount', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damages');
    }
};
