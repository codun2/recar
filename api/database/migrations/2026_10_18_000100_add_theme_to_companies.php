<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            // Chosen preset key (gold|royal|mint|minimal|vivid). Level 2.
            $table->string('theme', 24)->default('gold')->after('locale');
            // Advanced per-token overrides (Level 3): {accent, accent_dark, sidebar,
            // on_accent, radius, font, css}. Null = use the preset as-is.
            $table->json('theme_custom')->nullable()->after('theme');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['theme', 'theme_custom']);
        });
    }
};
