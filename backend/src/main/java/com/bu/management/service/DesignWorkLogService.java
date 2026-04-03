package com.bu.management.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.bu.management.dto.CreateDesignWorkLogDTO;
import com.bu.management.dto.UpdateDesignWorkLogDTO;
import com.bu.management.entity.DesignWorkLog;
import com.bu.management.entity.Requirement;
import com.bu.management.mapper.DesignWorkLogMapper;
import com.bu.management.mapper.RequirementMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 设计工作记录服务
 *
 * @author BU Team
 * @since 2026-04-03
 */
@Service
@RequiredArgsConstructor
public class DesignWorkLogService {

    private final DesignWorkLogMapper workLogMapper;
    private final RequirementMapper requirementMapper;

    /**
     * 创建设计工作记录
     */
    @Transactional
    public DesignWorkLog createWorkLog(CreateDesignWorkLogDTO dto) {
        // 验证需求存在
        Requirement requirement = requirementMapper.selectById(dto.getRequirementId());
        if (requirement == null) {
            throw new RuntimeException("需求不存在");
        }

        // 创建工作记录
        DesignWorkLog workLog = new DesignWorkLog();
        workLog.setRequirementId(dto.getRequirementId());
        workLog.setWorkType(dto.getWorkType());
        workLog.setDesignerId(dto.getDesignerId());
        workLog.setEstimatedHours(dto.getEstimatedHours());
        workLog.setWorkContent(dto.getWorkContent());
        workLog.setStatus("进行中");
        workLog.setStartedAt(LocalDateTime.now());
        workLog.setCreatedAt(LocalDateTime.now());
        workLog.setUpdatedAt(LocalDateTime.now());

        workLogMapper.insert(workLog);
        return workLog;
    }

    /**
     * 更新设计工作记录
     */
    @Transactional
    public DesignWorkLog updateWorkLog(Long id, UpdateDesignWorkLogDTO dto) {
        DesignWorkLog workLog = workLogMapper.selectById(id);
        if (workLog == null) {
            throw new RuntimeException("工作记录不存在");
        }

        if (dto.getActualHours() != null) {
            workLog.setActualHours(dto.getActualHours());
        }
        if (dto.getResultUrl() != null) {
            workLog.setResultUrl(dto.getResultUrl());
        }
        if (dto.getWorkContent() != null) {
            workLog.setWorkContent(dto.getWorkContent());
        }
        if (dto.getStatus() != null) {
            workLog.setStatus(dto.getStatus());
            if ("已完成".equals(dto.getStatus())) {
                workLog.setCompletedAt(LocalDateTime.now());
            }
        }
        workLog.setUpdatedAt(LocalDateTime.now());

        workLogMapper.updateById(workLog);
        return workLog;
    }

    /**
     * 查询需求的设计工作记录列表
     */
    public List<DesignWorkLog> getWorkLogsByRequirementId(Long requirementId) {
        LambdaQueryWrapper<DesignWorkLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DesignWorkLog::getRequirementId, requirementId);
        wrapper.orderByDesc(DesignWorkLog::getCreatedAt);
        return workLogMapper.selectList(wrapper);
    }

    /**
     * 分页查询设计工作记录
     */
    public Page<DesignWorkLog> getWorkLogsPage(int page, int size, Long requirementId, String workType, String status) {
        Page<DesignWorkLog> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<DesignWorkLog> wrapper = new LambdaQueryWrapper<>();

        if (requirementId != null) {
            wrapper.eq(DesignWorkLog::getRequirementId, requirementId);
        }
        if (workType != null && !workType.isEmpty()) {
            wrapper.eq(DesignWorkLog::getWorkType, workType);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(DesignWorkLog::getStatus, status);
        }

        wrapper.orderByDesc(DesignWorkLog::getCreatedAt);
        return workLogMapper.selectPage(pageParam, wrapper);
    }

    /**
     * 删除设计工作记录
     */
    @Transactional
    public void deleteWorkLog(Long id) {
        workLogMapper.deleteById(id);
    }
}
