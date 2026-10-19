<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A damage/claim record against a car (optionally tied to a booking). */
#[Fillable([
    'company_id', 'car_id', 'booking_id', 'customer_id', 'title', 'description',
    'severity', 'status', 'cost_estimate', 'repair_cost', 'images', 'reported_by',
    'occurred_at', 'resolved_at', 'insurance_claim', 'claim_ref', 'claim_amount',
])]
class Damage extends Model
{
    use BelongsToCompany;

    protected function casts(): array
    {
        return [
            'cost_estimate'   => 'decimal:2',
            'repair_cost'     => 'decimal:2',
            'claim_amount'    => 'decimal:2',
            'images'          => 'array',
            'insurance_claim' => 'boolean',
            'occurred_at'     => 'date',
            'resolved_at'     => 'date',
        ];
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
