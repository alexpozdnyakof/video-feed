import "./style.css";
import { html } from "html";
import { videoFeedState } from "./videofeed.state.js";
import { videoFeed as videoFeedNG } from "./videofeed.js";

const workerURL = import.meta.env.VITE_WORKER_URL;

if (!workerURL) {
  throw new Error("Worker URL not defined");
}

const Sentinel = html` <div id="sentinel" class="sentinel"></div> `;

const activeObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach(({ target, isIntersecting }) => {
      const video = target.querySelector("video");
      if (isIntersecting) {
        console.log({ video, play: true });
        target.querySelector("video").play();
      } else {
        console.log({ video, play: false });
        target.querySelector("video").pause();
      }
    }),
  { threshold: 0.9 },
);

function main() {
  const app = document.querySelector("#app");
  videoFeedNG(workerURL).mount(app);
}

main();
