# Agent Skill: React-PHP Decoupled Architecture (UB CSE 442)

## Folder Structure Protocol
- **`frontend/`**: Next.js project. Must use `output: 'export'` in `next.config.js` to generate a `/out` or `/dist` folder for deployment.
- **`backend/`**: Pure PHP API. No HTML rendering. All PHP files must return JSON headers.
- **`database/`**: SQL migration scripts and schema definitions.

## Communication Logic
- The Frontend must use the native `fetch()` API or `axios` to communicate with the Backend.
- **CORS Handling:** Since the frontend and backend might live on different sub-folders/ports during development, the agent must include CORS headers in PHP:
  ```php
  header("Access-Control-Allow-Origin: *");
  header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
  header("Access-Control-Allow-Headers: Content-Type, Authorization");