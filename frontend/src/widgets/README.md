# Widgets

여러 feature를 조합한 화면 단위 블록이 필요할 때만 사용한다.

## 사용 기준
- 하나의 화면 영역이 여러 feature를 조합한다.
- app route에 직접 두기에는 재사용되거나 복잡하다.

## 규칙
- widget은 feature public API를 조합한다.
- feature 내부 파일을 직접 import하지 않는다.
- 비즈니스 규칙은 feature에 둔다.
