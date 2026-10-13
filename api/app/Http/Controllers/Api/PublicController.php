<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\CarCategory;
use App\Models\Company;
use Illuminate\Http\Request;

/**
 * Public, unauthenticated endpoints (no tenant context bound) used by the
 * marketing site and the customer signup picker. Company is selected by slug.
 */
class PublicController extends Controller
{
    /** Active companies — for the signup/login company picker. */
    public function companies()
    {
        return response()->json(
            Company::where('status', 'active')
                ->get(['id', 'name', 'slug', 'city', 'logo', 'currency'])
        );
    }

    /** One company's public profile. */
    public function company(string $slug)
    {
        $company = Company::where('slug', $slug)->where('status', 'active')
            ->firstOrFail(['id', 'name', 'slug', 'city', 'phone', 'email', 'address', 'logo', 'currency']);

        return response()->json($company);
    }

    /** A company's public, bookable cars + categories. */
    public function cars(Request $request, string $slug)
    {
        $company = Company::where('slug', $slug)->where('status', 'active')->firstOrFail();

        // No tenant context on public routes, so scope explicitly by company_id.
        $cars = Car::withoutGlobalScope('company')
            ->where('company_id', $company->id)
            ->whereIn('status', ['available', 'rented'])
            ->with('category:id,name_ar,name_en')
            ->when($request->category_id, fn ($q, $c) => $q->where('category_id', $c))
            ->when($request->q, fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('name_ar', 'like', "%{$term}%")->orWhere('name_en', 'like', "%{$term}%")))
            ->orderByDesc('featured')->orderBy('daily_price')
            ->paginate(12);

        $categories = CarCategory::withoutGlobalScope('company')
            ->where('company_id', $company->id)->orderBy('sort')->get(['id', 'name_ar', 'name_en']);

        return response()->json([
            'company'    => ['id' => $company->id, 'name' => $company->name, 'slug' => $company->slug, 'currency' => $company->currency],
            'categories' => $categories,
            'cars'       => $cars,
        ]);
    }
}
