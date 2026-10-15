package com.dayro.inquiry.service.impl;

import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.event.ActivityOccurredEvent;
import com.dayro.global.config.jwt.AuthenticatedMember;
import com.dayro.global.quota.RateLimiter;
import com.dayro.inquiry.domain.Inquiry;
import com.dayro.inquiry.dto.request.InquiryCreateRequest;
import com.dayro.inquiry.dto.response.InquiryCreateResponse;
import com.dayro.inquiry.event.InquirySubmittedEvent;
import com.dayro.inquiry.repository.InquiryRepository;
import com.dayro.inquiry.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InquiryServiceImpl implements InquiryService {

    private final InquiryRepository inquiryRepository;
    private final RateLimiter rateLimiter;
    private final ApplicationEventPublisher eventPublisher;

    // 비로그인으로 열린 "메일 보내기" API라 스팸 통로가 되지 않게 IP별·전체 일일 상한을 둔다
    @Value("${inquiry.per-ip-hourly-limit:5}")
    private long perIpHourlyLimit;

    @Value("${inquiry.daily-limit:100}")
    private long dailyLimit;

    @Override
    @Transactional
    public InquiryCreateResponse create(InquiryCreateRequest request, String clientIp) {
        rateLimiter.check("inquiry", clientIp, perIpHourlyLimit, Duration.ofHours(1));
        rateLimiter.check("inquiry-daily", "all", dailyLimit, Duration.ofDays(1));

        UUID memberId = AuthenticatedMember.currentIdOrNull();
        Inquiry inquiry = inquiryRepository.save(Inquiry.builder()
                .subject(request.subject().strip())
                .body(request.body().strip())
                .replyEmail(request.email().strip())
                .memberId(memberId)
                .build());

        eventPublisher.publishEvent(new InquirySubmittedEvent(inquiry.getId()));
        // 이메일·본문은 개인정보/자유입력이라 활동 이벤트에 넣지 않는다
        eventPublisher.publishEvent(ActivityOccurredEvent.of(ActivityEventType.INQUIRY_SUBMIT, memberId,
                ActivityOccurredEvent.metadata("inquiryId", inquiry.getId().toString())));
        return new InquiryCreateResponse(inquiry.getId());
    }
}
