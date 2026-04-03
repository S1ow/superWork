package com.bu.management.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 更新设计工作记录 DTO
 *
 * @author BU Team
 * @since 2026-04-03
 */
@Data
public class UpdateDesignWorkLogDTO {

    /**
     * 实际工时
     */
    private BigDecimal actualHours;

    /**
     * 成果物链接或文件ID
     */
    private String resultUrl;

    /**
     * 工作内容描述
     */
    private String workContent;

    /**
     * 状态：进行中/已完成
     */
    private String status;
}
