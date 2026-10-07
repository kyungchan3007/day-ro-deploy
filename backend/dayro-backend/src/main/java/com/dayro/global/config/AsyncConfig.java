package com.dayro.global.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig {

    public static final String ACTIVITY_EVENT_EXECUTOR = "activityEventExecutor";

    // 활동 이벤트 기록 전용 풀 - 서버 메모리가 2GiB라 작게 잡고, 큐가 넘치면 요청 스레드를 막지 않고 해당 이벤트만 버린다
    @Bean(name = ACTIVITY_EVENT_EXECUTOR)
    public Executor activityEventExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("activity-");
        executor.setRejectedExecutionHandler((task, pool) -> log.warn("활동 이벤트 큐가 가득 차 이벤트를 버립니다."));
        // 블루-그린 전환 시 종료되는 쪽에 남은 이벤트를 최대한 기록하고 내려간다(stop_grace_period 35s 안쪽)
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }
}
