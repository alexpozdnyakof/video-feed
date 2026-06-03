/** @import  {Effect, Message, VideoFile} from "../types" */
import { videoFeedApi } from "./videofeed.api";
import { effect, clamp, assertNever } from "./utils";
import { CHUNK_SIZE, VIDEO_PLAYERS_TO_SHOW } from "./videofeed.constraints";

/**
 * @typedef {Object} State
 * @property {number} active
 * @property {Array<VideoFile>} videos
 * @property {boolean} autoPlayEnabled
 * @property {number | null} played
 * @property {boolean} muted
 */

/**
 * @param {string} apiUrl
 * @param {AsyncIterable<Message>} messages
 * @returns {AsyncGenerator<Effect>}
 */
export async function* videoFeedState(apiUrl, messages) {
  const videoChunk = videoFeedApi(apiUrl);

  const { value: chunk, done } = await videoChunk.next();

  if (done) return;
  /** @type {State} */
  let state = {
    active: 0,
    videos: [...chunk],
    autoPlayEnabled: true,
    played: 0,
    muted: true,
  };

  const toAttach = /** @type {Array<number>}*/ ([
    ...activePlayers(state.active, state.videos.length),
  ]);

  yield effect("mount", { count: CHUNK_SIZE });

  yield effect("attachVideo", {
    muted: state.muted,
    videos: Object.fromEntries(toAttach.map((idx) => [idx, state.videos[idx]])),
  });

  yield effect("setAutoPlay", { idx: state.active });

  for await (const message of messages) {
    console.log({ event: message });
    switch (message.type) {
      case "scroll": {
        const nextIdx = message.payload.nextIdx;
        if (nextIdx !== state.active) {
          if (state.autoPlayEnabled) {
            yield effect("removeAutoPlay", { idx: state.active });
          }
          if (state.played === null) {
            yield effect("removePaused", { idx: state.active });
          }
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
          if (attach.length > 0) {
            yield effect("attachVideo", {
              muted: state.muted,
              videos: Object.fromEntries(
                attach.map((idx) => [idx, state.videos[idx]]),
              ),
            });
          }

          const remain = state.videos.length - 1 - nextIdx;

          if (remain <= CHUNK_SIZE / 2) {
            const { value: chunk, done } = await videoChunk.next();
            state = { ...state, videos: [...state.videos, ...chunk] };
            yield effect("mount", { count: CHUNK_SIZE });
          }

          state = {
            ...state,
            active: nextIdx,
            autoPlayEnabled: false,
            played: nextIdx,
          };
        }
        break;
      }
      case "scrollTo": {
        let nextIdx =
          message.payload.direction === "up"
            ? state.active - 1
            : state.active + 1;
        nextIdx = clamp(nextIdx, 0, state.videos.length);
        if (nextIdx !== state.active) {
          yield effect("scrollTo", { idx: nextIdx });
        }
        break;
      }
      case "togglePlay": {
        const { idx } = message.payload;
        let played = state.played;
        if (idx === played) {
          yield effect("pause", { idx: played });
          yield effect("userPaused", { idx: played });
          played = null;
        } else {
          yield effect("play", { idx });
          played = idx;
        }

        state = {
          ...state,
          played,
        };

        break;
      }
      case "toggleMute": {
        state = { ...state, muted: !state.muted };
        yield effect("setMuted", { muted: state.muted });
        break;
      }
      default:
        assertNever(message);
    }
  }
}

const { ABOVE, TOTAL } = VIDEO_PLAYERS_TO_SHOW;

/**
 * @param {number} activeIdx
 * @param {number} length
 * @returns {Set<number>}
 */
const activePlayers = (activeIdx, length) => {
  const start = clamp(activeIdx - ABOVE, 0, length - TOTAL);
  const s = new Set();
  for (let i = start; i < start + TOTAL && i < length; i++) s.add(i);
  return s;
};
