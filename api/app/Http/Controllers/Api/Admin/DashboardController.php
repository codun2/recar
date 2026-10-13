<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Carbon;

/** Company dashboard statistics (tenant-scoped automatically). */
class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today()->toDateString();
        $monthStart = Carbon::now()->startOfMonth();

        return response()->json([
            'cars' => [
                'total'       => Car::count(),
                'available'   => Car::where('status', 'available')->count(),
                'rented'      => Car::where('status', 'rented')->count(),
                'maintenance' => Car::where('status', 'maintenance')->count(),
            ],
            'bookings' => [
                'total'     => Booking::count(),
                'pending'   => Booking::where('status', 'pending')->count(),
                'active'    => Booking::where('status', 'active')->count(),
                'completed' => Booking::where('status', 'completed')->count(),
            ],
            'customers' => Customer::count(),
            'invoices'  => [
                'unpaid'  => Invoice::whereIn('status', ['unpaid', 'partial'])->count(),
                'overdue' => Invoice::whereIn('status', ['unpaid', 'partial'])
                    ->whereNotNull('due_date')->whereDate('due_date', '<', $today)->count(),
            ],
            'revenue' => [
                'total' => round((float) Payment::sum('amount'), 2),
                'month' => round((float) Payment::where('paid_at', '>=', $monthStart)->sum('amount'), 2),
            ],
            'latest_bookings' => Booking::with(['customer:id,name', 'car:id,name_ar,name_en'])
                ->orderByDesc('id')->limit(8)->get(),
            'revenue_series' => $this->revenueSeries(),
        ]);
    }

    /** Last 6 months of collected revenue, for the dashboard chart. */
    private function revenueSeries(): array
    {
        $series = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->startOfMonth()->subMonths($i);
            $next = (clone $month)->addMonth();
            $series[] = [
                'label' => $month->format('Y-m'),
                'value' => round((float) Payment::where('paid_at', '>=', $month)
                    ->where('paid_at', '<', $next)->sum('amount'), 2),
            ];
        }

        return $series;
    }
}
