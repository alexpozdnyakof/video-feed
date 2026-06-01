import { html } from "html";
import { IconButton } from "./ui";

export const VideoPlaceholder = () => html`
  <article class="video-placeholder"></article>
`;

/**
 *  @param {{thumbnail: string; url: string; autoplay?: boolean}} props
 *  @returns {HTMLElement}
 */
export const VideoPlayer = ({ thumbnail, url, autoplay = false }) => {
  const videoEl = /** @type {HTMLVideoElement} */ (
    html`<video
      class="video-card_player"
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
    class="video-player__preload-cover"
  ></div>`;

  videoEl.load();

  videoEl.addEventListener(
    "canplay",
    () => {
      thumbnailEl.style.opacity = "0";
    },
    { once: true },
  );

  return html`<div class="video-card_player-container">
    ${thumbnailEl} ${videoEl}
  </div>`;
};

export function VideoFeed({ emit }) {
  return html`
    <div class="video-feed">
      <div class="video-feed_cards"></div>
      <div class="video-feed_controls">
        <div class="video-feed_controls-container">
          <div class="video-feed_controls_buttons">
            ${Button({
    children: UpArrowIcon(),
    onClick: () =>
      emit({ type: "scrollTo", payload: { direction: "up" } }),
  })}
            ${Button({
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

const UpArrowIcon = () =>
  html`<svg
    aria-label=""
    class="x1lliihq x1n2onr6 x5n08af"
    fill="currentColor"
    height="24"
    role="img"
    viewBox="0 0 24 24"
    width="24"
  >
    <title></title>
    <path
      d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z"
    ></path>
  </svg>`;
const DownArrowIcon = () =>
  html`<svg
    aria-label=""
    class="x1lliihq x1n2onr6 x5n08af"
    fill="currentColor"
    height="24"
    role="img"
    viewBox="0 0 24 24"
    width="24"
  >
    <title></title>
    <path
      d="M12 17.502a1 1 0 0 1-.707-.293l-9-9.004a1 1 0 0 1 1.414-1.414L12 15.087l8.293-8.296a1 1 0 0 1 1.414 1.414l-9 9.004a1 1 0 0 1-.707.293Z"
    ></path>
  </svg>`;
