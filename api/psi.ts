/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DATA_GOV_SG_PSI_URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

// Serverless handler for live Singapore PSI data
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Ensure GET method
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use GET.' }));
    return;
  }

  try {
    // Construct upstream URL with optional date/date_time query pass-through
    const upstreamUrl = new URL(DATA_GOV_SG_PSI_URL);

    // If query string is present in request (e.g. from Express or Vercel req.url / req.query)
    if (req.query) {
      if (req.query.date) upstreamUrl.searchParams.set('date', String(req.query.date));
      if (req.query.date_time) upstreamUrl.searchParams.set('date_time', String(req.query.date_time));
    } else if (req.url && req.url.includes('?')) {
      const parsedUrl = new URL(req.url, 'http://localhost');
      for (const [key, value] of parsedUrl.searchParams.entries()) {
        upstreamUrl.searchParams.set(key, value);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AirGuardSG-Serverless/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!upstreamResponse.ok) {
      res.statusCode = upstreamResponse.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Upstream data.gov.sg error',
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText
        })
      );
      return;
    }

    const jsonPayload = await upstreamResponse.json();

    // Cache-Control: Cache for 60 seconds at edge, allow stale-while-revalidate for 120s
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    res.end(JSON.stringify(jsonPayload));
  } catch (error: any) {
    console.error('Error fetching live PSI from data.gov.sg:', error);

    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Bad Gateway - Failed to fetch live PSI telemetry from data.gov.sg',
        message: error?.message || 'Upstream request timeout or network failure',
        timestamp: new Date().toISOString()
      })
    );
  }
}
