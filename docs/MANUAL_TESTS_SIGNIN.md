# Manual Test Cases: Sign-In and Access Control

**Test server link:** http://localhost:3000/

Use the seeded accounts from [DUMMY_DATA.md](DUMMY_DATA.md): password for all is **Password123!**

- **Employee:** morgan.lee.0@example.com  
- **Manager:** alex.manager@example.com  
- **Admin:** admin@example.com  

---

## Test 1: Sign Up Flow on Desktop

**Test server link:** http://localhost:3000/

1. Navigate to the link above on Desktop.
2. Ensure you see the main sign-in page with the heading **"Sign in to your account"** on the right side.
3. Below the blue **"Sign In"** button, click the blue **"Sign up"** link (in the line “Don't have an account? Sign up”).
4. Ensure you are on the **"Create your account"** page with the following fields on the right: **Full Name**, **Role**, **Work Email**, and **Password**.
5. Ensure **Role** has **Employee** selected by default, with a dropdown that allows switching between **Employee** and **Manager**.
6. Enter a **Full Name**, leave or set **Role** (e.g. Employee or Manager), enter a **Work Email** (use an email you can access), and a **Password** (at least 8 characters). Click the blue **"Sign Up →"** button.
7. Verify you are redirected to the **"Verify your email"** page and that a 6-digit verification code was sent to your Work Email.
8. Enter the verification code in the field provided and click the blue **"Verify & sign in"** button.
9. Verify you are redirected to the main dashboard.
   - If your role is **Manager**, ensure the page title/content shows **"Team Dashboard"** and the sidebar shows team management options (e.g. Direct Reports, Company Directory).
   - If your role is **Employee**, ensure the page shows **"My Dashboard"** and the sidebar shows options such as My Dashboard, My History, My Reviews.

---

## Test 2: Sign In as Employee on Desktop

**Test server link:** http://localhost:3000/

1. Navigate to the link above on Desktop.
2. Ensure you see **"Sign in to your account"** on the right.
3. Enter **Work Email:** morgan.lee.0@example.com and **Password:** Password123!
4. Click the blue **"Sign In"** button.
5. Verify you are redirected to the **Employee dashboard** (e.g. title or heading **"My Dashboard"**, sidebar shows “MY WORK” with My Dashboard, My History, Impact Trends, My Reviews).
6. Verify you do **not** see manager-only items (e.g. Direct Reports, Company Directory, Goal Management) in the main nav.
7. Verify the sidebar shows your role as **Employee** (e.g. under your name or in the account section).

---

## Test 3: Sign In as Manager on Desktop

**Test server link:** http://localhost:3000/

1. Navigate to the link above on Desktop.
2. Ensure you see **"Sign in to your account"** on the right.
3. Enter **Work Email:** alex.manager@example.com and **Password:** Password123!
4. Click the blue **"Sign In"** button.
5. Verify you are redirected to the **Manager dashboard** (e.g. title or heading **"Team Dashboard"**).
6. Verify the sidebar shows **"TEAM MANAGEMENT"** with options such as **Team Dashboard**, **Direct Reports**, **Structured Reviews**, **Goal Management**, **Company Directory**.
7. Verify the sidebar shows your role as **Manager** (e.g. under your name or in the account section).
8. Click **Direct Reports** (or Company Directory) and ensure the page loads and shows team/directory content appropriate for a manager.

---

## Test 4: Sign In as Admin via Admin Login on Desktop

**Test server link (admin login):** http://localhost:3000/admin/login/

1. Navigate to the main app link: http://localhost:3000/
2. In the footer, click **"Admin"**.
3. Ensure you are redirected to the **Admin sign-in** page with heading **"Team Management"** and subheading **"Admin sign in"** (dark-themed page with Email and Password only).
4. Enter **Email:** admin@example.com and **Password:** Password123!
5. Click **"Sign in"**.
6. Verify you are redirected to the **Team Management** admin page (simple layout with tabs: **Users**, **Teams**, **Team Members**).
7. Verify you can see the **Users**, **Teams**, and **Team Members** tabs and that data loads in each tab.
8. Verify the header shows **"Team Management"** and a **"Log out"** button (no “Back to app” link).

---

## Test 5: Admin Login Rejects Non-Admin (Employee/Manager) on Desktop

**Test server link (admin login):** http://localhost:3000/admin/login/

1. Navigate to the admin login link above (or go to the main app and click **Admin** in the footer).
2. Enter **Email:** morgan.lee.0@example.com (employee) and **Password:** Password123!
3. Click **"Sign in"**.
4. Verify you are **not** redirected to the Team Management page.
5. Verify an error message appears such as **"This account is not an administrator."**
6. Repeat with **Email:** alex.manager@example.com (manager) and **Password:** Password123!
7. Verify the same (or equivalent) error message and that you remain on the Admin sign-in page.

---

## Test 6: Unregistered User / Invalid Credentials on Main Sign-In

**Test server link:** http://localhost:3000/

1. Navigate to the link above on Desktop.
2. Enter **Work Email:** notregistered@example.com and **Password:** WrongPass123!
3. Click the blue **"Sign In"** button.
4. Verify you are **not** redirected to the dashboard.
5. Verify an error message appears (e.g. **"Invalid email or password"** or similar).
6. Verify you remain on the sign-in page and can try again or switch to Sign up.

---

## Test 7: Unauthenticated User Accessing Protected Pages (Redirect to Sign-In)

**Test server link:** http://localhost:3000/

Use a fresh browser session or an incognito/private window so you are not signed in.

1. Navigate directly to: http://localhost:3000/dashboard/
   - **Verify** you are redirected to the **main sign-in** page (“Sign in to your account”), not the dashboard.
2. Navigate directly to: http://localhost:3000/direct-reports/
   - **Verify** you are redirected to the main sign-in page.
3. Navigate directly to: http://localhost:3000/profile/
   - **Verify** you are redirected to the main sign-in page.
4. Navigate directly to: http://localhost:3000/admin/
   - **Verify** you are redirected to the **Admin sign-in** page (“Team Management” / “Admin sign in”), not the main app sign-in and not the Team Management dashboard.
5. Navigate directly to: http://localhost:3000/admin/login/
   - **Verify** the Admin sign-in page loads (no redirect away).

---

## Test 8: Employee Cannot Access Manager-Only Pages (Redirect to Dashboard)

**Test server link:** http://localhost:3000/

1. Sign in as **Employee** (morgan.lee.0@example.com / Password123!) using the main sign-in page.
2. After reaching the Employee dashboard, navigate directly to: http://localhost:3000/direct-reports/
   - **Verify** you are redirected to the **dashboard** (or equivalent), not to the Direct Reports page.
3. Navigate to: http://localhost:3000/directory/
   - **Verify** you are redirected to the dashboard (or equivalent), not to the Company Directory page.
4. (Optional) Verify that manager-only links (e.g. Direct Reports, Company Directory) do not appear in the sidebar when signed in as Employee.

---

## Test 9: Manager Can Access Manager-Only Pages

**Test server link:** http://localhost:3000/

1. Sign in as **Manager** (alex.manager@example.com / Password123!) using the main sign-in page.
2. From the sidebar, click **Direct Reports**.
   - **Verify** the Direct Reports page loads and shows team members (or empty state).
3. Click **Company Directory** (or navigate to .../directory/).
   - **Verify** the Company Directory page loads.
4. Click **Goal Management** (or navigate to .../goals/).
   - **Verify** the Goal Management page loads (or appropriate manager content).

---

## Summary Table

| Test | Purpose |
|------|--------|
| 1 | Sign up flow: create account, verify email, land on correct dashboard (Employee vs Manager). |
| 2 | Sign in as Employee: correct dashboard and no manager-only options. |
| 3 | Sign in as Manager: Team Dashboard and manager-only nav (Direct Reports, Directory, etc.). |
| 4 | Admin sign in: only admin can access Team Management page via Admin login. |
| 5 | Admin login rejects Employee and Manager accounts. |
| 6 | Unregistered/invalid credentials: error on main sign-in, no redirect. |
| 7 | Not signed in: direct access to dashboard, direct-reports, profile, admin redirects to sign-in or admin login. |
| 8 | Employee: direct access to manager-only pages redirects to dashboard. |
| 9 | Manager: can access Direct Reports, Directory, Goals. |
