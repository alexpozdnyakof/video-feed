import { html } from "html";
import styles from "./icon-button.module.css";

/**
 * @param {{onClick?: () => void; children?: Node | Array<Node> | string; className?: string; size?: "sm"; dataAction?: string; }} props
 */
export function IconButton({ onClick, children, className, size, dataAction }) {
  const element = html`<button
    class="${[
      styles.button,
      className ? className : "",
      size === "sm" ? styles.buttonSizeSm : "",
    ].join(" ")}"
    data-action="${dataAction}"
  >
    ${children}
  </button>`;
  if (onClick) {
    element.addEventListener("click", onClick);
  }
  return element;
}
