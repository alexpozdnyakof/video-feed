import { html } from "html";
import styles from "./icon-button.module.css";

/**
 * @param {{onClick: () => void; children: Node; className?: string}} props
 */
export function IconButton({ onClick, children, className }) {
  const element = html`<button
    class="${[styles.button, className ? className : ""].join(" ")}"
  >
    ${children}
  </button>`;
  if (onClick) {
    element.addEventListener("click", onClick);
  }
  return element;
}
