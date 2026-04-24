package com.bu.management.service;

import com.bu.management.dto.ProjectRequest;
import com.bu.management.entity.BusinessLine;
import com.bu.management.entity.Project;
import com.bu.management.entity.User;
import com.bu.management.mapper.BusinessLineMapper;
import com.bu.management.mapper.ProjectMapper;
import com.bu.management.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private BusinessLineMapper businessLineMapper;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void createRejectsNonPmManager() {
        ProjectRequest request = buildRequest();
        User developer = new User();
        developer.setId(9L);
        developer.setRole("DEVELOPER");

        when(businessLineMapper.selectById(1L)).thenReturn(new BusinessLine());
        when(userMapper.selectById(9L)).thenReturn(developer);

        RuntimeException error = assertThrows(RuntimeException.class, () -> projectService.create(request));

        assertEquals("项目经理必须选择项目经理角色用户", error.getMessage());
    }

    @Test
    void createAllowsPmManager() {
        ProjectRequest request = buildRequest();
        User manager = new User();
        manager.setId(9L);
        manager.setRole("PM");

        when(businessLineMapper.selectById(1L)).thenReturn(new BusinessLine());
        when(userMapper.selectById(9L)).thenReturn(manager);
        when(projectMapper.selectCount(any())).thenReturn(0L);
        doAnswer(invocation -> {
            Project project = invocation.getArgument(0);
            project.setId(100L);
            return 1;
        }).when(projectMapper).insert(any(Project.class));

        Project created = projectService.create(request);

        assertEquals(100L, created.getId());
        assertEquals(9L, created.getManagerId());
        verify(projectMapper).insert(any(Project.class));
    }

    private ProjectRequest buildRequest() {
        ProjectRequest request = new ProjectRequest();
        request.setBusinessLineId(1L);
        request.setName("客户中台");
        request.setCode("CRM");
        request.setManagerId(9L);
        request.setStatus(1);
        return request;
    }
}
