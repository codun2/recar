<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Http\Request;

/** Global search across cars, customers, bookings and invoices (command palette). */
class SearchController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->q);
        if (mb_strlen($q) < 1) {
            return response()->json(['cars' => [], 'customers' => [], 'bookings' => [], 'invoices' => []]);
        }
        $like = "%{$q}%";

        $cars = Car::query()
            ->where(fn ($w) => $w->where('name_ar', 'like', $like)->orWhere('name_en', 'like', $like)->orWhere('plate_number', 'like', $like))
            ->limit(6)->get(['id', 'name_ar', 'name_en', 'plate_number', 'status'])
            ->map(fn ($c) => [
                'id' => $c->id, 'ar' => $c->name_ar, 'en' => $c->name_en,
                'sub' => $c->plate_number, 'status' => $c->status,
                'href' => '/admin/car-form.html?id='.$c->id,
            ]);

        $customers = Customer::query()
            ->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('phone', 'like', $like)->orWhere('national_id', 'like', $like))
            ->limit(6)->get(['id', 'name', 'phone'])
            ->map(fn ($c) => ['id' => $c->id, 'label' => $c->name, 'sub' => $c->phone, 'href' => '/admin/customers.html']);

        $bookings = Booking::query()
            ->where('reference', 'like', $like)
            ->with('customer:id,name')
            ->limit(6)->get(['id', 'reference', 'customer_id', 'status'])
            ->map(fn ($b) => ['id' => $b->id, 'label' => $b->reference ?: ('#'.$b->id), 'sub' => $b->customer->name ?? '', 'status' => $b->status, 'href' => '/admin/bookings.html']);

        $invoices = Invoice::query()
            ->where('number', 'like', $like)
            ->limit(6)->get(['id', 'number', 'status', 'total'])
            ->map(fn ($i) => ['id' => $i->id, 'label' => $i->number, 'sub' => '', 'status' => $i->status, 'href' => '/admin/invoices.html']);

        return response()->json(compact('cars', 'customers', 'bookings', 'invoices'));
    }
}
