package com.dayro.course.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GenerationType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

// 코스 저장 시점의 장소 상세정보 스냅샷 - Google 재조회 없이 저장 요청에 담긴 값을 그대로 보관한다
@Entity
@Table(name = "course_places")
@Getter
@NoArgsConstructor
public class CoursePlace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "visit_order", nullable = false)
    private int visitOrder;

    @Column(name = "place_id", nullable = false)
    private String placeId;

    @Column(nullable = false)
    private String name;

    @Column
    private String category;

    @Column
    private String address;

    @Column
    private Double rating;

    @Column(name = "user_rating_count")
    private Integer userRatingCount;

    @Column(name = "business_hours")
    private String businessHours;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "photo_url")
    private String photoUrl;

    @Builder
    public CoursePlace(int visitOrder, String placeId, String name, String category, String address,
                        Double rating, Integer userRatingCount, String businessHours,
                        Double latitude, Double longitude, String photoUrl) {
        this.visitOrder = visitOrder;
        this.placeId = placeId;
        this.name = name;
        this.category = category;
        this.address = address;
        this.rating = rating;
        this.userRatingCount = userRatingCount;
        this.businessHours = businessHours;
        this.latitude = latitude;
        this.longitude = longitude;
        this.photoUrl = photoUrl;
    }

    void assignCourse(Course course) {
        this.course = course;
    }

    void updateVisitOrder(int visitOrder) {
        this.visitOrder = visitOrder;
    }
}
