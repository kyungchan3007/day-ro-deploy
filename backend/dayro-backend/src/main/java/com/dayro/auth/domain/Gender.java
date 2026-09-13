package com.dayro.auth.domain;

public enum Gender {
    MALE, FEMALE;

    // 카카오가 내려주는 "male" / "female" 문자열을 enum으로 변환
    // 선택 동의 항목이라 미동의 시 null이 올 수 있으므로 null 방어
    public static Gender from(String kakaoGender) {
        if (kakaoGender == null) {
            return null;
        }
        return "male".equals(kakaoGender) ? MALE : FEMALE;
    }
}
