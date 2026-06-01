/** @import  {Effect, Message, UnionConstructor} from "../types" */
import { videoFeedState } from "./videofeed.state";
import { VideoFeed, VideoPlaceholder } from "./videofeed.ui";
import { VideoPlayer } from "./ui";
/**
 * @param {string} apiUrl
 * @returns void
 */
export function videoFeed(apiUrl) {
  const videoCards = /**@type Array<HTMLElement>*/[];
  const videoCardsIdx = /**@type WeakMap<HTMLElement, number>*/ new WeakMap();

  const { iterator, emit } = asyncEventQueue();
  const feed = VideoFeed({ emit });
  const videosSlot = feed.querySelector(".video-feed_cards");

  const videoObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          const nextIdx = videoCardsIdx.get(target);
          if (nextIdx !== undefined) {
            emit({ type: "scroll", payload: { nextIdx } });
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
        const cards = new Array(count)
          .fill(0)
          .map(() => /** @type {HTMLElement} */(VideoPlaceholder()));

        cards.forEach((card) => {
          videoCards.push(card);
          videoCardsIdx.set(card, videoCards.length - 1);
          fragment.appendChild(card);
        });

        videosSlot.appendChild(fragment);

        requestAnimationFrame(() => {
          cards.forEach((card) => videoObserver.observe(card));
        });
        break;
      }
      case "attachVideo": {
        for (const [idx, video] of Object.entries(effect.payload.videos)) {
          const { url, thumbnail } = video;

          const videoCard = /** @type {HTMLMediaElement} */ (
            VideoPlayer({ url, thumbnail })
          );
          videoCards[idx].append(videoCard);
        }
        break;
      }
      case "detachVideo": {
        effect.payload.idxsToDetach.forEach((idx) => {
          const video = videoCards[idx].querySelector("video");
          if (video) {
            video.pause();
            video.src = "";
            video.load();

            videoCards[idx].innerHTML = "";
          }
        });
        break;
      }
      case "play": {
        videoCards[effect.payload.idx]
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
        videoCards[effect.payload.idx].querySelector("video")?.pause();
        break;
      }
      case "scrollTo": {
        videoCards[effect.payload.idx].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        break;
      }
      case "setAutoPlay": {
        const video = videoCards[effect.payload.idx].querySelector("video");
        video.setAttribute("autoplay", "");
        break;
      }
      case "removeAutoPlay": {
        const video = videoCards[effect.payload.idx].querySelector("video");
        video.removeAttribute("autoplay");
        break;
      }

      default:
        return;
    }
  }

  return {
    /**
     * @param {Element} hostElement
     */
    async mount(hostElement) {
      hostElement.appendChild(feed);
      (async () => {
        for await (const state of videoFeedState(apiUrl, iterator)) {
          await apply(state);
        }
      })();
    },
  };
}
/**
 * @returns {{iterator: AsyncIterable<Message>, emit: (event: Message) => void}}
 */
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

  /** @param {Message} event */
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

/** @type {UnionConstructor<Message>} */
function message(type, payload) {
  return /** @type {any} */ ({ type, payload });
}
