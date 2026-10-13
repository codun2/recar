<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An invoice for a booking (or ad-hoc), scoped to a company.
 * Status: unpaid → partial → paid (or void).
 */
#[Fillable([
    'company_id', 'customer_id', 'booking_id', 'number', 'issue_date', 'due_date',
    'subtotal', 'discount', 'tax', 'total', 'paid_amount', 'status', 'notes',
])]
class Invoice extends Model
{
    use BelongsToCompany;

    protected function casts(): array
    {
        return [
            'issue_date'  => 'date',
            'due_date'    => 'date',
            'subtotal'    => 'decimal:2',
            'discount'    => 'decimal:2',
            'tax'         => 'decimal:2',
            'total'       => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderByDesc('paid_at')->orderByDesc('id');
    }

    /** Recompute paid_amount + status from recorded payments. */
    public function syncPaymentState(): void
    {
        $paid = (float) $this->payments()->sum('amount');
        $this->paid_amount = $paid;
        $total = (float) $this->total;

        if ($this->status === 'void') {
            // keep void
        } elseif ($paid <= 0) {
            $this->status = 'unpaid';
        } elseif ($paid + 0.001 < $total) {
            $this->status = 'partial';
        } else {
            $this->status = 'paid';
        }

        $this->save();
    }
}
