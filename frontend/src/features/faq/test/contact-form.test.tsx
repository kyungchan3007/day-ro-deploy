import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONTACT_BODY_MAX } from "../model/contact-validation";
import { ContactForm } from "../ui/ContactForm";

const useContactFormMock = vi.fn();

// vi.mock 은 import 보다 먼저 끌어올려지므로 정적 import 에도 mock 이 적용된다.
// (테스트 안 동적 import 는 병렬 실행 시 변환 시간이 5초 제한에 포함돼 타임아웃이 났다.)
vi.mock("../hooks/useContactForm", () => ({
  useContactForm: () => useContactFormMock(),
}));

describe("ContactForm", () => {
  beforeEach(() => {
    useContactFormMock.mockReturnValue({
      draft: { subject: "", body: "", email: "" },
      bodyAtLimit: false,
      doneOpen: false,
      valid: false,
      setField: vi.fn(),
      submit: vi.fn(),
      closeDone: vi.fn(),
    });
  });

  it("exposes the body max length as a native textarea constraint", () => {
    const markup = renderToStaticMarkup(<ContactForm />);

    expect(markup).toContain(`maxLength="${CONTACT_BODY_MAX}"`);
  });

  it("keeps the submit button disabled when the form is invalid", () => {
    const markup = renderToStaticMarkup(<ContactForm />);

    expect(markup).toContain("문의 남기기");
    expect(markup).toContain("disabled");
  });
});
