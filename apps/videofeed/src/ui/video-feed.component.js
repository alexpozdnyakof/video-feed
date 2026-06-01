import { html } from "html";
import styles from "./video-feed.module.css";
import { IconButton } from "./icon-button.component";
import { SideNavPanel } from "./side-nav-panel.component";
import { UpArrowIcon, DownArrowIcon } from "./icons";

/** @param {{onScrollUp: () => void; onScrollDown: () => void}} props */
export function VideoFeed({ onScrollUp, onScrollDown }) {
  return html`
    <div class="${styles.videoFeedContainer}">
      <div id="videoFeed" class="${styles.videoFeed}"></div>
      ${SideNavPanel({
    children: [
      IconButton({
        children: UpArrowIcon(),
        onClick: onScrollUp,
      }),
      IconButton({
        children: DownArrowIcon(),
        onClick: onScrollDown,
      }),
    ],
  })}
    </div>
  `;
}
