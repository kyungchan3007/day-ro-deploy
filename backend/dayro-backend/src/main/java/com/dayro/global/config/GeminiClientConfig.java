package com.dayro.global.config;

import com.google.genai.Client;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Spring AI 자동 구성의 Client를 대체한다(자동 구성은 @ConditionalOnMissingBean이라 이 빈이 있으면 물러난다).
// Google GenAI SDK는 기본으로 429/5xx를 최대 5회, 대기 최대 60초까지 재시도한다.
// 무료 티어(분당 5회)에서 429가 나면 요청 1건이 1분 가까이 붙잡히고 재시도가 한도를 더 소모하므로,
// 재시도 없이 바로 실패시키고 사용자에게 "다시 시도"를 안내하는 편이 낫다 - 기획안 "AI 응답 최대 30초" 정책.
@Configuration(proxyBeanMethods = false)
public class GeminiClientConfig {

    @Bean
    public Client googleGenAiClient(@Value("${spring.ai.google.genai.api-key}") String apiKey,
                                    @Value("${ai.gemini.timeout-ms:20000}") int timeoutMs) {
        return Client.builder()
                .apiKey(apiKey)
                .httpOptions(HttpOptions.builder()
                        .timeout(timeoutMs)
                        // attempts는 첫 시도를 포함한 총 횟수 - 1이면 재시도하지 않는다
                        .retryOptions(HttpRetryOptions.builder().attempts(1).build())
                        .build())
                .build();
    }
}
