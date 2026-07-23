package com.dayro.situation;

import com.dayro.situation.client.TradeAreaClient;
import com.dayro.situation.domain.Region;
import com.dayro.situation.dto.external.TradeAreaResponse;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 상권분석 API(상권 단위, 1,650여건) 중 발달상권/관광특구(255건)를 기획팀이 소분류 표시명 기준으로 큐레이션한 결과(158건)를 지역 마스터 데이터로 적재.
// 큐레이션 근거: resources/region-curation.csv (기획팀 회신 dayro_소분류명_큐레이션요청_최종.xlsx, 2026-07-24) - 상권코드별 최종 자치구/표시명.
// 자치구 경계에 걸친 소분류(미아사거리/목동/강남/논현)는 기획팀이 유동인구 우위 자치구로 재배정 완료 - CSV의 category 컬럼이 그 최종 배정값.
// 여러 상권코드가 같은 표시명을 공유할 수 있음(예: 종로구 "종로" = 종각역+종로·청계관광특구) - Region 스키마는 이를 허용하며,
// 같은 표시명이 노출 리스트에 중복으로 뜨는 문제는 별도 논의 필요(프론트/AI 코스생성 연동 시 재검토).
@Component
@RequiredArgsConstructor
@Slf4j
public class RegionDataLoader implements CommandLineRunner {

    private static final int PAGE_SIZE = 1000;
    private static final String CURATION_RESOURCE = "region-curation.csv";

    // SIGNGU_CD 오름차순과 동일한 서울 25개 자치구 순서(중랑구는 큐레이션 결과 소분류 0건이라 목록엔 안 남지만 정렬 기준엔 유지)
    private static final List<String> DISTRICT_ORDER = List.of(
            "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구",
            "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구",
            "관악구", "서초구", "강남구", "송파구", "강동구"
    );

    private record CuratedRegion(String category, String displayName) {
    }

    private final TradeAreaClient tradeAreaClient;
    private final RegionRepository regionRepository;

    @Override
    public void run(String... args) {
        if (regionRepository.count() > 0) {
            return;
        }

        Map<String, CuratedRegion> curatedRegions = loadCuratedRegions();
        Map<String, Region> regionsByTradeAreaCode = new LinkedHashMap<>();

        try {
            int startIndex = 1;
            int totalCount = Integer.MAX_VALUE;

            while (startIndex <= totalCount) {
                int endIndex = startIndex + PAGE_SIZE - 1;
                TradeAreaResponse.TbgisTrdarRelm page = tradeAreaClient.fetch(startIndex, endIndex);
                totalCount = page.listTotalCount();

                for (TradeAreaResponse.Row row : page.row()) {
                    CuratedRegion curated = curatedRegions.get(row.tradeAreaCode());
                    if (curated == null) {
                        continue;
                    }
                    regionsByTradeAreaCode.putIfAbsent(row.tradeAreaCode(), Region.builder()
                            .districtId(row.tradeAreaCode())
                            .category(curated.category())
                            .categoryOrder(DISTRICT_ORDER.indexOf(curated.category()))
                            .name(curated.displayName())
                            .sortOrder(regionsByTradeAreaCode.size())
                            .build());
                }

                startIndex += PAGE_SIZE;
            }
        } catch (Exception e) {
            log.warn("상권분석 API 동기화 실패 - 인증키 미발급/미설정 상태일 수 있습니다. 지역 목록 없이 기동합니다.", e);
            return;
        }

        regionRepository.saveAll(regionsByTradeAreaCode.values());
        log.info("상권분석 API 지역(기획팀 소분류 표시명 큐레이션) 동기화 완료: {}건", regionsByTradeAreaCode.size());
    }

    private Map<String, CuratedRegion> loadCuratedRegions() {
        Map<String, CuratedRegion> curatedRegions = new LinkedHashMap<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource(CURATION_RESOURCE).getInputStream(), StandardCharsets.UTF_8))) {
            reader.readLine(); // header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                String[] columns = line.split(",", 3);
                curatedRegions.put(columns[0], new CuratedRegion(columns[1], columns[2]));
            }
        } catch (IOException e) {
            throw new IllegalStateException(CURATION_RESOURCE + " 로드 실패", e);
        }
        return curatedRegions;
    }
}
