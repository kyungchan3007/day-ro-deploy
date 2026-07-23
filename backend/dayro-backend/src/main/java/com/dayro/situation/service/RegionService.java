package com.dayro.situation.service;

import com.dayro.situation.dto.response.RegionResponse;

import java.util.List;

public interface RegionService {
    /**
     * 대분류별로 그룹핑된 지역 목록 조회
     * @return List<RegionResponse>
     * */
    List<RegionResponse> getRegions();
}
