/**
 * @param {TemplateStringsArray} strings
 * @param {...(string | number | Node | Array<Node>)} values
 * @returns {HTMLElement}
 */
export function html(strings, ...values) {
  //TODO: add string sanitizing
  const placeholders = new Map();
  const rawTemplate = strings
    .reduce((acc, curr, i) => {
      if (i >= values.length) return acc.concat(curr);

      const value = values[i];

      if (value instanceof Node) {
        const id = `__node_${i}__`;
        placeholders.set(id, value);
        return acc.concat(curr, `<span id="${id}"></span>`);
      }
      return acc.concat(curr, String(value));
    }, "")
    .trim();

  const templateElement = document.createElement("template");
  templateElement.innerHTML = rawTemplate;
  const fragment = templateElement.content;

  placeholders.forEach((node, id) => {
    const el = fragment.querySelector(`#${id}`);
    el?.replaceWith(node);
  });
  return /** @type {HTMLElement} */ (fragment.firstChild);
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
    it("should apply outer passed elements", () => {
      const child = html`<div id="child"></div>`;
      const result = html`<div class="element">${child}</div>`;
      expect(result.querySelector("#child")).toEqual(child);
    });
  });
}
