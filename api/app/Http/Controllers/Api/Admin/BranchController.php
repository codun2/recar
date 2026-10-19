<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Car;
use Illuminate\Http\Request;

/** CRUD for company branches (tenant-scoped). */
class BranchController extends Controller
{
    public function index()
    {
        return response()->json(
            Branch::withCount('cars')->orderByDesc('is_primary')->orderBy('sort')->orderBy('id')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $branch = Branch::create($data);
        $this->syncPrimary($branch);

        return response()->json($branch->fresh(), 201);
    }

    public function update(Request $request, Branch $branch)
    {
        $data = $this->validateData($request, true);
        $branch->update($data);
        $this->syncPrimary($branch);

        return response()->json($branch->fresh());
    }

    public function destroy(Branch $branch)
    {
        // Detach cars from the deleted branch rather than blocking the delete.
        Car::where('branch_id', $branch->id)->update(['branch_id' => null]);
        $branch->delete();

        return response()->json(['message' => 'تم حذف الفرع.']);
    }

    private function validateData(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name'       => [$req, 'string', 'max:160'],
            'phone'      => ['nullable', 'string', 'max:40'],
            'city'       => ['nullable', 'string', 'max:120'],
            'address'    => ['nullable', 'string', 'max:255'],
            'is_primary' => ['nullable', 'boolean'],
            'sort'       => ['nullable', 'integer'],
        ]);
    }

    /** Ensure only one branch per company is flagged primary. */
    private function syncPrimary(Branch $branch): void
    {
        if ($branch->is_primary) {
            Branch::where('id', '!=', $branch->id)->update(['is_primary' => false]);
        }
    }
}
