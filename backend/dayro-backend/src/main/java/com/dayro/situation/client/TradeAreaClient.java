package com.dayro.situation.client;

import com.dayro.situation.dto.external.TradeAreaResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;

// 서울시 우리마을가게 상권분석서비스(상권영역) Open API 연동 - http://openapi.seoul.go.kr:8088/{인증키}/{TYPE}/TbgisTrdarRelm/{START_INDEX}/{END_INDEX}/
@Component
@RequiredArgsConstructor
@Slf4j
public class TradeAreaClient {

    private static final String BASE_URL = "http://openapi.seoul.go.kr:8088";
    private static final String SERVICE_NAME = "TbgisTrdarRelm";

    private final RestClient restClient = RestClient.builder()
            .requestFactory(ClientHttpRequestFactories.get(
                    ClientHttpRequestFactorySettings.DEFAULTS
                            .withConnectTimeout(Duration.ofSeconds(5))
                            .withReadTimeout(Duration.ofSeconds(10))))
            .build();

    @Value("${seoul-open-api.key}")
    private String apiKey;

    public TradeAreaResponse.TbgisTrdarRelm fetch(int startIndex, int endIndex) {
        String uri = String.format("%s/%s/json/%s/%d/%d/", BASE_URL, apiKey, SERVICE_NAME, startIndex, endIndex);
        TradeAreaResponse response = restClient
                .get()
                .uri(uri)
                .retrieve()
                .body(TradeAreaResponse.class);
        return response.tbgisTrdarRelm();
    }
}
