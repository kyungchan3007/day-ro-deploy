import type { SessionUser } from "@/features/auth";
import type { ProfileInfoRow } from "../ui/ProfileInfoList";

/**
 * 백엔드 생일(MMDD)을 화면용 `MM.DD` 형식으로 바꾼다.
 * @param birthday 카카오에서 받은 생일 문자열.
 */
function formatBirthday(birthday: string | null) {
  if (!birthday || birthday.length !== 4) {
    return null;
  }

  return `${birthday.slice(0, 2)}.${birthday.slice(2, 4)}`;
}

/**
 * 가입 일시 문자열을 화면용 `YYYY.MM.DD` 형식으로 바꾼다.
 * @param joinedAt ISO 날짜 문자열.
 */
function formatJoinDate(joinedAt: string) {
  const date = new Date(joinedAt);

  if (Number.isNaN(date.getTime())) {
    return joinedAt;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/\s/g, "")
    .replace(/\.$/, "");
}

/**
 * 현재 로그인 사용자를 내 정보 행 목록으로 변환한다.
 * 카카오 동의 상태에 따라 null 인 값은 숨겨서 실제 보이는 정보만 보여준다.
 *
 * @param user 현재 로그인 사용자.
 */
export function buildProfileInfoRows(user: SessionUser): ProfileInfoRow[] {
  const rows: ProfileInfoRow[] = [
    { label: "연동 계정", value: "카카오" },
    { label: "닉네임", value: user.nickname ?? "-" },
  ];

  if (user.email) {
    rows.push({ label: "이메일", value: user.email });
  }

  if (user.name) {
    rows.push({ label: "이름", value: user.name });
  }

  const birthday = formatBirthday(user.birthday);
  if (birthday) {
    rows.push({ label: "생일", value: birthday });
  }

  rows.push({ label: "가입일", value: formatJoinDate(user.joinedAt) });

  return rows;
}
