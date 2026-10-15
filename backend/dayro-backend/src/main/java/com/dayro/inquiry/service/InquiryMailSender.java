package com.dayro.inquiry.service;

import com.dayro.inquiry.domain.Inquiry;
import com.dayro.inquiry.domain.InquiryMailStatus;
import com.dayro.inquiry.event.InquirySubmittedEvent;
import com.dayro.inquiry.repository.InquiryRepository;
import io.sentry.Sentry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.util.StringUtils;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import static com.dayro.global.config.AsyncConfig.MAIL_EXECUTOR;

// 문의 저장이 커밋된 뒤 데이로 대표 메일로 전달한다. 사용자는 메일 발송을 기다리지 않는다.
// 발송 실패는 상태(FAILED)와 Sentry로 남기고 삼킨다 - 문의 자체는 이미 저장돼 있다
@Component
@RequiredArgsConstructor
@Slf4j
public class InquiryMailSender {

    private static final DateTimeFormatter KST_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.of("Asia/Seoul"));

    private final InquiryRepository inquiryRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String from;

    // 받는 주소 - 비우면 보내는 계정(데이로 지메일) 자신에게 보낸다
    @Value("${inquiry.mail-to:}")
    private String to;

    @Async(MAIL_EXECUTOR)
    @TransactionalEventListener
    public void send(InquirySubmittedEvent event) {
        Inquiry inquiry = inquiryRepository.findById(event.inquiryId()).orElse(null);
        if (inquiry == null) {
            return;
        }
        if (!StringUtils.hasText(from)) {
            log.warn("메일 계정 미설정 - 문의는 저장만 함, inquiryId: {}", inquiry.getId());
            updateStatus(inquiry, InquiryMailStatus.SKIPPED);
            return;
        }
        try {
            mailSender.send(toMessage(inquiry));
            updateStatus(inquiry, InquiryMailStatus.SENT);
            log.info("문의 메일 발송 - inquiryId: {}", inquiry.getId());
        } catch (Exception e) {
            log.warn("문의 메일 발송 실패 - inquiryId: {}", inquiry.getId(), e);
            Sentry.captureException(e);
            updateStatus(inquiry, InquiryMailStatus.FAILED);
        }
    }

    private SimpleMailMessage toMessage(Inquiry inquiry) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(StringUtils.hasText(to) ? to : from);
        // 받은 메일에서 "답장"을 누르면 문의한 사용자에게 바로 간다
        message.setReplyTo(inquiry.getReplyEmail());
        message.setSubject("[데이로 문의] " + singleLine(inquiry.getSubject()));
        message.setText("""
                %s

                ----------------------------------------
                답변 받을 이메일: %s
                회원 여부: %s
                접수 시각: %s (KST)
                문의 ID: %s
                """.formatted(
                inquiry.getBody(),
                inquiry.getReplyEmail(),
                inquiry.getMemberId() == null ? "비회원" : "회원 (" + inquiry.getMemberId() + ")",
                KST_FORMAT.format(inquiry.getCreatedAt().atZone(ZoneId.systemDefault())),
                inquiry.getId()));
        return message;
    }

    // 제목 줄바꿈으로 메일 헤더를 조작하지 못하게 한 줄로 만든다
    private String singleLine(String value) {
        return value.replaceAll("[\\r\\n]+", " ");
    }

    private void updateStatus(Inquiry inquiry, InquiryMailStatus status) {
        inquiry.markMailed(status);
        inquiryRepository.save(inquiry);
    }
}
