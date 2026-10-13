<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Booking;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/** CRUD for invoices + payments (tenant-scoped). */
class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $invoices = Invoice::query()
            ->with(['customer:id,name', 'booking:id,reference'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->q, fn ($q, $term) => $q->where('number', 'like', "%{$term}%")
                ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$term}%")))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($invoices);
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load(['items', 'payments', 'customer', 'booking']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id'      => ['required', 'integer', 'exists:customers,id'],
            'booking_id'       => ['nullable', 'integer', 'exists:bookings,id'],
            'issue_date'       => ['nullable', 'date'],
            'due_date'         => ['nullable', 'date'],
            'discount'         => ['nullable', 'numeric', 'min:0'],
            'tax'              => ['nullable', 'numeric', 'min:0'],
            'notes'            => ['nullable', 'string'],
            'items'            => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity'    => ['required', 'numeric', 'min:0'],
            'items.*.unit_price'  => ['required', 'numeric', 'min:0'],
        ]);

        $invoice = DB::transaction(function () use ($data, $request) {
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += (float) $item['quantity'] * (float) $item['unit_price'];
            }
            $discount = (float) ($data['discount'] ?? 0);
            $tax = (float) ($data['tax'] ?? 0);
            $total = round($subtotal - $discount + $tax, 2);

            $company = $request->user()->company;
            $number = $this->nextNumber($company->invoice_prefix ?? 'INV');

            $invoice = Invoice::create([
                'customer_id' => $data['customer_id'],
                'booking_id'  => $data['booking_id'] ?? null,
                'number'      => $number,
                'issue_date'  => $data['issue_date'] ?? Carbon::today()->toDateString(),
                'due_date'    => $data['due_date'] ?? null,
                'subtotal'    => round($subtotal, 2),
                'discount'    => round($discount, 2),
                'tax'         => round($tax, 2),
                'total'       => $total,
                'status'      => 'unpaid',
                'notes'       => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $invoice->items()->create([
                    'description' => $item['description'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'amount'      => round((float) $item['quantity'] * (float) $item['unit_price'], 2),
                ]);
            }

            return $invoice;
        });

        return response()->json($invoice->load(['items', 'customer']), 201);
    }

    /** Pre-fill an invoice draft from a booking (returns JSON, does not persist). */
    public function fromBooking(Booking $booking)
    {
        $booking->load('car', 'customer');

        return response()->json([
            'customer_id' => $booking->customer_id,
            'booking_id'  => $booking->id,
            'discount'    => $booking->discount,
            'tax'         => $booking->tax,
            'items'       => [[
                'description' => trim(($booking->car->name_ar ?? 'سيارة')." — {$booking->days} يوم ({$booking->reference})"),
                'quantity'    => $booking->days,
                'unit_price'  => $booking->daily_price,
            ]],
        ]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'due_date' => ['nullable', 'date'],
            'notes'    => ['nullable', 'string'],
            'status'   => ['nullable', 'in:unpaid,partial,paid,void'],
        ]);

        $invoice->update($data);

        return response()->json($invoice->load(['items', 'payments']));
    }

    public function addPayment(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'amount'    => ['required', 'numeric', 'min:0.01'],
            'method'    => ['nullable', 'in:cash,card,transfer,other'],
            'reference' => ['nullable', 'string', 'max:120'],
            'paid_at'   => ['nullable', 'date'],
            'note'      => ['nullable', 'string', 'max:255'],
        ]);

        $invoice->payments()->create([
            'customer_id' => $invoice->customer_id,
            'amount'      => $data['amount'],
            'method'      => $data['method'] ?? 'cash',
            'reference'   => $data['reference'] ?? null,
            'paid_at'     => $data['paid_at'] ?? Carbon::now(),
            'note'        => $data['note'] ?? null,
        ]);

        $invoice->syncPaymentState();

        AppNotification::notify('payment', [
            'title_ar' => 'دفعة جديدة',
            'title_en' => 'Payment received',
            'body_ar'  => "دفعة {$data['amount']} على الفاتورة {$invoice->number}",
            'body_en'  => "Payment {$data['amount']} on invoice {$invoice->number}",
            'link'     => '/admin/invoices.html',
            'data'     => ['invoice_id' => $invoice->id],
        ]);

        return response()->json($invoice->fresh()->load(['items', 'payments']));
    }

    public function deletePayment(Invoice $invoice, int $paymentId)
    {
        $invoice->payments()->where('id', $paymentId)->delete();
        $invoice->syncPaymentState();

        return response()->json($invoice->fresh()->load(['items', 'payments']));
    }

    public function void(Invoice $invoice)
    {
        $invoice->update(['status' => 'void']);

        return response()->json($invoice);
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();

        return response()->json(['message' => 'تم حذف الفاتورة.']);
    }

    private function nextNumber(string $prefix): string
    {
        $seq = Invoice::count() + 1;

        return $prefix.'-'.str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }
}
