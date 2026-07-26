package com.dayro.auth.client;

import com.dayro.auth.dto.KakaoServiceTerms;
import com.dayro.auth.dto.KakaoTokenResponse;
import com.dayro.auth.dto.KakaoUserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class KakaoClient {
    private static final String USER_INFO_URI = "https://kapi.kakao.com/v2/user/me";
    private static final String SERVICE_TERMS_URI = "https://kapi.kakao.com/v2/user/service_terms";
    private static final String TOKEN_URI = "https://kauth.kakao.com/oauth/token";
    private final RestClient restClient = RestClient.create();

    @Value("${kakao.rest-api-key}")
    private String restApiKey;

    @Value("${kakao.client-secret}")
    private String clientSecret;

    @Value("${kakao.redirect-uri}")
    private String redirectUri;

    // 인가코드를 실제 accessToken으로 교환 (리다이렉트 방식 로그인 플로우)
    public String getAccessToken(String code) {
        KakaoTokenResponse response = restClient
                .post()
                .uri(TOKEN_URI)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(buildTokenRequestBody(code))
                .retrieve()
                .body(KakaoTokenResponse.class);
        return response.accessToken();
    }

    private String buildTokenRequestBody(String code) {
        return "grant_type=authorization_code"
                + "&client_id=" + encode(restApiKey)
                + "&redirect_uri=" + encode(redirectUri)
                + "&code=" + encode(code)
                + "&client_secret=" + encode(clientSecret);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

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
