package com.dayro.activity.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

// @Enumerated(STRING) 대신 쓰는 이유: Hibernate가 enum 허용값으로 CHECK 제약을 만드는데(columnDefinition을 지정해도 생김), ddl-auto=update는 이 제약을 갱신하지 않는다.
// 그러면 이벤트 종류를 추가했을 때 운영 DB INSERT가 실패하고, 리스너가 예외를 삼키므로 기록이 조용히 누락된다. 컨버터를 쓰면 제약이 생기지 않는다.
@Converter
public class ActivityEventTypeConverter implements AttributeConverter<ActivityEventType, String> {

    @Override
    public String convertToDatabaseColumn(ActivityEventType attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public ActivityEventType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ActivityEventType.valueOf(dbData);
    }
}
