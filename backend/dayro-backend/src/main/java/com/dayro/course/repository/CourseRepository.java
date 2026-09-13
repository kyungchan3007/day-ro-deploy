package com.dayro.course.repository;

import com.dayro.course.domain.Course;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    List<Course> findAllByMember_IdOrderByCreatedAtDesc(UUID memberId);

    Optional<Course> findByIdAndMember_Id(UUID id, UUID memberId);

    // 회원 탈퇴 시 사용 - 엔티티 단위로 삭제되어 Course.coursePlaces의 orphanRemoval 캐스케이드가 그대로 적용된다
    void deleteAllByMember_Id(UUID memberId);

    // 인기 검색어 - 자치구 무관 전체 지역을 대상으로 저장된 코스가 많은 순으로 소분류 표시명을 집계. 저장 시점에만 카운트되어 상황입력 화면 이동만으로는 중복 집계되지 않는다.
    // 동률은 가나다순(regionName ASC)으로 - 현대 한글 음절(U+AC00~D7A3)은 코드포인트 순서가 곧 가나다 순서라 별도 콜레이션 없이도 정렬된다
    @Query("""
            SELECT c.regionName
            FROM Course c
            GROUP BY c.regionName
            ORDER BY COUNT(c) DESC, c.regionName ASC
            """)
    List<String> findPopularRegionNames(Pageable pageable);
}
