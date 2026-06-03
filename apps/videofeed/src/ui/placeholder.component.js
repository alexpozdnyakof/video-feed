import { html } from "html";
import styles from "./placeholder.module.css";

export const Placeholder = () => html`
  <article
    class="${styles.placeholder}"
    data-role="placeholder"
    data-testid="video-placeholder"
  ></article>
`;
