// Compute API base URL at call-time (not module load time) so that
// NEXT_PUBLIC_* env vars baked in at build time are always used correctly.
// The Jupyter proxy forwards /proxy/8001 → localhost:8001 on the server side.
function getApiBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) return apiUrl;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return basePath.includes('/3000') ? basePath.replace('/3000', '/8001') : `${basePath}/api`;
}

// Keep API_BASE as a convenience export (evaluated at first import — fine for client bundles)
export const API_BASE = getApiBase();

export interface GitRepoDTO {
  project_name: string;
  project_description?: string;
  project_type: 'maven' | 'gradle';
  /** Accepts both HTTPS and SSH git URLs */
  git_repo_url: string;
  build_args?: string;
  schedule_type?: string;
  schedule_config?: string;
}

export interface ProjectDetailsDTO {
  project_id: number;
  project_name: string;
  project_description?: string;
  project_type: string;
  git_repo_url: string;
  status?: number;
}

export interface ResponseDTO {
  message?: string;
  status_code?: number;
  project_details?: ProjectDetailsDTO;
  /** Returned by GET /git/get-all-projects */
  projects?: ProjectDetailsDTO[];
}

export async function addProject(dto: GitRepoDTO): Promise<ResponseDTO> {
  const res = await fetch(`${API_BASE}/git/add-project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getProject(id: number): Promise<ResponseDTO> {
  const res = await fetch(`${API_BASE}/git/get-project?project_id=${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteProject(id: number): Promise<ResponseDTO> {
  const res = await fetch(`${API_BASE}/git/delete-project/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getAllProjects(): Promise<ProjectDetailsDTO[]> {
  const res = await fetch(`${API_BASE}/git/get-all-projects`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }
  const data: ResponseDTO = await res.json();
  return data.projects ?? [];
}


export function getDownloadUrl(folderLocation: string): string {
  return `${API_BASE}/git/download-project/${encodeURIComponent(folderLocation)}`;
}

export function streamProjectFix(
  projectPath: string,
  onEvent: (event: Record<string, unknown>) => void
): EventSource {
  const url = `${API_BASE}/git/stream?path=${encodeURIComponent(projectPath)}`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch {
      /* ignore parse errors */
    }
  };
  return es;
}

export interface FixRequestDTO {
  id: number;
  project_id: number;
  project_name: string;
  status: string;
  created_at: string;
}

export async function getFixRequests(): Promise<FixRequestDTO[]> {
  const res = await fetch(`${API_BASE}/git/fix-requests`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.data ?? [];
}

export async function getAllSchedules(): Promise<any> {
  const res = await fetch(`${API_BASE}/git/get-all-schedules`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.schedules ?? [];
}

export interface ExecutionHistoryDTO {
  id: number;
  project_id: number;
  project_name: string;
  executed_datetime: string;
  result: string;
}

export async function getExecutionHistory(): Promise<ExecutionHistoryDTO[]> {
  const res = await fetch(`${API_BASE}/git/get-execution-history`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.data ?? [];
}
