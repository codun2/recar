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
            'insurance_type'        => ['nullable', 'in:none,third_party,comprehensive'],
            'insurance_company'     => ['nullable', 'string', 'max:160'],
            'insurance_policy'      => ['nullable', 'string', 'max:120'],
            'insurance_excess'      => ['nullable', 'numeric', 'min:0'],
            'insurance_fee'         => ['nullable', 'numeric', 'min:0'],
            'second_driver_name'    => ['nullable', 'string', 'max:160'],
            'second_driver_license' => ['nullable', 'string', 'max:80'],
            'km_limit'              => ['nullable', 'integer', 'min:0'],
            'extra_km_price'        => ['nullable', 'numeric', 'min:0'],
        ]);

        $car = Car::findOrFail($data['car_id']);
        $status = $data['status'] ?? 'pending';
        $deliveryFee = (float) ($data['delivery_fee'] ?? 0);
        $insuranceFee = (float) ($data['insurance_fee'] ?? 0);

        if (in_array($status, ['confirmed', 'active'], true)
            && ! $car->isAvailableBetween($data['start_date'], $data['end_date'])) {
            throw ValidationException::withMessages(['car_id' => ['السيارة محجوزة في هذه الفترة.']]);
        }

        $priced = $this->price($car, $data['start_date'], $data['end_date'], (float) ($data['discount'] ?? 0), $deliveryFee, $insuranceFee);

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
            'insurance_type'        => ['nullable', 'in:none,third_party,comprehensive'],
            'insurance_company'     => ['nullable', 'string', 'max:160'],
            'insurance_policy'      => ['nullable', 'string', 'max:120'],
            'insurance_excess'      => ['nullable', 'numeric', 'min:0'],
            'insurance_fee'         => ['nullable', 'numeric', 'min:0'],
            'second_driver_name'    => ['nullable', 'string', 'max:160'],
            'second_driver_license' => ['nullable', 'string', 'max:80'],
            'km_limit'              => ['nullable', 'integer', 'min:0'],
            'extra_km_price'        => ['nullable', 'numeric', 'min:0'],
        ]);

        $start = $data['start_date'] ?? $booking->start_date->toDateString();
        $end = $data['end_date'] ?? $booking->end_date->toDateString();
        $discount = (float) ($data['discount'] ?? $booking->discount);
        $deliveryFee = array_key_exists('delivery_fee', $data) ? (float) $data['delivery_fee'] : (float) $booking->delivery_fee;
        $insuranceFee = array_key_exists('insurance_fee', $data) ? (float) $data['insurance_fee'] : (float) $booking->insurance_fee;

        if ($booking->car && ! $booking->car->isAvailableBetween($start, $end, $booking->id)
            && in_array($booking->status, ['confirmed', 'active'], true)) {
            throw ValidationException::withMessages(['car_id' => ['السيارة محجوزة في هذه الفترة.']]);
        }

        $priced = $this->price($booking->car, $start, $end, $discount, $deliveryFee, $insuranceFee);
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
     * Hand the car OUT to the renter (rental starts): records who delivered it,
     * when, odometer and notes. Activates the booking and marks the car rented.
     */
    public function deliver(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'delivered_by'      => ['required', 'string', 'max:160'],
            'delivered_at'      => ['nullable', 'date'],
            'delivered_mileage' => ['nullable', 'integer', 'min:0'],
            'delivered_notes'   => ['nullable', 'string'],
            'delivered_fuel'    => ['nullable', 'integer', 'min:0', 'max:8'],
            'delivered_checklist' => ['nullable', 'string'],
            'photos'            => ['nullable', 'array', 'max:12'],
            'photos.*'          => ['image', 'max:6144'],
        ]);

        if ($booking->car && ! $booking->car->isAvailableBetween($booking->start_date->toDateString(), $booking->end_date->toDateString(), $booking->id)) {
            throw ValidationException::withMessages(['delivered_by' => ['السيارة محجوزة في هذه الفترة.']]);
        }
        if ($booking->delivery && (float) $booking->deposit_paid + 0.001 < (float) $booking->total) {
            throw ValidationException::withMessages(['delivered_by' => ['لا يمكن تحريك السيارة للتوصيل قبل سداد كامل المبلغ.']]);
        }

        $booking->delivered_by = $data['delivered_by'];
        $booking->delivered_at = $data['delivered_at'] ?? Carbon::now();
        $booking->delivered_mileage = $data['delivered_mileage'] ?? null;
        $booking->delivered_notes = $data['delivered_notes'] ?? null;
        $booking->delivered_fuel = $data['delivered_fuel'] ?? null;
        $booking->delivered_checklist = $this->decodeChecklist($request->input('delivered_checklist'));
        if ($request->hasFile('photos')) {
            $booking->delivered_photos = $this->storeInspectionPhotos($request->file('photos'));
        }
        $booking->status = 'active';
        $booking->save();

        if ($booking->car) {
            $booking->car->update(['status' => 'rented']);
        }

        AppNotification::notify('booking', [
            'title_ar' => 'تسليم سيارة للعميل',
            'title_en' => 'Car delivered to renter',
            'body_ar'  => "تم تسليم سيارة الحجز {$booking->reference} بواسطة {$booking->delivered_by}",
            'body_en'  => "Car delivered for {$booking->reference} by {$booking->delivered_by}",
            'link'     => '/admin/bookings.html',
            'data'     => ['booking_id' => $booking->id],
        ]);

        return response()->json($booking->fresh()->load(['customer', 'car']));
    }

    /**
     * Confirm the car was RETURNED (received back) by the showroom: who received
     * it, when, odometer, voucher and notes. Completes the booking, frees the car,
     * and (optionally) settles the remaining balance onto the invoice.
     */
    public function handover(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'handover_by'       => ['required', 'string', 'max:160'],
            'handover_at'       => ['nullable', 'date'],
            'handover_mileage'  => ['nullable', 'integer', 'min:0'],
            'handover_notes'    => ['nullable', 'string'],
            'receipt'           => ['nullable', 'image', 'max:4096'],
            'handover_fuel'     => ['nullable', 'integer', 'min:0', 'max:8'],
            'handover_checklist' => ['nullable', 'string'],
            'photos'            => ['nullable', 'array', 'max:12'],
            'photos.*'          => ['image', 'max:6144'],
            'charge_extra_km'   => ['nullable', 'boolean'],
            'settle_remaining'  => ['nullable', 'boolean'],
            'settle_method'     => ['nullable', 'in:cash,card,transfer,other'],
        ]);

        $booking->handover_by = $data['handover_by'];
        $booking->handover_at = $data['handover_at'] ?? Carbon::now();
        $booking->handover_mileage = $data['handover_mileage'] ?? null;
        $booking->handover_notes = $data['handover_notes'] ?? null;
        $booking->handover_fuel = $data['handover_fuel'] ?? null;
        $booking->handover_checklist = $this->decodeChecklist($request->input('handover_checklist'));
        if ($request->hasFile('photos')) {
            $booking->handover_photos = $this->storeInspectionPhotos($request->file('photos'));
        }
        if ($request->hasFile('receipt')) {
            $booking->handover_receipt = $this->storeImage($request->file('receipt'), 'handovers');
        }

        // Extra-distance charge: km driven beyond the agreed allowance.
        $extra = $this->extraKm($booking);
        if (! empty($data['charge_extra_km']) && $extra['charge'] > 0) {
            $invoice = $this->ensureInvoice($booking);
            $invoice->items()->create([
                'description' => "مسافة إضافية {$extra['extra']} كم × ".rtrim(rtrim(number_format((float) $booking->extra_km_price, 2), '0'), '.'),
                'quantity'    => $extra['extra'],
                'unit_price'  => $booking->extra_km_price,
                'amount'      => $extra['charge'],
            ]);
            // Extra-distance is an add-on to the amount due (not taxed), mirroring how
            // delivery/insurance fees ride on the total rather than the rental subtotal.
            $invoice->total = (float) $invoice->total + $extra['charge'];
            $invoice->save();
            $invoice->syncPaymentState();
        }

        // Settle the remaining balance on the booking's invoice (create one if needed).
        $settled = 0;
        if (! empty($data['settle_remaining'])) {
            $invoice = $this->ensureInvoice($booking);
            $remaining = round((float) $invoice->total - (float) $invoice->paid_amount, 2);
            if ($remaining > 0) {
                $invoice->payments()->create([
                    'company_id'  => $booking->company_id,
                    'customer_id' => $booking->customer_id,
                    'amount'      => $remaining,
                    'method'      => $data['settle_method'] ?? 'cash',
                    'reference'   => $booking->reference,
                    'paid_at'     => Carbon::now(),
                    'note'        => 'تخليص المتبقّي عند الاستلام',
                ]);
                $invoice->syncPaymentState();
                $booking->deposit_paid = (float) $booking->deposit_paid + $remaining;
                $settled = $remaining;
            }
        }

        // Receiving the car back = rental finished → booking completed, car available.
        if ($booking->status !== 'cancelled') {
            $booking->status = 'completed';
        }
        $booking->save();

        if ($booking->car) {
            $booking->car->update(['status' => 'available']);
        }

        AppNotification::notify('booking', [
            'title_ar' => 'استلام السيارة وإنهاء الحجز',
            'title_en' => 'Car returned, booking completed',
            'body_ar'  => "تم استلام سيارة الحجز {$booking->reference} بواسطة {$booking->handover_by}".($settled > 0 ? " · تخليص متبقّي {$settled}" : ''),
            'body_en'  => "Car returned for {$booking->reference} by {$booking->handover_by}",
            'link'     => '/admin/bookings.html',
            'data'     => ['booking_id' => $booking->id],
        ]);

        return response()->json($booking->fresh()->load(['customer', 'car']));
    }

    /** Find the booking's invoice or build one from it (rental line + delivery). */
    private function ensureInvoice(Booking $booking): \App\Models\Invoice
    {
        if ($booking->invoice) {
            return $booking->invoice;
        }
        $company = $booking->company;
        $prefix = $company->invoice_prefix ?? 'INV';
        $seq = \App\Models\Invoice::count() + 1;
        $number = $prefix.'-'.str_pad((string) $seq, 5, '0', STR_PAD_LEFT);

        $invoice = \App\Models\Invoice::create([
            'customer_id' => $booking->customer_id,
            'booking_id'  => $booking->id,
            'number'      => $number,
            'issue_date'  => Carbon::today()->toDateString(),
            'due_date'    => $booking->end_date?->toDateString(),
            'subtotal'    => $booking->subtotal,
            'discount'    => $booking->discount,
            'tax'         => $booking->tax,
            'total'       => $booking->total,
            'paid_amount' => 0,
            'status'      => 'unpaid',
            'notes'       => 'إيجار '.$booking->reference,
        ]);
        $carName = $booking->car->name_ar ?? 'سيارة';
        $invoice->items()->create([
            'description' => "{$carName} — {$booking->days} يوم ({$booking->reference})",
            'quantity'    => $booking->days,
            'unit_price'  => $booking->daily_price,
            'amount'      => round((float) $booking->daily_price * $booking->days, 2),
        ]);
        if ((float) $booking->delivery_fee > 0) {
            $invoice->items()->create(['description' => 'رسوم توصيل', 'quantity' => 1, 'unit_price' => $booking->delivery_fee, 'amount' => $booking->delivery_fee]);
        }
        if ((float) $booking->insurance_fee > 0) {
            $invoice->items()->create(['description' => 'رسوم تأمين', 'quantity' => 1, 'unit_price' => $booking->insurance_fee, 'amount' => $booking->insurance_fee]);
        }
        // Carry over any deposit already paid.
        if ((float) $booking->deposit_paid > 0) {
            $invoice->payments()->create([
                'company_id' => $booking->company_id, 'customer_id' => $booking->customer_id,
                'amount' => $booking->deposit_paid, 'method' => 'transfer', 'reference' => $booking->reference,
                'paid_at' => Carbon::now(), 'note' => 'دفعة مقدّمة على الحجز',
            ]);
            $invoice->syncPaymentState();
        }

        return $invoice->fresh();
    }

    /** Check availability + price for a car over a date range (booking form). */
    public function availability(Request $request)
    {
        $data = $request->validate([
            'car_id'       => ['required', 'integer', 'exists:cars,id'],
            'start_date'   => ['required', 'date'],
            'end_date'     => ['required', 'date', 'after_or_equal:start_date'],
            'except'        => ['nullable', 'integer'],
            'delivery_fee'  => ['nullable', 'numeric', 'min:0'],
            'insurance_fee' => ['nullable', 'numeric', 'min:0'],
        ]);

        $car = Car::findOrFail($data['car_id']);
        $available = $car->isAvailableBetween($data['start_date'], $data['end_date'], $data['except'] ?? null);
        $priced = $this->price($car, $data['start_date'], $data['end_date'], 0, (float) ($data['delivery_fee'] ?? 0), (float) ($data['insurance_fee'] ?? 0));

        return response()->json(array_merge(['available' => $available], $priced));
    }

    /** Compute days + totals from the car (offer) price, tax rate, delivery + insurance fees. */
    private function price(Car $car, string $start, string $end, float $discount, float $deliveryFee = 0, float $insuranceFee = 0): array
    {
        $days = max(1, Carbon::parse($start)->diffInDays(Carbon::parse($end)));
        $daily = $car->effectivePrice();
        $subtotal = $daily * $days;
        $taxable = max(0, $subtotal - $discount) + $deliveryFee + $insuranceFee;
        $taxRate = (float) ($car->company->tax_rate ?? 0);
        $tax = round($taxable * $taxRate / 100, 2);
        $total = round($taxable + $tax, 2);

        return [
            'days'          => $days,
            'daily_price'   => $daily,
            'subtotal'      => round($subtotal, 2),
            'discount'      => round($discount, 2),
            'delivery_fee'  => round($deliveryFee, 2),
            'insurance_fee' => round($insuranceFee, 2),
            'tax'           => $tax,
            'total'         => $total,
        ];
    }

    /** Decode a JSON condition checklist string into a clean key=>state map. */
    private function decodeChecklist(?string $raw): ?array
    {
        if (! $raw) {
            return null;
        }
        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return null;
        }
        $out = [];
        foreach ($decoded as $key => $state) {
            if (is_string($key) && in_array($state, ['ok', 'note', 'bad'], true)) {
                $out[substr($key, 0, 40)] = $state;
            }
        }

        return $out ?: null;
    }

    /** Store a batch of uploaded inspection photos and return their web paths. */
    private function storeInspectionPhotos(array $files): array
    {
        $paths = [];
        foreach ($files as $file) {
            $paths[] = $this->storeImage($file, 'inspections');
        }

        return $paths;
    }

    /** Distance driven vs. the agreed allowance, and the resulting extra charge. */
    private function extraKm(Booking $booking): array
    {
        $out = ['used' => null, 'allowed' => null, 'extra' => 0, 'charge' => 0.0];
        if ($booking->delivered_mileage === null || $booking->handover_mileage === null) {
            return $out;
        }
        $used = max(0, (int) $booking->handover_mileage - (int) $booking->delivered_mileage);
        $out['used'] = $used;
        if (! $booking->km_limit) {
            return $out; // unlimited mileage
        }
        $allowed = (int) $booking->km_limit * max(1, (int) $booking->days);
        $out['allowed'] = $allowed;
        $extra = max(0, $used - $allowed);
        $out['extra'] = $extra;
        $out['charge'] = round($extra * (float) $booking->extra_km_price, 2);

        return $out;
    }

    /**
     * Everything needed to render/print a rental agreement for one booking:
     * the booking, renter, car, company and the company's contract terms.
     */
    public function contract(Booking $booking)
    {
        $booking->load(['customer', 'car', 'creator:id,name', 'invoice']);
        $company = $booking->company;

        return response()->json([
            'booking'  => $booking,
            'company'  => $company,
            'settings' => \App\Models\Setting::allAsMap(),
            'extra_km' => $this->extraKm($booking),
        ]);
    }

    /** Store the renter's signature (image) against the booking and stamp it signed. */
    public function sign(Request $request, Booking $booking)
    {
        $request->validate([
            'signature' => ['required', 'image', 'max:2048'],
        ]);

        $this->deleteImage($booking->signature);
        $booking->signature = $this->storeImage($request->file('signature'), 'signatures');
        $booking->contract_signed_at = Carbon::now();
        $booking->save();

        return response()->json($booking->fresh());
    }
}
