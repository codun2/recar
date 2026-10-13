<?php

namespace App\Http\Controllers\Api\Super;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/** Platform-owner management of subscription plans. */
class PlanController extends Controller
{
    public function index()
    {
        return response()->json(
            SubscriptionPlan::withCount('companies')->orderBy('sort')->orderBy('id')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? $data['name_en']);

        $plan = SubscriptionPlan::create($data);

        return response()->json($plan, 201);
    }

    public function update(Request $request, SubscriptionPlan $plan)
    {
        $data = $this->validateData($request, $plan->id);
        unset($data['slug']); // slug is stable

        $plan->update($data);

        return response()->json($plan);
    }

    public function destroy(SubscriptionPlan $plan)
    {
        $plan->delete();

        return response()->json(['message' => 'تم حذف الخطة.']);
    }

    private function validateData(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'name_ar'       => ['required', 'string', 'max:120'],
            'name_en'       => ['required', 'string', 'max:120'],
            'slug'          => ['nullable', 'string', 'max:120'],
            'price_monthly' => ['nullable', 'numeric', 'min:0'],
            'price_yearly'  => ['nullable', 'numeric', 'min:0'],
            'max_cars'      => ['nullable', 'integer', 'min:0'],
            'max_staff'     => ['nullable', 'integer', 'min:0'],
            'features'      => ['nullable', 'array'],
            'is_active'     => ['nullable', 'boolean'],
            'sort'          => ['nullable', 'integer'],
        ]);
    }

    private function uniqueSlug(string $base): string
    {
        $slug = Str::slug($base) ?: 'plan';
        $original = $slug;
        $i = 1;
        while (SubscriptionPlan::where('slug', $slug)->exists()) {
            $slug = $original.'-'.$i++;
        }

        return $slug;
    }
}
