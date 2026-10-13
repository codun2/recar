<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
        ];
    }
}
