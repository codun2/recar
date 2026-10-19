<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\MaintenanceRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/** Maintenance / service log for the fleet (tenant-scoped), plus fleet reminders. */
class MaintenanceController extends Controller
{
    public const TYPES = ['service', 'oil', 'repair', 'inspection', 'tires', 'battery', 'insurance', 'other'];

    public function index(Request $request)
    {
        $q = MaintenanceRecord::query()
            ->with('car:id,name_ar,name_en,plate_number')
            ->when($request->car_id, fn ($q, $c) => $q->where('car_id', $c))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByRaw('COALESCE(performed_at, created_at) DESC')
            ->orderByDesc('id');

        // Per-car history returns the full list; the main page paginates.
        return response()->json($request->car_id ? $q->get() : $q->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $record = MaintenanceRecord::create($data);
        $this->syncCarNextService($record);

        return response()->json($record->load('car:id,name_ar,name_en,plate_number'), 201);
    }

    public function update(Request $request, MaintenanceRecord $maintenance)
    {
        $data = $this->validateData($request, true);
        $maintenance->update($data);
        $this->syncCarNextService($maintenance);

        return response()->json($maintenance->fresh()->load('car:id,name_ar,name_en,plate_number'));
    }

    public function destroy(MaintenanceRecord $maintenance)
    {
        $maintenance->delete();

        return response()->json(['message' => 'تم حذف السجلّ.']);
    }

    /**
     * Fleet reminders: upcoming/overdue insurance, registration, inspection,
     * scheduled service — within `within` days (default 30) or already overdue.
     */
    public function reminders(Request $request)
    {
        $within = (int) ($request->within ?: 30);
        $today  = Carbon::today();
        $limit  = $today->copy()->addDays($within);

        $cars = Car::query()
            ->where(function ($w) use ($limit) {
                $w->whereNotNull('insurance_expiry')->where('insurance_expiry', '<=', $limit)
                  ->orWhere(fn ($x) => $x->whereNotNull('registration_expiry')->where('registration_expiry', '<=', $limit))
                  ->orWhere(fn ($x) => $x->whereNotNull('inspection_expiry')->where('inspection_expiry', '<=', $limit))
                  ->orWhere(fn ($x) => $x->whereNotNull('next_service_date')->where('next_service_date', '<=', $limit));
            })
            ->get(['id', 'name_ar', 'name_en', 'plate_number', 'insurance_expiry', 'registration_expiry', 'inspection_expiry', 'next_service_date']);

        $fields = [
            'insurance_expiry'    => 'insurance',
            'registration_expiry' => 'registration',
            'inspection_expiry'   => 'inspection',
            'next_service_date'   => 'service',
        ];

        $items = [];
        foreach ($cars as $car) {
            foreach ($fields as $col => $kind) {
                $date = $car->$col;
                if (! $date) {
                    continue;
                }
                $d = Carbon::parse($date);
                if ($d->gt($limit)) {
                    continue;
                }
                $items[] = [
                    'car_id'   => $car->id,
                    'car_ar'   => $car->name_ar,
                    'car_en'   => $car->name_en,
                    'plate'    => $car->plate_number,
                    'kind'     => $kind,
                    'due_date' => $d->toDateString(),
                    'days'     => $today->diffInDays($d, false), // negative = overdue
                    'overdue'  => $d->lt($today),
                ];
            }
        }

        // Soonest/most-overdue first.
        usort($items, fn ($a, $b) => $a['days'] <=> $b['days']);

        return response()->json([
            'within' => $within,
            'count'  => count($items),
            'items'  => $items,
        ]);
    }

    private function validateData(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'car_id'            => [$req, 'integer', 'exists:cars,id'],
            'type'             => ['nullable', 'in:'.implode(',', self::TYPES)],
            'title'            => [$req, 'string', 'max:160'],
            'description'      => ['nullable', 'string'],
            'cost'             => ['nullable', 'numeric', 'min:0'],
            'odometer'         => ['nullable', 'integer', 'min:0'],
            'performed_at'     => ['nullable', 'date'],
            'performed_by'     => ['nullable', 'string', 'max:120'],
            'vendor'           => ['nullable', 'string', 'max:160'],
            'next_due_date'    => ['nullable', 'date'],
            'next_due_odometer' => ['nullable', 'integer', 'min:0'],
            'status'           => ['nullable', 'in:done,scheduled'],
        ]);
    }

    /** Mirror a record's next-due onto the car so fleet reminders reflect it. */
    private function syncCarNextService(MaintenanceRecord $record): void
    {
        if (! $record->next_due_date && ! $record->next_due_odometer) {
            return;
        }
        $car = Car::find($record->car_id);
        if (! $car) {
            return;
        }
        $patch = [];
        if ($record->next_due_date) {
            $patch['next_service_date'] = $record->next_due_date;
        }
        if ($record->next_due_odometer) {
            $patch['next_service_odometer'] = $record->next_due_odometer;
        }
        $car->update($patch);
    }
}
