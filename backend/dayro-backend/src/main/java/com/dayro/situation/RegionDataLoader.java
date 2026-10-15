package com.dayro.situation;

import com.dayro.situation.domain.Region;
import com.dayro.situation.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

// 상권분석 API(상권 단위, 1,650여건) 중 발달상권/관광특구(255건)를 기획팀이 소분류 표시명 기준으로 큐레이션한 결과(158건)를 지역 마스터 데이터로 적재.
// 큐레이션 근거: resources/region-curation.csv (기획팀 회신 dayro_소분류명_큐레이션요청_최종.xlsx, 2026-07-24) - 상권코드별 최종 자치구/표시명.
// dong 컬럼은 기획팀이 추가 회신한 dayro_소분류명_큐레이션요청_행정동 기입.xlsx(2026-08-05, 자치구별 정리 시트)를 반영해 자치구+표시명 조합별 중분류 행정동을 매핑.
// 자치구 경계에 걸친 소분류(미아사거리/목동/강남/논현)는 기획팀이 유동인구 우위 자치구로 재배정 완료 - CSV의 category 컬럼이 그 최종 배정값.
// 여러 상권코드가 같은 표시명을 공유할 수 있음(예: 종로구 "종로" = 종각역+종로·청계관광특구) - Region 스키마는 이를 허용하며,
// 같은 표시명이 노출 리스트에 중복으로 뜨는 문제는 별도 논의 필요(프론트/AI 코스생성 연동 시 재검토).
//
// 적재 원천은 CSV 단독이다. 과거에는 상권분석 API를 호출해 상권코드를 훑었지만 API 응답에서 실제로 쓰는 값이 상권코드뿐이었고
// 그 상권코드는 이미 CSV의 키라서, API는 결과에 아무것도 보태지 못하면서 "인증키가 죽으면 지역 0건인 채로 조용히 기동"하는 장애만 만들었다.
@Component
@RequiredArgsConstructor
@Slf4j
public class RegionDataLoader implements CommandLineRunner {

    private static final String CURATION_RESOURCE = "region-curation.csv";
    private static final int COLUMN_COUNT = 4;

    // SIGNGU_CD 오름차순과 동일한 서울 25개 자치구 순서(중랑구는 큐레이션 결과 소분류 0건이라 목록엔 안 남지만 정렬 기준엔 유지)
    private static final List<String> DISTRICT_ORDER = List.of(
            "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구",
            "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구",
            "관악구", "서초구", "강남구", "송파구", "강동구"
    );

    private final RegionRepository regionRepository;

    @Override
    public void run(String... args) {
        if (regionRepository.count() > 0) {
            return;
        }

        List<Region> regions = loadCuratedRegions();
        regionRepository.saveAll(regions);
        log.info("지역 마스터 데이터(기획팀 소분류 표시명 큐레이션) 적재 완료: {}건", regions.size());
    }

    // 적재에 실패하면 지역 선택이 통째로 비어 상황입력부터 막히므로, 조용히 넘어가지 않고 기동을 중단시킨다
    private List<Region> loadCuratedRegions() {
        List<Region> regions = new ArrayList<>();
        Set<String> seenTradeAreaCodes = new LinkedHashSet<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource(CURATION_RESOURCE).getInputStream(), StandardCharsets.UTF_8))) {
            reader.readLine(); // header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                String[] columns = line.split(",", COLUMN_COUNT);
                if (columns.length < COLUMN_COUNT) {
                    throw new IllegalStateException(CURATION_RESOURCE + " 형식 오류 - 컬럼이 부족한 행: " + line);
                }

                String tradeAreaCode = columns[0].trim();
                String district = columns[1].trim();
                int categoryOrder = DISTRICT_ORDER.indexOf(district);
                if (categoryOrder < 0) {
                    // -1이 그대로 들어가면 해당 자치구가 목록 맨 앞에 뜨는 형태로만 드러나서 원인을 찾기 어렵다
                    throw new IllegalStateException(CURATION_RESOURCE + " 형식 오류 - 알 수 없는 자치구: " + district);
                }
                if (!seenTradeAreaCodes.add(tradeAreaCode)) {
                    // districtId가 unique 제약이라 그대로 두면 저장 시점에 터진다
                    throw new IllegalStateException(CURATION_RESOURCE + " 형식 오류 - 중복된 상권코드: " + tradeAreaCode);
                }

                regions.add(Region.builder()
                        .districtId(tradeAreaCode)
                        .category(district)
                        .categoryOrder(categoryOrder)
                        .name(columns[2].trim())
                        .dong(columns[3].trim())
                        .sortOrder(regions.size())
                        .build());
            }
        } catch (IOException e) {
            throw new IllegalStateException(CURATION_RESOURCE + " 로드 실패", e);
        }

        if (regions.isEmpty()) {
            throw new IllegalStateException(CURATION_RESOURCE + "에서 적재할 지역이 없습니다.");
        }
        return regions;
    }
}
