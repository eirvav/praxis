# **Implementation Plan: Module Creation for Teachers in LMS**

## **1. Overview**
This implementation plan outlines the steps to enable teachers to create modules that are visible to all students. Authentication and role management are handled by **Clerk**, while module data is stored in **Supabase**.

## **2. Goals**
- Allow **teachers** to create modules via a simple input form.
- Store module data in **Supabase**.
- Ensure **students** can view all modules in a table format.
- Establish a connection between **Clerk authentication** and **Supabase data**.

---

## **3. Steps to Implement**

### **Step 1: Store User Data in Supabase**
Since Clerk handles authentication, we need to store the following user data in Supabase:
- **User ID** (from Clerk)
- **Role** (`student` or `teacher`)

#### **Tasks:**
- Create a `users` table in Supabase:
  - `id` (UUID, primary key, matches Clerk user ID)
  - `email` (TEXT, unique)
  - `role` (TEXT, either `teacher` or `student`)
- Set up a **Clerk Webhook** to trigger when a user signs up.
- Write a **server function** that listens for the webhook and stores user details in Supabase.

---

### **Step 2: Create a Modules Table in Supabase**
The modules created by teachers will be stored in a new table.

#### **Tasks:**
- Create a `modules` table in Supabase:
  - `id` (UUID, primary key)
  - `title` (TEXT)
  - `description` (TEXT)
  - `created_by` (UUID, references `users.id`)
  - `created_at` (TIMESTAMP, default `now()`)

---

### **Step 3: Create a Simple Module Creation Form (Frontend)**
Teachers should be able to input:
- **Module Title**
- **Module Description**
- **Submit Button** to save the module

#### **Tasks:**
- Create a **frontend form** in Next.js for teachers.
- On form submission, send a request to a **Next.js API route**.
- Validate that the user is a **teacher** before allowing submission.

---

### **Step 4: Implement API Route to Handle Module Creation**
A backend API should:
1. **Verify the user role** (check Supabase `users` table).
2. **Insert the module** into Supabase.
3. **Return a success response**.

#### **Tasks:**
- Create a **Next.js API route** (`/api/modules`) that:
  - Extracts the user’s ID from **Clerk auth**.
  - Checks the user’s role in **Supabase**.
  - Inserts module data into **Supabase**.

---

### **Step 5: Fetch Modules for Students**
All students should be able to view **all modules** created by teachers.

#### **Tasks:**
- Create a **Next.js API route** (`/api/get-modules`) to:
  - Fetch all modules from **Supabase**.
  - Return them as JSON.
- On the **student's page**, display the modules in a **table format**.
