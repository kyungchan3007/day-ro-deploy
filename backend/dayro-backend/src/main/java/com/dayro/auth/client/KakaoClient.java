package com.dayro.auth.client;

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
    private final RestClient restClient = RestClient.create();

    public KakaoUserInfo getUserInfo(String accessToken) {
        return restClient
                .get()
                .uri(USER_INFO_URI)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(KakaoUserInfo.class);
    }
}
