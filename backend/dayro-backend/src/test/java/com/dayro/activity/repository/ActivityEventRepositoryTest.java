package com.dayro.activity.repository;

import com.dayro.activity.domain.ActivityEvent;
import com.dayro.activity.domain.ActivityEventType;
import com.dayro.auth.domain.Member;
import com.dayro.auth.repository.MemberRepository;
import com.dayro.global.config.JpaConfig;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;

@DataJpaTest
@Import(JpaConfig.class) // 회원 created_at(Auditing) 채우기 - @DataJpaTest는 이 설정을 자동으로 올리지 않는다
@Testcontainers
@AutoConfigureTestDatabase(replace = Replace.NONE)
// create-drop을 쓰지 않는다: 종료 시점엔 Testcontainers가 DB를 이미 내린 뒤라 drop 연결 시도가 30초씩 타임아웃된다(컨테이너는 어차피 버려짐)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create")
class ActivityEventRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private ActivityEventRepository activityEventRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void eventType_hasNoEnumCheckConstraint() {
        // CHECK 제약이 생기면 ddl-auto=update 환경에서 이벤트 종류 추가 시 INSERT가 실패한다
        Number checkCount = (Number) entityManager.createNativeQuery("""
                SELECT COUNT(*) FROM pg_constraint
                WHERE conrelid = 'activity_events'::regclass AND contype = 'c'
                """).getSingleResult();

        assertThat(checkCount.intValue()).isZero();
    }

    @Test
    void metadata_isStoredAsJsonbAndReadBack() {
        Instant occurredAt = Instant.parse("2026-10-05T15:30:00Z");
        activityEventRepository.saveAndFlush(ActivityEvent.builder()
                .eventType(ActivityEventType.COURSE_GENERATE)
                .requestId("req-1")
                .metadata(Map.of("regionName", "홍대", "durationMinutes", 180, "retry", false))
                .occurredAt(occurredAt)
                .build());

        ActivityEvent found = activityEventRepository.findAllByEventType(ActivityEventType.COURSE_GENERATE).get(0);

        assertThat(found.getRequestId()).isEqualTo("req-1");
        assertThat(found.getMemberId()).isNull();
        assertThat(found.getOccurredAt()).isEqualTo(occurredAt);
        assertThat(found.getMetadata())
                .containsEntry("regionName", "홍대")
                .containsEntry("durationMinutes", 180)
                .containsEntry("retry", false);
    }

    @Test
    void anonymizeMember_clearsOnlyThatMembersEvents() {
        UUID withdrawn = UUID.randomUUID();
        UUID other = UUID.randomUUID();
        activityEventRepository.save(event(ActivityEventType.SIGN_UP, withdrawn));
        activityEventRepository.save(event(ActivityEventType.COURSE_SAVE, withdrawn));
        activityEventRepository.save(event(ActivityEventType.SIGN_UP, other));
        activityEventRepository.flush();

        int updated = activityEventRepository.anonymizeMember(withdrawn);

        assertThat(updated).isEqualTo(2);
        entityManager.clear(); // 벌크 UPDATE는 1차 캐시를 거치지 않으므로 DB 값을 다시 읽는다
        // 통계(행)는 남고 누구의 활동인지만 끊긴다
        assertThat(activityEventRepository.findAll()).hasSize(3)
                .extracting(ActivityEvent::getMemberId)
                .containsExactlyInAnyOrder(null, null, other);
    }

    @Test
    void anonymizeMember_doesNotDiscardPendingDeletesInSameTransaction() {
        Member member = memberRepository.saveAndFlush(Member.builder().kakaoId("k-1").nickname("탈퇴자").build());

        // 회원 탈퇴 흐름과 같은 순서 - 삭제(아직 flush 전) 후 비식별화
        memberRepository.delete(member);
        activityEventRepository.anonymizeMember(member.getId());
        entityManager.flush();

        Number remaining = (Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM members WHERE id = :id")
                .setParameter("id", member.getId())
                .getSingleResult();
        assertThat(remaining.intValue()).isZero();
    }

    private ActivityEvent event(ActivityEventType type, UUID memberId) {
        return ActivityEvent.builder()
                .eventType(type)
                .memberId(memberId)
                .metadata(Map.of())
                .occurredAt(Instant.now())
                .build();
    }
}
