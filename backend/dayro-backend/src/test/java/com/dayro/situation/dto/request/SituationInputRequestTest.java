package com.dayro.situation.dto.request;

import com.dayro.situation.domain.Purpose;
import com.navercorp.fixturemonkey.FixtureMonkey;
import com.navercorp.fixturemonkey.api.introspector.ConstructorPropertiesArbitraryIntrospector;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

// Fixture Monkey 도입 예시 - 랜덤 필드는 자동 생성하고 검증 대상 필드만 명시적으로 고정
// record는 세터가 없어 기본 BeanArbitraryIntrospector가 인스턴스화를 못 함 -> 정규 생성자 기반 introspector 필요
class SituationInputRequestTest {

    private final FixtureMonkey fixtureMonkey = FixtureMonkey.builder()
            .objectIntrospector(ConstructorPropertiesArbitraryIntrospector.INSTANCE)
            .build();

    @Test
    void 최소_2시간_이상_최대_12시간_이하면_유효하다() {
        SituationInputRequest request = fixtureMonkey.giveMeBuilder(SituationInputRequest.class)
                .set("startTime", LocalTime.of(12, 0))
                .set("endTime", LocalTime.of(18, 0))
                .set("purpose", Purpose.CASUAL_DATE)
                .sample();

        assertThat(request.isDurationValid()).isTrue();
    }

    @Test
    void 두시간_미만이면_유효하지_않다() {
        SituationInputRequest request = fixtureMonkey.giveMeBuilder(SituationInputRequest.class)
                .set("startTime", LocalTime.of(12, 0))
                .set("endTime", LocalTime.of(13, 0))
                .set("purpose", Purpose.CASUAL_DATE)
                .sample();

        assertThat(request.isDurationValid()).isFalse();
    }
}
