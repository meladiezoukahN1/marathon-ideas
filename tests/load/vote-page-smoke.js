import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://marathon-ideas.vercel.app";

export default function () {
  const res = http.get(`${BASE_URL}/vote`, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "not server error": (r) => r.status < 500,
    "response under 1s": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

