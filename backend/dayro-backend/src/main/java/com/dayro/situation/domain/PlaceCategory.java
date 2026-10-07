package com.dayro.situation.domain;

// 코스 구성용 장소 카테고리 - 기획안(26.07.14 Updated) slide 6 코스 구성 예시(식사+카페+산책/쇼핑 등) 기반
public enum PlaceCategory {
    MEAL("식사", "맛집"),
    CAFE("카페", "카페"),
    ACTIVITY("액티비티", "액티비티"),
    EXHIBITION("전시", "전시"),
    PARK("산책", "공원"),
    SHOPPING("쇼핑", "쇼핑"),
    BAR("야경/바", "바");

    private final String label;
    private final String searchKeyword;

    PlaceCategory(String label, String searchKeyword) {
        this.label = label;
        this.searchKeyword = searchKeyword;
    }

    public String label() {
        return label;
    }

    public String searchKeyword() {
        return searchKeyword;
    }
}
