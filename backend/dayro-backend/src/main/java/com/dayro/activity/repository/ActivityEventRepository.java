package com.dayro.activity.repository;

import com.dayro.activity.domain.ActivityEvent;
import com.dayro.activity.domain.ActivityEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {

    List<ActivityEvent> findAllByEventType(ActivityEventType eventType);

    // 회원 탈퇴 시 사용 - 통계는 남기고 누구의 활동인지만 끊는다
    // clearAutomatically를 쓰면 안 된다: 같은 트랜잭션에서 아직 flush 안 된 회원/코스 삭제까지 영속성 컨텍스트에서 버려져 탈퇴가 반영되지 않는다
    @Modifying
    @Query("UPDATE ActivityEvent e SET e.memberId = null WHERE e.memberId = :memberId")
    int anonymizeMember(@Param("memberId") UUID memberId);
}
