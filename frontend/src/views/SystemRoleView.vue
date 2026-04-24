<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Role {
  id: number
  code: string
  name: string
  description?: string
  status: number
  createdAt?: string
}

interface Menu {
  id: number
  parentId: number | null
  name: string
  icon?: string
  path?: string
  component?: string
  sortOrder?: number
  visible?: number
  status?: number
  children?: Menu[]
}

interface Permission {
  id: number
  code: string
  name: string
  description?: string
  type?: string
  menuId?: number | null
}

interface BusinessLineOption {
  id: number
  name: string
}

interface ProjectOption {
  id: number
  name: string
  businessLineId: number
}

const DATA_SCOPE_OPTIONS = [
  { value: 'ALL', label: '全部数据可见' },
  { value: 'BU_LINE', label: '按业务线' },
  { value: 'PROJECT', label: '按项目/部门' },
  { value: 'SELF', label: '仅本人数据' }
]

const roles = ref<Role[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const form = ref({
  id: undefined as number | undefined,
  code: '',
  name: '',
  description: '',
  status: 1
})

const rules = {
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

// ---- Authorization Dialog ----
const authDialogVisible = ref(false)
const currentRoleId = ref<number | null>(null)
const currentRoleName = ref('')
const menuTree = ref<Menu[]>([])
const allPermissions = ref<Permission[]>([])
const authLoading = ref(false)
const businessLines = ref<BusinessLineOption[]>([])
const projects = ref<ProjectOption[]>([])

const checkedMenuKeys = ref<number[]>([])
const focusedMenuId = ref<number | null>(null)
const menuButtonStates = ref<Map<number, Set<number>>>(new Map())
const dataScope = ref('SELF')
const dataScopeValue = ref('')
const selectedBusinessLineIds = ref<number[]>([])
const selectedProjectIds = ref<number[]>([])

// Build menu tree
const buildMenuTree = (menus: Menu[]): Menu[] => {
  const nodeMap = new Map<number, Menu & { children: Menu[] }>()
  const roots: Array<Menu & { children: Menu[] }> = []

  // First pass: create all nodes
  menus.forEach(menu => {
    const nodeId = menu.id ?? 0
    // Use a unique ID to avoid collisions (parentId=0 means root)
    nodeMap.set(nodeId, { ...menu, children: [] })
  })

  // Second pass: build hierarchy
  menus.forEach(menu => {
    const nodeId = menu.id ?? 0
    const parentId = menu.parentId ?? 0
    const node = nodeMap.get(nodeId)!

    if (parentId === 0) {
      roots.push(node)
    } else {
      const parent = nodeMap.get(parentId)
      if (parent) {
        parent.children.push(menu as Menu & { children: Menu[] })
      } else {
        // Parent not found, treat as root
        roots.push(node)
      }
    }
  })

  const sortNodes = (nodes: Menu[]) => {
    nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    nodes.forEach(node => {
      if (node.children?.length) sortNodes(node.children)
    })
  }
  sortNodes(roots)
  return roots
}


// Permissions grouped by menu
const permissionsByMenu = computed(() => {
  const map = new Map<number, Permission[]>()
  allPermissions.value.forEach(p => {
    if (p.menuId != null) {
      if (!map.has(p.menuId)) map.set(p.menuId, [])
      map.get(p.menuId)!.push(p)
    }
  })
  return map
})

const currentMenuButtons = computed(() => {
  if (focusedMenuId.value == null) return []
  return permissionsByMenu.value.get(focusedMenuId.value) ?? []
})

const availableProjects = computed(() => {
  if (selectedBusinessLineIds.value.length === 0) return projects.value
  return projects.value.filter(project => selectedBusinessLineIds.value.includes(project.businessLineId))
})

const toggleBusinessLineScope = (id: number) => {
  const index = selectedBusinessLineIds.value.indexOf(id)
  if (index >= 0) selectedBusinessLineIds.value.splice(index, 1)
  else selectedBusinessLineIds.value.push(id)
}

const toggleProjectScope = (id: number) => {
  const index = selectedProjectIds.value.indexOf(id)
  if (index >= 0) selectedProjectIds.value.splice(index, 1)
  else selectedProjectIds.value.push(id)
}

const isButtonChecked = (permId: number) => {
  if (focusedMenuId.value == null) return false
  return menuButtonStates.value.get(focusedMenuId.value)?.has(permId) ?? false
}

const toggleButton = (permId: number) => {
  if (focusedMenuId.value == null) return
  const set = menuButtonStates.value.get(focusedMenuId.value) ?? new Set()
  if (set.has(permId)) set.delete(permId)
  else set.add(permId)
  menuButtonStates.value.set(focusedMenuId.value, set)
}

const handleNodeClick = (nodeData: Menu) => {
  focusedMenuId.value = nodeData.id
}

const parseScopeValues = (value: string) => {
  return value
    .split(',')
    .map(item => Number(item.trim()))
    .filter(item => Number.isFinite(item))
}

const loadRoles = async () => {
  loading.value = true
  try {
    const data = await api.getRoles()
    roles.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error('加载角色失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  form.value = { id: undefined, code: '', name: '', description: '', status: 1 }
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row: Role) => {
  form.value = { id: row.id, code: row.code, name: row.name, description: row.description || '', status: row.status }
  isEdit.value = true
  dialogVisible.value = true
}

const handleDelete = async (row: Role) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色「${row.name}」吗？关联的用户、菜单、权限关系将一并清除。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.deleteRole(row.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      if (isEdit.value) {
        await api.updateRole(form.value.id!, { name: form.value.name, description: form.value.description, status: form.value.status })
        ElMessage.success('更新成功')
      } else {
        await api.createRole({ code: form.value.code, name: form.value.name, description: form.value.description, status: form.value.status })
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadRoles()
    } catch (error) {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    }
  })
}

const openAuthDialog = async (row: Role) => {
  currentRoleId.value = row.id
  currentRoleName.value = row.name
  authDialogVisible.value = true
  authLoading.value = true
  menuButtonStates.value = new Map()
  focusedMenuId.value = null
  checkedMenuKeys.value = []

  try {
    const [menus, permissions, auth, businessLinePayload, projectPayload] = await Promise.all([
      api.getMenus(),
      api.getPermissions(),
      api.getRoleAuthorization(row.id),
      api.getBusinessLines({ page: 1, size: 999 }),
      api.getProjects({ page: 1, size: 999 })
    ])

    const menuList = Array.isArray(menus) ? menus : []
    const allMenusFlat = menuList.map((m: any) => ({
      ...m,
      parentId: m.parentId ?? 0
    }))
    menuTree.value = buildMenuTree(allMenusFlat)
    allPermissions.value = Array.isArray(permissions) ? permissions : []

    checkedMenuKeys.value = auth.menuIds || []

    // Build button state map: group permission IDs by menu_id
    const permByMenu = new Map<number, number[]>()
    for (const permId of (auth.permissionIds || [])) {
      const perm = allPermissions.value.find(p => p.id === permId)
      if (perm?.menuId != null) {
        if (!permByMenu.has(perm.menuId)) permByMenu.set(perm.menuId, [])
        permByMenu.get(perm.menuId)!.push(permId)
      }
    }
    const buttonMap = new Map<number, Set<number>>()
    permByMenu.forEach((ids, mid) => buttonMap.set(mid, new Set(ids)))
    menuButtonStates.value = buttonMap

    // Restore data scope
    dataScope.value = auth.dataScope || 'SELF'
    dataScopeValue.value = auth.dataScopeValue || ''
    businessLines.value = Array.isArray(businessLinePayload?.records) ? businessLinePayload.records : Array.isArray(businessLinePayload) ? businessLinePayload : []
    projects.value = Array.isArray(projectPayload?.records) ? projectPayload.records : Array.isArray(projectPayload) ? projectPayload : []

    if (dataScope.value === 'BU_LINE') {
      selectedBusinessLineIds.value = parseScopeValues(dataScopeValue.value)
      selectedProjectIds.value = []
    } else if (dataScope.value === 'PROJECT') {
      selectedProjectIds.value = parseScopeValues(dataScopeValue.value)
      selectedBusinessLineIds.value = []
    } else {
      selectedBusinessLineIds.value = []
      selectedProjectIds.value = []
    }

    // Focus first checked menu
    if (checkedMenuKeys.value.length > 0) {
      focusedMenuId.value = checkedMenuKeys.value[0]
    }
  } catch (error) {
    console.error('加载授权数据失败:', error)
    ElMessage.error('加载授权数据失败')
  } finally {
    authLoading.value = false
  }
}

const findParentMenuIds = (menuId: number, tree: Menu[]): number[] => {
  const parents: number[] = []
  const find = (nodes: Menu[], targetId: number): boolean => {
    for (const node of nodes) {
      if (node.children?.some(c => c.id === targetId)) {
        parents.push(node.id)
        return true
      }
      if (node.children && find(node.children, targetId)) {
        parents.push(node.id)
        return true
      }
    }
    return false
  }
  find(tree, menuId)
  return parents
}

const handleSaveAuth = async () => {
  if (!currentRoleId.value) return
  authLoading.value = true
  try {
    // Collect all checked menu IDs + parent menus
    const allMenuIds = new Set<number>(checkedMenuKeys.value)
    for (const mid of checkedMenuKeys.value) {
      findParentMenuIds(mid, menuTree.value).forEach(id => allMenuIds.add(id))
    }

    // Collect all button permission IDs from cache
    const allPermIds = new Set<number>()
    menuButtonStates.value.forEach(s => s.forEach(id => allPermIds.add(id)))

    if (dataScope.value === 'BU_LINE') {
      dataScopeValue.value = selectedBusinessLineIds.value.join(',')
    } else if (dataScope.value === 'PROJECT') {
      dataScopeValue.value = selectedProjectIds.value.join(',')
    } else {
      dataScopeValue.value = ''
    }

    await api.assignRoleAuthorization(
      currentRoleId.value,
      Array.from(allMenuIds),
      Array.from(allPermIds),
      dataScope.value,
      dataScopeValue.value
    )
    ElMessage.success('授权配置已保存')
    authDialogVisible.value = false
  } catch (error) {
    console.error('保存授权失败:', error)
    ElMessage.error('保存授权失败')
  } finally {
    authLoading.value = false
  }
}

onMounted(() => { loadRoles() })

watch(dataScope, scope => {
  if (scope === 'BU_LINE') {
    selectedProjectIds.value = []
  }
  if (scope === 'PROJECT') {
    selectedBusinessLineIds.value = []
  }
  if (scope === 'ALL' || scope === 'SELF') {
    selectedBusinessLineIds.value = []
    selectedProjectIds.value = []
  }
})
</script>

<template>
  <div class="system-role-page">
    <!-- 页面标题 + 操作按钮 -->
    <div class="content-header">
      <div class="title-with-stats">
        <h2 class="page-title">角色管理</h2>
        <div class="inline-stats">
          <span class="inline-stat">
            <span class="stat-num">{{ roles.length }}</span>
            <span class="stat-text">个角色</span>
          </span>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="handleAdd">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新增角色
        </button>
      </div>
    </div>

    <div class="table-card">
      <el-table :data="roles" v-loading="loading" class="unified-table"
        :header-cell-style="{ background: 'var(--gray-50)', color: 'var(--gray-600)', fontWeight: 600, fontSize: '12px', borderBottom: '1px solid var(--gray-100)', padding: '10px 12px' }"
        :cell-style="{ fontSize: '13px', color: 'var(--gray-700)', padding: '10px 12px', borderBottom: '1px solid var(--gray-50)' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="code" label="角色编码" min-width="150" />
        <el-table-column prop="name" label="角色名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span :class="['status-badge', row.status === 1 ? 'green' : 'gray']">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-links">
              <span class="action-link primary" @click="openAuthDialog(row)">配置授权</span>
              <span class="action-link primary" @click="handleEdit(row)">编辑</span>
              <span class="action-link danger" @click="handleDelete(row)">删除</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Role CRUD Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" :disabled="isEdit" placeholder="如: PM_MANAGER" />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="如: 项目经理" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="角色描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0"
                     active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- Authorization Dialog -->
    <el-dialog v-model="authDialogVisible" :title="`配置授权 - ${currentRoleName}`" width="1000px" destroy-on-close>
      <div v-loading="authLoading" class="auth-layout">
        <div class="auth-columns">
          <div class="auth-menu-col auth-menu">
            <div class="menu-col-header">菜单权限</div>
            <el-tree ref="menuTreeRef" :data="menuTree" :props="{ label: 'name', children: 'children' }" show-checkbox node-key="id" v-model:checked-keys="checkedMenuKeys" @node-click="handleNodeClick" :check-strictly="false" />
          </div>
          <div class="auth-right-col">
            <div class="panel-section auth-buttons">
              <div class="section-header">按钮权限</div>
              <template v-if="focusedMenuId">
                <div class="btn-header">
                  <span class="btn-menu-name button-menu-name">{{ menuTree.flatMap(menu => [menu, ...(menu.children || [])]).find(menu => menu.id === focusedMenuId)?.name ?? '' }}</span>
                  <span class="btn-count">{{ currentMenuButtons.length }} 个操作权限</span>
                </div>
                <div class="btn-list">
                  <div v-for="perm in currentMenuButtons" :key="perm.id" class="btn-item" :class="{ 'btn-checked': isButtonChecked(perm.id) }" @click="toggleButton(perm.id)">
                    <el-checkbox :model-value="isButtonChecked(perm.id)">
                      <span class="perm-name">{{ perm.name }}</span>
                      <span class="perm-code">{{ perm.code }}</span>
                    </el-checkbox>
                    <el-tag v-if="perm.type" size="small" :type="perm.type === 'button' ? 'warning' : perm.type === 'api' ? 'danger' : 'info'">{{ perm.type }}</el-tag>
                  </div>
                </div>
              </template>
              <div v-else class="empty-area"><p>请点击左侧菜单节点</p><p>查看该菜单下的操作权限</p></div>
            </div>
            <div class="panel-section section-divider">
              <div class="section-header">数据范围</div>
              <div class="ds-form">
                <el-radio-group v-model="dataScope" class="ds-radio-group">
                  <el-radio v-for="opt in DATA_SCOPE_OPTIONS" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
                </el-radio-group>
                <div v-if="dataScope === 'BU_LINE'" class="ds-value-row">
                  <span class="ds-label">业务线：</span>
                  <div class="scope-choice-grid">
                    <button
                      v-for="item in businessLines"
                      :key="item.id"
                      type="button"
                      class="scope-choice"
                      :class="{ active: selectedBusinessLineIds.includes(item.id) }"
                      @click="toggleBusinessLineScope(item.id)"
                    >
                      {{ item.name }}
                    </button>
                  </div>
                </div>
                <div v-else-if="dataScope === 'PROJECT'" class="ds-value-row">
                  <span class="ds-label">项目：</span>
                  <div class="scope-choice-grid">
                    <button
                      v-for="item in availableProjects"
                      :key="item.id"
                      type="button"
                      class="scope-choice"
                      :class="{ active: selectedProjectIds.includes(item.id) }"
                      @click="toggleProjectScope(item.id)"
                    >
                      {{ item.name }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="authDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAuth" :loading="authLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ========== 页面头部 ========== */
.content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.title-with-stats { display: flex; align-items: center; gap: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: var(--gray-800); margin: 0; }
.inline-stats { display: flex; align-items: center; gap: 8px; padding-left: 16px; border-left: 1px solid var(--gray-200); }
.inline-stat { display: flex; align-items: center; gap: 4px; }
.stat-num { font-size: 16px; font-weight: 700; color: var(--gray-800); }
.stat-text { font-size: 13px; color: var(--gray-500); }
.page-actions { display: flex; align-items: center; gap: 8px; }

/* ========== 按钮 ========== */
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-md); font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s ease; }
.btn svg { width: 16px; height: 16px; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-dark); }

/* ========== 表格 ========== */
.table-card { background: #FFFFFF; border-radius: var(--radius-md); overflow: auto; box-shadow: var(--shadow-sm); max-height: calc(100vh - 240px); }
.unified-table :deep(.el-table__header-wrapper th) { background: var(--gray-50) !important; font-size: 12px !important; font-weight: 600 !important; color: var(--gray-600) !important; border-bottom: 1px solid var(--gray-100) !important; }
.unified-table :deep(.el-table__body-wrapper td) { font-size: 13px !important; color: var(--gray-700) !important; border-bottom: 1px solid var(--gray-50) !important; }
.unified-table :deep(.el-table__body-wrapper tr:hover > td) { background: var(--gray-50) !important; }
.unified-table :deep(.el-table__border-left-patch), .unified-table :deep(.el-table__inner-wrapper::before) { display: none !important; }

/* ========== 状态标签 ========== */
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap; }
.status-badge.gray { background: var(--gray-100); color: var(--gray-600); }
.status-badge.green { background: #d1fae5; color: #047857; }

/* ========== 操作链接 ========== */
.action-links { display: flex; align-items: center; gap: 12px; }
.action-link { font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.15s ease; }
.action-link:hover { opacity: 0.8; }
.action-link.primary { color: var(--primary); }
.action-link.danger { color: var(--danger); }

/* ========== 授权弹窗 ========== */
.auth-layout { min-height: 520px; }
.auth-columns { display: flex; gap: 16px; min-height: 520px; }
.menu-col-header { font-size: 14px; font-weight: 600; color: var(--gray-700); margin-bottom: 8px; padding-left: 6px; }
.auth-menu-col { flex: 0 0 340px; overflow-y: auto; border: 1px solid var(--gray-200); border-radius: 8px; padding: 14px; }
.auth-right-col { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0; min-height: 520px; }
.panel-section { flex-shrink: 0; padding: 12px 16px; }
.section-divider { border-top: 1px solid var(--gray-200); }
.section-header { font-size: 13px; font-weight: 600; color: var(--gray-600); margin-bottom: 10px; }
.btn-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.btn-menu-name { font-size: 14px; font-weight: 600; color: var(--gray-800); }
.btn-count { font-size: 12px; color: var(--gray-400); }
.btn-list { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px; }
.btn-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 10px; cursor: pointer; transition: background 0.15s, border-color 0.15s; border: 1px solid transparent; }
.btn-item:hover { background: var(--gray-50); }
.btn-checked { background: var(--gray-50); border-color: rgba(79, 70, 229, 0.18); }
.btn-item :deep(.el-checkbox) { width: 100%; pointer-events: none; }
.btn-item :deep(.el-checkbox__input) { pointer-events: none; }
.btn-item :deep(.el-checkbox__label) { width: 100%; display: flex; align-items: center; gap: 8px; }
.perm-name { font-size: 13px; color: var(--gray-800); margin-right: 8px; }
.perm-code { font-size: 11px; color: var(--gray-400); font-family: monospace; }
.empty-area { text-align: center; color: var(--gray-400); font-size: 13px; margin-top: 60px; }
.empty-area p { margin: 4px 0; }
.ds-form { padding: 4px 0; }
.ds-radio-group { display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px 18px; }
:deep(.ds-radio-group .el-radio) { margin-right: 6px; margin-bottom: 0; }
.ds-value-row { margin-top: 12px; display: flex; align-items: flex-start; gap: 10px; }
.ds-label { font-size: 13px; color: var(--gray-600); white-space: nowrap; }
.scope-choice-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.scope-choice { border: 1px solid var(--gray-200); border-radius: 999px; background: #fff; color: var(--gray-600); padding: 7px 12px; font-size: 12px; cursor: pointer; transition: all 0.15s ease; }
.scope-choice:hover { border-color: var(--primary); color: var(--primary); }
.scope-choice.active { background: var(--primary); border-color: var(--primary); color: #fff; }

@media (max-width: 768px) {
  .auth-columns { flex-direction: column; height: auto; }
  .auth-menu-col { flex: none; max-height: 280px; }
  .auth-right-col { max-height: 320px; }
}
</style>
