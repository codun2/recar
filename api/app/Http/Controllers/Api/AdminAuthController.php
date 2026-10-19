<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

/**
 * Company staff/admin authentication. Email+password login; an optional
 * `company` slug disambiguates when the same email exists in several companies.
 */
class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
            'company'  => ['nullable', 'string'],
        ]);

        $query = User::query()
            ->whereIn('role', ['admin', 'staff'])
            ->where('email', $data['email']);

        if (! empty($data['company'])) {
            $query->whereHas('company', fn ($q) => $q->where('slug', $data['company']));
        }

        $user = $query->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['بيانات الدخول غير صحيحة.']]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages(['email' => ['هذا الحساب موقوف.']]);
        }

        $company = $user->company;
        if (! $company || ! $company->isActive()) {
            throw ValidationException::withMessages(['email' => ['اشتراك الشركة غير مفعّل حالياً.']]);
        }

        $token = $user->createToken('admin')->plainTextToken;

        return response()->json([
            'token'   => $token,
            'user'    => $this->userPayload($user),
            'company' => $company,
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user'    => $this->userPayload($user),
            'company' => $user->company,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج.']);
    }

    /** Unread counts for the sidebar badges. */
    public function badges(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'notifications' => AppNotification::query()
                ->whereNull('read_at')
                ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $user->id))
                ->count(),
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'role'        => $user->role,
            'title'       => $user->title,
            'photo'       => $user->photo,
            'permissions' => $user->role === 'admin' ? User::PERMISSIONS : ($user->permissions ?? []),
            'is_demo'     => (bool) $user->is_demo,
        ];
    }

    /**
     * Log into the public read-only demo account (no password) — powers the
     * "explore the app" button. Writes are blocked by the `notdemo` middleware.
     */
    public function demoLogin()
    {
        $user = User::where('is_demo', true)->whereIn('role', ['admin', 'staff'])->first();

        if (! $user) {
            return response()->json(['message' => 'العرض التجريبي غير متاح حالياً.'], 404);
        }

        $company = $user->company;
        if (! $company) {
            return response()->json(['message' => 'العرض التجريبي غير متاح حالياً.'], 404);
        }

        $token = $user->createToken('demo')->plainTextToken;

        return response()->json([
            'token'   => $token,
            'user'    => $this->userPayload($user),
            'company' => $company,
            'demo'    => true,
        ]);
    }

    /**
     * Google Sign-In. Verifies a GIS `credential` (id_token) against Google and
     * logs in the matching staff/admin. Activate by setting GOOGLE_CLIENT_ID in
     * the API env; the login page shows the button only when it is configured.
     */
    public function google(Request $request)
    {
        $clientId = config('services.google.client_id') ?: env('GOOGLE_CLIENT_ID');
        if (! $clientId) {
            return response()->json(['message' => 'دخول Google غير مُفعّل بعد.', 'configured' => false], 501);
        }

        $data = $request->validate([
            'credential' => ['required', 'string'],
            'company'    => ['nullable', 'string'],
        ]);

        $resp = Http::get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $data['credential']]);
        if (! $resp->ok()) {
            throw ValidationException::withMessages(['email' => ['تعذّر التحقّق من حساب Google.']]);
        }
        $p = $resp->json();
        if (($p['aud'] ?? null) !== $clientId || empty($p['email_verified']) || empty($p['email'])) {
            throw ValidationException::withMessages(['email' => ['حساب Google غير صالح.']]);
        }

        $query = User::query()->whereIn('role', ['admin', 'staff'])->where('email', $p['email']);
        if (! empty($data['company'])) {
            $query->whereHas('company', fn ($q) => $q->where('slug', $data['company']));
        }
        $user = $query->first();

        if (! $user || $user->status !== 'active' || ! $user->company || ! $user->company->isActive()) {
            throw ValidationException::withMessages(['email' => ['لا يوجد حساب فعّال بهذا البريد.']]);
        }

        return response()->json([
            'token'   => $user->createToken('admin-google')->plainTextToken,
            'user'    => $this->userPayload($user),
            'company' => $user->company,
        ]);
    }
}
