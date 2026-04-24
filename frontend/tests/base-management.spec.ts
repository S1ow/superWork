import { expect, test } from '@playwright/test'

const mockBusinessLines = [
  { id: 1, name: '全渠道云鹿定制', description: '定制业务', status: 1 },
  { id: 2, name: '会员通', description: '会员通业务', status: 1 }
]

const mockProjects = [
  { id: 1, businessLineId: 1, parentId: null, level: 1, name: '皇家项目', fullPath: '皇家项目', code: 'ROYAL', managerId: 1, status: 1 },
  { id: 2, businessLineId: 2, parentId: null, level: 1, name: '会员通系统', fullPath: '会员通系统', code: 'MEMBER', managerId: 1, status: 1 }
]

const mockUsers = [
  { id: 1, username: 'pm_zhang', realName: '张项目经理', role: 'PM', status: 1 },
  { id: 2, username: 'dev_zhao', realName: '赵开发', role: 'DEVELOPER', status: 1 }
]

const mockContacts = [
  { id: 1, projectId: 1, name: 'Ember', company: '皇家集团', position: '产品总监', phone: '13900000001', email: 'ember@royal.com', isActive: 1 }
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-token')
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 999,
        username: 'admin',
        realName: '系统管理员',
        role: 'BU_ADMIN',
        email: 'admin@example.com',
        phone: '13800009999'
      })
    )
  })

  await page.route('**/api/business-lines**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        message: 'success',
        data: { records: mockBusinessLines },
        timestamp: new Date().toISOString()
      })
    })
  })

  await page.route('**/api/projects/tree**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        message: 'success',
        data: mockProjects,
        timestamp: new Date().toISOString()
      })
    })
  })

  await page.route('**/api/projects**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        message: 'success',
        data: { records: mockProjects },
        timestamp: new Date().toISOString()
      })
    })
  })

  await page.route('**/api/users**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        message: 'success',
        data: { records: mockUsers },
        timestamp: new Date().toISOString()
      })
    })
  })

  await page.route('**/api/customer-contacts**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        message: 'success',
        data: { records: mockContacts },
        timestamp: new Date().toISOString()
      })
    })
  })
})

test('基础分类导航与业务线路由可用', async ({ page }) => {
  await page.goto('/organization')

  await expect(page).toHaveURL(/\/business-lines$/)
  await expect(page.getByText('基础分类')).toBeVisible()
  await expect(page.getByRole('link', { name: '业务线管理' })).toBeVisible()
  await expect(page.getByRole('link', { name: '项目管理' })).toBeVisible()
  await expect(page.getByRole('link', { name: '客户信息管理' })).toBeVisible()
  await expect(page.locator('.page-title')).toHaveText('业务线管理')
  const firstCard = page.locator('[data-testid="business-line-card"]').first()
  await expect(page.locator('[data-testid=\"business-line-card\"]')).toHaveCount(2)
  await expect(firstCard).toContainText('全渠道云鹿定制')
  await expect(firstCard.locator('.status-badge')).toContainText('启用')
  await expect(firstCard.locator('.meta-block')).toHaveCount(2)
  await expect(firstCard.locator('.card-footer')).toContainText('编辑')
  await expect(firstCard.locator('.card-footer')).toContainText('删除')
  await expect(page.locator('.el-table')).toHaveCount(0)
})

test('项目管理的项目经理下拉只展示 PM 用户', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: '新增项目' }).click()

  const dialog = page.locator('.el-dialog').filter({ hasText: '新增项目' })
  const managerSelect = dialog.locator('.el-form-item').filter({ hasText: '项目经理' }).locator('.el-select')
  await managerSelect.click()

  await expect(page.getByRole('option', { name: '张项目经理' })).toBeVisible()
  await expect(page.getByRole('option', { name: '赵开发' })).toHaveCount(0)
})

test('客户信息管理页面展示联系人与关联项目', async ({ page }) => {
  await page.goto('/customers')

  await expect(page.locator('.page-title')).toHaveText('客户信息管理')
  await expect(page.locator('.el-table')).toContainText('Ember')
  await expect(page.locator('.el-table')).toContainText('皇家集团')
  await expect(page.locator('.el-table')).toContainText('皇家项目')
  await expect(page.locator('.el-table')).toContainText('全渠道云鹿定制')
})
