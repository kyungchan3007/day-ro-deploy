package com.dayro.situation.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

// Google Places API (New) Text Search 응답 - https://places.googleapis.com/v1/places:searchText
public record PlaceSearchResponse(
        List<Place> places
) {

    public record Place(
            String id,
            DisplayName displayName,
            List<String> types,
            String formattedAddress,
            Location location,
            Double rating,
            @JsonProperty("userRatingCount") Integer userRatingCount,
            @JsonProperty("regularOpeningHours") OpeningHours regularOpeningHours,
            @JsonProperty("editorialSummary") EditorialSummary editorialSummary,
            List<Photo> photos
    ) {
    }

    // name은 "places/{placeId}/photos/{photoId}" 형태의 리소스명 - 실제 이미지 URL은 Photo Media 엔드포인트로 별도 조회해야 함
    public record Photo(
            String name
    ) {
    }

    public record DisplayName(
            String text,
            String languageCode
    ) {
    }

    public record Location(
            double latitude,
            double longitude
    ) {
    }

    public record OpeningHours(
            List<Period> periods,
            List<String> weekdayDescriptions
    ) {
    }

    public record Period(
            TimePoint open,
            TimePoint close
    ) {
    }

    public record TimePoint(
            int day,
            int hour,
            int minute
    ) {
    }

    public record EditorialSummary(
            String text
    ) {
    }
}
