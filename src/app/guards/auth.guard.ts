// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInitialization().then(() => {
    if (authService.isLoggedIn) {
      return true;
    }

    router.navigate(['/login']);
    return false;
  });
};

export const loginGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInitialization().then(() => {
    if (!authService.isLoggedIn) {
      return true;
    }

    router.navigate(['/reports-dashboard']);
    return false;
  });
};

// Module Access Guards
export const manufacturingGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInitialization().then(() => {
    if (!authService.isLoggedIn) {
      router.navigate(['/login']);
      return false;
    }

    // Labour staff can ONLY access /daily-entry
    if (authService.isLabourStaff()) {
      return true;
    }

    if (authService.hasAccess('manufacturing')) {
      return true;
    }

    router.navigate(['/library-grid']);
    return false;
  });
};

// Labour Staff Guard: Only allows /daily-entry access
export const dailyEntryOnlyGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInitialization().then(() => {
    if (!authService.isLoggedIn) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.isLabourStaff()) {
      router.navigate(['/daily-entry']);
      return false;
    }

    return true;
  });
};

export const libraryGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInitialization().then(() => {
    if (!authService.isLoggedIn) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasAccess('library')) {
      return true;
    }

    router.navigate(['/reports-dashboard']);
    return false;
  });
};

// Admin-only access guard (for management operations)
export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInitialization().then(() => {
    if (authService.isAdmin()) {
      return true;
    }

    router.navigate(['/reports-dashboard']);
    return false;
  });
};
