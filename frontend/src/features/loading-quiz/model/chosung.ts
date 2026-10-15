/**
 * 한글 초성 추출 — 순수 로직.
 *
 * 정답 단어에서 초성 문자열을 계산한다. 초성을 사람이 직접 적지 않고
 * 정답만 관리하기 위한 유틸이다. (예: `마카롱 카페` → `ㅁㅋㄹ ㅋㅍ`)
 */

/** 한글 음절 초성 19자(유니코드 분해 순서). */
const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ",
  "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ",
  "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

/** 한글 음절 영역 시작(가) 코드포인트. */
const HANGUL_BASE = 0xac00;
/** 한글 음절 영역 끝(힣) 코드포인트. */
const HANGUL_END = 0xd7a3;
/** 초성 하나가 담당하는 음절 수(중성 21 × 종성 28). */
const CHOSEONG_STRIDE = 588;

/**
 * 한 글자의 초성을 반환한다.
 * 한글 음절이면 대응 초성을, 그 외(공백·자모·영문·기호)는 원문 그대로 유지한다.
 */
function toChoseongChar(char: string): string {
  const code = char.codePointAt(0);
  if (code === undefined || code < HANGUL_BASE || code > HANGUL_END) {
    return char;
  }
  const index = Math.floor((code - HANGUL_BASE) / CHOSEONG_STRIDE);
  return CHOSEONG[index];
}

/**
 * 정답 문자열을 초성 문자열로 변환한다.
 * 공백은 그대로 두어 단어 경계가 유지된다.
 */
export function toChoseong(answer: string): string {
  return Array.from(answer).map(toChoseongChar).join("");
}
