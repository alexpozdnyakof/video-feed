import { html } from "html";
import { videoFeedState } from "./videofeed.state";

/**
 * @param {string} apiUrl
 * @returns
 */

export function videoFeed(apiUrl) {
  const videoCards = /**@type Array<HTMLElement>*/[];
  const videoCardsIdx = /**@type WeakMap<HTMLElement, number>*/ new WeakMap();

  const feed = VideoFeed();
  const { iterator, emit } = asyncEventQueue();

  const videoObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          const activeIdx = videoCardsIdx.get(target);
          emit({ type: "scroll", payload: { activeIdx } });
        }
      }),
    { threshold: 0.9 },
  );

  async function applyEffect(state) {
    console.log({ state });
    switch (state.type) {
      case "init": {
        const { videos } = state.state;
        const fragment = document.createDocumentFragment();
        const cards = videos.map(({ url, thumbnail }, i) => {
          const card = /** @type {HTMLElement} */ (VideoCard());
          if (i < 4) {
            const player = /** @type {HTMLElement} */ (
              VideoPlayer({ url, thumbnail })
            );
            card.querySelector(".video-card_content").appendChild(player);
          }
          return card;
        });

        cards.forEach(
          /** @param {HTMLElement} card */(card) => {
            videoCards.push(card);
            videoCardsIdx.set(card, videoCards.length - 1);
            fragment.appendChild(card);
          },
        );

        feed.appendChild(fragment);
        requestAnimationFrame(() => {
          cards[0].querySelector("video").play();
          cards.forEach(
            /** @param {HTMLDivElement} card */
            (card) => videoObserver.observe(card),
          );
        });

        break;
      }
      case "chunk": {
        const { videos } = state.state;
        const fragment = document.createDocumentFragment();
        const cards = videos.map(() => VideoCard());
        cards.forEach((card) => {
          videoCards.push(card);
          videoCardsIdx.set(card, videoCards.length - 1);

          fragment.appendChild(card);
        });
        feed.appendChild(fragment);

        cards.forEach(
          /** @param {HTMLDivElement} card */
          (card) => videoObserver.observe(card),
        );

        break;
      }
      case "detach": {
        videoCards[state.state.idx].querySelector(
          ".video-card_content",
        ).innerHTML = "";
        break;
      }
      case "attach": {
        const { url, thumbnail } = state.state.video;
        const player = /** @type {HTMLMediaElement} */ (
          VideoPlayer({ url, thumbnail })
        );
        videoCards[state.state.idx]
          .querySelector(".video-card_content")
          .appendChild(player);
        break;
      }
      case "scroll": {
        videoCards[state.state.prev].querySelector("video").pause();
        await videoCards[state.state.next].querySelector("video").play();
        console.log("scroll", state);
      }
      case "scroll_up": {
        console.log("scroll_up");
      }

      default:
        return;
    }
  }

  return {
    async mount(hostElement) {
      hostElement.appendChild(feed);
      (async () => {
        for await (const state of videoFeedState(apiUrl, iterator)) {
          await applyEffect(state);
        }
      })();
    },
  };
}

const VideoCard = () => html`
  <article class="video-card">
    <div class="video-card_content"></div>
  </article>
`;

const VideoPlayer = ({ thumbnail, url }) => {
  const videoElement = /** @type {HTMLVideoElement} */ (
    html`<video
      class="video-card_player"
      playsinline
      muted
      loop
      preload="auto"
      src=${url}
    />`
  );

  videoElement.load();

  const thumbnailElement = /** @type {HTMLElement} */ html`<div
    style="--thumbnail: url(${thumbnail});"
    class="video-player__preload-cover"
  ></div>`;

  videoElement.addEventListener("canplay", () => {
    //@ts-ignore
    thumbnailElement.style.opacity = "0";
  });

  const container = html`<div class="video-card_player-container"></div>`;
  container.appendChild(thumbnailElement);
  container.appendChild(videoElement);
  return container;
};

function VideoFeed() {
  // @ts-ignore
  return /** @type {HTMLElement} */ (html` <div class="video-feed"></div> `);
}

function asyncEventQueue() {
  const queue = [];
  let resolve = null;
  const iterator = {
    [Symbol.asyncIterator]() {
      return this;
    },
    next() {
      return new Promise((r) => {
        if (queue.length) {
          r({ value: queue.shift(), done: false });
        } else {
          resolve = r;
        }
      });
    },
  };
  const emit = (event) => {
    if (resolve) {
      resolve({ value: event, done: false });
      resolve = null;
    } else {
      queue.push(event);
    }
  };
  return { iterator, emit };
}
