package com.dayro.situation.service.ai;

import com.dayro.global.quota.DailyCallBudget;
import com.dayro.situation.domain.PlaceCategory;
import com.dayro.situation.domain.Purpose;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CoursePlaceSelectorTest {

    private static final String PRIMARY = "primary-model";
    private static final String FALLBACK = "fallback-model";

    @Mock
    ChatModel chatModel;
    @Mock
    DailyCallBudget dailyCallBudget;
    @Mock
    ApplicationEventPublisher eventPublisher;

    CoursePlaceSelector selector;

    private final List<PlaceCandidateDraft> candidates = List.of(
            new PlaceCandidateDraft("p1", "카페", PlaceCategory.values()[0], 4.5, 100, null),
            new PlaceCandidateDraft("p2", "전시", PlaceCategory.values()[1], 4.7, 200, null));

    @BeforeEach
    void setUp() {
        selector = new CoursePlaceSelector(ChatClient.builder(chatModel), dailyCallBudget, eventPublisher);
        ReflectionTestUtils.setField(selector, "dailyLimit", 50L);
        ReflectionTestUtils.setField(selector, "primaryModel", PRIMARY);
        ReflectionTestUtils.setField(selector, "fallbackModel", FALLBACK);
    }

    @Test
    void primarySucceeds_doesNotCallFallback() {
        given(chatModel.call(any(Prompt.class))).willReturn(response("[\"p2\",\"p1\"]"));

        List<String> result = selector.select(candidates, Purpose.ANNIVERSARY, 2, false);

        assertThat(result).containsExactly("p2", "p1");
        assertThat(calledModels(1)).containsExactly(PRIMARY);
    }

    @Test
    void primaryFails_retriesOnceWithFallbackModel() {
        given(chatModel.call(any(Prompt.class)))
                .willThrow(new RuntimeException("503 This model is currently experiencing high demand"))
                .willReturn(response("[\"p1\",\"p2\"]"));

        List<String> result = selector.select(candidates, Purpose.ANNIVERSARY, 2, false);

        assertThat(result).containsExactly("p1", "p2");
        assertThat(calledModels(2)).containsExactly(PRIMARY, FALLBACK);
        // 폴백은 같은 사용자 요청의 연장이라 일일 한도는 한 번만 차감한다
        verify(dailyCallBudget, times(1)).consume(eq("gemini-course-selection"), anyLong());
    }

    @Test
    void bothFail_throws() {
        given(chatModel.call(any(Prompt.class))).willThrow(new RuntimeException("503"));

        assertThatThrownBy(() -> selector.select(candidates, Purpose.ANNIVERSARY, 2, false))
                .isInstanceOf(RuntimeException.class);
        assertThat(calledModels(2)).containsExactly(PRIMARY, FALLBACK);
    }

    @Test
    void noFallbackConfigured_failsWithoutRetry() {
        ReflectionTestUtils.setField(selector, "fallbackModel", "");
        given(chatModel.call(any(Prompt.class))).willThrow(new RuntimeException("503"));

        assertThatThrownBy(() -> selector.select(candidates, Purpose.ANNIVERSARY, 2, false))
                .isInstanceOf(RuntimeException.class);
        assertThat(calledModels(1)).containsExactly(PRIMARY);
    }

    private List<String> calledModels(int expectedCalls) {
        ArgumentCaptor<Prompt> captor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel, times(expectedCalls)).call(captor.capture());
        return captor.getAllValues().stream().map(p -> p.getOptions().getModel()).toList();
    }

    private ChatResponse response(String idsJson) {
        return new ChatResponse(List.of(new Generation(new AssistantMessage("{\"orderedPlaceIds\":" + idsJson + "}"))));
    }
}
