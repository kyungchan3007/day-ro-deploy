package com.dayro.inquiry.domain;

// 문의 메일 전달 상태 - 실패/미설정 건은 DB에 남아 있으므로 어드민에서 확인하고 직접 답할 수 있다
public enum InquiryMailStatus {
    PENDING,
    SENT,
    FAILED,
    SKIPPED  // 메일 계정 미설정(로컬/CI) - 저장만 한다
}
