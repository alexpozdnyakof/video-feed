export function html(strings, ...values) {
  //TODO: add string sanitizing
  const rawTemplate = strings
    .reduce(
      (acc, curr, i) => acc.concat(curr, i < values.length ? values[i] : ""),
      "",
    )
    .trim();

  const templateElement = document.createElement("template");
  templateElement.innerHTML = rawTemplate;
  return templateElement.content.firstChild;
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("html", () => {
    it("should return element", () => {
      const result = html`<div></div>`;
      expect(result).toBeInstanceOf(HTMLElement);
    });

    it("should set the classname to the element", () => {
      const result = html`<div class="element"></div>`;
      expect(result.className).toBe("element");
    });

    it("should set the attributes to the element", () => {
      const result = html`<div id="element" data-value="value"></div>`;
      expect(result.id).toBe("element");
      expect(result.getAttribute("data-value")).toBe("value");
    });

    it("should interpolate inner text content", () => {
      const textContent = "yo bro";
      const result = html`<div class="element">${textContent}</div>`;
      expect(result.textContent).toBe("yo bro");
    });

    it("should create inner element", () => {
      const result = html`<div class="element">
        <input class="field" />div>
      </div>`;
      expect(result.querySelector("input")).toBeInstanceOf(HTMLInputElement);
    });
  });
}
