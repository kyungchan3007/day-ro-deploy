package com.dayro.inquiry.service;

import com.dayro.inquiry.dto.request.InquiryCreateRequest;
import com.dayro.inquiry.dto.response.InquiryCreateResponse;

public interface InquiryService {

    InquiryCreateResponse create(InquiryCreateRequest request, String clientIp);
}
