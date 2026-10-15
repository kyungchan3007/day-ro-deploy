package com.dayro.situation.service.impl;

import com.dayro.course.repository.CourseRepository;
import com.dayro.situation.domain.Region;
import com.dayro.situation.dto.response.RegionResponse;
import com.dayro.situation.repository.RegionRepository;
import com.dayro.situation.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegionServiceImpl implements RegionService {

    private static final int POPULAR_KEYWORD_LIMIT = 5;

    private final RegionRepository regionRepository;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public List<RegionResponse> getRegions() {
        List<Region> regions = regionRepository.findAllByOrderByCategoryOrderAscSortOrderAsc();

        Map<String, List<Region>> groupedByCategory = regions.stream()
                .collect(Collectors.groupingBy(Region::getCategory, LinkedHashMap::new, Collectors.toList()));

        return groupedByCategory.entrySet().stream()
                .map(entry -> new RegionResponse(entry.getKey(), toRegionItems(entry.getValue())))
                .toList();
    }

    // 인기 검색어 = 자치구 무관 전체 지역 대상, 저장된 코스가 많은 소분류 표시명 상위 5개(동률은 가나다순).
    // 카운트는 코스 저장(courses row 생성) 시점에만 반영되므로 상황입력 화면을 오가며 지역을 다시 선택해도 중복 집계되지 않는다.
    // 저장된 코스가 아직 하나도 없으면(서비스 초기) 전체 지역 중 랜덤 5개로 대체한다.
    @Override
    @Transactional(readOnly = true)
    public List<RegionResponse.RegionItem> getPopularKeywords() {
        List<String> popularNames = courseRepository.findPopularRegionNames(PageRequest.of(0, POPULAR_KEYWORD_LIMIT));
        if (popularNames.isEmpty()) {
            return randomKeywords();
        }

        Map<String, List<Region>> regionsByName = regionRepository.findAllByNameIn(popularNames).stream()
                .collect(Collectors.groupingBy(Region::getName));

        return popularNames.stream()
                .map(regionsByName::get)
                .filter(Objects::nonNull)
                .map(this::toRegionItem)
                .toList();
    }

    private List<RegionResponse.RegionItem> randomKeywords() {
        List<RegionResponse.RegionItem> allItems = toRegionItems(
                regionRepository.findAllByOrderByCategoryOrderAscSortOrderAsc());
        List<RegionResponse.RegionItem> shuffled = new ArrayList<>(allItems);
        Collections.shuffle(shuffled);
        return shuffled.stream().limit(POPULAR_KEYWORD_LIMIT).toList();
    }

    private List<RegionResponse.RegionItem> toRegionItems(List<Region> regions) {
        Map<String, List<Region>> regionsByName = regions.stream()
                .collect(Collectors.groupingBy(Region::getName, LinkedHashMap::new, Collectors.toList()));

        return regionsByName.values().stream()
                .map(this::toRegionItem)
                .toList();
    }

    private RegionResponse.RegionItem toRegionItem(List<Region> group) {
        return new RegionResponse.RegionItem(
                group.get(0).getName(),
                group.get(0).getDong(),
                group.stream().map(Region::getDistrictId).toList());
    }
}
