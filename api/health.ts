/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Serverless health check endpoint
export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  res.end(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'airguard-sg-serverless-api',
      upstream: 'https://api-open.data.gov.sg/v2/real-time/api/psi'
    })
  );
}
