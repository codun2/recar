<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/** Financial overview + ledgers for the company (tenant-scoped). */
class AccountsController extends Controller
{
    public function index()
    {
        $monthStart = Carbon::now()->startOfMonth();

        // Receivables = unpaid portion of open invoices.
        $receivables = (float) Invoice::whereIn('status', ['unpaid', 'partial'])
            ->select(DB::raw('COALESCE(SUM(total - paid_amount),0) as due'))->value('due');

        // Deposits currently held = deposit_paid on active/confirmed bookings.
        $depositsHeld = (float) Booking::whereIn('status', ['confirmed', 'active'])->sum('deposit_paid');

        $byMethod = Payment::select('method', DB::raw('SUM(amount) as total'))
            ->groupBy('method')->pluck('total', 'method');

        return response()->json([
            'summary' => [
                'revenue_total' => round((float) Payment::sum('amount'), 2),
                'revenue_month' => round((float) Payment::where('paid_at', '>=', $monthStart)->sum('amount'), 2),
                'receivables'   => round($receivables, 2),
                'deposits_held' => round($depositsHeld, 2),
                'invoiced'      => round((float) Invoice::where('status', '!=', 'void')->sum('total'), 2),
                'collected'     => round((float) Invoice::sum('paid_amount'), 2),
            ],
            'by_method'      => $byMethod,
            'revenue_series' => $this->revenueSeries(),
            'recent_payments' => Payment::with(['customer:id,name', 'invoice:id,number'])
                ->orderByDesc('paid_at')->orderByDesc('id')->limit(15)->get(),
            'outstanding' => Invoice::whereIn('status', ['unpaid', 'partial'])
                ->with('customer:id,name')->orderBy('due_date')->limit(15)->get(),
        ]);
    }

    private function revenueSeries(): array
    {
        $series = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->startOfMonth()->subMonths($i);
            $next = (clone $month)->addMonth();
            $series[] = [
                'label' => $month->format('Y-m'),
                'value' => round((float) Payment::where('paid_at', '>=', $month)->where('paid_at', '<', $next)->sum('amount'), 2),
            ];
        }

        return $series;
    }
}
