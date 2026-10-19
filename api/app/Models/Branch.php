<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A physical branch/location of a rental company. */
#[Fillable(['company_id', 'name', 'phone', 'city', 'address', 'is_primary', 'sort'])]
class Branch extends Model
{
    use BelongsToCompany;

    protected function casts(): array
    {
        return ['is_primary' => 'boolean', 'sort' => 'integer'];
    }

    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }
}
