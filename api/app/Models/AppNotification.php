<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An in-app notification, scoped to a company. user_id null = company-wide
 * (shown to all staff). type drives the icon on the frontend.
 */
#[Fillable([
    'company_id', 'user_id', 'type', 'title_ar', 'title_en',
    'body_ar', 'body_en', 'link', 'data', 'read_at',
])]
class AppNotification extends Model
{
    use BelongsToCompany;

    protected $table = 'app_notifications';

    protected function casts(): array
    {
        return [
            'data'    => 'array',
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Create a notification for the current company (optionally a user). */
    public static function notify(string $type, array $attrs, ?int $userId = null): self
    {
        return self::create(array_merge($attrs, ['type' => $type, 'user_id' => $userId]));
    }
}
