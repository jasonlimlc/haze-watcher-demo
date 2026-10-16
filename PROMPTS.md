# Conversation History: AirGuard SG Project (PROMPTS.md)

## Turn 1: Initial Application Build Request

### User Prompt
> build a Singapore based application that tracks live PSI levels and alerts users when air quality drops to unhealthy thresholds. It should include an interactive map and push notifications.
>
> build just the front end for now, I will add the serverless backend connection later.

### Assistant Response Summary
- Built **AirGuard SG**, a real-time Singapore PSI air quality monitoring web application.
- Integrated official live Singapore Government open data feeds (`api.data.gov.sg/v1/environment/psi` and `pm25`).
- Created an interactive vector SVG map of Singapore featuring all 5 official NEA zones (North, South, East, West, Central) with dynamic color shading according to official PSI bands (Good, Moderate, Unhealthy, Very Unhealthy, Hazardous), station marker pulses, wind vectors, and GPS geolocation to match the user's nearest Singapore region.
- Built a multi-channel alert engine:
  - Native browser Push Notifications via `Notification.requestPermission()`.
  - Configurable PSI threshold slider (default: 100 / Unhealthy) and 1-hr PM2.5 slider (default: 55 µg/m³).
  - Synthesized Web Audio chime (tri-tone warning alarm) and mobile haptic vibration.
  - In-app toast alerts and persistent incident/notification history log in localStorage.
- Added 24-hour historical trend charts with time-scrubber playback.
- Added Singapore Ministry of Health (MOH) and NEA health guidance for healthy individuals vs vulnerable groups.
- Added a Haze Crisis Simulator with preset scenarios (Pristine, Moderate, Unhealthy Surge, Severe Crisis) and manual surge injection to test threshold alerts on demand.

---

## Turn 2: Git Repository Setup & Initial Push

### User Prompt
> git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@github.com/jasonlimlc/haze-watcher-demo.git

### Assistant Response Summary
- Initialized empty Git repository in the project root.
- Configured user credentials: name `Jason Lim`, email `jason_lim@sach.org.sg`.
- Added `.aistudio/` to `.gitignore`.
- Created root commit with 25 files (`Initial commit: Singapore PSI tracker and air quality alert application`).
- Added remote origin pointing to `https://github.com/jasonlimlc/haze-watcher-demo.git` using personal access token.
- Executed `git push -u origin main` successfully.

---

## Turn 3: Serverless Endpoints Implementation

### User Prompt
> add a serverless end point that pulls live data from data.gov.sg using the following endpoint:
>
> GET https://api-open.data.gov.sg/v2/real-time/api/psi
>
> - store this in /api folder in the project root level, NOT the src folder
> - include /health.ts and /psi.ts within the same subfolder
> - there is no key required for this service

### Assistant Response Summary
- Created `/api/health.ts` at the project root:
  - Returns `{ status: 'healthy', timestamp: '...', service: 'airguard-sg-serverless-api', upstream: 'https://api-open.data.gov.sg/v2/real-time/api/psi' }` with CORS headers.
- Created `/api/psi.ts` at the project root:
  - Serverless function handler fetching live data from `https://api-open.data.gov.sg/v2/real-time/api/psi`.
  - No API key required.
  - Supports CORS, pass-through query parameters (`date`, `date_time`), timeout abort safety, and edge caching headers (`Cache-Control: public, s-maxage=60, stale-while-revalidate=120`).
- Created `server.ts` to mount `/api/health` and `/api/psi` in development alongside Vite middleware, and updated `package.json` dev/start scripts (`tsx server.ts`).
- Updated `src/services/psiApi.ts` to query `/api/psi` as primary data source with automatic v2 schema parsing.
- Verified endpoints with curl:
  - `GET /api/health` returned HTTP 200.
  - `GET /api/psi` returned live Singapore regional PSI telemetry.
- Committed and pushed all serverless endpoint changes to GitHub repository `main` branch.

---

## Turn 4: Chat History Export

### User Prompt
> export this entire chat as an .md file --> PROMPTS.md

### Action Taken
- Generated `PROMPTS.md` containing the structured record of all prompts, decisions, architectural details, and actions taken throughout the session.
