import { html } from "html";
import styles from "./video-feed.module.css";
import { IconButton } from "./icon-button.component";
import { UpArrowIcon, DownArrowIcon } from "./icons";

export function VideoFeed({ emit }) {
  return html`
    <div class="${styles.videoFeedContainer}">
      <div id="videoFeed" class="${styles.videoFeed}"></div>
      <div class="${styles.videoFeedControls}">
        <div class="${styles.videoFeedControlsContainer}">
          <div class="${styles.videoFeedControlsButtons}">
            ${IconButton({
    children: UpArrowIcon(),
    onClick: () =>
      emit({ type: "scrollTo", payload: { direction: "up" } }),
  })}
            ${IconButton({
    children: DownArrowIcon(),
    onClick: () =>
      emit({ type: "scrollTo", payload: { direction: "down" } }),
  })}
          </div>
        </div>
      </div>
    </div>
  `;
}
