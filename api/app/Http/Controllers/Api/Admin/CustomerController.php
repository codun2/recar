<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

/** CRUD for customers (tenant-scoped). */
class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $customers = Customer::query()
            ->withCount('bookings')
            ->when($request->q, fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('national_id', 'like', "%{$term}%")))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($customers);
    }

    public function show(Customer $customer)
    {
        return response()->json(
            $customer->load(['bookings' => fn ($q) => $q->with('car:id,name_ar,name_en')->orderByDesc('id')->limit(20)])
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        return response()->json(Customer::create($data), 201);
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $this->validateData($request, true);
        $customer->update($data);

        return response()->json($customer);
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json(['message' => 'تم حذف العميل.']);
    }

    private function validateData(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name'           => [$req, 'string', 'max:255'],
            'phone'          => ['nullable', 'string', 'max:40'],
            'email'          => ['nullable', 'email'],
            'national_id'    => ['nullable', 'string', 'max:60'],
            'license_number' => ['nullable', 'string', 'max:60'],
            'license_expiry' => ['nullable', 'date'],
            'address'        => ['nullable', 'string', 'max:255'],
            'city'           => ['nullable', 'string', 'max:120'],
            'notes'          => ['nullable', 'string'],
            'status'         => ['nullable', 'in:active,blocked'],
        ]);
    }
}
