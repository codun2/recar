<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Read-only guard for the public demo account: a user flagged is_demo may read
 * freely but cannot perform any write (POST/PUT/PATCH/DELETE), except logging out.
 */
class EnsureNotDemo
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_demo
            && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)
            && ! $request->is('api/admin/logout')) {
            return response()->json([
                'message' => 'وضع العرض التجريبي — للقراءة فقط. أنشئ حساباً لتعديل البيانات.',
                'demo'    => true,
            ], 403);
        }

        return $next($request);
    }
}
