<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\HandlesUploads;
use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\CarImage;
use Illuminate\Http\Request;

/** CRUD for cars (tenant-scoped): offer pricing, gallery images, status. */
class CarController extends Controller
{
    use HandlesUploads;

    public const MAX_IMAGES = 15;

    public function index(Request $request)
    {
        $cars = Car::query()
            ->with('category:id,name_ar,name_en')
            ->withCount('images')
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
        return response()->json($car->load(['category:id,name_ar,name_en', 'images']));
    }

    /** Rental history/timeline for one car: who rented it, when, and totals. */
    public function history(Car $car)
    {
        $bookings = $car->bookings()
            ->with('customer:id,name,phone')
            ->orderByDesc('start_date')->orderByDesc('id')
            ->get(['id', 'customer_id', 'reference', 'start_date', 'end_date', 'days', 'total', 'deposit_paid', 'delivery', 'status', 'created_at']);

        $billable = $bookings->whereNotIn('status', ['cancelled']);

        return response()->json([
            'car' => [
                'id' => $car->id, 'name_ar' => $car->name_ar, 'name_en' => $car->name_en,
                'plate_number' => $car->plate_number, 'status' => $car->status,
            ],
            'stats' => [
                'total_rentals' => $billable->count(),
                'active'        => $bookings->where('status', 'active')->count(),
                'revenue'       => round((float) $billable->sum('total'), 2),
                'days'          => (int) $billable->sum('days'),
            ],
            'bookings' => $bookings->values(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        if ($request->hasFile('image')) {
            $data['image'] = $this->storeImage($request->file('image'), 'cars');
        }

        $car = Car::create($data);
        $this->syncGallery($request, $car);

        return response()->json($car->load(['category:id,name_ar,name_en', 'images']), 201);
    }

    public function update(Request $request, Car $car)
    {
        $data = $this->validateData($request, true);

        if ($request->hasFile('image')) {
            $this->deleteImage($car->image);
            $data['image'] = $this->storeImage($request->file('image'), 'cars');
        }

        $car->update($data);
        $this->syncGallery($request, $car);

        return response()->json($car->load(['category:id,name_ar,name_en', 'images']));
    }

    /** Add gallery images (multipart `images[]`), capped at MAX_IMAGES total. */
    public function uploadImages(Request $request, Car $car)
    {
        $request->validate([
            'images'   => ['required', 'array'],
            'images.*' => ['image', 'max:4096'],
        ]);

        $existing = $car->images()->count();
        foreach ($request->file('images') as $file) {
            if ($existing >= self::MAX_IMAGES) {
                break;
            }
            $path = $this->storeImage($file, 'cars');
            $car->images()->create(['car_id' => $car->id, 'path' => $path, 'sort' => $existing]);
            if (! $car->image) {
                $car->update(['image' => $path]);
            }
            $existing++;
        }

        return response()->json($car->fresh()->load('images'));
    }

    public function destroyImage(Request $request, Car $car, int $imageId)
    {
        $img = $car->images()->whereKey($imageId)->first();
        if ($img) {
            $this->deleteImage($img->path);
            if ($car->image === $img->path) {
                $next = $car->images()->whereKeyNot($imageId)->first();
                $car->update(['image' => $next->path ?? null]);
            }
            $img->delete();
        }

        return response()->json($car->fresh()->load('images'));
    }

    /** Pick a gallery image as the main (cover) image. */
    public function setMainImage(Request $request, Car $car, int $imageId)
    {
        $img = $car->images()->whereKey($imageId)->first();
        if ($img) {
            $car->update(['image' => $img->path]);
        }

        return response()->json($car->fresh()->load('images'));
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
        foreach ($car->images as $img) {
            $this->deleteImage($img->path);
        }
        $car->images()->delete();
        $car->delete();

        return response()->json(['message' => 'تم حذف السيارة.']);
    }

    /** Store gallery files sent inline with store/update (field `images[]`). */
    private function syncGallery(Request $request, Car $car): void
    {
        if (! $request->hasFile('images')) {
            return;
        }
        $existing = $car->images()->count();
        foreach ($request->file('images') as $file) {
            if ($existing >= self::MAX_IMAGES) {
                break;
            }
            $path = $this->storeImage($file, 'cars');
            $car->images()->create(['car_id' => $car->id, 'path' => $path, 'sort' => $existing]);
            if (! $car->image) {
                $car->update(['image' => $path]);
            }
            $existing++;
        }
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
            'offer_price'    => ['nullable', 'numeric', 'min:0'],
            'offer_label'    => ['nullable', 'string', 'max:60'],
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
