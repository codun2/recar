<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A gallery image for a car, scoped to a company. */
#[Fillable(['company_id', 'car_id', 'path', 'sort'])]
class CarImage extends Model
{
    use BelongsToCompany;

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}
