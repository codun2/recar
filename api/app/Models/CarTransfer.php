<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A record of moving a car from one branch to another. */
#[Fillable(['company_id', 'car_id', 'from_branch_id', 'to_branch_id', 'transferred_by', 'note'])]
class CarTransfer extends Model
{
    use BelongsToCompany;

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function fromBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function toBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'to_branch_id');
    }
}
