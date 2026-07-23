package com.dayro.auth.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

// 카카오싱크 간편가입 시 사용자가 동의한 서비스 약관 내역
// 약관은 여러 개이므로 Member 컬럼이 아닌 별도 테이블로 관리
@Entity
@Table(name = "member_service_terms")
@Getter
@NoArgsConstructor
public class MemberServiceTerm {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private String tag;          // 동의한 약관 식별 태그

    @Column(name = "agreed_at")
    private LocalDateTime agreedAt;

    @Builder
    public MemberServiceTerm(Member member, String tag, LocalDateTime agreedAt) {
        this.member = member;
        this.tag = tag;
        this.agreedAt = agreedAt;
    }
}
