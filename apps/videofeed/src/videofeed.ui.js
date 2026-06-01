import { html } from "html";

export const VideoCard = ({ thumbnail, url }) => html`
  <article class="video-card">
    <div class="video-card_content">${VideoPlayer({ thumbnail, url })}</div>
  </article>
`;

export const VideoPlaceholder = () => html`
  <article class="video-placeholder"></article>
`;

/**
 *  @param {{thumbnail: string; url: string}} props
 *  @returns {HTMLElement}
 */
export const VideoPlayer = ({ thumbnail, url }) => {
  const videoEl = /** @type {HTMLVideoElement} */ (
    html`<video
      class="video-card_player"
      playsinline
      muted
      loop
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
          ${Button({
    children: UpArrowIcon(),
    className: "up",
    onClick: () => emit({ type: "scrollUp" }),
  })}
          ${Button({
    children: DownArrowIcon(),
    className: "down",
    onClick: () => emit({ type: "scrollDown" }),
  })}
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

export function Button({ className, onClick, children }) {
  const element = html`<button class="${className}">${children}</button>`;
  if (onClick) {
    element.addEventListener("click", onClick);
  }
  return element;
}
