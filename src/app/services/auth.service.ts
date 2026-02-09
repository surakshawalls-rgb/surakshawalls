// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface User {
  id: string;
  email: string;
  role: 'su' | 'admin' | 'editor' | 'library_manager' | 'library_viewer' | 'viewer';
  full_name: string;
  can_delete: boolean;
  modules: string[]; // ['library', 'manufacturing']
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.loadUserFromStorage();
  }

  // Load user from localStorage on app start
  private loadUserFromStorage() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Failed to parse user from storage:', error);
        this.logout();
      }
    }
  }

  // Get current user value synchronously
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in
  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
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
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Email not verified. Please contact admin.');
        } else if (error.message.includes('email_provider_disabled')) {
          throw new Error('Email login is disabled. Please contact admin.');
        } else {
          throw new Error(error.message);
        }
      }
      
      if (!data.user) throw new Error('Login failed. Please try again.');

      // Get user metadata (role info)
      const metadata = data.user.user_metadata || {};
      
      const user: User = {
        id: data.user.id,
        email: data.user.email || email,
        role: metadata['role'] || 'viewer',
        full_name: metadata['full_name'] || email.split('@')[0],
        can_delete: metadata['can_delete'] || false,
        modules: metadata['modules'] || ['library', 'manufacturing']
      };

      // Save to state and localStorage
      this.currentUserSubject.next(user);
      localStorage.setItem('currentUser', JSON.stringify(user));

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed. Please try again.' };
    }
  }

  // Logout
  async logout() {
    try {
      await this.supabase.supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUserSubject.next(null);
      localStorage.removeItem('currentUser');
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
    return user?.can_delete || false;
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
}
