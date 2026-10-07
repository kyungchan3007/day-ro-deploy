package com.dayro.global.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// 요청 1건당 한 줄(메서드/경로/상태/소요시간/IP)을 남긴다.
// 본문은 남기지 않는다 - 로그 양이 커지고, 로그인 API는 토큰이 섞인다. 쿼리스트링도 같은 이유로 제외한다.
// ForwardedHeaderFilter(HIGHEST_PRECEDENCE) 다음에 돌아야 프록시 뒤에서도 실제 클라이언트 IP가 찍힌다.
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Docker 헬스체크가 15초마다 호출해서 남기면 로그가 이걸로 도배된다
        return "/health".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long startedAt = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long elapsedMs = System.currentTimeMillis() - startedAt;
            int status = response.getStatus();
            String line = "%s %s -> %d (%dms) ip=%s".formatted(
                    request.getMethod(), request.getRequestURI(), status, elapsedMs, request.getRemoteAddr());
            if (status >= 500) {
                log.warn(line);
            } else {
                log.info(line);
            }
        }
    }
}
