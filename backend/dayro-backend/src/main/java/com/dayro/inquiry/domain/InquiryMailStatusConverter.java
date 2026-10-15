package com.dayro.inquiry.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

// @Enumerated(STRING)은 CHECK 제약을 만들고 ddl-auto=update가 이를 갱신하지 않아, 상태를 추가하면 운영 INSERT가 실패한다(ActivityEventTypeConverter와 같은 이유)
@Converter
public class InquiryMailStatusConverter implements AttributeConverter<InquiryMailStatus, String> {

    @Override
    public String convertToDatabaseColumn(InquiryMailStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public InquiryMailStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : InquiryMailStatus.valueOf(dbData);
    }
}
