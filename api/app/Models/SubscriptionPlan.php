<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A platform subscription plan (managed by the super-admin). Global — not
 * tenant-scoped. Companies reference a plan via company.plan_id.
 */
#[Fillable([
    'name_ar', 'name_en', 'slug', 'price_monthly', 'price_yearly',
    'max_cars', 'max_staff', 'features', 'is_active', 'sort',
])]
class SubscriptionPlan extends Model
{
    protected function casts(): array
    {
        return [
            'price_monthly' => 'decimal:2',
            'price_yearly'  => 'decimal:2',
            'features'      => 'array',
            'is_active'     => 'boolean',
        ];
    }

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class, 'plan_id');
    }
}
