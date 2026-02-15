/**
 * API client for Magpie backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================================================
// Types
// ============================================================================

export type Severity = "critical" | "high" | "medium" | "low";

export interface DetectionOption {
  id: string;
  label: string;
  enabled: boolean;
}

export interface PolicySection {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  policy_text: string;
  options: DetectionOption[];
  enabled: boolean;
}

export interface PolicyCategory {
  id: string;
  name: string;
  enabled: boolean;
  sections: PolicySection[];
}

export interface PolicyConfig {
  categories: PolicyCategory[];
}

export interface Policy {
  id: string;
  project_id: string;
  is_active: boolean;
  config: PolicyConfig;
  created_at: string;
  updated_at: string | null;
}

export interface PolicyUpdate {
  is_active?: boolean;
  config?: PolicyConfig;
}

export interface CategoryToggle {
  category_id: string;
  enabled: boolean;
}

export interface SectionToggle {
  category_id: string;
  section_id: string;
  enabled: boolean;
}

export interface OptionToggle {
  category_id: string;
  section_id: string;
  option_id: string;
  enabled: boolean;
}

// ============================================================================
// API Error Handling
// ============================================================================

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }
  return response.json();
}

// ============================================================================
// Policy API
// ============================================================================

/**
 * Get or create policy for a project
 */
export async function getPolicy(projectId: string): Promise<Policy> {
  return apiFetch<Policy>(
    `${API_BASE_URL}/api/v1/policies/project/${projectId}`,
    {
      method: "GET",
    },
  );
}

/**
 * Update policy configuration
 */
export async function updatePolicy(
  policyId: string,
  data: PolicyUpdate,
): Promise<Policy> {
  return apiFetch<Policy>(`${API_BASE_URL}/api/v1/policies/${policyId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Toggle a category's enabled state
 */
export async function toggleCategory(
  policyId: string,
  categoryId: string,
  enabled: boolean,
): Promise<Policy> {
  return apiFetch<Policy>(
    `${API_BASE_URL}/api/v1/policies/${policyId}/toggle/category`,
    {
      method: "POST",
      body: JSON.stringify({ category_id: categoryId, enabled }),
    },
  );
}

/**
 * Toggle a section's enabled state
 */
export async function toggleSection(
  policyId: string,
  categoryId: string,
  sectionId: string,
  enabled: boolean,
): Promise<Policy> {
  return apiFetch<Policy>(
    `${API_BASE_URL}/api/v1/policies/${policyId}/toggle/section`,
    {
      method: "POST",
      body: JSON.stringify({
        category_id: categoryId,
        section_id: sectionId,
        enabled,
      }),
    },
  );
}

/**
 * Toggle a detection option's enabled state
 */
export async function toggleOption(
  policyId: string,
  categoryId: string,
  sectionId: string,
  optionId: string,
  enabled: boolean,
): Promise<Policy> {
  return apiFetch<Policy>(
    `${API_BASE_URL}/api/v1/policies/${policyId}/toggle/option`,
    {
      method: "POST",
      body: JSON.stringify({
        category_id: categoryId,
        section_id: sectionId,
        option_id: optionId,
        enabled,
      }),
    },
  );
}

/**
 * Reset policy to default configuration
 */
export async function resetPolicy(policyId: string): Promise<Policy> {
  return apiFetch<Policy>(`${API_BASE_URL}/api/v1/policies/${policyId}/reset`, {
    method: "POST",
  });
}

// ============================================================================
// Projects API (placeholder for future use)
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export async function getProjects(): Promise<Project[]> {
  return apiFetch(`${API_BASE_URL}/api/v1/projects`);
}

export async function getProject(projectId: string): Promise<Project> {
  return apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}`);
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string },
): Promise<Project> {
  return apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  return apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    method: "DELETE",
  });
}

// ============================================================================
// API Keys API
// ============================================================================

export interface ApiKey {
  id: string;
  project_id: string;
  key_prefix: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface GeneratedApiKey extends ApiKey {
  api_key: string; // Full plaintext key - only shown once
}

export async function getApiKeys(projectId: string): Promise<ApiKey[]> {
  return apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/api-keys`);
}

export async function createApiKey(
  projectId: string,
  name?: string,
): Promise<GeneratedApiKey> {
  return apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/api-keys`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function deleteApiKey(
  projectId: string,
  keyId: string,
): Promise<void> {
  return apiFetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/api-keys/${keyId}`,
    {
      method: "DELETE",
    },
  );
}

// ============================================================================
// Execution Logs API
// ============================================================================

export interface ExecutionLog {
  id: string;
  project_id: string;
  trace_id: string;
  input: string | null;
  output: string | null;
  custom_data: Record<string, any> | null;
  total_latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  context_utilization: number | null;
  input_cost: number | null;
  output_cost: number | null;
  total_cost: number | null;
  status: string;
  error_message: string | null;
  function_name: string | null;
  pii_detection: Record<string, any> | null;
  content_moderation: Record<string, any> | null;
  schema_validation: Record<string, any> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ExecutionLogsResponse {
  logs: ExecutionLog[];
  total: number;
}

export interface ObservabilityStats {
  total_requests: number;
  success_rate: number;
  total_cost: number;
  avg_latency_ms: number;
}

export async function getObservabilityStats(
  projectId: string,
  apiKey: string,
): Promise<ObservabilityStats> {
  const params = new URLSearchParams();
  if (projectId) {
    params.set("project_id", projectId);
  }
  const url = params.toString()
    ? `${API_BASE_URL}/api/v1/logs/stats/overview?${params.toString()}`
    : `${API_BASE_URL}/api/v1/logs/stats/overview`;

  return apiFetch<ObservabilityStats>(url);
}

export async function getExecutionLogs(
  projectId: string,
  apiKey: string,
  skip: number = 0,
  limit: number = 10,
  customKey?: string,
  customValue?: string,
): Promise<ExecutionLog[]> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  if (projectId) {
    params.set("project_id", projectId);
  }
  if (customKey && customValue !== undefined) {
    params.set("custom_key", customKey);
    params.set("custom_value", customValue);
  }

  return apiFetch<ExecutionLog[]>(
    `${API_BASE_URL}/api/v1/logs/?${params.toString()}`,
  );
}

export async function getExecutionLog(
  logId: string,
  projectId?: string,
): Promise<ExecutionLog> {
  const params = new URLSearchParams();
  if (projectId) {
    params.set("project_id", projectId);
  }
  const queryString = params.toString();
  return apiFetch<ExecutionLog>(
    `${API_BASE_URL}/api/v1/logs/${logId}${
      queryString ? "?" + queryString : ""
    }`,
  );
}

// ============================================================================
// Review Queue
// ============================================================================

export interface ReviewQueueItem {
  id: string;
  execution_log_id: string;
  project_id: string;
  content_type: "user_input" | "ai_output";
  content_text: string;
  severity: "low" | "medium" | "high" | "critical";
  flagged_policies: string[] | null;
  violation_reasons: Record<string, any> | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by_user_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewQueueStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  by_severity: Record<string, number>;
  by_content_type: Record<string, number>;
}

export async function getReviewQueueItems(
  projectId: string,
  status?: string,
  skip: number = 0,
  limit: number = 10,
): Promise<ReviewQueueItem[]> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  if (status) {
    params.set("status", status);
  }

  const response = await apiFetch<{
    items: ReviewQueueItem[];
    total: number;
    skip: number;
    limit: number;
  }>(
    `${API_BASE_URL}/api/v1/projects/${projectId}/review-queue?${params.toString()}`,
  );
  return response.items;
}

export async function getReviewQueueStats(
  projectId: string,
): Promise<ReviewQueueStats> {
  return apiFetch<ReviewQueueStats>(
    `${API_BASE_URL}/api/v1/projects/${projectId}/review-queue/stats`,
  );
}

export async function getReviewQueueItem(
  itemId: string,
): Promise<ReviewQueueItem> {
  return apiFetch<ReviewQueueItem>(
    `${API_BASE_URL}/api/v1/review-queue/${itemId}`,
  );
}

export async function updateReviewQueueItem(
  itemId: string,
  status: "approved" | "rejected",
  reviewNotes?: string,
): Promise<ReviewQueueItem> {
  return apiFetch<ReviewQueueItem>(
    `${API_BASE_URL}/api/v1/review-queue/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
        review_notes: reviewNotes,
      }),
    },
  );
}

// ============================================================================
// Audit Logs API
// ============================================================================

export interface AuditLog {
  id: string;
  user_id: string;
  user_email?: string;
  action: string;
  description?: string;
  created_at: string;
}

export async function getAuditLogs(
  projectId: string,
  skip: number = 0,
  limit: number = 20,
  action?: string,
  userId?: string,
): Promise<AuditLog[]> {
  const params = new URLSearchParams({
    project_id: projectId,
    skip: skip.toString(),
    limit: limit.toString(),
  });
  if (action) {
    params.set("action", action);
  }
  if (userId) {
    params.set("user_id", userId);
  }

  const response = await apiFetch<{
    items: AuditLog[];
    total: number;
    skip: number;
    limit: number;
  }>(`${API_BASE_URL}/api/v1/audit-logs?${params.toString()}`);

  return response.items || [];
}

export async function getAuditLog(auditLogId: string): Promise<AuditLog> {
  return apiFetch<AuditLog>(`${API_BASE_URL}/api/v1/audit-logs/${auditLogId}`);
}

// ============================================================================
// Team Members API
// ============================================================================

export interface TeamMember {
  user_id: string;
  email: string;
  name: string;
  role: string;
  joined_at: string;
}

export interface PendingInvitation {
  id: string;
  project_id: string;
  invited_email: string;
  role: string;
  status: string;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string | null;
}

export interface InviteUserRequest {
  email: string;
  role?: "admin" | "member" | "viewer";
}

export interface InvitationResponse {
  id: string;
  project_id: string;
  invited_email: string;
  role: string;
  status: string;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string | null;
}

export async function inviteMember(
  projectId: string,
  email: string,
  role: "admin" | "member" | "viewer" = "member",
): Promise<InvitationResponse> {
  return apiFetch<InvitationResponse>(
    `${API_BASE_URL}/api/v1/projects/${projectId}/team/invite`,
    {
      method: "POST",
      body: JSON.stringify({ email, role }),
    },
  );
}

export async function listTeamMembers(
  projectId: string,
): Promise<TeamMember[]> {
  return apiFetch<TeamMember[]>(
    `${API_BASE_URL}/api/v1/projects/${projectId}/team/members`,
  );
}

export async function listPendingInvitations(
  projectId: string,
): Promise<PendingInvitation[]> {
  return apiFetch<PendingInvitation[]>(
    `${API_BASE_URL}/api/v1/projects/${projectId}/team/invitations`,
  );
}

export async function removeMember(
  projectId: string,
  userId: string,
): Promise<void> {
  return apiFetch<void>(
    `${API_BASE_URL}/api/v1/projects/${projectId}/team/members/${userId}`,
    {
      method: "DELETE",
    },
  );
}

export async function cancelInvitation(
  projectId: string,
  invitationId: string,
): Promise<void> {
  return apiFetch<void>(
    `${API_BASE_URL}/api/v1/projects/${projectId}/team/invitations/${invitationId}`,
    {
      method: "DELETE",
    },
  );
}
