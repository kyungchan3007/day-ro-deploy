package com.dayro.situation.service;

import com.dayro.situation.dto.response.RegionResponse;

import java.util.List;

public interface RegionService {
    /**
     * 대분류별로 그룹핑된 지역 목록 조회
     * @return List<RegionResponse>
     * */
    List<RegionResponse> getRegions();

    /**
     * 전체 지역(자치구 무관) 대상 인기 검색어 상위 5개 조회 - 누적 카운트 데이터가 없으면 랜덤 5개
     * @return List<RegionResponse.RegionItem>
     * */
    List<RegionResponse.RegionItem> getPopularKeywords();
}
