package com.dayro.inquiry.service.impl;

import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.event.ActivityOccurredEvent;
import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import com.dayro.global.quota.RateLimiter;
import com.dayro.inquiry.domain.Inquiry;
import com.dayro.inquiry.dto.request.InquiryCreateRequest;
import com.dayro.inquiry.dto.response.InquiryCreateResponse;
import com.dayro.inquiry.event.InquirySubmittedEvent;
import com.dayro.inquiry.repository.InquiryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class InquiryServiceImplTest {

    @Mock
    InquiryRepository inquiryRepository;
    @Mock
    RateLimiter rateLimiter;
    @Mock
    ApplicationEventPublisher eventPublisher;

    @InjectMocks
    InquiryServiceImpl inquiryService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(inquiryService, "perIpHourlyLimit", 5L);
        ReflectionTestUtils.setField(inquiryService, "dailyLimit", 100L);
    }

    @Test
    void create_savesInquiryAndPublishesMailAndActivityEvents() {
        UUID inquiryId = UUID.randomUUID();
        given(inquiryRepository.save(any(Inquiry.class))).willAnswer(invocation -> {
            Inquiry saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", inquiryId);
            return saved;
        });

        InquiryCreateResponse response = inquiryService.create(
                new InquiryCreateRequest("  코스 저장 문의 ", "저장이 안 돼요\n", " user@example.com "), "1.2.3.4");

        assertThat(response.inquiryId()).isEqualTo(inquiryId);
        verify(rateLimiter).check(eq("inquiry"), eq("1.2.3.4"), eq(5L), eq(Duration.ofHours(1)));
        verify(rateLimiter).check(eq("inquiry-daily"), eq("all"), eq(100L), eq(Duration.ofDays(1)));

        ArgumentCaptor<Inquiry> inquiryCaptor = ArgumentCaptor.forClass(Inquiry.class);
        verify(inquiryRepository).save(inquiryCaptor.capture());
        assertThat(inquiryCaptor.getValue().getSubject()).isEqualTo("코스 저장 문의");
        assertThat(inquiryCaptor.getValue().getReplyEmail()).isEqualTo("user@example.com");
        assertThat(inquiryCaptor.getValue().getMemberId()).isNull();

        ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher, times(2)).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getAllValues().get(0)).isEqualTo(new InquirySubmittedEvent(inquiryId));
        ActivityOccurredEvent activity = (ActivityOccurredEvent) eventCaptor.getAllValues().get(1);
        assertThat(activity.type()).isEqualTo(ActivityEventType.INQUIRY_SUBMIT);
        // 이메일·본문 같은 자유입력/개인정보는 활동 이벤트에 남기지 않는다
        assertThat(activity.metadata()).containsOnlyKeys("inquiryId");
    }

    @Test
    void create_rateLimited_doesNotSave() {
        willThrow(new BusinessException(ErrorCode.TOO_MANY_REQUESTS))
                .given(rateLimiter).check(eq("inquiry"), eq("1.2.3.4"), anyLong(), any());

        assertThatThrownBy(() -> inquiryService.create(
                new InquiryCreateRequest("제목", "내용", "user@example.com"), "1.2.3.4"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TOO_MANY_REQUESTS);
        verify(inquiryRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any(Object.class));
    }
}
