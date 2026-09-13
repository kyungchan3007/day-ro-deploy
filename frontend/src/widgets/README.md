# Widgets

여러 feature를 조합한 화면 단위 블록이 필요할 때만 사용한다.

## 사용 기준
- 하나의 화면 영역이 여러 feature를 조합한다.
- app route에 직접 두기에는 재사용되거나 복잡하다.
- 화면의 헤더, 본문, CTA, 보조 안내처럼 여러 조각을 배치해 완성된 구조를 만든다.
- feature 내부의 UI 조각을 묶어 사용자의 한 화면 경험으로 조립한다.

## 규칙
- widget은 feature public API를 조합한다.
- feature 내부 파일을 직접 import하지 않는다.
- 비즈니스 규칙은 feature에 둔다.
- widget은 화면 단위 조합 책임을 가진다.
- widget 안에는 가능한 한 새로운 비즈니스 규칙을 넣지 않는다.
- 단일 버튼이나 단일 폼 필드 같은 조각은 widget이 아니라 feature 또는 shared에 둔다.