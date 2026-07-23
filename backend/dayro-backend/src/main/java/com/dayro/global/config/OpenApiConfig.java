package com.dayro.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI dayroOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Dayro API")
                        .description("AI 기반 맞춤형 데이트 코스 추천 서비스 API 문서")
                        .version("v0.0.1"));
    }
}
