<script setup lang="ts">
import { ref } from 'vue'

const tasks = ref([
  { id: '1', title: '数据库设计', type: '开发', assignee: '张三', estimatedHours: 8, status: '已完成' },
  { id: '2', title: '后端API开发', type: '开发', assignee: '李四', estimatedHours: 24, status: '进行中' },
  { id: '3', title: '前端页面开发', type: '开发', assignee: '王五', estimatedHours: 32, status: '待开始' },
  { id: '4', title: '接口联调', type: '开发', assignee: '张三', estimatedHours: 8, status: '待开始' }
])

const statusBadgeClass = (status: string) => {
  if (status === '已完成') return 'green'
  if (status === '进行中') return 'yellow'
  return 'gray'
}

const completedCount = ref(tasks.value.filter(t => t.status === '已完成').length)
const totalCount = ref(tasks.value.length)
</script>

<template>
  <div class="tasks-page">
    <!-- 页面标题 + 操作按钮 -->
    <div class="content-header">
      <div class="title-with-stats">
        <h2 class="page-title">任务管理</h2>
        <div class="inline-stats">
          <span class="inline-stat">
            <span class="stat-num">{{ totalCount }}</span>
            <span class="stat-text">个任务</span>
          </span>
          <span class="stat-divider">|</span>
          <span class="inline-stat">
            <span class="stat-num green">{{ completedCount }}</span>
            <span class="stat-text">已完成</span>
          </span>
        </div>
      </div>
    </div>

    <div class="tasks-list">
      <div v-for="task in tasks" :key="task.id" class="task-card">
        <div class="task-checkbox">
          <svg v-if="task.status === '已完成'" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" class="check-icon">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div v-else class="checkbox-empty"></div>
        </div>
        <div class="task-info">
          <span class="task-title" :class="{ 'task-done': task.status === '已完成' }">{{ task.title }}</span>
          <div class="task-meta">
            <span class="meta-item">{{ task.type }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-item">{{ task.assignee }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-item">{{ task.estimatedHours }}h</span>
          </div>
        </div>
        <span :class="['status-badge', statusBadgeClass(task.status)]">
          {{ task.status }}
        </span>
      </div>
    </div>
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
.stat-num.green { color: var(--success); }
.stat-text { font-size: 13px; color: var(--gray-500); }
.stat-divider { color: var(--gray-300); }

/* ========== 任务卡片 ========== */
.tasks-list { display: flex; flex-direction: column; gap: 8px; }

.task-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: #FFFFFF;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.15s ease;
}

.task-card:hover {
  box-shadow: var(--shadow-md);
}

.task-checkbox { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
.check-icon { width: 20px; height: 20px; }
.checkbox-empty { width: 20px; height: 20px; border: 2px solid var(--gray-300); border-radius: 4px; }
.task-info { flex: 1; }
.task-title { display: block; font-size: 14px; font-weight: 500; color: var(--gray-800); margin-bottom: 4px; }
.task-done { text-decoration: line-through; color: var(--gray-400); }
.task-meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--gray-400); }

/* ========== 状态标签 ========== */
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap; }
.status-badge.gray { background: var(--gray-100); color: var(--gray-600); }
.status-badge.green { background: #d1fae5; color: #047857; }
.status-badge.yellow { background: #fef3c7; color: #b45309; }
</style>
