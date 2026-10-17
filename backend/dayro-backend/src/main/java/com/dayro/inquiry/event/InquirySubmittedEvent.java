package com.dayro.inquiry.event;

import java.util.UUID;

// 문의 저장 트랜잭션이 커밋된 뒤 메일을 보내기 위한 이벤트
public record InquirySubmittedEvent(UUID inquiryId) {
}
