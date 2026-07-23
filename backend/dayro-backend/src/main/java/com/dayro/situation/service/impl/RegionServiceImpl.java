package com.dayro.situation.service.impl;

import com.dayro.situation.domain.Region;
import com.dayro.situation.dto.response.RegionResponse;
import com.dayro.situation.repository.RegionRepository;
import com.dayro.situation.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegionServiceImpl implements RegionService {

    private final RegionRepository regionRepository;

    @Transactional(readOnly = true)
    public List<RegionResponse> getRegions() {
        List<Region> regions = regionRepository.findAllByOrderByCategoryOrderAscSortOrderAsc();

        Map<String, List<Region>> groupedByCategory = regions.stream()
                .collect(Collectors.groupingBy(Region::getCategory, LinkedHashMap::new, Collectors.toList()));

        return groupedByCategory.entrySet().stream()
                .map(entry -> new RegionResponse(entry.getKey(), toRegionItems(entry.getValue())))
                .toList();
    }

    private List<RegionResponse.RegionItem> toRegionItems(List<Region> regions) {
        Map<String, List<String>> districtIdsByName = regions.stream()
                .collect(Collectors.groupingBy(Region::getName, LinkedHashMap::new,
                        Collectors.mapping(Region::getDistrictId, Collectors.toList())));

        return districtIdsByName.entrySet().stream()
                .map(entry -> new RegionResponse.RegionItem(entry.getKey(), entry.getValue()))
                .toList();
    }
}
