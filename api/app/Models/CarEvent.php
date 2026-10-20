<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A status transition in a car's life (created, available→rented→maintenance…).
 * Written automatically by the Car model whenever `status` changes, so every
 * source (manual edit, delivery, return, maintenance) is captured uniformly.
 */
#[Fillable(['company_id', 'car_id', 'type', 'from_status', 'to_status', 'actor', 'note', 'happened_at'])]
class CarEvent extends Model
{
    use BelongsToCompany;

    protected function casts(): array
    {
        return ['happened_at' => 'datetime'];
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /** Record an event for a car, stamping the acting user when available. */
    public static function log(Car $car, string $type, ?string $from = null, ?string $to = null, ?string $note = null): self
    {
        $actor = null;
        try {
            $actor = request()?->user()?->name;
        } catch (\Throwable) {
        }

        return self::create([
            'company_id'  => $car->company_id,
            'car_id'      => $car->id,
            'type'        => $type,
            'from_status' => $from,
            'to_status'   => $to,
            'actor'       => $actor,
            'note'        => $note,
            'happened_at' => now(),
        ]);
    }
}
