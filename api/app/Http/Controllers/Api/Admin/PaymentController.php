<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

/** Read-only list of recorded payments (tenant-scoped). */
class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $payments = Payment::query()
            ->with(['invoice:id,number', 'customer:id,name'])
            ->when($request->method, fn ($q, $m) => $q->where('method', $m))
            ->orderByDesc('paid_at')->orderByDesc('id')
            ->paginate(30);

        return response()->json($payments);
    }
}
