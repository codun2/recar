<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CarCategory;
use Illuminate\Http\Request;

/** CRUD for car categories (tenant-scoped). */
class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(
            CarCategory::withCount('cars')->orderBy('sort')->orderBy('id')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:120'],
            'name_en' => ['required', 'string', 'max:120'],
            'icon'    => ['nullable', 'string', 'max:60'],
            'sort'    => ['nullable', 'integer'],
        ]);

        return response()->json(CarCategory::create($data), 201);
    }

    public function update(Request $request, CarCategory $category)
    {
        $data = $request->validate([
            'name_ar' => ['sometimes', 'string', 'max:120'],
            'name_en' => ['sometimes', 'string', 'max:120'],
            'icon'    => ['nullable', 'string', 'max:60'],
            'sort'    => ['nullable', 'integer'],
        ]);

        $category->update($data);

        return response()->json($category);
    }

    public function destroy(CarCategory $category)
    {
        $category->delete();

        return response()->json(['message' => 'تم حذف التصنيف.']);
    }
}
