import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../services/auth.service';
import {
  AdminUserService,
  AppUserModule,
  AppUserRole,
  CreateManagedUserInput,
  ManagedAuthUser,
  UpdateManagedUserInput,
} from '../../services/admin-user.service';
import { NotificationService } from '../../services/notification.service';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';

interface UserFormModel {
  email: string;
  full_name: string;
  role: AppUserRole;
  modules: AppUserModule[];
  can_delete: boolean;
  password: string;
}

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSelectModule,
    MfgFooterComponent,
  ],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css'],
})
export class AdminUserManagementComponent implements OnInit {
  users: ManagedAuthUser[] = [];
  filteredUsers: ManagedAuthUser[] = [];
  loading = false;
  saving = false;
  searchTerm = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showSuspendModal = false;

  editingUser: ManagedAuthUser | null = null;
  deletingUser: ManagedAuthUser | null = null;
  suspendingUser: ManagedAuthUser | null = null;
  suspendTargetState = false;

  createForm: UserFormModel = this.buildDefaultForm();
  editForm: UserFormModel = this.buildDefaultForm();

  displayedColumns: string[] = [
    'full_name',
    'email',
    'role',
    'modules',
    'can_delete',
    'status',
    'last_sign_in_at',
    'actions',
  ];

  readonly roleOptions: AppUserRole[] = [
    'su',
    'admin',
    'editor',
    'library_manager',
    'library_viewer',
    'viewer',
    'labour_staff',
  ];

  readonly moduleOptions: AppUserModule[] = ['library', 'manufacturing'];

  readonly operationFallbackMessages = {
    load: 'Unable to load user accounts right now. Please try again.',
    create: 'Unable to create the user right now. Please try again.',
    update: 'Unable to save user changes right now. Please try again.',
    suspend: 'Unable to update the user status right now. Please try again.',
    delete: 'Unable to delete the user right now. Please try again.',
  } as const;

  constructor(
    private adminUserService: AdminUserService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  private buildDefaultForm(): UserFormModel {
    return {
      email: '',
      full_name: '',
      role: 'viewer',
      modules: ['library'],
      can_delete: false,
      password: '',
    };
  }

  async loadUsers(): Promise<void> {
    this.loading = true;

    try {
      this.users = await this.adminUserService.listUsers();
      this.applyFilter();
    } catch (error: any) {
      this.notificationService.notify(
        'Users',
        this.getFriendlyUserMessage(error, this.operationFallbackMessages.load),
        'error'
      );
    } finally {
      this.loading = false;
    }
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter((user) => {
      const modules = user.modules.join(', ').toLowerCase();
      const status = user.is_suspended ? 'suspended disabled blocked' : 'active enabled';
      return (
        user.full_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        modules.includes(term) ||
        status.includes(term)
      );
    });
  }

  openCreateModal(): void {
    this.createForm = this.buildDefaultForm();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  async createUser(): Promise<void> {
    const validationMessage = this.validateForm(this.createForm, true);
    if (validationMessage) {
      this.notificationService.notify('Check the Form', validationMessage, 'warning');
      return;
    }

    const input: CreateManagedUserInput = {
      email: this.createForm.email.trim().toLowerCase(),
      password: this.createForm.password,
      full_name: this.createForm.full_name.trim(),
      role: this.createForm.role,
      modules: [...this.createForm.modules],
      can_delete: this.createForm.can_delete,
    };

    this.saving = true;

    try {
      await this.adminUserService.createUser(input);
      this.notificationService.notify('Users', 'User created successfully.', 'success');
      this.closeCreateModal();
      await this.loadUsers();
    } catch (error: any) {
      this.notificationService.notify(
        'Users',
        this.getFriendlyUserMessage(error, this.operationFallbackMessages.create),
        'error'
      );
    } finally {
      this.saving = false;
    }
  }

  openEditModal(user: ManagedAuthUser): void {
    this.editingUser = user;
    this.editForm = {
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      modules: [...user.modules],
      can_delete: user.can_delete,
      password: '',
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
  }

  async updateUser(): Promise<void> {
    if (!this.editingUser) {
      return;
    }

    const validationMessage = this.validateForm(this.editForm, false);
    if (validationMessage) {
      this.notificationService.notify('Check the Form', validationMessage, 'warning');
      return;
    }

    const input: UpdateManagedUserInput = {
      email: this.editForm.email.trim().toLowerCase(),
      full_name: this.editForm.full_name.trim(),
      role: this.editForm.role,
      modules: [...this.editForm.modules],
      can_delete: this.editForm.can_delete,
    };

    if (this.editForm.password.trim()) {
      input.password = this.editForm.password;
    }

    this.saving = true;

    try {
      await this.adminUserService.updateUser(this.editingUser.id, input);
      this.notificationService.notify('Users', 'User updated successfully.', 'success');
      this.closeEditModal();
      await this.loadUsers();
    } catch (error: any) {
      this.notificationService.notify(
        'Users',
        this.getFriendlyUserMessage(error, this.operationFallbackMessages.update),
        'error'
      );
    } finally {
      this.saving = false;
    }
  }

  openDeleteModal(user: ManagedAuthUser): void {
    this.deletingUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingUser = null;
  }

  openSuspendModal(user: ManagedAuthUser): void {
    if (this.isCurrentUser(user)) {
      this.notificationService.notify('Users', 'You cannot suspend your own account.', 'warning');
      return;
    }

    this.suspendingUser = user;
    this.suspendTargetState = !user.is_suspended;
    this.showSuspendModal = true;
  }

  closeSuspendModal(): void {
    this.showSuspendModal = false;
    this.suspendingUser = null;
    this.suspendTargetState = false;
  }

  async updateSuspension(): Promise<void> {
    if (!this.suspendingUser) {
      return;
    }

    if (this.isCurrentUser(this.suspendingUser)) {
      this.notificationService.notify('Users', 'You cannot suspend your own account.', 'warning');
      this.closeSuspendModal();
      return;
    }

    this.saving = true;

    try {
      await this.adminUserService.setSuspended(this.suspendingUser.id, this.suspendTargetState);
      this.notificationService.notify(
        'Users',
        this.suspendTargetState
          ? 'User suspended successfully. Login is now blocked.'
          : 'User re-enabled successfully. Login is allowed again.',
        'success'
      );
      this.closeSuspendModal();
      await this.loadUsers();
    } catch (error: any) {
      this.notificationService.notify(
        'Users',
        this.getFriendlyUserMessage(error, this.operationFallbackMessages.suspend),
        'error'
      );
    } finally {
      this.saving = false;
    }
  }

  async deleteUser(): Promise<void> {
    if (!this.deletingUser) {
      return;
    }

    if (this.isCurrentUser(this.deletingUser)) {
      this.notificationService.notify('Users', 'You cannot delete your own account.', 'warning');
      this.closeDeleteModal();
      return;
    }

    this.saving = true;

    try {
      await this.adminUserService.deleteUser(this.deletingUser.id);
      this.notificationService.notify('Users', 'User deleted successfully.', 'success');
      this.closeDeleteModal();
      await this.loadUsers();
    } catch (error: any) {
      this.notificationService.notify(
        'Users',
        this.getFriendlyUserMessage(error, this.operationFallbackMessages.delete),
        'error'
      );
    } finally {
      this.saving = false;
    }
  }

  toggleModuleSelection(
    formType: 'create' | 'edit',
    module: AppUserModule,
    checked: boolean
  ): void {
    const form = formType === 'create' ? this.createForm : this.editForm;

    if (checked) {
      if (!form.modules.includes(module)) {
        form.modules = [...form.modules, module];
      }
      return;
    }

    form.modules = form.modules.filter((item) => item !== module);
  }

  isModuleSelected(formType: 'create' | 'edit', module: AppUserModule): boolean {
    const form = formType === 'create' ? this.createForm : this.editForm;
    return form.modules.includes(module);
  }

  isCurrentUser(user: ManagedAuthUser): boolean {
    return this.authService.currentUserValue?.id === user.id;
  }

  isSuperAdmin(): boolean {
    return this.authService.currentUserValue?.role === 'su';
  }

  roleLabel(role: AppUserRole): string {
    const labels: Record<AppUserRole, string> = {
      su: 'Super Admin',
      admin: 'Admin',
      editor: 'Editor',
      library_manager: 'Library Manager',
      library_viewer: 'Library Viewer',
      viewer: 'Viewer',
      labour_staff: 'Labour Staff',
    };

    return labels[role] || role;
  }

  formatModules(modules: AppUserModule[]): string {
    if (!modules.length) {
      return 'None';
    }

    return modules
      .map((module) => (module === 'library' ? 'Library' : 'Manufacturing'))
      .join(', ');
  }

  moduleLabel(module: AppUserModule): string {
    return module === 'library' ? 'Library' : 'Manufacturing';
  }

  formatDate(value: string | null): string {
    if (!value) {
      return 'Never';
    }

    return new Date(value).toLocaleString('en-IN');
  }

  statusLabel(user: ManagedAuthUser): string {
    return user.is_suspended ? 'Suspended' : 'Active';
  }

  statusDetail(user: ManagedAuthUser): string {
    if (user.is_suspended) {
      return user.suspended_at
        ? `Disabled on ${this.formatDate(user.suspended_at)}`
        : 'Login access is currently blocked';
    }

    return 'Login access is active';
  }

  lastLoginDetail(user: ManagedAuthUser): string {
    return user.last_sign_in_at ? 'Most recent sign-in' : 'No sign-in recorded yet';
  }

  suspendActionLabel(user: ManagedAuthUser): string {
    return user.is_suspended ? 'Re-enable' : 'Suspend';
  }

  suspendActionTooltip(user: ManagedAuthUser): string {
    return user.is_suspended
      ? 'Allow this user to log in again'
      : 'Temporarily block this user from logging in';
  }

  private getFriendlyUserMessage(error: unknown, fallback: string): string {
    const rawMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message || '')
        : '';

    const normalizedMessage = rawMessage.trim().toLowerCase();

    if (!normalizedMessage) {
      return fallback;
    }

    if (
      normalizedMessage.includes('session not found') ||
      normalizedMessage.includes('session expired') ||
      normalizedMessage.includes('invalid or expired session') ||
      normalizedMessage.includes('missing bearer token')
    ) {
      return 'Your session has expired. Please log in again and retry.';
    }

    if (
      normalizedMessage.includes('fetch failed') ||
      normalizedMessage.includes('failed to fetch') ||
      normalizedMessage.includes('network')
    ) {
      return 'Unable to connect to the server. Check your internet connection and try again.';
    }

    if (
      normalizedMessage.includes('already registered') ||
      normalizedMessage.includes('already exists') ||
      normalizedMessage.includes('duplicate key value')
    ) {
      return 'An account with this email address already exists.';
    }

    if (normalizedMessage.includes('invalid email')) {
      return 'Enter a valid email address before saving.';
    }

    if (normalizedMessage.includes('password must be at least 6')) {
      return 'Password must contain at least 6 characters.';
    }

    if (normalizedMessage.includes('full name')) {
      return 'Enter the full name for this user.';
    }

    if (normalizedMessage.includes('invalid role selected')) {
      return 'Choose a valid role for this user.';
    }

    if (normalizedMessage.includes('select at least one valid module')) {
      return 'Select at least one valid module for this user.';
    }

    if (normalizedMessage.includes('select at least one module')) {
      return 'Select at least one module the user can access.';
    }

    if (normalizedMessage.includes('no changes provided')) {
      return 'Update at least one field before saving changes.';
    }

    if (normalizedMessage.includes('user not found')) {
      return 'This user could not be found. Refresh the list and try again.';
    }

    if (normalizedMessage.includes('only admin users can manage accounts')) {
      return 'You do not have permission to manage user accounts.';
    }

    if (normalizedMessage.includes('you cannot suspend your own account')) {
      return 'You cannot suspend your own account.';
    }

    if (normalizedMessage.includes('you cannot delete your own account')) {
      return 'You cannot delete your own account.';
    }

    return fallback;
  }

  private validateForm(form: UserFormModel, requirePassword: boolean): string | null {
    const email = form.email.trim().toLowerCase();
    const fullName = form.full_name.trim();

    if (!fullName) {
      return 'Enter the full name for this user.';
    }

    if (!email) {
      return 'Enter the email address for this user.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Enter a valid email address, for example name@company.com.';
    }

    if (!form.modules.length) {
      return 'Select at least one module the user can access.';
    }

    if (requirePassword) {
      if (!form.password || form.password.length < 6) {
        return 'Create a password with at least 6 characters.';
      }
    } else if (form.password.trim() && form.password.trim().length < 6) {
      return 'New password must contain at least 6 characters.';
    }

    return null;
  }
}
