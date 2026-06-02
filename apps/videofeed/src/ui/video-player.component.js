import { html } from "html";
import styles from "./video-player.module.css";

/**
 *  @param {{thumbnail: string; url: string; autoplay?: boolean}} props
 *  @returns {HTMLElement}
 */
export const VideoPlayer = ({ thumbnail, url, autoplay = false }) => {
  const videoEl = /** @type {HTMLVideoElement} */ (
    html`<video
      class="${styles.videoPlayer}"
      playsinline
      muted
      loop
      ${autoplay ? "autoplay" : ""}
      preload="auto"
      src=${url}
    />`
  );

  const thumbnailEl = html`<div
    style="--thumbnail: url(${thumbnail});"
    class="${styles.videoCover}"
  ></div>`;

  videoEl.load();
  videoEl.addEventListener(
    "canplay",
    () => {
      thumbnailEl.style.opacity = "0";
    },
    { once: true },
  );

  return html`<div class="${styles.videoCard}">
    ${thumbnailEl}
    <div class="${styles.videoPlayer}">${videoEl}</div>
  </div>`;
};
