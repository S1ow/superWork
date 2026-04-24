const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: string
}

type ApiPayload<T> = ApiResponse<T> | T

interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  userInfo: {
    id: number
    username: string
    realName: string
    role: string
    email: string
    phone: string
  }
}

interface RegisterRequest {
  username: string
  password: string
  realName: string
  role: string
  email?: string
  phone?: string
}

class ApiService {
  private baseUrl = API_BASE_URL

  private getToken(): string | null {
    return localStorage.getItem('token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const parsed = errorText ? JSON.parse(errorText) : null
        if (parsed?.message) {
          errorMessage = parsed.message
        }
      } catch {
        if (errorText) {
          errorMessage = errorText
        }
      }

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      throw new Error(errorMessage)
    }

    const text = await response.text()

    if (!text) {
      return undefined as T
    }

    const result: ApiPayload<T> = JSON.parse(text)

    if (Array.isArray(result)) {
      return result as T
    }

    if (result && typeof result === 'object' && 'code' in result) {
      const wrapped = result as ApiResponse<T>
      if (wrapped.code !== 200) {
        throw new Error(wrapped.message || 'Request failed')
      }
      return wrapped.data
    }

    return result as T
  }

  // Auth APIs
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const result = await response.json()

    if (result.code !== 200) {
      throw new Error(result.message || 'Login failed')
    }

    return result.data
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Business Line APIs
  async getBusinessLines(params?: { page?: number; size?: number; name?: string; status?: number }): Promise<any> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.size) searchParams.set('size', String(params.size))
    if (params?.name) searchParams.set('name', params.name)
    if (params?.status !== undefined) searchParams.set('status', String(params.status))
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.request(`/api/business-lines${query}`)
  }

  async createBusinessLine(data: any): Promise<any> {
    return this.request('/api/business-lines', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateBusinessLine(id: number, data: any): Promise<any> {
    return this.request(`/api/business-lines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteBusinessLine(id: number): Promise<void> {
    return this.request(`/api/business-lines/${id}`, {
      method: 'DELETE'
    })
  }

  // Project APIs
  async getProjects(params?: { businessLineId?: number; page?: number; size?: number; name?: string; status?: number }): Promise<any> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.size) searchParams.set('size', String(params.size))
    if (params?.businessLineId) searchParams.set('businessLineId', String(params.businessLineId))
    if (params?.name) searchParams.set('name', params.name)
    if (params?.status !== undefined) searchParams.set('status', String(params.status))
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.request(`/api/projects${query}`)
  }

  async getProjectById(id: number): Promise<any> {
    return this.request(`/api/projects/${id}`)
  }

  async getProjectTree(businessLineId?: number): Promise<any> {
    const query = businessLineId ? `?businessLineId=${businessLineId}` : ''
    return this.request(`/api/projects/tree${query}`)
  }

  async createProject(data: any): Promise<any> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateProject(id: number, data: any): Promise<any> {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteProject(id: number): Promise<void> {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE'
    })
  }

  // Requirement APIs
  async getRequirements(params?: {
    page?: number
    size?: number
    businessLineId?: number
    projectId?: number
    type?: string
    status?: string
    priority?: string
    title?: string
  }): Promise<any> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.size) searchParams.set('size', String(params.size))
    if (params?.businessLineId) searchParams.set('businessLineId', String(params.businessLineId))
    if (params?.projectId) searchParams.set('projectId', String(params.projectId))
    if (params?.type) searchParams.set('type', params.type)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.priority) searchParams.set('priority', params.priority)
    if (params?.title) searchParams.set('title', params.title)

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.request(`/api/requirements${query}`)
  }

  async getRequirementById(id: number): Promise<any> {
    return this.request(`/api/requirements/${id}`)
  }

  async createRequirement(data: any): Promise<any> {
    return this.request('/api/requirements', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateRequirement(id: number, data: any): Promise<any> {
    return this.request(`/api/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteRequirement(id: number): Promise<void> {
    return this.request(`/api/requirements/${id}`, {
      method: 'DELETE'
    })
  }

  async executeRequirementStageAction(id: number, action: string): Promise<any> {
    return this.request(`/api/requirements/${id}/stage-actions`, {
      method: 'POST',
      body: JSON.stringify({ action })
    })
  }

  async getRequirementTransitionInfo(id: number): Promise<any> {
    return this.request(`/api/requirement-transitions/${id}`)
  }

  async submitRequirementEvaluation(data: {
    requirementId: number
    isFeasible: number
    feasibilityDesc?: string
    estimatedWorkload?: number
    estimatedCost?: number
    workBreakdown?: string
    suggestProduct?: number
  }): Promise<any> {
    return this.request('/api/requirement-evaluations', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getRequirementEvaluation(requirementId: number): Promise<any> {
    return this.request(`/api/requirement-evaluations/by-requirement/${requirementId}`)
  }

  async submitBuDecision(data: {
    requirementId: number
    decision: string
    decisionReason?: string
  }): Promise<any> {
    return this.request('/api/bu-decisions', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getRequirementDesign(requirementId: number): Promise<any> {
    return this.request(`/api/requirement-designs/${requirementId}`)
  }

  async createRequirementDesign(data: {
    requirementId: number
    prototypeStatus?: string
    uiStatus?: string
    techSolutionStatus?: string
  }): Promise<any> {
    return this.request('/api/requirement-designs', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateRequirementDesign(requirementId: number, data: {
    prototypeStatus?: string
    uiStatus?: string
    techSolutionStatus?: string
  }): Promise<any> {
    return this.request(`/api/requirement-designs/${requirementId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async getRequirementConfirmation(requirementId: number): Promise<any> {
    return this.request(`/api/requirement-confirmations/${requirementId}`)
  }

  async createRequirementConfirmation(data: {
    requirementId: number
    confirmationType: string
    confirmedBy: number
    confirmationNotes?: string
  }): Promise<any> {
    return this.request('/api/requirement-confirmations', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getRequirementDelivery(requirementId: number): Promise<any> {
    return this.request(`/api/requirement-deliveries/${requirementId}`)
  }

  async getDesignWorkLogs(requirementId: number): Promise<any[]> {
    return this.request(`/api/design-work-logs/requirement/${requirementId}`)
  }

  async createDesignWorkLog(data: {
    requirementId: number
    workType: string
    designerId: number
    estimatedHours?: number
    workContent?: string
    plannedCompletedAt?: string
    status?: string
  }): Promise<any> {
    return this.request('/api/design-work-logs', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateDesignWorkLog(id: number, data: {
    actualHours?: number
    resultUrl?: string
    workContent?: string
    designerId?: number
    estimatedHours?: number
    plannedCompletedAt?: string
    status?: string
  }): Promise<any> {
    return this.request(`/api/design-work-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteDesignWorkLog(id: number): Promise<void> {
    return this.request(`/api/design-work-logs/${id}`, {
      method: 'DELETE'
    })
  }

  async createRequirementDelivery(data: {
    requirementId: number
    deliveredBy: number
    deliveryNotes?: string
  }): Promise<any> {
    return this.request('/api/requirement-deliveries', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async acceptRequirementDelivery(requirementId: number, data: {
    acceptedBy: number
    acceptanceNotes?: string
  }): Promise<any> {
    return this.request(`/api/requirement-deliveries/${requirementId}/accept`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getRequirementTasks(requirementId: number): Promise<any[]> {
    return this.request(`/api/tasks/requirement/${requirementId}`)
  }

  async createTask(data: {
    requirementId: number
    title: string
    description?: string
    assigneeId?: number
    taskType?: string
    createdBy?: number
    estimatedHours?: number
  }): Promise<any> {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateTask(id: number, data: {
    title?: string
    description?: string
    assigneeId?: number
    estimatedHours?: number
    actualHours?: number
    status?: string
  }): Promise<any> {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // User APIs
  async getUsers(params?: {
    page?: number
    size?: number
    keyword?: string
    username?: string
    realName?: string
    role?: string
    status?: number
  }): Promise<any> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.size) searchParams.set('size', String(params.size))
    if (params?.keyword) searchParams.set('keyword', params.keyword)
    if (params?.username) searchParams.set('username', params.username)
    if (params?.realName) searchParams.set('realName', params.realName)
    if (params?.role) searchParams.set('role', params.role)
    if (params?.status !== undefined) searchParams.set('status', String(params.status))

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.request(`/api/users${query}`)
  }

  async getUserById(id: number): Promise<any> {
    return this.request(`/api/users/${id}`)
  }

  async createUser(data: any): Promise<any> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateUser(id: number, data: any): Promise<any> {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteUser(id: number): Promise<void> {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE'
    })
  }

  // System Management APIs (Menu, Role, Permission)
  async getMenus(): Promise<any[]> {
    return this.request('/api/system/menus')
  }

  async getMenusByRoleId(roleId: number): Promise<any[]> {
    return this.request(`/api/system/menus/role/${roleId}`)
  }

  async assignMenusToRole(roleId: number, menuIds: number[]): Promise<void> {
    return this.request('/api/system/menus/assign', {
      method: 'POST',
      body: JSON.stringify({ roleId, menuIds })
    })
  }

  async getRoles(): Promise<any[]> {
    return this.request('/api/system/roles')
  }

  async createRole(data: { code: string; name: string; description?: string; status?: number }): Promise<any> {
    return this.request('/api/system/roles', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateRole(id: number, data: { name: string; description?: string; status?: number }): Promise<void> {
    return this.request(`/api/system/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteRole(id: number): Promise<void> {
    return this.request(`/api/system/roles/${id}`, {
      method: 'DELETE'
    })
  }

  async getRolesByUserId(userId: number): Promise<any[]> {
    return this.request(`/api/system/roles/user/${userId}`)
  }

  async getPermissionsByRoleId(roleId: number): Promise<any[]> {
    return this.request(`/api/system/roles/${roleId}/permissions`)
  }

  async getRoleAuthorization(roleId: number): Promise<{ menuIds: number[]; permissionIds: number[]; dataScope?: string; dataScopeValue?: string }> {
    return this.request(`/api/system/roles/${roleId}/authorization`)
  }

  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
    return this.request('/api/system/roles/permissions/assign', {
      method: 'POST',
      body: JSON.stringify({ roleId, permissionIds })
    })
  }

  async assignRoleAuthorization(
    roleId: number,
    menuIds: number[],
    permissionIds: number[],
    dataScope?: string,
    dataScopeValue?: string
  ): Promise<void> {
    return this.request('/api/system/roles/authorization/assign', {
      method: 'POST',
      body: JSON.stringify({ roleId, menuIds, permissionIds, dataScope, dataScopeValue })
    })
  }

  async assignRolesToUser(userId: number, roleIds: number[]): Promise<void> {
    return this.request('/api/system/roles/user/assign', {
      method: 'POST',
      body: JSON.stringify({ userId, roleIds })
    })
  }

  async getPermissions(): Promise<any[]> {
    return this.request('/api/system/permissions')
  }

  // Workflow Config APIs
  async getWorkflowConfigs(): Promise<any[]> {
    return this.request('/api/workflow-configs')
  }

  async createWorkflowConfig(data: any): Promise<any> {
    return this.request('/api/workflow-configs', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateWorkflowConfig(id: number, data: any): Promise<any> {
    return this.request(`/api/workflow-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteWorkflowConfig(id: number): Promise<void> {
    return this.request(`/api/workflow-configs/${id}`, {
      method: 'DELETE'
    })
  }

  async getWorkflowConfigsByType(requirementType: string): Promise<any[]> {
    return this.request(`/api/workflow-configs/type/${requirementType}`)
  }

  async getWorkflowStatusOptions(): Promise<Record<string, string[]>> {
    return this.request('/api/workflow-configs/meta/status-options')
  }

  async getNextStatuses(requirementType: string, currentStatus: string): Promise<string[]> {
    return this.request(`/api/workflow-configs/next-statuses?requirementType=${requirementType}&currentStatus=${currentStatus}`)
  }

  // Statistics APIs
  async getStatistics(): Promise<any> {
    return this.request('/api/statistics/dashboard')
  }

  // Customer Contact APIs
  async getCustomerContacts(projectId?: number): Promise<any[]> {
    const query = projectId ? `?projectId=${projectId}` : ''
    const result = await this.request<any>(`/api/customer-contacts${query}`)
    if (Array.isArray(result)) return result
    if (Array.isArray(result?.records)) return result.records
    if (Array.isArray(result?.data?.records)) return result.data.records
    if (Array.isArray(result?.data)) return result.data
    return []
  }

  async getCustomerContactPage(params?: {
    page?: number
    size?: number
    projectId?: number
    name?: string
    isActive?: number
  }): Promise<any> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.size) searchParams.set('size', String(params.size))
    if (params?.projectId) searchParams.set('projectId', String(params.projectId))
    if (params?.name) searchParams.set('name', params.name)
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.request(`/api/customer-contacts${query}`)
  }

  async createCustomerContact(data: any): Promise<any> {
    return this.request('/api/customer-contacts', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateCustomerContact(id: number, data: any): Promise<any> {
    return this.request(`/api/customer-contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteCustomerContact(id: number): Promise<void> {
    return this.request(`/api/customer-contacts/${id}`, {
      method: 'DELETE'
    })
  }

  // Project Member APIs
  async getProjectMembers(projectId: number): Promise<any[]> {
    return this.request(`/api/project-members/by-project?projectId=${projectId}`)
  }

  async addProjectMember(data: { projectId: number; userId: number; role?: string }): Promise<any> {
    return this.request('/api/project-members', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async removeProjectMember(projectId: number, userId: number): Promise<void> {
    return this.request(`/api/project-members?projectId=${projectId}&userId=${userId}`, {
      method: 'DELETE'
    })
  }
}

export const api = new ApiService()
export default api
