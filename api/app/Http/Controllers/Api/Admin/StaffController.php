<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\HandlesUploads;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Company staff management (tenant-scoped). Admins and staff accounts. */
class StaffController extends Controller
{
    use HandlesUploads;

    public function index()
    {
        return response()->json(
            User::query()->whereIn('role', ['admin', 'staff'])->orderByDesc('id')->get()
                ->map(fn ($u) => $this->payload($u))
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['required', 'email', Rule::unique('users')->where(fn ($q) => $q->where('company_id', $request->user()->company_id))],
            'phone'       => ['nullable', 'string', 'max:40'],
            'title'       => ['nullable', 'string', 'max:120'],
            'role'        => ['nullable', 'in:admin,staff'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(User::PERMISSIONS)],
            'password'    => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name'        => $data['name'],
            'email'       => $data['email'],
            'phone'       => $data['phone'] ?? null,
            'title'       => $data['title'] ?? null,
            'role'        => $data['role'] ?? 'staff',
            'status'      => 'active',
            'permissions' => $data['permissions'] ?? [],
            'password'    => $data['password'],
        ]);

        return response()->json($this->payload($user), 201);
    }

    public function update(Request $request, User $user)
    {
        abort_if(! $user->isStaff(), 404);

        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'phone'       => ['nullable', 'string', 'max:40'],
            'title'       => ['nullable', 'string', 'max:120'],
            'role'        => ['nullable', 'in:admin,staff'],
            'status'      => ['nullable', 'in:active,suspended'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(User::PERMISSIONS)],
            'password'    => ['nullable', 'string', 'min:6'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($this->payload($user->fresh()));
    }

    public function uploadPhoto(Request $request, User $user)
    {
        abort_if(! $user->isStaff(), 404);
        $request->validate(['photo' => ['required', 'image', 'max:4096']]);

        $this->deleteImage($user->photo);
        $user->update(['photo' => $this->storeImage($request->file('photo'), 'staff')]);

        return response()->json($this->payload($user->fresh()));
    }

    public function destroy(Request $request, User $user)
    {
        abort_if(! $user->isStaff(), 404);
        abort_if($user->id === $request->user()->id, 422, 'لا يمكنك حذف حسابك.');

        $this->deleteImage($user->photo);
        $user->delete();

        return response()->json(['message' => 'تم حذف الموظف.']);
    }

    private function payload(User $u): array
    {
        return [
            'id'          => $u->id,
            'name'        => $u->name,
            'email'       => $u->email,
            'phone'       => $u->phone,
            'title'       => $u->title,
            'role'        => $u->role,
            'status'      => $u->status,
            'photo'       => $u->photo,
            'permissions' => $u->role === 'admin' ? User::PERMISSIONS : ($u->permissions ?? []),
        ];
    }
}
