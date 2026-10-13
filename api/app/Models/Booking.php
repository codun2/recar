<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A rental booking/reservation, scoped to a company.
 * Status flow: pending → confirmed → active → completed (or cancelled).
 */
#[Fillable([
    'company_id', 'customer_id', 'car_id', 'created_by', 'reference',
    'start_date', 'end_date', 'days', 'daily_price', 'subtotal',
    'discount', 'tax', 'total', 'deposit', 'status',
    'pickup_location', 'dropoff_location', 'notes',
])]
class Booking extends Model
{
    use BelongsToCompany;

    protected function casts(): array
    {
        return [
            'start_date'  => 'date',
            'end_date'    => 'date',
            'days'        => 'integer',
            'daily_price' => 'decimal:2',
            'subtotal'    => 'decimal:2',
            'discount'    => 'decimal:2',
            'tax'         => 'decimal:2',
            'total'       => 'decimal:2',
            'deposit'     => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }
}
