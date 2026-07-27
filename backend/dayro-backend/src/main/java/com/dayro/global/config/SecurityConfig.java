package com.dayro.global.config;

import com.dayro.global.config.jwt.JwtAuthenticationFilter;
import com.dayro.global.config.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtProvider jwtProvider;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .sessionManagement(session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        )
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(
                "/health",
                "/api/auth/kakao/token",
                "/api/auth/refresh",
                "/error",
                "/swagger-ui/**",
                "/v3/api-docs/**",
                // 비회원도 상황입력/코스생성까지는 로그인 없이 이용 가능해야 함 (기획안 로그인 정책 - 로그인은 코스 저장/찜한 코스 보기 시점에만 요구)
                "/api/regions/**",
                "/api/situations/**"
            ).permitAll()
            .anyRequest().authenticated()
        ).addFilterBefore(new JwtAuthenticationFilter(jwtProvider), UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
