<?php

namespace App\Http\Controllers\Api\Super;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Platform-owner management of rental companies (tenants). */
class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $companies = Company::query()
            ->with('plan')
            ->withCount(['cars', 'users', 'bookings'])
            ->when($request->q, fn ($q, $term) => $q->where('name', 'like', "%{$term}%"))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($companies);
    }

    public function show(Company $company)
    {
        $company->load('plan')->loadCount(['cars', 'users', 'bookings', 'customers']);

        return response()->json($company);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'slug'           => ['nullable', 'string', 'max:255'],
            'plan_id'        => ['nullable', 'integer', 'exists:subscription_plans,id'],
            'phone'          => ['nullable', 'string', 'max:40'],
            'email'          => ['nullable', 'email'],
            'city'           => ['nullable', 'string', 'max:120'],
            'currency'       => ['nullable', 'string', 'max:8'],
            'status'         => ['nullable', 'in:pending,active,suspended'],
            // seed admin account
            'admin_name'     => ['required', 'string', 'max:255'],
            'admin_email'    => ['required', 'email'],
            'admin_password' => ['required', 'string', 'min:6'],
        ]);

        $company = DB::transaction(function () use ($data) {
            $company = Company::create([
                'name'     => $data['name'],
                'slug'     => $this->uniqueSlug($data['slug'] ?? $data['name']),
                'plan_id'  => $data['plan_id'] ?? null,
                'phone'    => $data['phone'] ?? null,
                'email'    => $data['email'] ?? null,
                'city'     => $data['city'] ?? null,
                'currency' => $data['currency'] ?? 'SAR',
                'status'   => $data['status'] ?? 'active',
            ]);

            User::create([
                'company_id' => $company->id,
                'name'       => $data['admin_name'],
                'email'      => $data['admin_email'],
                'role'       => 'admin',
                'status'     => 'active',
                'password'   => $data['admin_password'],
            ]);

            return $company;
        });

        return response()->json($company->load('plan'), 201);
    }

    public function update(Request $request, Company $company)
    {
        $data = $request->validate([
            'name'                 => ['sometimes', 'string', 'max:255'],
            'plan_id'              => ['nullable', 'integer', 'exists:subscription_plans,id'],
            'phone'                => ['nullable', 'string', 'max:40'],
            'email'                => ['nullable', 'email'],
            'city'                 => ['nullable', 'string', 'max:120'],
            'address'              => ['nullable', 'string', 'max:255'],
            'currency'             => ['nullable', 'string', 'max:8'],
            'trial_ends_at'        => ['nullable', 'date'],
            'subscription_ends_at' => ['nullable', 'date'],
        ]);

        $company->update($data);

        return response()->json($company->load('plan'));
    }

    public function approve(Company $company)
    {
        $company->update(['status' => 'active']);

        return response()->json($company);
    }

    public function suspend(Company $company)
    {
        $company->update(['status' => 'suspended']);

        return response()->json($company);
    }

    public function activate(Company $company)
    {
        $company->update(['status' => 'active']);

        return response()->json($company);
    }

    public function destroy(Company $company)
    {
        $company->delete();

        return response()->json(['message' => 'تم حذف الشركة.']);
    }

    private function uniqueSlug(string $base): string
    {
        $slug = Str::slug($base) ?: 'company';
        $original = $slug;
        $i = 1;
        while (Company::where('slug', $slug)->exists()) {
            $slug = $original.'-'.$i++;
        }

        return $slug;
    }
}
