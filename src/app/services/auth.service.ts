// src/app/services/auth.service.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface User {
  id: string;
  email: string;
  role: 'su' | 'admin' | 'editor' | 'library_manager' | 'library_viewer' | 'viewer' | 'labour_staff';
  full_name: string;
  can_delete: boolean;
  modules: string[]; // ['library', 'manufacturing']
  is_suspended: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  private platformId = inject(PLATFORM_ID);
  private readonly userStorageKey = 'currentUser';
  private readonly sessionStorageKey = 'supabaseSession';
  private readonly initializationPromise: Promise<void>;

  constructor(private supabase: SupabaseService) {
    this.initializationPromise = this.initializeAuthState();
  }

  private async initializeAuthState(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storedSession = this.readStoredSession();
    if (!storedSession?.refresh_token) {
      this.clearLocalAuthState();
      return;
    }

    try {
      const { data, error } = await this.supabase.supabase.auth.refreshSession({
        refresh_token: storedSession.refresh_token,
      });

      if (error || !data.user || !data.session?.access_token || !data.session?.refresh_token) {
        this.clearLocalAuthState();
        return;
      }

      const user = this.mapAuthUser(data.user, data.user.email || '');
      if (user.is_suspended) {
        await this.supabase.supabase.auth.signOut();
        this.clearLocalAuthState();
        return;
      }

      this.setAuthenticatedUser(user, data.session.access_token, data.session.refresh_token);
    } catch (error) {
      console.error('Failed to restore auth session from storage:', error);
      this.clearLocalAuthState();
    }
  }

  private readStoredSession(): { access_token?: string; refresh_token?: string } | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const sessionJson = localStorage.getItem(this.sessionStorageKey);
    if (!sessionJson) {
      return null;
    }

    try {
      return JSON.parse(sessionJson) as {
        access_token?: string;
        refresh_token?: string;
      };
    } catch (error) {
      localStorage.removeItem(this.sessionStorageKey);
      return null;
    }
  }

  private mapAuthUser(authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  }, fallbackEmail: string): User {
    const metadata = authUser.user_metadata || {};

    return {
      id: authUser.id,
      email: authUser.email || fallbackEmail,
      role: (metadata['role'] as User['role']) || 'viewer',
      full_name: (metadata['full_name'] as string) || fallbackEmail.split('@')[0],
      can_delete: metadata['can_delete'] === true,
      modules: Array.isArray(metadata['modules'])
        ? metadata['modules'].filter((item): item is string => typeof item === 'string')
        : ['library', 'manufacturing'],
      is_suspended: metadata['is_suspended'] === true,
    };
  }

  private setAuthenticatedUser(
    user: User,
    accessToken?: string | null,
    refreshToken?: string | null
  ): void {
    this.currentUserSubject.next(user);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(this.userStorageKey, JSON.stringify(user));

    if (accessToken && refreshToken) {
      localStorage.setItem(
        this.sessionStorageKey,
        JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
      );
    }
  }

  private clearLocalAuthState(): void {
    this.currentUserSubject.next(null);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(this.userStorageKey);
    localStorage.removeItem(this.sessionStorageKey);
  }

  waitForInitialization(): Promise<void> {
    return this.initializationPromise;
  }

  private normalizeAuthErrorMessage(message?: string | null): string {
    const rawMessage = (message || '').trim();
    const normalizedMessage = rawMessage.toLowerCase();

    if (!normalizedMessage) {
      return 'Unable to sign in right now. Please try again.';
    }

    if (normalizedMessage.includes('invalid login credentials')) {
      return 'Incorrect email address or password. Please try again.';
    }

    if (
      normalizedMessage.includes('banned') ||
      normalizedMessage.includes('temporarily suspended') ||
      normalizedMessage.includes('user is banned')
    ) {
      return 'This account has been temporarily suspended. Please contact the admin or library desk to restore access.';
    }

    if (normalizedMessage.includes('email not confirmed')) {
      return 'This account is not verified yet. Please contact admin.';
    }

    if (normalizedMessage.includes('email_provider_disabled')) {
      return 'Email login is currently unavailable. Please contact admin.';
    }

    if (
      normalizedMessage.includes('fetch failed') ||
      normalizedMessage.includes('failed to fetch') ||
      normalizedMessage.includes('network')
    ) {
      return 'Unable to reach the server. Check your internet connection and try again.';
    }

    if (
      normalizedMessage.includes('too many requests') ||
      normalizedMessage.includes('rate limit') ||
      normalizedMessage.includes('over_request_rate_limit')
    ) {
      return 'Too many login attempts were made. Please wait a minute and try again.';
    }

    if (
      normalizedMessage.includes('session') ||
      normalizedMessage.includes('jwt') ||
      normalizedMessage.includes('token')
    ) {
      return 'Your session could not be validated. Please sign in again.';
    }

    return 'Unable to sign in right now. Please try again or contact admin if the issue continues.';
  }

  // Get current user value synchronously
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in
  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null && this.currentUserSubject.value.is_suspended !== true;
  }

  // Login with email and password
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Sign in with Supabase
      const { data, error } = await this.supabase.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(this.normalizeAuthErrorMessage(error.message));
      }
      
      if (!data.user) {
        throw new Error('Unable to sign in right now. Please try again.');
      }

      const user = this.mapAuthUser(data.user, email);
      if (user.is_suspended) {
        await this.supabase.supabase.auth.signOut();
        this.clearLocalAuthState();
        throw new Error(this.normalizeAuthErrorMessage('temporarily suspended'));
      }

      this.setAuthenticatedUser(
        user,
        data.session?.access_token || null,
        data.session?.refresh_token || null
      );

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: this.normalizeAuthErrorMessage(error?.message),
      };
    }
  }

  // Logout
  async logout() {
    try {
      await this.supabase.supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearLocalAuthState();
    }
  }

  // Permission checks
  hasAccess(module: 'library' | 'manufacturing'): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return user.modules.includes(module);
  }

  canDelete(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'su';
  }

  canEdit(): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return ['su', 'admin', 'editor', 'library_manager'].includes(user.role);
  }

  canView(): boolean {
    return this.isLoggedIn;
  }

  // Role checks
  isAdmin(): boolean {
    const role = this.currentUserValue?.role;
    return role === 'admin' || role === 'su';
  }

  isEditor(): boolean {
    return this.currentUserValue?.role === 'editor';
  }

  isLibraryManager(): boolean {
    return this.currentUserValue?.role === 'library_manager';
  }

  isLibraryViewer(): boolean {
    return this.currentUserValue?.role === 'library_viewer';
  }

  isViewer(): boolean {
    return this.currentUserValue?.role === 'viewer';
  }

  isLabourStaff(): boolean {
    return this.currentUserValue?.role === 'labour_staff';
  }
}
