# High-Level Implementation Plan and Routing System

## 1. Overview

This plan details how to route users to different dashboards (`student` vs. `teacher`) in our Next.js 15 project using Clerk for authentication. The system ensures:

- **Role assignment**: New users receive a default `role:"student"` upon sign-up.
- **Role-based routing**: 
  - **Student** → `/(dashboard)/student`
  - **Teacher** → `/(dashboard)/teacher`
- **Security**: Each dashboard is protected so only the correct role can access it.

---

## 2. Folder Structure and Routing

Below is a high-level outline of the relevant folders and routes in the Next.js (App Router) project:

### Key Directories

1. **`app/(auth)/sign-up/[[...sign-up]]/`**  
   - Handles user sign-up flows.  
   - After a successful sign-up, users will eventually land at a main page (e.g., `/app/page.tsx`).

2. **`app/(auth)/sign-in/[[...sign-in]]/`**  
   - Handles user sign-in.  
   - Users are directed here if they are not authenticated.

3. **`app/(dashboard)/student/`**  
   - Contains student-specific dashboard pages and layout.  
   - Only accessible to users with `role:"student"`.

4. **`app/(dashboard)/teacher/`**  
   - Contains teacher-specific dashboard pages and layout.  
   - Only accessible to users with `role:"teacher"`.

5. **`app/page.tsx`**  
   - Acts as a “root” page or entry point after sign-in.  
   - Determines user role and redirects to the correct dashboard.

6. **`app/api/webhook/clerk/route.ts`**  
   - A serverless function to handle Clerk webhooks.  
   - Ensures new users have a default role if not otherwise assigned.

---

## 3. Detailed Implementation Steps

### 3.1 Root Page Role Check

1. **Objective**: Immediately redirect logged-in users to their respective dashboards.  
2. **Location**: `app/page.tsx` (a server component).  
3. **Process**:
   - If no user is found (i.e., not logged in), redirect to sign-in.  
   - Otherwise, read the user’s `role` from their Clerk metadata.  
   - If the role is `teacher`, redirect to `/(dashboard)/teacher`.  
   - If the role is `student` or undefined, redirect to `/(dashboard)/student`.  

### 3.2 Role-Based Dashboard Protection

#### 3.2.1 Student Dashboard

1. **Objective**: Allow only `student`-role users to access.  
2. **Location**: `app/(dashboard)/student/page.tsx`  
3. **Process**:
   - If no user is found, redirect to sign-in.  
   - If the user’s role is not `student`, redirect them away (or show a 403 page).  
   - Otherwise, render the student dashboard content.

#### 3.2.2 Teacher Dashboard

1. **Objective**: Allow only `teacher`-role users to access.  
2. **Location**: `app/(dashboard)/teacher/page.tsx`  
3. **Process**:
   - If no user is found, redirect to sign-in.  
   - If the user’s role is not `teacher`, redirect them away (or show a 403 page).  
   - Otherwise, render the teacher dashboard content.

### 3.3 Sign-Up Flow

1. **Objective**: Handle user sign-up and subsequent routing.  
2. **Location**: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`  
3. **Process**:
   - Users complete sign-up using Clerk’s component or flow.  
   - After sign-up, they are typically directed to `/app` (or an equivalent page).  
   - The root page (`app/page.tsx`) logic then checks the role and redirects accordingly.

### 3.4 Optional Enhancements

- **403 Page**: Instead of silently redirecting unauthorized users, you could show a 403 page for better clarity.  
- **Performance Considerations**: Server-side checks avoid flickering or client-based vulnerabilities.

---

## 4. User Flow Summary

1. **Sign-Up**:  
   - User completes sign-up via Clerk.  
   - Clerk webhook triggers, ensuring `role:"student"` if missing.

2. **Login**:  
   - User logs in via Clerk.  
   - After login, user is taken to the main page (`/app`).

3. **Role Check & Redirection** (in `app/page.tsx`):  
   - If not authenticated, user goes to `/sign-in`.  
   - If authenticated, role is retrieved:  
     - **Teacher** → `/(dashboard)/teacher`  
     - **Student** → `/(dashboard)/student`

4. **Access Dashboards**:  
   - Within each dashboard, the layout file confirms the user has the correct role.  
   - If incorrect, user is either redirected or shown a 403 error.
