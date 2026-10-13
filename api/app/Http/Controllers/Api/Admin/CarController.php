<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\HandlesUploads;
use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;

/** CRUD for cars (tenant-scoped), with image upload and status control. */
class CarController extends Controller
{
    use HandlesUploads;

    public function index(Request $request)
    {
        $cars = Car::query()
            ->with('category:id,name_ar,name_en')
            ->when($request->q, fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('name_ar', 'like', "%{$term}%")
                ->orWhere('name_en', 'like', "%{$term}%")
                ->orWhere('plate_number', 'like', "%{$term}%")))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->category_id, fn ($q, $c) => $q->where('category_id', $c))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($cars);
    }

    public function show(Car $car)
    {
        return response()->json($car->load('category:id,name_ar,name_en'));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        if ($request->hasFile('image')) {
            $data['image'] = $this->storeImage($request->file('image'), 'cars');
        }

        return response()->json(Car::create($data)->load('category:id,name_ar,name_en'), 201);
    }

    public function update(Request $request, Car $car)
    {
        $data = $this->validateData($request, true);

        if ($request->hasFile('image')) {
            $this->deleteImage($car->image);
            $data['image'] = $this->storeImage($request->file('image'), 'cars');
        }

        $car->update($data);

        return response()->json($car->load('category:id,name_ar,name_en'));
    }

    public function updateStatus(Request $request, Car $car)
    {
        $data = $request->validate([
            'status' => ['required', 'in:available,rented,maintenance,hidden'],
        ]);

        $car->update($data);

        return response()->json($car);
    }

    public function destroy(Car $car)
    {
        $this->deleteImage($car->image);
        $car->delete();

        return response()->json(['message' => 'تم حذف السيارة.']);
    }

    private function validateData(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'category_id'    => ['nullable', 'integer', 'exists:car_categories,id'],
            'name_ar'        => [$req, 'string', 'max:160'],
            'name_en'        => [$req, 'string', 'max:160'],
            'make'           => ['nullable', 'string', 'max:80'],
            'model'          => ['nullable', 'string', 'max:80'],
            'year'           => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'plate_number'   => ['nullable', 'string', 'max:40'],
            'color'          => ['nullable', 'string', 'max:40'],
            'transmission'   => ['nullable', 'in:auto,manual'],
            'fuel'           => ['nullable', 'in:petrol,diesel,electric,hybrid'],
            'seats'          => ['nullable', 'integer', 'min:1', 'max:60'],
            'doors'          => ['nullable', 'integer', 'min:1', 'max:10'],
            'daily_price'    => [$req, 'numeric', 'min:0'],
            'weekly_price'   => ['nullable', 'numeric', 'min:0'],
            'monthly_price'  => ['nullable', 'numeric', 'min:0'],
            'deposit'        => ['nullable', 'numeric', 'min:0'],
            'mileage'        => ['nullable', 'integer', 'min:0'],
            'status'         => ['nullable', 'in:available,rented,maintenance,hidden'],
            'featured'       => ['nullable', 'boolean'],
            'description_ar' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
        ]);
    }
}
