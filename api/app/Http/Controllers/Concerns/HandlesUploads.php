<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait HandlesUploads
{
    /**
     * Store an uploaded image on the public disk and return its web path
     * (e.g. "/storage/cars/ab12.jpg"). Served by nginx via the /storage proxy.
     */
    protected function storeImage(UploadedFile $file, string $folder): string
    {
        $name = Str::random(24).'.'.$file->getClientOriginalExtension();
        $file->storeAs($folder, $name, 'public');

        return '/storage/'.$folder.'/'.$name;
    }

    /** Delete a previously stored image given its web path. */
    protected function deleteImage(?string $webPath): void
    {
        if (! $webPath) {
            return;
        }
        $relative = ltrim(str_replace('/storage/', '', $webPath), '/');
        if ($relative) {
            Storage::disk('public')->delete($relative);
        }
    }
}
