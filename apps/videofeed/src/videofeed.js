import { html } from "html";
import { videoFeedState } from "./videofeed.state";

/**
 * @param {string} apiUrl
 * @returns
 */

export function videoFeed(apiUrl) {
  const feed = VideoFeed();
  const sentinel = feed.querySelector(".sentinel");
  const { iterator, emit } = asyncEventQueue();

  const loadMoreObserver = new IntersectionObserver(
    ([endOfFeed]) => {
      if (endOfFeed.isIntersecting) emit({ type: "fetch" });
    },
    { root: feed, rootMargin: "200px" },
  );

  loadMoreObserver.observe(sentinel);

  function applyEffect(state) {
    switch (state.type) {
      case "init": {
        const { videos } = state.state;
        const fragment = document.createDocumentFragment();
        const cards = videos.map(({ url }) =>
          VideoCard({ url: apiUrl.concat(url) }),
        );
        cards.forEach((card) => fragment.appendChild(card));
        feed.insertBefore(fragment, sentinel);
        break;
      }
      case "chunk": {
        const { videos } = state.state;
        const fragment = document.createDocumentFragment();
        const cards = videos.map(({ url }) =>
          VideoCard({ url: apiUrl.concat(url) }),
        );
        cards.forEach((card) => fragment.appendChild(card));
        feed.insertBefore(fragment, sentinel);
        requestAnimationFrame(() => {
          // cards.forEach(
          /** @param {HTMLDivElement} card */
          //(card) =>
          //activeObserver.observe(card),
          //);
        });

        break;
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
          applyEffect(state);
        }
      })();
    },
  };
}

const VideoCard = ({ url }) => html`
  <article class="video-card">
    <div class="video-card_content">
      <div class="video-card_player-container">
        <video
          class="video-card_player"
          playsinline
          preload="auto"
          src="${url}"
        ></video>
      </div>
    </div>
  </article>
`;

function VideoFeed() {
  // @ts-ignore
  return /** @type {HTMLElement} */ (
    html`
      <div class="video-feed"><div class="sentinel" id="sentinel"></div></div>
    `
  );
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
