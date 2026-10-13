# 코스 생성·재추천 로그인 토큰 전달 PRD

## Meta
- prd_id: 2026-10-05-situation-auth-header
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시)
- issue: Dayro-dev/dayro#135
- 요청: 백엔드(사용자 통계 집계)

## Problem
- 출시 후 6개월 KPI 핵심 지표 "주간 코스 생성 이용자 수"를 백엔드가 집계해야 한다.
- 코스 생성(`POST /api/situations`)·다른 코스 보기(`POST /api/situations/{requestId}/retry`) BFF 호출에 토큰이 붙지 않아, 로그인 사용자도 비회원으로 집계된다.

## Goal
- 로그인 상태면 두 호출에 `Authorization: Bearer {accessToken}`를 붙인다.
- 비로그인은 지금처럼 헤더 없이 보낸다. 응답 형식·화면 동작은 바뀌지 않는다.

## In Scope
- BFF Route Handler(`app/api/situations/**`)에서 httpOnly 쿠키 access token 읽기 → 서버 계층 → backend transport 헤더

## Out of Scope
- 토큰 refresh(만료·위조 토큰은 백엔드가 비회원 처리, 401 없음)
- 비회원 기기 ID(쿠키 발급 위치·헤더 이름) — 백엔드와 별도 논의
- 백엔드 집계 구현
