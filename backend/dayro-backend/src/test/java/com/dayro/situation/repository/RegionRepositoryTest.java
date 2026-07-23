package com.dayro.situation.repository;

import com.dayro.situation.domain.Region;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;

// Testcontainers 도입 예시 - 실제 Postgres 컨테이너로 JPA 쿼리 메서드를 검증
// ddl-auto를 명시적으로 지정 - 로컬 loc 프로파일이나 CI 환경변수에 기대지 않고 이 테스트 단독으로도 통과해야 함
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class RegionRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private RegionRepository regionRepository;

    @Test
    void 자치구_순서와_상세지역_순서대로_조회된다() {
        regionRepository.save(Region.builder()
                .districtId("3120101")
                .category("마포구")
                .categoryOrder(14)
                .name("합정")
                .sortOrder(0)
                .build());
        regionRepository.save(Region.builder()
                .districtId("3120006")
                .category("종로구")
                .categoryOrder(1)
                .name("종로")
                .sortOrder(0)
                .build());

        List<Region> result = regionRepository.findAllByOrderByCategoryOrderAscSortOrderAsc();

        assertThat(result).extracting(Region::getCategory)
                .containsExactly("종로구", "마포구");
    }
}
