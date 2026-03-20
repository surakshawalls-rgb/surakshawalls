import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User } from './auth.service';
import { SupabaseService } from './supabase.service';

export type AppUserRole = User['role'];
export type AppUserModule = 'library' | 'manufacturing';

export interface ManagedAuthUser {
  id: string;
  email: string;
  full_name: string;
  role: AppUserRole;
  can_delete: boolean;
  modules: AppUserModule[];
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
}

export interface CreateManagedUserInput {
  email: string;
  password: string;
  full_name: string;
  role: AppUserRole;
  modules: AppUserModule[];
  can_delete: boolean;
}

export interface UpdateManagedUserInput {
  email?: string;
  password?: string;
  full_name?: string;
  role?: AppUserRole;
  modules?: AppUserModule[];
  can_delete?: boolean;
}

export interface ProvisionLibraryStudentUserInput {
  student_id: string;
  full_name: string;
  mobile: string;
}

interface EdgeResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ListUsersResponse {
  users: ManagedAuthUser[];
  page: number;
  per_page: number;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  private platformId = inject(PLATFORM_ID);
  private readonly sessionStorageKey = 'supabaseSession';

  constructor(private supabase: SupabaseService) {}

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!isPlatformBrowser(this.platformId)) {
      return {};
    }

    const sessionJson = localStorage.getItem(this.sessionStorageKey);
    if (!sessionJson) {
      throw new Error('Session not found. Please login again.');
    }

    let parsed: { access_token?: string; refresh_token?: string };
    try {
      parsed = JSON.parse(sessionJson) as { access_token?: string; refresh_token?: string };
    } catch {
      localStorage.removeItem(this.sessionStorageKey);
      throw new Error('Session is corrupted. Please login again.');
    }

    if (!parsed.refresh_token) {
      localStorage.removeItem(this.sessionStorageKey);
      throw new Error('Session is incomplete. Please login again.');
    }

    const { data, error } = await this.supabase.supabase.auth.refreshSession({
      refresh_token: parsed.refresh_token,
    });

    if (error || !data.session?.access_token || !data.session?.refresh_token) {
      localStorage.removeItem(this.sessionStorageKey);
      throw new Error('Session expired. Please login again.');
    }

    localStorage.setItem(
      this.sessionStorageKey,
      JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
    );

    return {
      Authorization: `Bearer ${data.session.access_token}`,
    };
  }

  private async invoke<T>(body: Record<string, unknown>): Promise<T> {
    const headers = await this.getAuthHeaders();

    const { data, error } = await this.supabase.supabase.functions.invoke<EdgeResponse<T>>(
      'admin-user-management',
      { body, headers }
    );

    if (error) {
      throw new Error(error.message || 'Failed to call admin-user-management function.');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Admin user operation failed.');
    }

    if (data.data === undefined) {
      throw new Error('Invalid response received from admin user function.');
    }

    return data.data;
  }

  async listUsers(page = 1, perPage = 200): Promise<ManagedAuthUser[]> {
    const response = await this.invoke<ListUsersResponse>({
      action: 'list',
      page,
      per_page: perPage,
    });

    return response.users || [];
  }

  async createUser(input: CreateManagedUserInput): Promise<ManagedAuthUser> {
    return this.invoke<ManagedAuthUser>({
      action: 'create',
      payload: input,
    });
  }

  async updateUser(userId: string, input: UpdateManagedUserInput): Promise<ManagedAuthUser> {
    return this.invoke<ManagedAuthUser>({
      action: 'update',
      payload: {
        user_id: userId,
        ...input,
      },
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.invoke<{ user_id: string }>({
      action: 'delete',
      payload: { user_id: userId },
    });
  }

  async setSuspended(userId: string, isSuspended: boolean): Promise<ManagedAuthUser> {
    return this.invoke<ManagedAuthUser>({
      action: 'set_suspension',
      payload: {
        user_id: userId,
        is_suspended: isSuspended,
      },
    });
  }

  async provisionLibraryStudentUser(
    input: ProvisionLibraryStudentUserInput
  ): Promise<ManagedAuthUser> {
    return this.invoke<ManagedAuthUser>({
      action: 'provision_library_student',
      payload: input,
    });
  }
}
