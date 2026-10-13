<?php

namespace App\Http\Controllers\Api\Super;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Payment;

/** Platform-wide statistics for the super-admin dashboard. */
class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'companies' => [
                'total'     => Company::count(),
                'active'    => Company::where('status', 'active')->count(),
                'pending'   => Company::where('status', 'pending')->count(),
                'suspended' => Company::where('status', 'suspended')->count(),
            ],
            'cars'     => Car::count(),
            'bookings' => Booking::count(),
            'invoices' => Invoice::count(),
            'revenue'  => round((float) Payment::sum('amount'), 2),
            'latest_companies' => Company::with('plan')->orderByDesc('id')->limit(8)->get(),
        ]);
    }
}
