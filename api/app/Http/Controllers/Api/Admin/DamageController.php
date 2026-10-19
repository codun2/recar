<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\HandlesUploads;
use App\Http\Controllers\Controller;
use App\Models\Damage;
use Illuminate\Http\Request;

/** Damages & insurance claims against cars (tenant-scoped). */
class DamageController extends Controller
{
    use HandlesUploads;

    public function index(Request $request)
    {
        $q = Damage::query()
            ->with(['car:id,name_ar,name_en,plate_number', 'customer:id,name', 'booking:id,reference'])
            ->when($request->car_id, fn ($q, $c) => $q->where('car_id', $c))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('id');

        return response()->json($request->car_id ? $q->get() : $q->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['images'] = $this->pullImages($request);
        $damage = Damage::create($data);

        return response()->json($damage->fresh()->load('car:id,name_ar,name_en,plate_number'), 201);
    }

    public function update(Request $request, Damage $damage)
    {
        $data = $this->validateData($request, true);
        $new = $this->pullImages($request);
        if ($new) {
            $data['images'] = array_merge($damage->images ?? [], $new);
        }
        if ($request->boolean('_resolve') && $damage->status !== 'resolved') {
            $data['status'] = 'resolved';
            $data['resolved_at'] = now()->toDateString();
        }
        $damage->update($data);

        return response()->json($damage->fresh()->load('car:id,name_ar,name_en,plate_number'));
    }

    public function destroy(Damage $damage)
    {
        foreach (($damage->images ?? []) as $img) {
            $this->deleteImage($img);
        }
        $damage->delete();

        return response()->json(['message' => 'تم حذف السجلّ.']);
    }

    /** Store any uploaded damage photos and return their web paths. */
    private function pullImages(Request $request): array
    {
        $paths = [];
        foreach ((array) $request->file('images', []) as $file) {
            if ($file) {
                $paths[] = $this->storeImage($file, 'damages');
            }
        }

        return $paths;
    }

    private function validateData(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'car_id'          => [$req, 'integer', 'exists:cars,id'],
            'booking_id'      => ['nullable', 'integer', 'exists:bookings,id'],
            'customer_id'     => ['nullable', 'integer', 'exists:customers,id'],
            'title'           => [$req, 'string', 'max:160'],
            'description'     => ['nullable', 'string'],
            'severity'        => ['nullable', 'in:minor,moderate,major'],
            'status'          => ['nullable', 'in:open,in_repair,resolved'],
            'cost_estimate'   => ['nullable', 'numeric', 'min:0'],
            'repair_cost'     => ['nullable', 'numeric', 'min:0'],
            'reported_by'     => ['nullable', 'string', 'max:120'],
            'occurred_at'     => ['nullable', 'date'],
            'resolved_at'     => ['nullable', 'date'],
            'insurance_claim' => ['nullable', 'boolean'],
            'claim_ref'       => ['nullable', 'string', 'max:120'],
            'claim_amount'    => ['nullable', 'numeric', 'min:0'],
            'images'          => ['nullable', 'array'],
            'images.*'        => ['nullable', 'image', 'max:4096'],
        ]);
    }
}
