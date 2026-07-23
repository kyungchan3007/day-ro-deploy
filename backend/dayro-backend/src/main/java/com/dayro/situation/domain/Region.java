package com.dayro.situation.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

// 상황 입력 - 지역 선택 마스터 데이터. 대분류=자치구, 상세지역=기획팀이 큐레이션한 소분류 표시명 (예: "홍대", "가로수길")
// 행정동 전체를 노출하면 서울 거의 모든 동이 나와 "핫플" 선별 의미가 없어서, 상권분석 API의 발달상권/관광특구만 사용하기로 팀 논의로 확정
@Entity
@Table(name = "regions")
@Getter
@NoArgsConstructor
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "district_id", nullable = false, unique = true)
    private String districtId;   // 상권 코드 (TRDAR_CD)

    @Column(nullable = false)
    private String category;     // 자치구명 (예: "마포구")

    @Column(name = "category_order", nullable = false)
    private int categoryOrder;   // 자치구 코드(SIGNGU_CD) 기준 정렬값

    @Column(nullable = false)
    private String name;         // 소분류 표시명, 기획팀 큐레이션 (예: "홍대") - 여러 상권코드가 같은 표시명을 공유 가능

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;       // 같은 자치구 내 노출 순서

    @Builder
    public Region(String districtId, String category, int categoryOrder, String name, int sortOrder) {
        this.districtId = districtId;
        this.category = category;
        this.categoryOrder = categoryOrder;
        this.name = name;
        this.sortOrder = sortOrder;
    }
}
