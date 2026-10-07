/** 세션 계약은 BFF 서버 계층과 공유하므로 shared/api 에 두고 여기서 다시 내보낸다(shared → features 금지). */
export type { AuthSession, SessionUser } from "../../../shared/api/auth-session";
