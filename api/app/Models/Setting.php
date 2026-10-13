<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** A key/value setting, scoped to a company. */
#[Fillable(['company_id', 'key', 'value'])]
class Setting extends Model
{
    use BelongsToCompany;

    public $timestamps = true;

    /** All settings for the current company as a flat key=>value map. */
    public static function allAsMap(): array
    {
        return self::query()->pluck('value', 'key')->toArray();
    }

    /** Upsert a batch of key=>value pairs for the current company. */
    public static function putMany(array $pairs): void
    {
        foreach ($pairs as $key => $value) {
            self::updateOrCreate(['key' => $key], ['value' => is_array($value) ? json_encode($value) : $value]);
        }
    }
}
