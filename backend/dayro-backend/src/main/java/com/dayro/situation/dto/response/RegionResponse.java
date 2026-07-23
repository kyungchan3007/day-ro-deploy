package com.dayro.situation.dto.response;

import java.util.List;

public record RegionResponse(String category, List<RegionItem> regions) {

    // 여러 상권코드가 같은 소분류 표시명으로 묶일 수 있어(예: "종로"=종각역+종로·청계관광특구) districtId를 리스트로 노출
    public record RegionItem(String name, List<String> districtIds) {
    }
}
