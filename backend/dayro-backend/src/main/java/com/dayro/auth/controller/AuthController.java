package com.dayro.auth.controller;

import com.dayro.auth.dto.request.KakaoLoginRequest;
import com.dayro.auth.dto.request.RefreshRequest;
import com.dayro.auth.dto.response.AuthResponse;
import com.dayro.auth.dto.response.MemberResponse;
import com.dayro.auth.service.AuthService;
import com.dayro.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/kakao/token")
    public ResponseEntity<ApiResponse<AuthResponse>> kakaoLogin(@RequestBody @Valid KakaoLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.kakaoLogin(request.code())));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody @Valid RefreshRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(request.refreshToken())));
    }

    @DeleteMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal String memberId) {
        authService.logout(memberId);
        return ResponseEntity.ok(ApiResponse.success("로그아웃 되었습니다."));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MemberResponse>> getMyInfo(@AuthenticationPrincipal String memberId) {
        return ResponseEntity.ok(ApiResponse.success(authService.getMyInfo(memberId)));
    }
}
