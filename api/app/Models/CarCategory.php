<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A car category/class (economy, SUV, luxury …), scoped to a company. */
#[Fillable(['company_id', 'name_ar', 'name_en', 'icon', 'sort'])]
class CarCategory extends Model
{
    use BelongsToCompany;

    public function cars(): HasMany
    {
        return $this->hasMany(Car::class, 'category_id');
    }
}
