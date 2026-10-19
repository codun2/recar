<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'is_demo')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_demo')->default(false)->after('status');
            });
        }

        // Seed a read-only demo admin for the "explore the app" button.
        $company = DB::table('companies')->where('slug', 'sayyar-demo')->first()
            ?? DB::table('companies')->orderBy('id')->first();

        if ($company) {
            $demo = DB::table('users')->where('email', 'demo@recar.sa')->first();
            if (! $demo) {
                DB::table('users')->insert([
                    'company_id' => $company->id,
                    'name'       => 'مستخدم تجريبي',
                    'email'      => 'demo@recar.sa',
                    'role'       => 'admin',
                    'status'     => 'active',
                    'is_demo'    => true,
                    'password'   => Hash::make(Str::random(40)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('users')->where('id', $demo->id)->update(['is_demo' => true]);
            }
        }
    }

    public function down(): void
    {
        DB::table('users')->where('email', 'demo@recar.sa')->delete();
        if (Schema::hasColumn('users', 'is_demo')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_demo');
            });
        }
    }
};
