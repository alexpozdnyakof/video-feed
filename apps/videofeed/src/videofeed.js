/** @import  {Effect, Message } from "../types" */
import { videoFeedState } from "./videofeed.state";
import { VideoFeed, VideoPlayer, Placeholder } from "./ui";
import { message, assertNever } from "./utils";

/**
 * @param {string} apiUrl
 * @returns void
 */
export function videoFeed(apiUrl) {
  const placeholders = /**@type Array<HTMLElement>*/[];
  const placeholdersIdx = /**@type WeakMap<HTMLElement, number>*/ new WeakMap();
  const onScrollUp = () => emit(message("scrollTo", { direction: "up" }));
  const onScrollDown = () => emit(message("scrollTo", { direction: "down" }));
  const onVideoClick = (/** @type {MouseEvent} e */ e) => {
    if (!(e.target instanceof HTMLElement)) return;

    const placeholder = e.target.closest("[data-role='placeholder']");
    if (!placeholder) return;

    const idx = placeholdersIdx.get(placeholder);

    const nearButton = /** @type {HTMLElement | null} */ (
      e.target.closest("[data-action]")
    );
    const action = nearButton?.dataset.action;

    switch (action) {
      case "mute": {
        emit(message("toggleMute"));
        break;
      }
      default:
        emit(message("togglePlay", { idx }));
    }
  };

  const { messages, emit } = messageQueue();

  const feed = VideoFeed({ onScrollUp, onScrollDown, onVideoClick });
  const videosSlot = feed.querySelector("#videoFeed");

  const videoObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          const nextIdx = placeholdersIdx.get(target);
          if (nextIdx !== undefined) {
            emit(message("scroll", { nextIdx }));
          }
        }
      }),
    { threshold: 0.9 },
  );

  /** @param {Effect} effect */
  async function apply(effect) {
    console.log({ state: effect });
    switch (effect.type) {
      case "mount": {
        const { count } = effect.payload;

        const fragment = document.createDocumentFragment();
        const newPlaceholders = new Array(count)
          .fill(0)
          .map(() => /** @type {HTMLElement} */(Placeholder()));

        newPlaceholders.forEach((card) => {
          placeholders.push(card);
          placeholdersIdx.set(card, placeholders.length - 1);
          fragment.appendChild(card);
        });

        videosSlot.appendChild(fragment);

        requestAnimationFrame(() => {
          newPlaceholders.forEach((card) => videoObserver.observe(card));
        });
        break;
      }
      case "attachVideo": {
        const { videos, muted } = effect.payload;
        for (const [idx, video] of Object.entries(videos)) {
          const { url, thumbnail } = video;

          const videoCard = /** @type {HTMLMediaElement} */ (
            VideoPlayer({ url, thumbnail, muted })
          );
          placeholders[idx].append(videoCard);
        }
        break;
      }
      case "detachVideo": {
        effect.payload.idxsToDetach.forEach((idx) => {
          const video = placeholders[idx].querySelector("video");
          if (video) {
            video.pause();
            video.src = "";
            video.load();

            placeholders[idx].replaceChildren();
          }
        });
        break;
      }
      case "play": {
        delete placeholders[effect.payload.idx].dataset.paused;
        placeholders[effect.payload.idx]
          .querySelector("video")
          ?.play()
          .catch((/**@type {Error}*/ e) => {
            if (!(e instanceof DOMException)) throw e;
            if (e.name === "AbortError") return;
            if (e.name === "NotAllowedError") return;
            throw e;
          });
        break;
      }
      case "pause": {
        placeholders[effect.payload.idx].querySelector("video")?.pause();
        break;
      }
      case "scrollTo": {
        placeholders[effect.payload.idx].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        break;
      }
      case "setPaused": {
        placeholders[effect.payload.idx].dataset.paused = "";
        break;
      }
      case "removePaused": {
        placeholders[effect.payload.idx].removeAttribute("data-paused");
        break;
      }
      case "setMuted": {
        const { muted } = effect.payload;
        videosSlot
          .querySelectorAll("video")
          .forEach((/** @type {HTMLVideoElement}*/ video) => {
            video.muted = muted;
          });
        break;
      }
      default:
        assertNever(effect);
    }
  }

  return {
    /**
     * @param {Element} hostElement
     */
    async mount(hostElement) {
      hostElement.appendChild(feed);
      (async () => {
        for await (const state of videoFeedState(apiUrl, messages)) {
          await apply(state);
        }
      })();
    },
  };
}
/**
 * @returns {{messages: AsyncIterable<Message>, emit: (event: Message) => void}}
 */
function messageQueue() {
  const queue = [];
  let resolve = null;
  const messages = {
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

  /** @param {Message} event */
  const emit = (event) => {
    if (resolve) {
      resolve({ value: event, done: false });
      resolve = null;
    } else {
      queue.push(event);
    }
  };
  return { messages, emit };
}
