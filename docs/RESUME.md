# 工作恢复提示词

## 项目状态概览

**项目：** 电商BU内部管理系统  
**技术栈：** Spring Boot 3.x + Vue 3 + MySQL 8.0 + Redis + MinIO  
**工作流：** Beads + Superpowers  
**当前阶段：** 阶段1 - 后端API开发 > Week 1-2 基础设施搭建

---

## 已完成工作

✅ **设计阶段完成**
- 完整的实施设计文档：`docs/superpowers/specs/2026-04-02-implementation-design.md`
- 包含：架构设计、数据库设计（16张表）、安全权限、工作流引擎、测试策略
- Git 提交: c60a73b

✅ **Beads 任务结构创建**
- 3个阶段 Epic：阶段1（后端）、阶段2（前端）、阶段3（集成测试）
- 阶段1 分解为 5 个 Week 任务
- Week 1-2 分解为 4 个子任务
- 依赖关系已正确设置

✅ **任务 1.1: Docker Compose环境搭建** (superWork-claude-sp-9av.1.1)
- 创建 `docker/docker-compose.yml` 配置所有服务
- MySQL 8.0 配置（端口 3306，数据库 bu_management）
- Redis 7 配置（端口 6379，AOF 持久化）
- MinIO 配置（端口 9000/9001）
- Nginx 反向代理配置（端口 80）
- 配置文件：MySQL my.cnf、Redis redis.conf、Nginx nginx.conf
- 使用文档：`docker/README.md`
- Git 提交: 4a48f60

---

## 下一步行动

**立即开始任务：** superWork-claude-sp-9av.1.2 - Spring Boot项目初始化

**任务描述：** 创建Maven项目，配置pom.xml，添加依赖(Spring Boot、MyBatis Plus、Spring Security等)

**具体步骤：**
1. 创建 `backend/` 目录结构
2. 创建 `pom.xml` 配置文件
3. 添加依赖：
   - Spring Boot 3.2.x
   - MyBatis Plus 3.5.x
   - Spring Security 6.x
   - MySQL Connector
   - Redis
   - MinIO SDK
   - Flyway
   - Knife4j
   - Lombok
   - JUnit 5
4. 创建 `application.yml` 配置文件（dev/prod）
5. 创建基础包结构：config、controller、service、mapper、entity、dto、vo、enums、exception、security、workflow、util
6. 创建 `Application.java` 启动类
7. 创建 `Dockerfile`
8. 验证项目可以启动
9. Git 提交

---

## Beads 命令参考

```bash
# 查看可开始的任务
beads ready

# 开始任务
beads update superWork-claude-sp-9av.1.2 --status in_progress

# 查看任务详情
beads show superWork-claude-sp-9av.1.2

# 完成任务
beads close superWork-claude-sp-9av.1.2

# 添加备注
beads note superWork-claude-sp-9av.1.2 "任务完成说明"

# 查看依赖图
beads graph superWork-claude-sp-9av.1.2
```

---

## 关键文件位置

- 设计文档：`docs/superpowers/specs/2026-04-02-implementation-design.md`
- 原始需求：`docs/superpowers/specs/2026-04-01-bu-management-system-design.md`
- Docker 配置：`docker/docker-compose.yml`
- Beads 数据库：`.beads/`

---

## 恢复工作提示词

```
我回来继续工作了。

项目：电商BU内部管理系统（Spring Boot + Vue 3）
工作流：Beads + Superpowers

上次完成：
- ✅ Docker Compose 环境搭建完成（任务 superWork-claude-sp-9av.1.1）
- Git 提交: 4a48f60

下一步：
开始任务 superWork-claude-sp-9av.1.2 - Spring Boot项目初始化

请按照 Beads + Superpowers 工作流：
1. 从 Beads 确认下一个任务
2. 标记为 in_progress
3. 实施任务
4. 运行验证
5. Git 提交
6. 更新 Beads 状态
7. 记录关键决策

开始吧！
```

---

**生成时间：** 2026-04-02 18:15  
**当前分支：** master  
**最新提交：** 4a48f60
