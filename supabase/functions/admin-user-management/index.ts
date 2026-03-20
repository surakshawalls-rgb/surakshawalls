import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AppRole =
  | 'su'
  | 'admin'
  | 'editor'
  | 'library_manager'
  | 'library_viewer'
  | 'viewer'
  | 'labour_staff';

type AppModule = 'library' | 'manufacturing';

type Action =
  | 'list'
  | 'create'
  | 'update'
  | 'delete'
  | 'set_suspension'
  | 'provision_library_student';

interface RequestBody {
  action?: unknown;
  payload?: unknown;
  page?: unknown;
  per_page?: unknown;
  [key: string]: unknown;
}

interface ManagedUserRecord {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  can_delete: boolean;
  modules: AppModule[];
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
}

interface AuthenticatedRequester {
  requester: Record<string, unknown>;
  role: AppRole;
  modules: AppModule[];
}

const ALLOWED_ROLES: AppRole[] = [
  'su',
  'admin',
  'editor',
  'library_manager',
  'library_viewer',
  'viewer',
  'labour_staff',
];

const ALLOWED_MODULES: AppModule[] = ['library', 'manufacturing'];
const ADMIN_ROLES = new Set<AppRole>(['su', 'admin']);
const LIBRARY_STUDENT_PROVISION_ROLES = new Set<AppRole>([
  'su',
  'admin',
  'editor',
  'library_manager',
]);
const LIBRARY_STUDENT_EMAIL_DOMAIN = 'surakshalibrary.com';

const adminClient =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRole(value: unknown): AppRole | null {
  const role = asString(value);
  if (!role) {
    return null;
  }

  return ALLOWED_ROLES.includes(role as AppRole) ? (role as AppRole) : null;
}

function parseModules(value: unknown): AppModule[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const modules = value
    .map((item) => asString(item))
    .filter((item): item is string => item !== null);

  const unique = Array.from(new Set(modules));
  const filtered = unique.filter((module): module is AppModule =>
    ALLOWED_MODULES.includes(module as AppModule)
  );

  if (filtered.length !== unique.length) {
    return null;
  }

  return filtered;
}

function normalizeRole(value: unknown): AppRole {
  const role = parseRole(value);
  return role ?? 'viewer';
}

function normalizeModules(value: unknown): AppModule[] {
  const modules = parseModules(value);
  return modules && modules.length > 0 ? modules : ['library', 'manufacturing'];
}

function normalizeCanDelete(value: unknown): boolean {
  return value === true;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
}

function getUserMetadata(user: { user_metadata?: unknown }): Record<string, unknown> {
  if (!user.user_metadata || typeof user.user_metadata !== 'object') {
    return {};
  }

  return user.user_metadata as Record<string, unknown>;
}

function isFutureTimestamp(value: unknown): boolean {
  const timestamp = asString(value);
  if (!timestamp) {
    return false;
  }

  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) && parsed > Date.now();
}

function isUserSuspended(user: Record<string, unknown>): boolean {
  const metadata = getUserMetadata({ user_metadata: user.user_metadata });
  return metadata.is_suspended === true || isFutureTimestamp(user.banned_until);
}

function getSuspendedAt(user: Record<string, unknown>): string | null {
  const metadata = getUserMetadata({ user_metadata: user.user_metadata });
  return asString(metadata.suspended_at);
}

function normalizeEmailLocalPart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  return {
    firstName: parts[0] || 'student',
    lastName: parts.slice(1).join(' '),
  };
}

function buildLibraryStudentEmail(fullName: string, suffix?: number): string {
  const { firstName, lastName } = splitFullName(fullName);
  const localParts = [normalizeEmailLocalPart(firstName), normalizeEmailLocalPart(lastName)].filter(
    (part) => part.length > 0
  );

  const localPart = localParts.join('.') || 'student';
  const suffixedLocalPart = suffix && suffix > 1 ? `${localPart}-${suffix}` : localPart;

  return `${suffixedLocalPart}@${LIBRARY_STUDENT_EMAIL_DOMAIN}`;
}

function normalizeStudentMobile(value: string): string | null {
  const digits = value.replace(/\D/g, '');

  if (/^[6-9]\d{9,}$/.test(digits)) {
    return digits.slice(0, 10);
  }

  if (/^0[6-9]\d{9,}$/.test(digits)) {
    return digits.slice(1, 11);
  }

  if (/^91[6-9]\d{9,}$/.test(digits)) {
    return digits.slice(2, 12);
  }

  if (/^0091[6-9]\d{9,}$/.test(digits)) {
    return digits.slice(4, 14);
  }

  return null;
}

function getUserId(user: Record<string, unknown>): string {
  return typeof user.id === 'string' ? user.id : '';
}

function getUserEmail(user: Record<string, unknown>): string {
  return typeof user.email === 'string' ? user.email.toLowerCase() : '';
}

function canProvisionLibraryStudent(role: AppRole, modules: AppModule[]): boolean {
  if (!LIBRARY_STUDENT_PROVISION_ROLES.has(role)) {
    return false;
  }

  if (ADMIN_ROLES.has(role)) {
    return true;
  }

  return modules.includes('library');
}

function mapUser(user: Record<string, unknown>): ManagedUserRecord {
  const metadata = getUserMetadata({ user_metadata: user.user_metadata });
  const email = typeof user.email === 'string' ? user.email : '';

  return {
    id: typeof user.id === 'string' ? user.id : '',
    email,
    full_name:
      asString(metadata.full_name) ||
      (email.includes('@') ? email.split('@')[0] : 'User'),
    role: normalizeRole(metadata.role),
    can_delete: normalizeCanDelete(metadata.can_delete),
    modules: normalizeModules(metadata.modules),
    created_at: typeof user.created_at === 'string' ? user.created_at : null,
    last_sign_in_at:
      typeof user.last_sign_in_at === 'string' ? user.last_sign_in_at : null,
    email_confirmed_at:
      typeof user.email_confirmed_at === 'string' ? user.email_confirmed_at : null,
    is_suspended: isUserSuspended(user),
    suspended_at: getSuspendedAt(user),
  };
}

async function requireAdmin(req: Request): Promise<
  | AuthenticatedRequester
  | { error: Response }
> {
  if (!adminClient) {
    return {
      error: json(500, {
        success: false,
        error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      }),
    };
  }

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return {
      error: json(401, {
        success: false,
        error: 'Missing bearer token. Please login again.',
      }),
    };
  }

  const { data, error } = await adminClient.auth.getUser(accessToken);
  if (error || !data.user) {
    return {
      error: json(401, {
        success: false,
        error: 'Invalid or expired session. Please login again.',
      }),
    };
  }

  const metadata = getUserMetadata(data.user as unknown as { user_metadata?: unknown });
  const role = normalizeRole(metadata.role);
  const modules = parseModules(metadata.modules) ?? [];

  return {
    requester: data.user as unknown as Record<string, unknown>,
    role,
    modules,
  };
}

async function requireAuthorizedUser(
  req: Request,
  action: Action
): Promise<AuthenticatedRequester | { error: Response }> {
  const authResult = await requireAdmin(req);
  if ('error' in authResult) {
    return authResult;
  }

  if (action === 'provision_library_student') {
    if (!canProvisionLibraryStudent(authResult.role, authResult.modules)) {
      return {
        error: json(403, {
          success: false,
          error: 'Only library management users can provision student accounts.',
        }),
      };
    }

    return authResult;
  }

  if (!ADMIN_ROLES.has(authResult.role)) {
    return {
      error: json(403, {
        success: false,
        error: 'Only admin users can manage accounts.',
      }),
    };
  }

  return authResult;
}

function getAction(value: unknown): Action {
  if (
    value === 'create' ||
    value === 'update' ||
    value === 'delete' ||
    value === 'set_suspension' ||
    value === 'provision_library_student'
  ) {
    return value;
  }

  return 'list';
}

function getBodyPayload(body: RequestBody): Record<string, unknown> {
  if (body.payload && typeof body.payload === 'object') {
    return body.payload as Record<string, unknown>;
  }

  return body as Record<string, unknown>;
}

async function handleList(body: RequestBody): Promise<Response> {
  if (!adminClient) {
    return json(500, { success: false, error: 'Admin client unavailable' });
  }

  const rawPage = Number(body.page);
  const rawPerPage = Number(body.per_page);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const perPage =
    Number.isFinite(rawPerPage) && rawPerPage > 0
      ? Math.min(Math.floor(rawPerPage), 200)
      : 100;

  const { data, error } = await adminClient.auth.admin.listUsers({
    page,
    perPage,
  });

  if (error) {
    return json(500, { success: false, error: error.message });
  }

  const users = (data?.users ?? []).map((user) =>
    mapUser(user as unknown as Record<string, unknown>)
  );

  const total =
    typeof (data as Record<string, unknown> | null)?.['total'] === 'number'
      ? ((data as Record<string, unknown>)['total'] as number)
      : users.length;

  return json(200, {
    success: true,
    data: {
      users,
      page,
      per_page: perPage,
      total,
    },
  });
}

async function handleCreate(payload: Record<string, unknown>): Promise<Response> {
  if (!adminClient) {
    return json(500, { success: false, error: 'Admin client unavailable' });
  }

  const email = asString(payload.email)?.toLowerCase() || '';
  if (!email || !isValidEmail(email)) {
    return json(400, { success: false, error: 'Valid email is required.' });
  }

  const password = asString(payload.password) || '';
  if (!password || password.length < 6) {
    return json(400, { success: false, error: 'Password must be at least 6 characters.' });
  }

  const role = parseRole(payload.role);
  if (!role) {
    return json(400, { success: false, error: 'Invalid role selected.' });
  }

  const modules = parseModules(payload.modules);
  if (!modules || modules.length === 0) {
    return json(400, { success: false, error: 'Select at least one module.' });
  }

  const fullName = asString(payload.full_name) || email.split('@')[0] || 'User';
  const canDelete = payload.can_delete === true;
  const emailConfirm = payload.email_confirm !== false;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: emailConfirm,
    user_metadata: {
      role,
      full_name: fullName,
      modules,
      can_delete: canDelete,
      is_suspended: false,
      suspended_at: null,
    },
  });

  if (error || !data.user) {
    return json(400, {
      success: false,
      error: error?.message || 'Failed to create user.',
    });
  }

  return json(200, {
    success: true,
    data: mapUser(data.user as unknown as Record<string, unknown>),
  });
}

async function handleUpdate(
  payload: Record<string, unknown>,
  requester: Record<string, unknown>
): Promise<Response> {
  if (!adminClient) {
    return json(500, { success: false, error: 'Admin client unavailable' });
  }

  const userId = asString(payload.user_id);
  if (!userId) {
    return json(400, { success: false, error: 'user_id is required.' });
  }

  const updateData: Record<string, unknown> = {};
  const updateMetadata: Record<string, unknown> = {};
  let hasMetadataUpdate = false;

  if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
    const email = asString(payload.email)?.toLowerCase() || '';
    if (!email || !isValidEmail(email)) {
      return json(400, { success: false, error: 'Invalid email.' });
    }

    updateData.email = email;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'password')) {
    const password = asString(payload.password);
    if (!password || password.length < 6) {
      return json(400, {
        success: false,
        error: 'New password must be at least 6 characters.',
      });
    }

    updateData.password = password;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'full_name')) {
    const fullName = asString(payload.full_name);
    if (!fullName) {
      return json(400, { success: false, error: 'Full name cannot be empty.' });
    }

    updateMetadata.full_name = fullName;
    hasMetadataUpdate = true;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'role')) {
    const role = parseRole(payload.role);
    if (!role) {
      return json(400, { success: false, error: 'Invalid role selected.' });
    }

    if (userId === requester.id && !ADMIN_ROLES.has(role)) {
      return json(400, {
        success: false,
        error: 'You cannot remove your own admin access.',
      });
    }

    updateMetadata.role = role;
    hasMetadataUpdate = true;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'modules')) {
    const modules = parseModules(payload.modules);
    if (!modules || modules.length === 0) {
      return json(400, {
        success: false,
        error: 'Select at least one valid module.',
      });
    }

    updateMetadata.modules = modules;
    hasMetadataUpdate = true;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'can_delete')) {
    updateMetadata.can_delete = payload.can_delete === true;
    hasMetadataUpdate = true;
  }

  if (Object.keys(updateData).length === 0 && !hasMetadataUpdate) {
    return json(400, { success: false, error: 'No changes provided for update.' });
  }

  if (hasMetadataUpdate) {
    const { data: existingData, error: existingError } = await adminClient.auth.admin.getUserById(userId);

    if (existingError || !existingData.user) {
      return json(404, {
        success: false,
        error: existingError?.message || 'User not found.',
      });
    }

    const currentMetadata = getUserMetadata(
      existingData.user as unknown as { user_metadata?: unknown }
    );

    updateData.user_metadata = {
      ...currentMetadata,
      ...updateMetadata,
    };
  }

  const { data, error } = await adminClient.auth.admin.updateUserById(userId, updateData);

  if (error || !data.user) {
    return json(400, {
      success: false,
      error: error?.message || 'Failed to update user.',
    });
  }

  return json(200, {
    success: true,
    data: mapUser(data.user as unknown as Record<string, unknown>),
  });
}

async function handleDelete(
  payload: Record<string, unknown>,
  requester: Record<string, unknown>
): Promise<Response> {
  if (!adminClient) {
    return json(500, { success: false, error: 'Admin client unavailable' });
  }

  const userId = asString(payload.user_id);
  if (!userId) {
    return json(400, { success: false, error: 'user_id is required.' });
  }

  if (userId === requester.id) {
    return json(400, {
      success: false,
      error: 'You cannot delete your own account.',
    });
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    return json(400, {
      success: false,
      error: error.message,
    });
  }

  return json(200, {
    success: true,
    data: { user_id: userId },
  });
}

async function handleSetSuspension(
  payload: Record<string, unknown>,
  requester: Record<string, unknown>
): Promise<Response> {
  if (!adminClient) {
    return json(500, { success: false, error: 'Admin client unavailable' });
  }

  const userId = asString(payload.user_id);
  if (!userId) {
    return json(400, { success: false, error: 'user_id is required.' });
  }

  if (typeof payload.is_suspended !== 'boolean') {
    return json(400, {
      success: false,
      error: 'is_suspended must be a boolean value.',
    });
  }

  if (userId === requester.id) {
    return json(400, {
      success: false,
      error: 'You cannot suspend your own account.',
    });
  }

  const { data: existingData, error: existingError } = await adminClient.auth.admin.getUserById(userId);

  if (existingError || !existingData.user) {
    return json(404, {
      success: false,
      error: existingError?.message || 'User not found.',
    });
  }

  const currentMetadata = getUserMetadata(
    existingData.user as unknown as { user_metadata?: unknown }
  );

  const isSuspended = payload.is_suspended;
  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: isSuspended ? '876000h' : 'none',
    user_metadata: {
      ...currentMetadata,
      is_suspended: isSuspended,
      suspended_at: isSuspended ? new Date().toISOString() : null,
    },
  });

  if (error || !data.user) {
    return json(400, {
      success: false,
      error:
        error?.message ||
        (isSuspended ? 'Failed to suspend user.' : 'Failed to reactivate user.'),
    });
  }

  return json(200, {
    success: true,
    data: mapUser(data.user as unknown as Record<string, unknown>),
  });
}

async function listAllUsers(): Promise<Record<string, unknown>[]> {
  if (!adminClient) {
    throw new Error('Admin client unavailable');
  }

  const perPage = 200;
  const users: Record<string, unknown>[] = [];

  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data?.users ?? []).map((user) => user as unknown as Record<string, unknown>);
    users.push(...batch);

    if (batch.length < perPage) {
      break;
    }
  }

  return users;
}

function resolveUniqueLibraryStudentEmail(
  fullName: string,
  users: Record<string, unknown>[],
  currentUserId?: string
): string {
  const emailOwners = new Map<string, string>();

  for (const user of users) {
    const email = getUserEmail(user);
    const userId = getUserId(user);
    if (email && userId) {
      emailOwners.set(email, userId);
    }
  }

  for (let suffix = 1; suffix <= 999; suffix += 1) {
    const candidate = buildLibraryStudentEmail(fullName, suffix === 1 ? undefined : suffix);
    const ownerId = emailOwners.get(candidate.toLowerCase());

    if (!ownerId || ownerId === currentUserId) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique library student email.');
}

async function handleProvisionLibraryStudent(
  payload: Record<string, unknown>
): Promise<Response> {
  if (!adminClient) {
    return json(500, { success: false, error: 'Admin client unavailable' });
  }

  const studentId = asString(payload.student_id);
  if (!studentId) {
    return json(400, { success: false, error: 'student_id is required.' });
  }

  const fullName = asString(payload.full_name);
  if (!fullName) {
    return json(400, { success: false, error: 'full_name is required.' });
  }

  const mobile = asString(payload.mobile);
  if (!mobile) {
    return json(400, { success: false, error: 'mobile is required.' });
  }

  const normalizedMobile = normalizeStudentMobile(mobile);
  if (!normalizedMobile) {
    return json(400, {
      success: false,
      error: 'Mobile number must resolve to a valid 10-digit number.',
    });
  }

  const password = normalizedMobile;

  let users: Record<string, unknown>[];
  try {
    users = await listAllUsers();
  } catch (error) {
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load existing users.',
    });
  }

  const matchingUserByStudentId = users.find((user) => {
    const metadata = getUserMetadata({ user_metadata: user.user_metadata });
    return asString(metadata.library_student_id) === studentId;
  });

  const matchingUserByMobile = users.find((user) => {
    const metadata = getUserMetadata({ user_metadata: user.user_metadata });
    return (
      normalizeStudentMobile(asString(metadata.mobile) || '') === normalizedMobile &&
      normalizeRole(metadata.role) === 'library_viewer'
    );
  });

  const existingUser = matchingUserByStudentId || matchingUserByMobile || null;
  const existingUserId = existingUser ? getUserId(existingUser) : undefined;
  const resolvedEmail = resolveUniqueLibraryStudentEmail(fullName, users, existingUserId);
  const { firstName, lastName } = splitFullName(fullName);
  const existingMetadata = existingUser
    ? getUserMetadata({ user_metadata: existingUser.user_metadata })
    : {};

  const nextMetadata = {
    ...existingMetadata,
    role: 'library_viewer' satisfies AppRole,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    mobile: normalizedMobile,
    library_student_id: studentId,
    modules: ['library'] satisfies AppModule[],
    can_delete: false,
    is_suspended: existingMetadata.is_suspended === true,
    suspended_at: asString(existingMetadata.suspended_at),
  };

  if (existingUser && existingUserId) {
    const { data, error } = await adminClient.auth.admin.updateUserById(existingUserId, {
      email: resolvedEmail,
      password,
      user_metadata: nextMetadata,
    });

    if (error || !data.user) {
      return json(400, {
        success: false,
        error: error?.message || 'Failed to update library student account.',
      });
    }

    return json(200, {
      success: true,
      data: mapUser(data.user as unknown as Record<string, unknown>),
    });
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email: resolvedEmail,
    password,
    email_confirm: true,
    user_metadata: nextMetadata,
  });

  if (error || !data.user) {
    return json(400, {
      success: false,
      error: error?.message || 'Failed to create library student account.',
    });
  }

  return json(200, {
    success: true,
    data: mapUser(data.user as unknown as Record<string, unknown>),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json(405, { success: false, error: 'Method not allowed.' });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json(400, { success: false, error: 'Invalid JSON body.' });
  }

  const action = getAction(body.action);
  const authResult = await requireAuthorizedUser(req, action);
  if ('error' in authResult) {
    return authResult.error;
  }

  const payload = getBodyPayload(body);

  if (action === 'list') {
    return handleList(body);
  }

  if (action === 'create') {
    return handleCreate(payload);
  }

  if (action === 'update') {
    return handleUpdate(payload, authResult.requester);
  }

  if (action === 'delete') {
    if (authResult.role !== 'su') {
      return json(403, {
        success: false,
        error: 'Only Super Admin accounts can delete users.',
      });
    }
    return handleDelete(payload, authResult.requester);
  }

  if (action === 'set_suspension') {
    return handleSetSuspension(payload, authResult.requester);
  }

  if (action === 'provision_library_student') {
    return handleProvisionLibraryStudent(payload);
  }

  return json(400, { success: false, error: 'Unsupported action.' });
});
