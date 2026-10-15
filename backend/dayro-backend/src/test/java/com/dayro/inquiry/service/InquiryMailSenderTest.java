package com.dayro.inquiry.service;

import com.dayro.inquiry.domain.Inquiry;
import com.dayro.inquiry.domain.InquiryMailStatus;
import com.dayro.inquiry.event.InquirySubmittedEvent;
import com.dayro.inquiry.repository.InquiryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class InquiryMailSenderTest {

    @Mock
    InquiryRepository inquiryRepository;
    @Mock
    JavaMailSender mailSender;

    @InjectMocks
    InquiryMailSender inquiryMailSender;

    private final UUID inquiryId = UUID.randomUUID();
    private Inquiry inquiry;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(inquiryMailSender, "from", "dayro@gmail.com");
        ReflectionTestUtils.setField(inquiryMailSender, "to", "");
        inquiry = Inquiry.builder().subject("저장\r\nBcc: spam@evil.com").body("코스 저장이 안 돼요")
                .replyEmail("user@example.com").build();
        ReflectionTestUtils.setField(inquiry, "id", inquiryId);
        ReflectionTestUtils.setField(inquiry, "createdAt", LocalDateTime.of(2026, 10, 14, 12, 0));
        given(inquiryRepository.findById(inquiryId)).willReturn(Optional.of(inquiry));
    }

    @Test
    void send_mailsToDayroWithReplyToUserAndSingleLineSubject() {
        inquiryMailSender.send(new InquirySubmittedEvent(inquiryId));

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getTo()).containsExactly("dayro@gmail.com");
        assertThat(message.getReplyTo()).isEqualTo("user@example.com");
        assertThat(message.getSubject()).isEqualTo("[데이로 문의] 저장 Bcc: spam@evil.com").doesNotContain("\n");
        assertThat(message.getText()).contains("코스 저장이 안 돼요", "user@example.com", "비회원", inquiryId.toString());
        assertThat(inquiry.getMailStatus()).isEqualTo(InquiryMailStatus.SENT);
        assertThat(inquiry.getMailedAt()).isNotNull();
    }

    @Test
    void send_failure_marksFailedAndSwallows() {
        willThrow(new MailSendException("smtp down")).given(mailSender).send(any(SimpleMailMessage.class));

        inquiryMailSender.send(new InquirySubmittedEvent(inquiryId));

        assertThat(inquiry.getMailStatus()).isEqualTo(InquiryMailStatus.FAILED);
        verify(inquiryRepository).save(inquiry);
    }

    @Test
    void send_withoutMailAccount_onlyMarksSkipped() {
        ReflectionTestUtils.setField(inquiryMailSender, "from", "");

        inquiryMailSender.send(new InquirySubmittedEvent(inquiryId));

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
        assertThat(inquiry.getMailStatus()).isEqualTo(InquiryMailStatus.SKIPPED);
    }
}
