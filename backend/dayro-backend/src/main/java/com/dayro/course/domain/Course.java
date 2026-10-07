package com.dayro.course.domain;

import com.dayro.auth.domain.Member;
import com.dayro.situation.domain.Purpose;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GenerationType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// 사용자가 AI 추천(situation 도메인) 결과 중 선택·정렬한 코스를 저장한 것 - places는 저장 시점 스냅샷이라 이후 원본 장소 정보가 바뀌어도 영향받지 않는다
@Entity
@Table(name = "courses")
@Getter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Column(name = "region_name", nullable = false)
    private String regionName;

    @Column(name = "region_category", nullable = false)
    private String regionCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Purpose purpose;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("visitOrder ASC")
    private List<CoursePlace> coursePlaces = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Course(Member member, String title, String description, String regionName, String regionCategory,
                  Purpose purpose, LocalTime startTime, LocalTime endTime) {
        this.member = member;
        this.title = title;
        this.description = description;
        this.regionName = regionName;
        this.regionCategory = regionCategory;
        this.purpose = purpose;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public void addPlace(CoursePlace coursePlace) {
        coursePlaces.add(coursePlace);
        coursePlace.assignCourse(this);
    }

    public void update(String title, String description) {
        this.title = title;
        this.description = description;
    }

    // placeIds에 없는 장소는 삭제(orphanRemoval)되고, 남은 장소는 placeIds 순서를 새 방문 순서로 반영한다.
    // 대상 placeId가 이 코스 소속인지, 최소 개수를 만족하는지는 호출 전에 검증되어 있어야 한다.
    public void reorderPlaces(List<String> placeIds) {
        Map<String, CoursePlace> byPlaceId = coursePlaces.stream()
                .collect(Collectors.toMap(CoursePlace::getPlaceId, Function.identity()));

        coursePlaces.removeIf(coursePlace -> !placeIds.contains(coursePlace.getPlaceId()));
        for (int i = 0; i < placeIds.size(); i++) {
            byPlaceId.get(placeIds.get(i)).updateVisitOrder(i);
        }
        coursePlaces.sort(Comparator.comparingInt(CoursePlace::getVisitOrder));
    }
}
