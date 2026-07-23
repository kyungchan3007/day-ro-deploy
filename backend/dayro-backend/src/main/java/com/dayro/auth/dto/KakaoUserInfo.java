package com.dayro.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class KakaoUserInfo {
    private Long id;
    @JsonProperty("kakao_account")
    private KakaoAccount kakaoAccount;

    @Data
    @NoArgsConstructor
    public static class KakaoAccount {
        private String email;
        private String name;        // 실명 (name 동의항목)
        private String gender;      // "male" / "female"
        private String birthday;    // "MMDD" 형식 (연도는 birthyear 별도 항목)
        private Profile profile;

        @Data
        @NoArgsConstructor
        public static class Profile {
            private String nickname;
            @JsonProperty("profile_image_url")
            private String profileImageUrl;
        }
    }
}
