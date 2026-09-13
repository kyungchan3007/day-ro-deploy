package com.dayro.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

// 카카오싱크 약관 동의 내역 응답 (GET /v2/user/service_terms)
// 약관 동의 정보는 /v2/user/me 응답에 포함되지 않아 별도 API로 조회한다.
@Data
@NoArgsConstructor
public class KakaoServiceTerms {

    @JsonProperty("service_terms")
    private List<ServiceTerm> serviceTerms;

    @Data
    @NoArgsConstructor
    public static class ServiceTerm {
        private String tag;          // 약관 식별 태그
        private boolean agreed;      // 동의 여부
        @JsonProperty("agreed_at")
        private OffsetDateTime agreedAt;
    }
}
