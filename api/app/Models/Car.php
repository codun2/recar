<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A rentable vehicle, scoped to a company. */
#[Fillable([
    'company_id', 'category_id', 'name_ar', 'name_en', 'make', 'model', 'year',
    'plate_number', 'color', 'transmission', 'fuel', 'seats', 'doors',
    'daily_price', 'offer_price', 'offer_label', 'weekly_price', 'monthly_price', 'deposit',
    'mileage', 'status', 'featured', 'image', 'description_ar', 'description_en',
])]
class Car extends Model
{
    use BelongsToCompany;

    protected function casts(): array
    {
        return [
            'daily_price'   => 'decimal:2',
            'offer_price'   => 'decimal:2',
            'weekly_price'  => 'decimal:2',
            'monthly_price' => 'decimal:2',
            'deposit'       => 'decimal:2',
            'featured'      => 'boolean',
            'year'          => 'integer',
            'seats'         => 'integer',
            'doors'         => 'integer',
            'mileage'       => 'integer',
        ];
    }

    /** The price actually charged per day (offer price when set, else daily). */
    public function effectivePrice(): float
    {
        return (float) ($this->offer_price !== null && $this->offer_price > 0 ? $this->offer_price : $this->daily_price);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CarCategory::class, 'category_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(CarImage::class)->orderBy('sort')->orderBy('id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /** Is the car free of confirmed/active bookings overlapping [from, to]? */
    public function isAvailableBetween(string $from, string $to, ?int $exceptBookingId = null): bool
    {
        return ! $this->bookings()
            ->whereIn('status', ['confirmed', 'active'])
            ->when($exceptBookingId, fn ($q) => $q->where('id', '!=', $exceptBookingId))
            ->where('start_date', '<=', $to)
            ->where('end_date', '>=', $from)
            ->exists();
    }
}
