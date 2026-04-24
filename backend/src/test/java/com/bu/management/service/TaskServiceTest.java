package com.bu.management.service;

import com.bu.management.dto.CreateTaskDTO;
import com.bu.management.entity.Requirement;
import com.bu.management.entity.Task;
import com.bu.management.mapper.RequirementMapper;
import com.bu.management.mapper.TaskMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService 测试")
class TaskServiceTest {

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private RequirementMapper requirementMapper;

    @InjectMocks
    private TaskService taskService;

    @Test
    @DisplayName("创建任务时补齐默认 taskType 和 createdBy")
    void createTask_setsDefaultTaskTypeAndCreatedBy() {
        Requirement requirement = new Requirement();
        requirement.setId(1L);

        CreateTaskDTO dto = new CreateTaskDTO();
        dto.setRequirementId(1L);
        dto.setTitle("联调接口");
        dto.setAssigneeId(9L);

        when(requirementMapper.selectById(1L)).thenReturn(requirement);
        when(taskMapper.insert(any(Task.class))).thenReturn(1);

        Task result = taskService.createTask(dto);

        assertThat(result).isNotNull();
        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskMapper).insert(captor.capture());
        assertThat(captor.getValue().getTaskType()).isEqualTo("开发任务");
        assertThat(captor.getValue().getCreatedBy()).isEqualTo(9L);
        assertThat(captor.getValue().getStatus()).isEqualTo("待开始");
    }

    @Test
    @DisplayName("需求不存在时创建任务失败")
    void createTask_requirementMissing_throwsException() {
        CreateTaskDTO dto = new CreateTaskDTO();
        dto.setRequirementId(99L);
        dto.setTitle("联调接口");

        when(requirementMapper.selectById(99L)).thenReturn(null);

        assertThatThrownBy(() -> taskService.createTask(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("需求不存在");
    }
}
