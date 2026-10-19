<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A maintenance/service entry in a car's service log. */
#[Fillable([
    'company_id', 'car_id', 'type', 'title', 'description', 'cost', 'odometer',
    'performed_at', 'performed_by', 'vendor', 'next_due_date', 'next_due_odometer', 'status',
])]
class MaintenanceRecord extends Model
{
    use BelongsToCompany;

    protected function casts(): array
    {
        return [
            'cost'              => 'decimal:2',
            'odometer'          => 'integer',
            'next_due_odometer' => 'integer',
            'performed_at'      => 'date',
            'next_due_date'     => 'date',
        ];
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}
