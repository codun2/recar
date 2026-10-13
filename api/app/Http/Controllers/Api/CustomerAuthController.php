<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Customer (end-user) authentication for the self-service portal. A customer
 * belongs to one company (chosen at signup by its slug), and a linked Customer
 * record is created so staff see them in the dashboard.
 */
class CustomerAuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'company'  => ['required', 'string'],      // company slug
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email'],
            'phone'    => ['nullable', 'string', 'max:40'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $company = Company::where('slug', $data['company'])->where('status', 'active')->first();
        if (! $company) {
            throw ValidationException::withMessages(['company' => ['الشركة غير موجودة أو غير مفعّلة.']]);
        }

        $exists = User::query()->where('company_id', $company->id)->where('email', $data['email'])->exists();
        if ($exists) {
            throw ValidationException::withMessages(['email' => ['هذا البريد مسجّل مسبقاً.']]);
        }

        $user = DB::transaction(function () use ($data, $company) {
            $user = User::create([
                'company_id' => $company->id,
                'name'       => $data['name'],
                'email'      => $data['email'],
                'phone'      => $data['phone'] ?? null,
                'role'       => 'customer',
                'status'     => 'active',
                'password'   => $data['password'],
            ]);

            Customer::create([
                'company_id' => $company->id,
                'user_id'    => $user->id,
                'name'       => $data['name'],
                'email'      => $data['email'],
                'phone'      => $data['phone'] ?? null,
                'status'     => 'active',
            ]);

            return $user;
        });

        $token = $user->createToken('customer')->plainTextToken;

        return response()->json([
            'token'   => $token,
            'user'    => $this->payload($user),
            'company' => ['id' => $company->id, 'name' => $company->name, 'slug' => $company->slug, 'currency' => $company->currency],
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'company'  => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $company = Company::where('slug', $data['company'])->first();
        if (! $company) {
            throw ValidationException::withMessages(['company' => ['الشركة غير موجودة.']]);
        }

        $user = User::query()
            ->where('company_id', $company->id)
            ->where('role', 'customer')
            ->where('email', $data['email'])
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['بيانات الدخول غير صحيحة.']]);
        }

        $token = $user->createToken('customer')->plainTextToken;

        return response()->json([
            'token'   => $token,
            'user'    => $this->payload($user),
            'company' => ['id' => $company->id, 'name' => $company->name, 'slug' => $company->slug, 'currency' => $company->currency],
        ]);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $this->payload($request->user())]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج.']);
    }

    private function payload(User $user): array
    {
        return [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role'  => 'customer',
        ];
    }
}
