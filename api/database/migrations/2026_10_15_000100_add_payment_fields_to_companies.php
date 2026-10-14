<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('logo');
            $table->string('account_name')->nullable()->after('bank_name');
            $table->string('iban')->nullable()->after('account_name');
            $table->string('stc_pay')->nullable()->after('iban');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'account_name', 'iban', 'stc_pay']);
        });
    }
};
