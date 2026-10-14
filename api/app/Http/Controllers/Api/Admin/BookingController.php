<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\HandlesUploads;
use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Booking;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/** CRUD + status flow for bookings (tenant-scoped). */
class BookingController extends Controller
{
    use HandlesUploads;

    public function index(Request $request)
    {
        $bookings = Booking::query()
            ->with(['customer:id,name,phone', 'car:id,name_ar,name_en,plate_number'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->q, fn ($q, $term) => $q->where('reference', 'like', "%{$term}%")
                ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$term}%")))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($bookings);
    }

    public function show(Booking $booking)
    {
        return response()->json($booking->load(['customer', 'car', 'invoice', 'creator:id,name']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id'      => ['required', 'integer', 'exists:customers,id'],
            'car_id'           => ['required', 'integer', 'exists:cars,id'],
            'start_date'       => ['required', 'date'],
            'end_date'         => ['required', 'date', 'after_or_equal:start_date'],
            'discount'         => ['nullable', 'numeric', 'min:0'],
            'deposit'          => ['nullable', 'numeric', 'min:0'],
            'deposit_paid'     => ['nullable', 'numeric', 'min:0'],
            'status'           => ['nullable', 'in:pending,confirmed,active,completed,cancelled'],
            'pickup_location'  => ['nullable', 'string', 'max:160'],
            'dropoff_location' => ['nullable', 'string', 'max:160'],
            'delivery'         => ['nullable', 'boolean'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'delivery_fee'     => ['nullable', 'numeric', 'min:0'],
            'notes'            => ['nullable', 'string'],
        ]);

        $car = Car::findOrFail($data['car_id']);
        $status = $data['status'] ?? 'pending';
        $deliveryFee = (float) ($data['delivery_fee'] ?? 0);

        if (in_array($status, ['confirmed', 'active'], true)
            && ! $car->isAvailableBetween($data['start_date'], $data['end_date'])) {
            throw ValidationException::withMessages(['car_id' => ['السيارة محجوزة في هذه الفترة.']]);
        }

        $priced = $this->price($car, $data['start_date'], $data['end_date'], (float) ($data['discount'] ?? 0), $deliveryFee);

        // Delivery bookings may not be activated until fully paid.
        if ($status === 'active' && ! empty($data['delivery'])
            && (float) ($data['deposit_paid'] ?? 0) + 0.001 < $priced['total']) {
            throw ValidationException::withMessages(['status' => ['لا يمكن تحريك السيارة للتوصيل قبل سداد كامل المبلغ.']]);
        }

        $booking = Booking::create(array_merge($data, $priced, [
            'created_by' => $request->user()->id,
            'deposit'    => $data['deposit'] ?? $car->deposit,
            'status'     => $status,
        ]));

        $booking->update(['reference' => 'BK-'.str_pad((string) $booking->id, 5, '0', STR_PAD_LEFT)]);

        if ($status === 'active') {
            $car->update(['status' => 'rented']);
        }

        AppNotification::notify('booking', [
            'title_ar' => 'حجز جديد',
            'title_en' => 'New booking',
            'body_ar'  => "حجز {$booking->reference} للسيارة {$car->name_ar}",
            'body_en'  => "Booking {$booking->reference} for {$car->name_en}",
            'link'     => '/admin/bookings.html',
            'data'     => ['booking_id' => $booking->id],
        ]);

        return response()->json($booking->load(['customer', 'car']), 201);
    }

    public function update(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'start_date'       => ['sometimes', 'date'],
            'end_date'         => ['sometimes', 'date', 'after_or_equal:start_date'],
            'discount'         => ['nullable', 'numeric', 'min:0'],
            'deposit'          => ['nullable', 'numeric', 'min:0'],
            'deposit_paid'     => ['nullable', 'numeric', 'min:0'],
            'pickup_location'  => ['nullable', 'string', 'max:160'],
            'dropoff_location' => ['nullable', 'string', 'max:160'],
            'delivery'         => ['nullable', 'boolean'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'delivery_fee'     => ['nullable', 'numeric', 'min:0'],
            'notes'            => ['nullable', 'string'],
        ]);

        $start = $data['start_date'] ?? $booking->start_date->toDateString();
        $end = $data['end_date'] ?? $booking->end_date->toDateString();
        $discount = (float) ($data['discount'] ?? $booking->discount);
        $deliveryFee = array_key_exists('delivery_fee', $data) ? (float) $data['delivery_fee'] : (float) $booking->delivery_fee;

        if ($booking->car && ! $booking->car->isAvailableBetween($start, $end, $booking->id)
            && in_array($booking->status, ['confirmed', 'active'], true)) {
            throw ValidationException::withMessages(['car_id' => ['السيارة محجوزة في هذه الفترة.']]);
        }

        $priced = $this->price($booking->car, $start, $end, $discount, $deliveryFee);
        $booking->update(array_merge($data, $priced));

        return response()->json($booking->load(['customer', 'car']));
    }

    /** Move a booking through its lifecycle, syncing the car's status. */
    public function updateStatus(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,confirmed,active,completed,cancelled'],
        ]);

        $new = $data['status'];

        if ($new === 'active' && $booking->car) {
            if (! $booking->car->isAvailableBetween($booking->start_date->toDateString(), $booking->end_date->toDateString(), $booking->id)) {
                throw ValidationException::withMessages(['status' => ['السيارة محجوزة في هذه الفترة.']]);
            }
            // A delivery booking can't move until the whole amount is paid.
            if ($booking->delivery && (float) $booking->deposit_paid + 0.001 < (float) $booking->total) {
                throw ValidationException::withMessages(['status' => ['لا يمكن تحريك السيارة للتوصيل قبل سداد كامل المبلغ.']]);
            }
            $booking->car->update(['status' => 'rented']);
        }

        if (in_array($new, ['completed', 'cancelled'], true) && $booking->car) {
            $booking->car->update(['status' => 'available']);
        }

        $booking->update(['status' => $new]);

        return response()->json($booking);
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();

        return response()->json(['message' => 'تم حذف الحجز.']);
    }

    /**
     * Confirm the physical handover of the car to the renter: who handed it
     * over, when, the voucher/receipt, mileage and notes. Activates the booking
     * and marks the car rented.
     */
    public function handover(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'handover_by'      => ['required', 'string', 'max:160'],
            'handover_at'      => ['nullable', 'date'],
            'handover_mileage' => ['nullable', 'integer', 'min:0'],
            'handover_notes'   => ['nullable', 'string'],
            'receipt'          => ['nullable', 'image', 'max:4096'],
        ]);

        $booking->handover_by = $data['handover_by'];
        $booking->handover_at = $data['handover_at'] ?? Carbon::now();
        $booking->handover_mileage = $data['handover_mileage'] ?? null;
        $booking->handover_notes = $data['handover_notes'] ?? null;
        if ($request->hasFile('receipt')) {
            $booking->handover_receipt = $this->storeImage($request->file('receipt'), 'handovers');
        }

        if (! in_array($booking->status, ['completed', 'cancelled'], true)) {
            $booking->status = 'active';
        }
        $booking->save();

        if ($booking->car) {
            $booking->car->update(['status' => 'rented']);
        }

        AppNotification::notify('booking', [
            'title_ar' => 'تأكيد استلام سيارة',
            'title_en' => 'Car handover confirmed',
            'body_ar'  => "تم تسليم سيارة الحجز {$booking->reference} بواسطة {$booking->handover_by}",
            'body_en'  => "Car handed over for {$booking->reference} by {$booking->handover_by}",
            'link'     => '/admin/bookings.html',
            'data'     => ['booking_id' => $booking->id],
        ]);

        return response()->json($booking->fresh()->load(['customer', 'car']));
    }

    /** Check availability + price for a car over a date range (booking form). */
    public function availability(Request $request)
    {
        $data = $request->validate([
            'car_id'       => ['required', 'integer', 'exists:cars,id'],
            'start_date'   => ['required', 'date'],
            'end_date'     => ['required', 'date', 'after_or_equal:start_date'],
            'except'       => ['nullable', 'integer'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
        ]);

        $car = Car::findOrFail($data['car_id']);
        $available = $car->isAvailableBetween($data['start_date'], $data['end_date'], $data['except'] ?? null);
        $priced = $this->price($car, $data['start_date'], $data['end_date'], 0, (float) ($data['delivery_fee'] ?? 0));

        return response()->json(array_merge(['available' => $available], $priced));
    }

    /** Compute days + totals from the car (offer) price, tax rate and delivery fee. */
    private function price(Car $car, string $start, string $end, float $discount, float $deliveryFee = 0): array
    {
        $days = max(1, Carbon::parse($start)->diffInDays(Carbon::parse($end)));
        $daily = $car->effectivePrice();
        $subtotal = $daily * $days;
        $taxable = max(0, $subtotal - $discount) + $deliveryFee;
        $taxRate = (float) ($car->company->tax_rate ?? 0);
        $tax = round($taxable * $taxRate / 100, 2);
        $total = round($taxable + $tax, 2);

        return [
            'days'         => $days,
            'daily_price'  => $daily,
            'subtotal'     => round($subtotal, 2),
            'discount'     => round($discount, 2),
            'delivery_fee' => round($deliveryFee, 2),
            'tax'          => $tax,
            'total'        => $total,
        ];
    }
}
