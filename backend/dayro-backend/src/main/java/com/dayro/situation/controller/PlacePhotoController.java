package com.dayro.situation.controller;

import com.dayro.situation.client.GooglePlacesClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// CourseCandidateResponse.PlaceCandidate.photoUrl이 가리키는 프록시 엔드포인트 - Google API 키를 클라이언트에 노출하지 않기 위해 서버가 대신 조회해 전달한다
@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlacePhotoController {

    private final GooglePlacesClient googlePlacesClient;

    @GetMapping("/photo")
    public ResponseEntity<byte[]> photo(@RequestParam String name) {
        return googlePlacesClient.fetchPhoto(name);
    }
}
