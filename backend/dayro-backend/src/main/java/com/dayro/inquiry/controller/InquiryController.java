package com.dayro.inquiry.controller;

import com.dayro.global.response.ApiResponse;
import com.dayro.inquiry.dto.request.InquiryCreateRequest;
import com.dayro.inquiry.dto.response.InquiryCreateResponse;
import com.dayro.inquiry.service.InquiryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// FAQ 문의하기 - 비회원도 사용 가능. 저장 후 데이로 대표 메일로 비동기 전달된다
@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping
    public ResponseEntity<ApiResponse<InquiryCreateResponse>> create(@Valid @RequestBody InquiryCreateRequest request,
                                                                     HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.success("문의가 접수되었습니다.",
                inquiryService.create(request, httpRequest.getRemoteAddr())));
    }
}
