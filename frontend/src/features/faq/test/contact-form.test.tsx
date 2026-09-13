import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONTACT_BODY_MAX } from "../model/contact-validation";

const useContactFormMock = vi.fn();

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

  it("exposes the body max length as a native textarea constraint", async () => {
    const { ContactForm } = await import("../ui/ContactForm");

    const markup = renderToStaticMarkup(<ContactForm />);

    expect(markup).toContain(`maxLength="${CONTACT_BODY_MAX}"`);
  });

  it("keeps the submit button disabled when the form is invalid", async () => {
    const { ContactForm } = await import("../ui/ContactForm");

    const markup = renderToStaticMarkup(<ContactForm />);

    expect(markup).toContain("문의 남기기");
    expect(markup).toContain("disabled");
  });
});
