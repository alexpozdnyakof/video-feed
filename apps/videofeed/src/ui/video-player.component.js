import { html } from "html";
import styles from "./video-player.module.css";
import { IconButton } from "./icon-button.component";
import { MuteIcon, UnmuteIcon } from "./icons";
/**
 *  @param {{thumbnail: string; url: string; autoplay?: boolean; muted?: boolean }} props
 *  @returns {HTMLElement}
 */
export const VideoPlayer = ({
  thumbnail,
  url,
  autoplay = false,
  muted = true,
}) => {
  const videoEl = /** @type {HTMLVideoElement} */ (
    html`<video
      class="${styles.videoPlayer}"
      playsinline
      loop
      ${muted ? "muted" : ""}
      ${autoplay ? "autoplay" : ""}
      preload="auto"
      src=${url}
    />`
  );

  const thumbnailEl = html`<div
    style="--thumbnail: url(${thumbnail});"
    class="${styles.videoCover}"
    data-testid="video-cover"
  ></div>`;

  const videoControls = html`<div class="${styles.videoControls}">
    ${IconButton({
    children: UnmuteIcon(),
    size: "sm",
    dataAction: "mute",
  })}
  </div>`;

  videoEl.load();
  videoEl.addEventListener(
    "canplay",
    () => {
      thumbnailEl.style.opacity = "0";
    },
    { once: true },
  );

  return html`<div class="${styles.videoCard}">
    ${videoControls} ${thumbnailEl}
    <div class="${styles.videoPlayer}">${videoEl}</div>
  </div>`;
};
