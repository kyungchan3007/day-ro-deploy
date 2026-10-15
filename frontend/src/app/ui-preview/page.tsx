"use client";

import {
  Logo,
  NavBar,
  Button,
  Toast,
  useToast,
  CourseTabGroup,
  CourseActions,
  PlaceNumberBadge,
  TransportStepList,
  TransportLabel,
  TransportInfo,
  RouteSummary,
  PathRoute,
  PlaceCard,
} from "@/shared/ui";

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4 border-b border-border/60 py-6">
      <div className="text-sm font-bold text-text-strong">{name}</div>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </div>
  );
}

export default function UiPreviewPage() {
  const { toast, visible, show } = useToast();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-text-strong">compornent-v0</h1>
        <span className="text-sm text-text-muted">shared/ui</span>
      </header>

      <Row name="logo-horizontal">
        <Logo height={28} />
        <Logo height={20} />
        <Logo height={24} withWordmark={false} />
      </Row>

      <Row name="nav-bar-top">
        <div className="w-[320px] rounded-lg border border-border">
          <NavBar />
        </div>
      </Row>

      <Row name="tap-course-btn-group">
        <CourseTabGroup
          defaultValue="a"
          options={[
            { value: "a", label: "A course", sublabel: "최단 거리" },
            { value: "b", label: "B course", sublabel: "SNS 핫플" },
            { value: "c", label: "C course", sublabel: "뷰맛집 코스" },
          ]}
        />
      </Row>

      <Row name="badge-number-place-type1">
        <div className="flex items-center gap-2">
          <PlaceNumberBadge value={1} variant="primary" />
          <PlaceNumberBadge value={2} variant="primary" />
          <PlaceNumberBadge value={3} variant="muted" />
          <PlaceNumberBadge value={4} variant="accent" />
          <PlaceNumberBadge value={5} variant="arrive" />
        </div>
      </Row>

      <Row name="badge-number-place-type2/3">
        <TransportStepList />
      </Row>

      <Row name="label-transport-floating">
        <TransportLabel mode="walk" minutes="N" />
        <TransportLabel mode="subway" minutes="N" />
        <TransportLabel mode="bus" minutes="N" />
        <TransportLabel mode="car" minutes="N" />
      </Row>

      <Row name="path-route">
        <div className="flex w-40 flex-col gap-3">
          <PathRoute variant="dotted" color="var(--color-primary)" length={140} />
          <PathRoute variant="solid" color="var(--color-primary)" length={140} />
          <PathRoute variant="dashed" color="var(--color-border-strong)" length={140} />
        </div>
      </Row>

      <Row name="transport-info">
        <div className="flex flex-wrap gap-4">
          <TransportInfo mode="walk" />
          <TransportInfo mode="subway" />
          <TransportInfo mode="bus" />
          <TransportInfo mode="car" />
        </div>
      </Row>

      <Row name="card-place">
        <PlaceCard
          order={1}
          name="장소명"
          category="카테고리"
          region="지역"
          moveInfo={{ mode: "walk", minutes: "N" }}
        />
        <PlaceCard order={1} name="장소명" category="카테고리" region="지역" collapsible />
        <PlaceCard
          order={1}
          name="장소명"
          category="카테고리"
          region="지역"
          defaultOpen
          moveInfo={{ mode: "walk", minutes: "N" }}
        />
      </Row>

      <Row name="btn-course-group">
        <CourseActions />
      </Row>

      <Row name="btn-main-cta">
        <div className="w-[320px]">
          <Button variant="primary" size="lg" fullWidth>
            경로 안내 시작하기
          </Button>
        </div>
      </Row>

      <Row name="info-summary">
        <RouteSummary value="N" />
      </Row>

      <Row name="toast-msg-success">
        <div className="flex items-center gap-4">
          <Toast message="코스가 저장되었습니다." />
          <Button variant="secondary" size="sm" onClick={() => show("코스가 저장되었습니다.")}>
            토스트 띄우기
          </Button>
        </div>
      </Row>

      {visible && toast && (
        <div className="fixed inset-x-0 bottom-8 flex justify-center">
          <Toast message={toast.message} variant={toast.variant} />
        </div>
      )}
    </main>
  );
}
