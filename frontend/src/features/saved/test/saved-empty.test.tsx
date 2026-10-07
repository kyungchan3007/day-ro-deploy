import {
  Children,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { savedStatic } from "@/shared/static/saved";

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/shared/ui", () => ({
  Button: ({
    children,
    onClick,
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
    fullWidth?: boolean;
  }) => <button onClick={onClick}>{children}</button>,
  Illustration: () => <div aria-hidden="true" />,
}));

function findCta(
  element: ReactElement,
): ReactElement<{ children: ReactNode; onClick: () => void }> {
  const children = Children.toArray(
    (element.props as { children?: ReactNode }).children,
  );
  const cta = children.find(
    (child) =>
      isValidElement<{ children?: ReactNode }>(child) &&
      child.props.children === savedStatic.empty.ctaLabel,
  );

  expect(cta).toBeDefined();
  return cta as ReactElement<{ children: ReactNode; onClick: () => void }>;
}

describe("SavedEmpty", () => {
  it("renders the empty-state copy and course creation CTA", async () => {
    const { SavedEmpty } = await import("../ui/SavedEmpty");

    const markup = renderToStaticMarkup(<SavedEmpty />);

    expect(markup).toContain(savedStatic.empty.title);
    expect(markup).toContain(savedStatic.empty.desc);
    expect(markup).toContain("코스 만들러 가기");
  });

  it("navigates to course creation when the CTA is clicked", async () => {
    const { SavedEmpty } = await import("../ui/SavedEmpty");
    const cta = findCta(SavedEmpty());

    cta.props.onClick();

    expect(pushMock).toHaveBeenCalledOnce();
    expect(pushMock).toHaveBeenCalledWith("/course/new");
  });
});
