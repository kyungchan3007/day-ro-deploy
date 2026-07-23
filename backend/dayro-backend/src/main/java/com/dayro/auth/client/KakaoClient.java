package com.dayro.auth.client;

import com.dayro.auth.dto.KakaoServiceTerms;
import com.dayro.auth.dto.KakaoUserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
@Slf4j
public class KakaoClient {
    private static final String USER_INFO_URI = "https://kapi.kakao.com/v2/user/me";
    private static final String SERVICE_TERMS_URI = "https://kapi.kakao.com/v2/user/service_terms";
    private final RestClient restClient = RestClient.create();

    public KakaoUserInfo getUserInfo(String accessToken) {
        return restClient
                .get()
                .uri(USER_INFO_URI)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(KakaoUserInfo.class);
    }

    // 카카오싱크 약관 동의 내역 조회 (user/me 와 별도 스코프)
    public KakaoServiceTerms getServiceTerms(String accessToken) {
        return restClient
                .get()
                .uri(SERVICE_TERMS_URI)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(KakaoServiceTerms.class);
    }
}
