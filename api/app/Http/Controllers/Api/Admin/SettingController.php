<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\HandlesUploads;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

/** Company profile + key/value settings (tenant-scoped). */
class SettingController extends Controller
{
    use HandlesUploads;

    public function index(Request $request)
    {
        $company = $request->user()->company;

        return response()->json([
            'company'  => $company,
            'settings' => Setting::allAsMap(),
        ]);
    }

    public function update(Request $request)
    {
        $company = $request->user()->company;

        $data = $request->validate([
            'name'           => ['sometimes', 'string', 'max:255'],
            'phone'          => ['nullable', 'string', 'max:40'],
            'email'          => ['nullable', 'email'],
            'address'        => ['nullable', 'string', 'max:255'],
            'city'           => ['nullable', 'string', 'max:120'],
            'currency'       => ['nullable', 'string', 'max:8'],
            'locale'         => ['nullable', 'in:ar,en'],
            'tax_rate'       => ['nullable', 'numeric', 'min:0', 'max:100'],
            'invoice_prefix' => ['nullable', 'string', 'max:12'],
            'bank_name'      => ['nullable', 'string', 'max:120'],
            'account_name'   => ['nullable', 'string', 'max:160'],
            'iban'           => ['nullable', 'string', 'max:60'],
            'stc_pay'        => ['nullable', 'string', 'max:40'],
            'theme'          => ['sometimes', 'in:gold,royal,mint,minimal,vivid'],
            'theme_custom'             => ['nullable', 'array'],
            'theme_custom.accent'      => ['nullable', 'string', 'max:24'],
            'theme_custom.accent_dark' => ['nullable', 'string', 'max:24'],
            'theme_custom.sidebar'     => ['nullable', 'string', 'max:24'],
            'theme_custom.on_accent'   => ['nullable', 'string', 'max:24'],
            'theme_custom.radius'      => ['nullable', 'string', 'max:8'],
            'theme_custom.font'        => ['nullable', 'string', 'max:60'],
            'theme_custom.css'         => ['nullable', 'string', 'max:6000'],
            'settings'       => ['nullable', 'array'],
        ]);

        $company->update(collect($data)->except('settings')->toArray());

        if (! empty($data['settings'])) {
            Setting::putMany($data['settings']);
        }

        return response()->json([
            'company'  => $company->fresh(),
            'settings' => Setting::allAsMap(),
        ]);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate(['logo' => ['required', 'image', 'max:4096']]);
        $company = $request->user()->company;

        $this->deleteImage($company->logo);
        $company->update(['logo' => $this->storeImage($request->file('logo'), 'logos')]);

        return response()->json(['company' => $company->fresh()]);
    }
}
