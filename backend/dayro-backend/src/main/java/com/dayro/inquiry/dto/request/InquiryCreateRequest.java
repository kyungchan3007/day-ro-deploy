package com.dayro.inquiry.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// FE features/faq/model/contact-validation.ts와 같은 규칙 - 제목 40자, 내용 3,000자, 이메일 형식
public record InquiryCreateRequest(
        @NotBlank @Size(max = 40) String subject,
        @NotBlank @Size(max = 3000) String body,
        @NotBlank @Email @Size(max = 254) String email
) {
}
