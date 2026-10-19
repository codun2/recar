<?php

use App\Http\Controllers\Api\Account\BookingController as AccountBookingController;
use App\Http\Controllers\Api\Account\CarController as AccountCarController;
use App\Http\Controllers\Api\Account\InvoiceController as AccountInvoiceController;
use App\Http\Controllers\Api\Admin\AccountsController;
use App\Http\Controllers\Api\Admin\BookingController;
use App\Http\Controllers\Api\Admin\BranchController;
use App\Http\Controllers\Api\Admin\CarController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\Admin\DamageController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\InvoiceController;
use App\Http\Controllers\Api\Admin\MaintenanceController;
use App\Http\Controllers\Api\Admin\NotificationController;
use App\Http\Controllers\Api\Admin\PaymentController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\Admin\StaffController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\Super\CompanyController;
use App\Http\Controllers\Api\Super\DashboardController as SuperDashboardController;
use App\Http\Controllers\Api\Super\PlanController;
use App\Http\Controllers\Api\SuperAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public (no auth, no tenant context)
|--------------------------------------------------------------------------
*/
Route::get('companies', [PublicController::class, 'companies']);
Route::get('companies/{slug}', [PublicController::class, 'company']);
Route::get('companies/{slug}/cars', [PublicController::class, 'cars']);
Route::get('companies/{slug}/cars/{id}', [PublicController::class, 'carDetail']);

/*
|--------------------------------------------------------------------------
| Customer self-service portal
|--------------------------------------------------------------------------
*/
Route::prefix('customer')->group(function () {
    Route::post('register', [CustomerAuthController::class, 'register']);
    Route::post('login', [CustomerAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'company'])->group(function () {
        Route::get('me', [CustomerAuthController::class, 'me']);
        Route::post('logout', [CustomerAuthController::class, 'logout']);

        Route::get('cars', [AccountCarController::class, 'index']);
        Route::get('cars/{car}', [AccountCarController::class, 'show']);

        Route::get('bookings', [AccountBookingController::class, 'index']);
        Route::post('bookings', [AccountBookingController::class, 'store']);
        Route::get('bookings/{booking}', [AccountBookingController::class, 'show']);
        Route::post('bookings/{booking}/pay', [AccountBookingController::class, 'pay']);
        Route::post('bookings/{booking}/cancel', [AccountBookingController::class, 'cancel']);

        Route::get('invoices', [AccountInvoiceController::class, 'index']);
        Route::get('invoices/{invoice}', [AccountInvoiceController::class, 'show']);
    });
});

/*
|--------------------------------------------------------------------------
| Company admin/staff dashboard
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {
    Route::post('login', [AdminAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'staff', 'company'])->group(function () {
        Route::get('me', [AdminAuthController::class, 'me']);
        Route::get('badges', [AdminAuthController::class, 'badges']);
        Route::post('logout', [AdminAuthController::class, 'logout']);

        Route::get('dashboard', [AdminDashboardController::class, 'index']);
        Route::get('accounts', [AccountsController::class, 'index']);

        // Cars
        Route::middleware('perm:cars')->group(function () {
            Route::get('cars', [CarController::class, 'index']);
            Route::post('cars', [CarController::class, 'store']);
            Route::get('cars/{car}', [CarController::class, 'show']);
            Route::get('cars/{car}/history', [CarController::class, 'history']);
            Route::post('cars/{car}', [CarController::class, 'update']); // multipart (image)
            Route::patch('cars/{car}', [CarController::class, 'update']);
            Route::patch('cars/{car}/status', [CarController::class, 'updateStatus']);
            Route::delete('cars/{car}', [CarController::class, 'destroy']);
            // Gallery (up to 15 images per car)
            Route::post('cars/{car}/images', [CarController::class, 'uploadImages']);
            Route::post('cars/{car}/images/{image}/main', [CarController::class, 'setMainImage']);
            Route::delete('cars/{car}/images/{image}', [CarController::class, 'destroyImage']);

            // Branches + inter-branch car transfer
            Route::get('branches', [BranchController::class, 'index']);
            Route::post('branches', [BranchController::class, 'store']);
            Route::patch('branches/{branch}', [BranchController::class, 'update']);
            Route::delete('branches/{branch}', [BranchController::class, 'destroy']);
            Route::post('cars/{car}/transfer', [CarController::class, 'transfer']);

            // Maintenance / service log + fleet reminders
            Route::get('maintenance/reminders', [MaintenanceController::class, 'reminders']);
            Route::get('maintenance', [MaintenanceController::class, 'index']);
            Route::post('maintenance', [MaintenanceController::class, 'store']);
            Route::patch('maintenance/{maintenance}', [MaintenanceController::class, 'update']);
            Route::delete('maintenance/{maintenance}', [MaintenanceController::class, 'destroy']);

            // Damages & claims
            Route::get('damages', [DamageController::class, 'index']);
            Route::post('damages', [DamageController::class, 'store']);
            Route::post('damages/{damage}', [DamageController::class, 'update']); // multipart (images)
            Route::patch('damages/{damage}', [DamageController::class, 'update']);
            Route::delete('damages/{damage}', [DamageController::class, 'destroy']);
        });

        // Categories
        Route::middleware('perm:categories')->group(function () {
            Route::get('categories', [CategoryController::class, 'index']);
            Route::post('categories', [CategoryController::class, 'store']);
            Route::patch('categories/{category}', [CategoryController::class, 'update']);
            Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
        });

        // Customers
        Route::middleware('perm:customers')->group(function () {
            Route::get('customers', [CustomerController::class, 'index']);
            Route::post('customers', [CustomerController::class, 'store']);
            Route::get('customers/{customer}', [CustomerController::class, 'show']);
            Route::patch('customers/{customer}', [CustomerController::class, 'update']);
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy']);
        });

        // Bookings
        Route::middleware('perm:bookings')->group(function () {
            Route::get('bookings', [BookingController::class, 'index']);
            Route::post('bookings', [BookingController::class, 'store']);
            Route::get('bookings/availability', [BookingController::class, 'availability']);
            Route::get('bookings/{booking}', [BookingController::class, 'show']);
            Route::patch('bookings/{booking}', [BookingController::class, 'update']);
            Route::patch('bookings/{booking}/status', [BookingController::class, 'updateStatus']);
            Route::post('bookings/{booking}/deliver', [BookingController::class, 'deliver']);
            Route::post('bookings/{booking}/handover', [BookingController::class, 'handover']);
            Route::delete('bookings/{booking}', [BookingController::class, 'destroy']);
        });

        // Invoices + payments
        Route::middleware('perm:invoices')->group(function () {
            Route::get('invoices', [InvoiceController::class, 'index']);
            Route::post('invoices', [InvoiceController::class, 'store']);
            Route::get('invoices/from-booking/{booking}', [InvoiceController::class, 'fromBooking']);
            Route::post('invoices/from-booking/{booking}', [InvoiceController::class, 'createFromBooking']);
            Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
            Route::patch('invoices/{invoice}', [InvoiceController::class, 'update']);
            Route::post('invoices/{invoice}/void', [InvoiceController::class, 'void']);
            Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy']);
            Route::post('invoices/{invoice}/payments', [InvoiceController::class, 'addPayment']);
            Route::delete('invoices/{invoice}/payments/{payment}', [InvoiceController::class, 'deletePayment']);
            Route::get('payments', [PaymentController::class, 'index']);
        });

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead']);
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);

        // Staff
        Route::middleware('perm:staff')->group(function () {
            Route::get('staff', [StaffController::class, 'index']);
            Route::post('staff', [StaffController::class, 'store']);
            Route::patch('staff/{user}', [StaffController::class, 'update']);
            Route::post('staff/{user}/photo', [StaffController::class, 'uploadPhoto']);
            Route::delete('staff/{user}', [StaffController::class, 'destroy']);
        });

        // Settings
        Route::middleware('perm:settings')->group(function () {
            Route::get('settings', [SettingController::class, 'index']);
            Route::patch('settings', [SettingController::class, 'update']);
            Route::post('settings/logo', [SettingController::class, 'uploadLogo']);
        });
    });
});

/*
|--------------------------------------------------------------------------
| Platform owner (super-admin)
|--------------------------------------------------------------------------
*/
Route::prefix('super')->group(function () {
    Route::post('login', [SuperAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'super'])->group(function () {
        Route::get('me', [SuperAuthController::class, 'me']);
        Route::post('logout', [SuperAuthController::class, 'logout']);

        Route::get('dashboard', [SuperDashboardController::class, 'index']);

        Route::get('companies', [CompanyController::class, 'index']);
        Route::post('companies', [CompanyController::class, 'store']);
        Route::get('companies/{company}', [CompanyController::class, 'show']);
        Route::patch('companies/{company}', [CompanyController::class, 'update']);
        Route::post('companies/{company}/approve', [CompanyController::class, 'approve']);
        Route::post('companies/{company}/suspend', [CompanyController::class, 'suspend']);
        Route::post('companies/{company}/activate', [CompanyController::class, 'activate']);
        Route::delete('companies/{company}', [CompanyController::class, 'destroy']);

        Route::get('plans', [PlanController::class, 'index']);
        Route::post('plans', [PlanController::class, 'store']);
        Route::patch('plans/{plan}', [PlanController::class, 'update']);
        Route::delete('plans/{plan}', [PlanController::class, 'destroy']);
    });
});
