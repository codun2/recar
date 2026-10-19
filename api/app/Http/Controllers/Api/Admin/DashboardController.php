<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Customer;
use App\Models\Damage;
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
        $weekStart = Carbon::now()->startOfWeek(Carbon::SUNDAY);
        $prevWeekStart = (clone $weekStart)->subWeek();

        $totalCars = Car::count();
        $inUse = Car::whereIn('status', ['rented'])->count();
        $soon = Carbon::today()->addDays(30);

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
            // Fleet utilization + compliance/service reminders.
            'fleet' => [
                'utilization'     => $totalCars > 0 ? (int) round($inUse / $totalCars * 100) : 0,
                'in_use'          => $inUse,
                'total'           => $totalCars,
                'reminders_count' => $this->remindersCount($soon),
                'damages_open'    => Damage::whereIn('status', ['open', 'in_repair'])->count(),
            ],
            // This week vs. last week (collections + deliveries/returns).
            'week' => [
                'collected'      => round((float) Payment::where('paid_at', '>=', $weekStart)->sum('amount'), 2),
                'prev_collected' => round((float) Payment::where('paid_at', '>=', $prevWeekStart)->where('paid_at', '<', $weekStart)->sum('amount'), 2),
                'delivered'      => Booking::whereNotNull('delivered_at')->where('delivered_at', '>=', $weekStart)->count(),
                'returned'       => Booking::whereNotNull('handover_at')->where('handover_at', '>=', $weekStart)->count(),
            ],
            // Active rentals ending within 3 days — "upcoming returns".
            'upcoming_returns' => Booking::with(['customer:id,name', 'car:id,name_ar,name_en,plate_number'])
                ->where('status', 'active')
                ->whereDate('end_date', '<=', Carbon::today()->addDays(3))
                ->orderBy('end_date')->limit(8)
                ->get(['id', 'customer_id', 'car_id', 'reference', 'start_date', 'end_date', 'status']),
            'latest_bookings' => Booking::with(['customer:id,name', 'car:id,name_ar,name_en'])
                ->orderByDesc('id')->limit(8)->get(),
            'revenue_series' => $this->revenueSeries(),
        ]);
    }

    /** How many cars have an insurance/registration/inspection/service date due by $limit. */
    private function remindersCount(Carbon $limit): int
    {
        return Car::where(function ($w) use ($limit) {
            $w->where(fn ($x) => $x->whereNotNull('insurance_expiry')->where('insurance_expiry', '<=', $limit))
              ->orWhere(fn ($x) => $x->whereNotNull('registration_expiry')->where('registration_expiry', '<=', $limit))
              ->orWhere(fn ($x) => $x->whereNotNull('inspection_expiry')->where('inspection_expiry', '<=', $limit))
              ->orWhere(fn ($x) => $x->whereNotNull('next_service_date')->where('next_service_date', '<=', $limit));
        })->count();
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
