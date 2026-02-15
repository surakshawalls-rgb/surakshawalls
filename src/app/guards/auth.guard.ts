// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) {
    return true;
  }

  // Redirect to login if not authenticated
  router.navigate(['/login']);
  return false;
};

export const loginGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn) {
    return true;
  }

  // Redirect to dashboard if already logged in
  router.navigate(['/reports-dashboard']);
  return false;
};

// Module Access Guards
export const manufacturingGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasAccess('manufacturing')) {
    return true;
  }

  // Redirect to library grid if user only has library access
  router.navigate(['/library-grid']);
  return false;
};

export const libraryGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasAccess('library')) {
    return true;
  }

  // Redirect to manufacturing dashboard if user only has manufacturing access
  router.navigate(['/reports-dashboard']);
  return false;
};

// Admin-only access guard (for management operations)
export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  // Redirect to dashboard if not admin
  router.navigate(['/reports-dashboard']);
  return false;
};
