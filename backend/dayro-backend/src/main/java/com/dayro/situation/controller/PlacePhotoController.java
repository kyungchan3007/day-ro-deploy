package com.dayro.situation.controller;

import com.dayro.global.quota.RateLimiter;
import com.dayro.situation.client.GooglePlacesClient;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

// CourseCandidateResponse.PlaceCandidate.photoUrl이 가리키는 프록시 엔드포인트 - Google API 키를 클라이언트에 노출하지 않기 위해 서버가 대신 조회해 전달한다
@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlacePhotoController {

    // 코스 후보 한 화면에 최대 9장이 뜨므로, 화면을 몇 번 오가도 걸리지 않을 만큼만 여유를 둔 값
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(1);
    // photoName은 사진마다 고정이라 같은 URL이 다른 이미지를 가리킬 일이 없다 - 브라우저 캐시를 길게 잡아 재조회 과금을 없앤다
    private static final Duration BROWSER_CACHE_TTL = Duration.ofDays(7);

    private final GooglePlacesClient googlePlacesClient;
    private final RateLimiter rateLimiter;

    @Value("${quota.places.photo-per-ip-limit:60}")
    private long perIpLimit;

    @GetMapping("/photo")
    public ResponseEntity<byte[]> photo(@RequestParam String name, HttpServletRequest request) {
        rateLimiter.check("places-photo", request.getRemoteAddr(), perIpLimit, RATE_LIMIT_WINDOW);

        GooglePlacesClient.Photo photo = googlePlacesClient.fetchPhoto(name);

        return ResponseEntity.ok()
                .contentType(photo.contentType())
                .cacheControl(CacheControl.maxAge(BROWSER_CACHE_TTL).cachePublic())
                .body(photo.data());
    }
}
