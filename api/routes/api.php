<?php

use App\Http\Controllers\Api\AdminAppointmentController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminClientController;
use App\Http\Controllers\Api\AdminInventoryController;
use App\Http\Controllers\Api\AdminMessageController;
use App\Http\Controllers\Api\AdminPetController;
use App\Http\Controllers\Api\AdminSettingController;
use App\Http\Controllers\Api\AdminStaffController;
use App\Http\Controllers\Api\AdoptionController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\ClinicRegistrationController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\SuperAuthController;
use App\Http\Controllers\Api\Super\ClinicController;
use Illuminate\Support\Facades\Route;

// Public — adoption ads shown on the homepage (no auth; aggregated across clinics).
Route::get('adoptions', [AdoptionController::class, 'publicIndex']);
Route::get('team', [AdminStaffController::class, 'publicIndex']);

// Public — clinic self-registration + the list of active clinics used by the
// pet-owner signup form to pick which clinic the account belongs to.
Route::get('clinics', [ClinicRegistrationController::class, 'publicList']);
Route::post('clinics/register', [ClinicRegistrationController::class, 'register']);
Route::get('clinics/{slug}', [ClinicRegistrationController::class, 'publicShow']);

// Pet-owner (customer) area — mirrors Matnokh's /api/customer/* namespace.
Route::prefix('customer')->group(function () {
    Route::post('register', [CustomerAuthController::class, 'register']);
    Route::post('login', [CustomerAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'clinic'])->group(function () {
        Route::get('me', [CustomerAuthController::class, 'me']);
        Route::post('logout', [CustomerAuthController::class, 'logout']);

        // Pets — read-only for owners (data is created/edited by clinic staff)
        Route::get('pets', [PetController::class, 'index']);
        Route::get('pets/{pet}', [PetController::class, 'show']);

        // Appointments — owners can view and request a booking (clinic confirms it)
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::post('appointments', [AppointmentController::class, 'store']);

        // Messages to the clinic
        Route::post('messages', [MessageController::class, 'store']);

        // Payment history (recorded by the clinic)
        Route::get('payments', [CustomerAuthController::class, 'payments']);

        // Adoption ads posted by the owner
        Route::get('adoptions/mine', [AdoptionController::class, 'mine']);
        Route::post('adoptions', [AdoptionController::class, 'store']);
        Route::delete('adoptions/{adoption}', [AdoptionController::class, 'destroy']);
    });
});

// Clinic staff/admin area — mirrors Matnokh's separate namespace.
Route::prefix('admin')->group(function () {
    Route::post('login', [AdminAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'staff', 'clinic'])->group(function () {
        Route::get('me', [AdminAuthController::class, 'me']);
        Route::get('badges', [AdminAuthController::class, 'badges']);
        Route::post('logout', [AdminAuthController::class, 'logout']);

        // Patients — perm:patients (except the inventory-suggestions read, gated separately)
        Route::middleware('perm:patients')->group(function () {
            Route::get('owners', [AdminPetController::class, 'owners']);
            Route::get('pets', [AdminPetController::class, 'index']);
            Route::post('pets', [AdminPetController::class, 'store']);
            Route::get('pets/{pet}', [AdminPetController::class, 'show']);
            Route::patch('pets/{pet}', [AdminPetController::class, 'update']);
            Route::patch('pets/{pet}/status', [AdminPetController::class, 'updateStatus']);
            Route::post('pets/{pet}/records', [AdminPetController::class, 'storeRecord']);
            Route::patch('pets/{pet}/records/{record}', [AdminPetController::class, 'updateRecord']);
            Route::delete('pets/{pet}/records/{record}', [AdminPetController::class, 'destroyRecord']);
        });

        // Clients
        Route::middleware('perm:clients')->group(function () {
            Route::get('clients', [AdminClientController::class, 'index']);
            Route::post('clients', [AdminClientController::class, 'store']);
            Route::get('clients/{user}', [AdminClientController::class, 'show']);
            Route::patch('clients/{user}', [AdminClientController::class, 'update']);
            Route::delete('clients/{user}', [AdminClientController::class, 'destroy']);
            Route::post('clients/{user}/payments', [AdminClientController::class, 'storePayment']);
            Route::delete('clients/{user}/payments/{payment}', [AdminClientController::class, 'destroyPayment']);
        });

        // Appointments
        Route::middleware('perm:appointments')->group(function () {
            Route::get('appointments', [AdminAppointmentController::class, 'index']);
            Route::post('appointments', [AdminAppointmentController::class, 'store']);
            Route::patch('appointments/{appointment}', [AdminAppointmentController::class, 'update']);
        });

        // Staff management
        Route::middleware('perm:staff')->group(function () {
            Route::get('staff', [AdminStaffController::class, 'index']);
            Route::post('staff', [AdminStaffController::class, 'store']);
            Route::patch('staff/{user}', [AdminStaffController::class, 'update']);
            Route::delete('staff/{user}', [AdminStaffController::class, 'destroy']);
            Route::post('staff/{user}/photo', [AdminStaffController::class, 'uploadPhoto']);
            Route::delete('staff/{user}/photo', [AdminStaffController::class, 'deletePhoto']);
        });

        // Inventory — reading is open to any staff (used for medication suggestions
        // in the patients treatment modal); writes require the permission.
        Route::get('inventory', [AdminInventoryController::class, 'index']);
        Route::middleware('perm:inventory')->group(function () {
            Route::post('inventory', [AdminInventoryController::class, 'store']);
            Route::patch('inventory/{medicine}', [AdminInventoryController::class, 'update']);
            Route::delete('inventory/{medicine}', [AdminInventoryController::class, 'destroy']);
        });

        // Messages (from clients)
        Route::middleware('perm:messages')->group(function () {
            Route::get('messages', [AdminMessageController::class, 'index']);
            Route::patch('messages/{message}/read', [AdminMessageController::class, 'markRead']);
        });

        // Settings
        Route::middleware('perm:settings')->group(function () {
            Route::get('settings', [AdminSettingController::class, 'index']);
            Route::patch('settings', [AdminSettingController::class, 'update']);
            Route::post('settings/photo', [AdminSettingController::class, 'uploadPhoto']);
        });
    });
});

// Platform-owner (super-admin) area — manages clinics above the tenant data.
Route::prefix('super')->group(function () {
    Route::post('login', [SuperAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'super'])->group(function () {
        Route::get('me', [SuperAuthController::class, 'me']);
        Route::post('logout', [SuperAuthController::class, 'logout']);

        Route::get('clinics', [ClinicController::class, 'index']);
        Route::post('clinics', [ClinicController::class, 'store']);
        Route::patch('clinics/{clinic}', [ClinicController::class, 'update']);
        Route::post('clinics/{clinic}/approve', [ClinicController::class, 'approve']);
        Route::post('clinics/{clinic}/suspend', [ClinicController::class, 'suspend']);
        Route::post('clinics/{clinic}/activate', [ClinicController::class, 'activate']);
    });
});
