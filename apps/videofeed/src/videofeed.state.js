import { videoFeedApi } from "./videofeed.api";

/**
 * @param {string} apiUrl
 * @returns {AsyncGenerator<{type: string; state: {active: number; videos: any[]}}>}
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
    switch (event.type) {
      case "fetch": {
        const { value: chunk, done } = await videoChunk.next();
        yield { type: "chunk", state: { active: state.active, videos: chunk } };
      }
    }
  }
}
