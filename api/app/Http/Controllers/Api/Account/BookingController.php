<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/** Customer self-service bookings (request + view + cancel). */
class BookingController extends Controller
{
    public function index(Request $request)
    {
        $customer = $this->customer($request);

        $bookings = Booking::where('customer_id', $customer->id)
            ->with('car:id,name_ar,name_en,image')
            ->orderByDesc('id')->paginate(15);

        return response()->json($bookings);
    }

    public function show(Request $request, Booking $booking)
    {
        $customer = $this->customer($request);
        abort_if($booking->customer_id !== $customer->id, 404);

        return response()->json($booking->load(['car', 'invoice']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'car_id'          => ['required', 'integer', 'exists:cars,id'],
            'start_date'      => ['required', 'date', 'after_or_equal:today'],
            'end_date'        => ['required', 'date', 'after_or_equal:start_date'],
            'pickup_location' => ['nullable', 'string', 'max:160'],
            'notes'           => ['nullable', 'string'],
        ]);

        $customer = $this->customer($request);
        $car = Car::findOrFail($data['car_id']);

        if (! $car->isAvailableBetween($data['start_date'], $data['end_date'])) {
            throw ValidationException::withMessages(['car_id' => ['السيارة غير متاحة في هذه الفترة.']]);
        }

        $days = max(1, Carbon::parse($data['start_date'])->diffInDays(Carbon::parse($data['end_date'])));
        $daily = (float) $car->daily_price;
        $subtotal = $daily * $days;
        $taxRate = (float) ($car->company->tax_rate ?? 0);
        $tax = round($subtotal * $taxRate / 100, 2);

        $booking = Booking::create([
            'customer_id'     => $customer->id,
            'car_id'          => $car->id,
            'start_date'      => $data['start_date'],
            'end_date'        => $data['end_date'],
            'days'            => $days,
            'daily_price'     => $daily,
            'subtotal'        => round($subtotal, 2),
            'tax'             => $tax,
            'total'           => round($subtotal + $tax, 2),
            'deposit'         => $car->deposit,
            'status'          => 'pending',
            'pickup_location' => $data['pickup_location'] ?? null,
            'notes'           => $data['notes'] ?? null,
        ]);

        $booking->update(['reference' => 'BK-'.str_pad((string) $booking->id, 5, '0', STR_PAD_LEFT)]);

        AppNotification::notify('booking', [
            'title_ar' => 'طلب حجز جديد',
            'title_en' => 'New booking request',
            'body_ar'  => "طلب حجز {$booking->reference} من {$customer->name}",
            'body_en'  => "Booking request {$booking->reference} from {$customer->name}",
            'link'     => '/admin/bookings.html',
            'data'     => ['booking_id' => $booking->id],
        ]);

        return response()->json($booking->load('car'), 201);
    }

    public function cancel(Request $request, Booking $booking)
    {
        $customer = $this->customer($request);
        abort_if($booking->customer_id !== $customer->id, 404);

        if (! in_array($booking->status, ['pending', 'confirmed'], true)) {
            throw ValidationException::withMessages(['status' => ['لا يمكن إلغاء هذا الحجز.']]);
        }

        $booking->update(['status' => 'cancelled']);

        return response()->json($booking);
    }

    private function customer(Request $request): Customer
    {
        $customer = Customer::where('user_id', $request->user()->id)->first();
        abort_if(! $customer, 404, 'لا يوجد ملف عميل.');

        return $customer;
    }
}
