import { html } from "html";
import styles from "./side-nav-panel.module.css";

/**
 * @param {{children: Node | Array<Node>}} props
 */
export function SideNavPanel({ children }) {
  return html`
    <aside class="${styles.videoFeedControls}">
      <div class="${styles.videoFeedControlsContainer}">${children}</div>
    </aside>
  `;
}
