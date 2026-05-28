import { videoFeedApi } from "./videofeed.api";
const CHUNK_SIZE = 6;

/**
 * @param {string} apiUrl
 * @returns {AsyncGenerator<{type: string; state: any}>}
 */
export async function* videoFeedState(apiUrl, events) {
  const videoChunk = videoFeedApi(apiUrl);

  const { value: chunk, done } = await videoChunk.next();

  if (done) return;

  let state = {
    active: 0,
    videos: [...chunk],
  };

  yield { type: "init", state };

  for await (const event of events) {
    console.log({ event });
    switch (event.type) {
      case "fetch": {
        console.log("fetch");
        const { value: chunk, done } = await videoChunk.next();
        state = {
          ...state,
          active: state.active,
          videos: [...state.videos, ...chunk],
        };
        console.log(state, "fetch update");
        yield {
          type: "chunk",
          state,
        };
        break;
      }
      case "scroll": {
        const nextIdx = event.payload.activeIdx;
        if (nextIdx !== state.active) {
          const type = nextIdx > state.active ? "scroll_down" : "scroll_up";
          if (type === "scroll_down" && nextIdx < state.videos.length - 1) {
            if (state.active > 0) {
              const detachIdx = state.active - 1;
              const attachIdx = detachIdx + 4;
              yield {
                type: "attach",
                state: { idx: attachIdx, video: state.videos[attachIdx] },
              };
              yield { type: "detach", state: { idx: detachIdx } };
            }

            if (state.videos.length - nextIdx - 1 === CHUNK_SIZE / 2) {
              const { value: chunk, done } = await videoChunk.next();
              if (!done) {
                state = {
                  ...state,
                  active: state.active,
                  videos: [...state.videos, ...chunk],
                };

                yield {
                  type: "chunk",
                  state: { active: state.active, videos: chunk },
                };
              }
            }
          }

          if (
            (type === "scroll_down" && nextIdx < state.videos.length) ||
            (type === "scroll_up" && state.active !== 0)
          ) {
            yield {
              type: "scroll",
              state: { prev: state.active, next: nextIdx },
            };
            state = { ...state, active: nextIdx };
          }
        }
        break;
      }
    }
  }
}
