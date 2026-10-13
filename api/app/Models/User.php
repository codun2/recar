<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['company_id', 'name', 'email', 'phone', 'role', 'status', 'title', 'photo', 'permissions', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use BelongsToCompany, HasApiTokens, HasFactory, Notifiable;

    /** Staff page permissions available in the admin dashboard. */
    public const PERMISSIONS = ['cars', 'categories', 'bookings', 'customers', 'invoices', 'notifications', 'staff', 'settings'];

    /** Roles: super (platform owner), admin (company owner), staff, customer. */
    public function isStaff(): bool
    {
        return in_array($this->role, ['staff', 'admin'], true);
    }

    /** Platform owner — manages companies, lives above tenant data (company_id is null). */
    public function isSuper(): bool
    {
        return $this->role === 'super';
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    /** Company admins can do everything; staff need the page key in their permissions. */
    public function hasPerm(string $key): bool
    {
        if ($this->role === 'admin') {
            return true;
        }

        return $this->isStaff() && in_array($key, $this->permissions ?? [], true);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'permissions'       => 'array',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'created_by');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }

    /** The customer profile linked to this account (for the self-service portal). */
    public function customer()
    {
        return $this->hasOne(Customer::class);
    }
}
