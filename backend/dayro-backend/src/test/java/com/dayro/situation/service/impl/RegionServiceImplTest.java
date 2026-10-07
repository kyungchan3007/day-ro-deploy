package com.dayro.situation.service.impl;

import com.dayro.course.repository.CourseRepository;
import com.dayro.situation.domain.Region;
import com.dayro.situation.dto.response.RegionResponse;
import com.dayro.situation.repository.RegionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class RegionServiceImplTest {

    @Mock
    RegionRepository regionRepository;
    @Mock
    CourseRepository courseRepository;

    @InjectMocks
    RegionServiceImpl regionService;

    private Region region(String districtId, String category, String name) {
        return Region.builder()
                .districtId(districtId).category(category).categoryOrder(0)
                .name(name).dong(name).sortOrder(0)
                .build();
    }

    @Test
    void getPopularKeywords_ordersByCourseSaveCount() {
        given(courseRepository.findPopularRegionNames(any()))
                .willReturn(List.of("합정", "홍대", "강남"));
        given(regionRepository.findAllByNameIn(List.of("합정", "홍대", "강남")))
                .willReturn(List.of(
                        region("d2", "마포구", "홍대"),
                        region("d3", "마포구", "홍대"), // 같은 표시명을 공유하는 다른 상권코드 - 중복 노출되면 안 됨
                        region("d1", "마포구", "합정"),
                        region("d5", "강남구", "강남")));

        List<RegionResponse.RegionItem> result = regionService.getPopularKeywords();

        assertThat(result).extracting(RegionResponse.RegionItem::name)
                .containsExactly("합정", "홍대", "강남");
        assertThat(result.get(1).districtIds()).containsExactly("d2", "d3");
    }

    @Test
    void getPopularKeywords_noCoursesSaved_fallsBackToRandomFromAllRegions() {
        given(courseRepository.findPopularRegionNames(any())).willReturn(List.of());
        given(regionRepository.findAllByOrderByCategoryOrderAscSortOrderAsc()).willReturn(List.of(
                region("d1", "마포구", "합정"),
                region("d2", "마포구", "홍대"),
                region("d3", "마포구", "망원동"),
                region("d4", "마포구", "연남동"),
                region("d5", "강남구", "강남"),
                region("d6", "종로구", "인사동")));

        List<RegionResponse.RegionItem> result = regionService.getPopularKeywords();

        assertThat(result).hasSize(5);
        assertThat(result).extracting(RegionResponse.RegionItem::name).doesNotHaveDuplicates();
    }
}
