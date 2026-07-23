package com.dayro.situation.controller;

import com.dayro.global.response.ApiResponse;
import com.dayro.situation.dto.response.RegionResponse;
import com.dayro.situation.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RegionResponse>>> getRegions() {
        return ResponseEntity.ok(ApiResponse.success(regionService.getRegions()));
    }
}
