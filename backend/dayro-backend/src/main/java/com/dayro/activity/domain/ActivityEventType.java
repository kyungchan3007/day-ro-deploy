package com.dayro.activity.domain;

// KPI 집계용 사용자 활동 이벤트 종류 - 연장/종료 판단 지표(북극성·리텐션·코스당 비용)의 원천 데이터
public enum ActivityEventType {
    // 회원
    SIGN_UP,
    LOGIN,
    LOGOUT,
    ACTIVE,              // 회원당 하루(KST) 1건 - DAU/리텐션 기준
    WITHDRAW,

    // 코스 생성 (비로그인 허용 경로 - 토큰이 있을 때만 member_id가 채워진다)
    COURSE_GENERATE,
    COURSE_RETRY,
    COURSE_GENERATE_FAIL,

    // 저장한 코스
    COURSE_SAVE,
    COURSE_LIST_VIEW,
    COURSE_VIEW,
    COURSE_UPDATE,
    COURSE_DELETE,

    // 외부 유료 API 실제 호출(캐시 적중은 기록되지 않음) - 코스 1건당 비용 산출용
    EXTERNAL_API_CALL;

    // 이 이벤트가 발생했다면 그날 활동한 것으로 본다 - 탈퇴는 활동이 아니라 이탈이고, 외부 API 호출은 사용자 행동이 아니다
    public boolean countsAsActive() {
        return this != WITHDRAW && this != EXTERNAL_API_CALL;
    }
}
