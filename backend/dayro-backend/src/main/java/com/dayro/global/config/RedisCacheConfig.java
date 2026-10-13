package com.dayro.global.config;

import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

// Google Places / Gemini 호출 비용 절감용 Redis 캐싱 설정 - 지역·카테고리 조합이 유한(158개 지역 x 7개 카테고리)해 캐시 적중률이 높음
@Configuration
@EnableCaching
public class RedisCacheConfig {

    public static final String PLACES_SEARCH_CACHE = "placesSearch";
    public static final String COURSE_PLACE_SELECTION_CACHE = "coursePlaceSelection";

    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer() {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(24))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return builder -> builder
                .cacheDefaults(defaultConfig)
                // 상권/맛집 데이터는 하루 안에 크게 안 바뀌므로 24시간
                .withCacheConfiguration(PLACES_SEARCH_CACHE, defaultConfig.entryTtl(Duration.ofHours(24)))
                // 후보(Places) 캐시가 만료되기 전에 같은 조합이 다시 들어오면 AI 재호출 없이 재사용
                .withCacheConfiguration(COURSE_PLACE_SELECTION_CACHE, defaultConfig.entryTtl(Duration.ofHours(12)));
    }
}
