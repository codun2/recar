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
    'discount', 'tax', 'total', 'deposit', 'deposit_paid', 'status',
    'pickup_location', 'dropoff_location', 'delivery', 'delivery_address',
    'delivery_fee', 'receipt', 'notes',
    'insurance_type', 'insurance_company', 'insurance_policy', 'insurance_excess', 'insurance_fee',
    'second_driver_name', 'second_driver_license', 'km_limit', 'extra_km_price',
    'handover_by', 'handover_at', 'handover_receipt', 'handover_mileage', 'handover_notes',
    'handover_fuel', 'handover_photos', 'handover_checklist',
    'delivered_by', 'delivered_at', 'delivered_mileage', 'delivered_notes',
    'delivered_fuel', 'delivered_photos', 'delivered_checklist',
    'signature', 'contract_signed_at',
])]
class Booking extends Model
{
    use BelongsToCompany;

    protected function casts(): array
    {
        return [
            'start_date'    => 'date',
            'end_date'      => 'date',
            'days'          => 'integer',
            'daily_price'   => 'decimal:2',
            'subtotal'      => 'decimal:2',
            'discount'      => 'decimal:2',
            'tax'           => 'decimal:2',
            'total'         => 'decimal:2',
            'deposit'       => 'decimal:2',
            'deposit_paid'  => 'decimal:2',
            'delivery'      => 'boolean',
            'delivery_fee'  => 'decimal:2',
            'insurance_excess'  => 'decimal:2',
            'insurance_fee'     => 'decimal:2',
            'km_limit'          => 'integer',
            'extra_km_price'    => 'decimal:2',
            'handover_at'   => 'datetime',
            'handover_mileage' => 'integer',
            'handover_fuel'    => 'integer',
            'handover_photos'  => 'array',
            'handover_checklist' => 'array',
            'delivered_at'  => 'datetime',
            'delivered_mileage' => 'integer',
            'delivered_fuel'   => 'integer',
            'delivered_photos' => 'array',
            'delivered_checklist' => 'array',
            'contract_signed_at'  => 'datetime',
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
