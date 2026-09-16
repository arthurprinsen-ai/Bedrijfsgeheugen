import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: Number(__ENV.QUALITY_K6_VUS || 3),
  duration: __ENV.QUALITY_K6_DURATION || '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    checks: ['rate>0.99'],
  },
};

const base = (__ENV.QUALITY_BASE_URL || 'https://www.bedrijfsgeheugen.nl').replace(/\/$/, '');
const routes = (__ENV.QUALITY_K6_ROUTES || '/,/prijzen,/due-diligence').split(',').map(x => x.trim()).filter(Boolean);

export default function () {
  const route = routes[__ITER % routes.length];
  const response = http.get(`${base}${route}`, { tags: { quality_route: route } });
  check(response, {
    'status is below 400': r => r.status < 400,
    'body exists': r => Boolean(r.body && r.body.length),
  });
}
