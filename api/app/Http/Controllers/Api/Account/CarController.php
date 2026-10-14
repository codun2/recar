<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\CarCategory;
use Illuminate\Http\Request;

/** Browse the customer's company cars (tenant-scoped via company context). */
class CarController extends Controller
{
    public function index(Request $request)
    {
        $cars = Car::query()
            ->whereIn('status', ['available', 'rented'])
            ->with('category:id,name_ar,name_en')
            ->when($request->category_id, fn ($q, $c) => $q->where('category_id', $c))
            ->when($request->q, fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('name_ar', 'like', "%{$term}%")->orWhere('name_en', 'like', "%{$term}%")))
            ->orderByDesc('featured')->orderBy('daily_price')
            ->paginate(12);

        return response()->json([
            'categories' => CarCategory::orderBy('sort')->get(['id', 'name_ar', 'name_en']),
            'cars'       => $cars,
        ]);
    }

    public function show(Car $car)
    {
        return response()->json($car->load(['category:id,name_ar,name_en', 'images']));
    }
}
