package com.dayro.inquiry.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

// FAQ 문의하기 - 메일 발송 성공 여부와 상관없이 먼저 저장해서, 발송 실패로 문의가 사라지지 않게 한다
@Entity
@Table(name = "inquiries")
@Getter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, length = 40)
    private String subject;

    @Column(nullable = false, length = 3000)
    private String body;

    @Column(name = "reply_email", nullable = false)
    private String replyEmail;   // 답변 받을 이메일 - 회원 정보가 아니라 사용자가 직접 입력한 값

    @Column(name = "member_id", columnDefinition = "uuid")
    private UUID memberId;       // 로그인 상태로 문의한 경우에만

    @Convert(converter = InquiryMailStatusConverter.class)
    @Column(name = "mail_status", nullable = false, length = 20)
    private InquiryMailStatus mailStatus = InquiryMailStatus.PENDING;

    @Column(name = "mailed_at")
    private LocalDateTime mailedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Inquiry(String subject, String body, String replyEmail, UUID memberId) {
        this.subject = subject;
        this.body = body;
        this.replyEmail = replyEmail;
        this.memberId = memberId;
    }

    public void markMailed(InquiryMailStatus status) {
        this.mailStatus = status;
        if (status == InquiryMailStatus.SENT) {
            this.mailedAt = LocalDateTime.now();
        }
    }
}
