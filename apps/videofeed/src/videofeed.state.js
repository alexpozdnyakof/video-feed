/** @import  {Effect, Message, UnionConstructor} from "../types" */
import { videoFeedApi } from "./videofeed.api";
const CHUNK_SIZE = 6;

/**
 * @param {string} apiUrl
 * @param {AsyncIterable<Message>} messages
 * @returns {AsyncGenerator<Effect>}
 */
export async function* videoFeedState(apiUrl, messages) {
  const videoChunk = videoFeedApi(apiUrl);

  const { value: chunk, done } = await videoChunk.next();

  if (done) return;

  let state = {
    active: 0,
    videos: [...chunk],
  };

  const toAttach = [...activePlayers(state.active, state.videos.length)];

  yield effect("mount", { count: CHUNK_SIZE });

  yield effect("attachVideo", {
    videos: Object.fromEntries(toAttach.map((idx) => [idx, state.videos[idx]])),
  });

  yield effect("play", { idx: state.active });

  for await (const message of messages) {
    console.log({ event: message });
    switch (message.type) {
      case "scroll": {
        const nextIdx = message.payload.nextIdx;
        if (nextIdx !== state.active) {
          yield effect("play", { idx: nextIdx });
          yield effect("pause", { idx: state.active });

          const currentPlayers = activePlayers(
            state.active,
            state.videos.length,
          );
          const nextPlayers = activePlayers(nextIdx, state.videos.length);
          const detach = [...currentPlayers.difference(nextPlayers)];
          const attach = [...nextPlayers.difference(currentPlayers)];
          yield effect("detachVideo", { idxsToDetach: detach });
          yield effect("attachVideo", {
            videos: Object.fromEntries(
              attach.map((idx) => [idx, state.videos[idx]]),
            ),
          });

          const remain = state.videos.length - 1 - nextIdx;

          if (remain <= CHUNK_SIZE / 2) {
            const { value: chunk, done } = await videoChunk.next();
            state = { ...state, videos: [...state.videos, ...chunk] };
            yield effect("mount", { count: CHUNK_SIZE });
          }

          state = {
            ...state,
            active: nextIdx,
          };
          //TODO: ползунок
        }
        break;
      }
      case "scrollTo": {
        const nextIdx =
          message.payload.direction === "up"
            ? state.active - 1
            : state.active + 1;

        yield effect("scrollTo", { idx: nextIdx });
        break;
      }
    }
  }
}

const ABOVE = 1;
const ACTIVE = 1;
const BELOW = 2;
const SIZE = ABOVE + ACTIVE + BELOW;

/**
 * @param {number} activeIdx
 * @param {number} length
 */
const activePlayers = (activeIdx, length) => {
  const start = Math.max(0, Math.min(activeIdx - ABOVE, length - SIZE));
  const s = new Set();
  for (let i = start; i < start + SIZE && i < length; i++) s.add(i);
  return s;
};
/** @type {UnionConstructor<Effect>} */
function effect(type, payload) {
  return /** @type {any} */ ({ type, payload });
}
