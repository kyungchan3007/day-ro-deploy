package com.dayro.situation.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

// 서울시 우리마을가게 상권분석서비스(상권영역) API 응답 - 서비스명 TbgisTrdarRelm
public record TradeAreaResponse(
        @JsonProperty("TbgisTrdarRelm") TbgisTrdarRelm tbgisTrdarRelm
) {

    public record TbgisTrdarRelm(
            @JsonProperty("list_total_count") int listTotalCount,
            @JsonProperty("RESULT") Result result,
            @JsonProperty("row") List<Row> row
    ) {
    }

    public record Result(
            @JsonProperty("CODE") String code,
            @JsonProperty("MESSAGE") String message
    ) {
    }

    public record Row(
            @JsonProperty("TRDAR_SE_CD") String tradeAreaTypeCode,
            @JsonProperty("TRDAR_SE_CD_NM") String tradeAreaTypeName,
            @JsonProperty("TRDAR_CD") String tradeAreaCode,
            @JsonProperty("TRDAR_CD_NM") String tradeAreaName,
            @JsonProperty("SIGNGU_CD") String guCode,
            @JsonProperty("SIGNGU_CD_NM") String guName,
            @JsonProperty("ADSTRD_CD") String dongCode,
            @JsonProperty("ADSTRD_CD_NM") String dongName
    ) {
    }
}
