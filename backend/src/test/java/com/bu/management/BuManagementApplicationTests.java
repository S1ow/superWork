package com.bu.management;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Application Context Test
 */
@SpringBootTest
@ActiveProfiles("dev")
class BuManagementApplicationTests {

    @Test
    void contextLoads() {
        // 验证 Spring 上下文可以正常加载
    }
}
