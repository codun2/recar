<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A rental company — the tenant of the SaaS platform. Everything else
 * (cars, bookings, invoices, staff, customers) belongs to one company.
 */
#[Fillable([
    'name', 'slug', 'status', 'plan_id', 'trial_ends_at', 'subscription_ends_at',
    'phone', 'email', 'address', 'city', 'logo', 'currency', 'locale',
    'tax_rate', 'invoice_prefix',
    'bank_name', 'account_name', 'iban', 'stc_pay',
    'theme', 'theme_custom',
])]
class Company extends Model
{
    protected function casts(): array
    {
        return [
            'trial_ends_at'        => 'datetime',
            'subscription_ends_at' => 'datetime',
            'tax_rate'             => 'decimal:2',
            'theme_custom'         => 'array',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(CarCategory::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
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
