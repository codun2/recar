<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\Request;

/** In-app notifications for the company (tenant-scoped). */
class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $notifications = AppNotification::query()
            ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $userId))
            ->when($request->unread, fn ($q) => $q->whereNull('read_at'))
            ->orderByDesc('id')
            ->paginate(30);

        return response()->json($notifications);
    }

    public function markRead(Request $request, AppNotification $notification)
    {
        $notification->update(['read_at' => now()]);

        return response()->json($notification);
    }

    public function markAllRead(Request $request)
    {
        $userId = $request->user()->id;

        AppNotification::query()
            ->whereNull('read_at')
            ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $userId))
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'تمّت القراءة.']);
    }

    public function destroy(AppNotification $notification)
    {
        $notification->delete();

        return response()->json(['message' => 'تم الحذف.']);
    }
}
