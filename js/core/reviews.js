import { loadJson, saveJson } from "./storage.js";

const RATINGS_KEY = "ta_gameRatings";
const REVIEWS_KEY = "ta_reviews";
const QUEUE_KEY = "ta_reviewQueue";

export function saveProjectReview({ stars, text }) {
  const reviews = loadJson(REVIEWS_KEY, []);
  reviews.push({
    stars,
    text,
    createdAt: Date.now()
  });
  saveJson(REVIEWS_KEY, reviews);

  const queue = loadJson(QUEUE_KEY, []);
  queue.push(reviews[reviews.length - 1]);
  saveJson(QUEUE_KEY, queue);
}

export function rateGame(gameName, stars) {
  const ratings = loadJson(RATINGS_KEY, {});
  if (!ratings[gameName]) {
    ratings[gameName] = [];
  }
  ratings[gameName].push(stars);
  saveJson(RATINGS_KEY, ratings);
}

/** True if the hub quick-like control has been used at least once for this game. */
export function gameHasHubLike(gameName) {
  const ratings = loadJson(RATINGS_KEY, {});
  const arr = ratings[gameName];
  return Array.isArray(arr) && arr.length > 0;
}

export function getMostLikedGame() {
  const ratings = loadJson(RATINGS_KEY, {});
  let bestGame = "";
  let bestAvg = 0;
  Object.entries(ratings).forEach(([gameName, votes]) => {
    const avg = votes.reduce((sum, n) => sum + n, 0) / votes.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestGame = gameName;
    }
  });
  return bestGame ? `${bestGame} (${bestAvg.toFixed(1)}★)` : "";
}

export function getReviewCount() {
  return loadJson(REVIEWS_KEY, []).length;
}
