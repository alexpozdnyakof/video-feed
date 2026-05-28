import "./style.css";
import { videoFeed } from "./videofeed.js";

const workerURL = import.meta.env.VITE_WORKER_URL;

if (!workerURL) {
  throw new Error("Worker URL not defined");
}

function main() {
  const app = document.querySelector("#app");
  videoFeed(workerURL).mount(app);
}

main();
