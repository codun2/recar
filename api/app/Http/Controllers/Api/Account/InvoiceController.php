<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Http\Request;

/** Customer self-service invoices (read-only). */
class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $customer = $this->customer($request);

        $invoices = Invoice::where('customer_id', $customer->id)
            ->with('booking:id,reference')
            ->orderByDesc('id')->paginate(15);

        return response()->json($invoices);
    }

    public function show(Request $request, Invoice $invoice)
    {
        $customer = $this->customer($request);
        abort_if($invoice->customer_id !== $customer->id, 404);

        return response()->json($invoice->load(['items', 'payments', 'booking']));
    }

    private function customer(Request $request): Customer
    {
        $customer = Customer::where('user_id', $request->user()->id)->first();
        abort_if(! $customer, 404, 'لا يوجد ملف عميل.');

        return $customer;
    }
}
