/** @import  {VideoFile} from "../types" */

/**
 * @param {string} apiUrl
 * @returns {AsyncGenerator<VideoFile>}
 */

export async function* videoFeedApi(apiUrl) {
  let nextPageToken = null;
  const url = new URL(apiUrl.concat("/feed"));

  while (true) {
    if (nextPageToken) {
      url.searchParams.set("pageToken", nextPageToken);
    } else {
      url.searchParams.delete("pageToken");
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(response.status.toString());
    const data = await response.json();
    nextPageToken = data.nextPageToken;
    yield data.videos.map(
      /** @param {VideoFile} video */(video) => ({
        ...video,
        url: apiUrl.concat(video.url),
        thumbnail: apiUrl.concat(video.thumbnail),
      }),
    );
  }
}
