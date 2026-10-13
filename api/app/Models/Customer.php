<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A rental customer record, scoped to a company. Managed by staff, and
 * optionally linked to a self-service User account (user_id).
 */
#[Fillable([
    'company_id', 'user_id', 'name', 'phone', 'email', 'national_id',
    'license_number', 'license_expiry', 'address', 'city', 'notes', 'status',
])]
class Customer extends Model
{
    use BelongsToCompany;

    protected function casts(): array
    {
        return [
            'license_expiry' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
