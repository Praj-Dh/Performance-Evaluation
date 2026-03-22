UB SERVER DEPLOYMENT STEPS:

1. FRONTEND BUILD: 
   Run `npm run build` inside the /frontend folder. This creates a static site.
   
2. DIRECTORY MAPPING:
   - Move the contents of `frontend/out/` to the root of your web server folder.
   - Move the `backend/` folder into the root as well.
   - Ensure your React `fetch` calls point to `./backend/api/filename.php`.

3. TEST VS PROD:
   - TEST Server: Used for active integration between React and PHP.
   - PROD Server: Only holds the final optimized build.

4. MAIL LOG ON DEPLOYED SERVER:
   - Open: https://aptitude.cse.buffalo.edu/.../api/mail-log.php to see last 100 mail attempts (timestamp | to | subject | ok/fail).

5. WHEN mail() SHOWS "ok" BUT NO EMAIL ARRIVES:
   The server accepted the message but delivery fails (relay, spam, or From-address policy). You can still test signup:
   - On the server, create config/mail_debug_otp.php (copy from config/mail_debug_otp.example.php or touch an empty file).
   - Then signup and resend-verification responses will include dev_otp in the JSON. Open the Network tab, copy the code from the response, or use the verify-email page (it prefills from the URL when dev_otp is in the signup redirect).
   - Optionally ask IT about outbound mail / relay for your app.