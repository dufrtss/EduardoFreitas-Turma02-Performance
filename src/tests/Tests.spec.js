import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getArmiesDuration = new Trend('get_armies', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.12'],
    get_armies: ['p(95)<5700'],
    content_OK: ['rate>0.95']
  },
  stages: [
    { duration: '10s', target: 10 },
    { duration: '30s', target: 10 },
    { duration: '10s', target: 10 },
    { duration: '30s', target: 10 },
    { duration: '10s', target: 10 },
    { duration: '30s', target: 10 },
    { duration: '10s', target: 10 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://aos-api.com/docs#tag/armies';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${baseUrl}`, params);

  getArmiesDuration.add(res.timings.duration);

  RateContentOK.add(res.status === OK);

  check(res, {
    'GET Armies - Status 200': () => res.status === OK,
    'GET Armies - Request duration': () => getArmiesDuration,
    'GET Armies - Rate content OK': () => RateContentOK
  });
}
