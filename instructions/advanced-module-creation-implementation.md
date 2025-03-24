# **Product Requirements Document (PRD): LMS Module Management**

This PRD outlines the detailed requirements and plan for adding and managing Modules (and their Slides) in our Learning Management System (LMS). It is intended to guide the implementation in our existing technology stack: **Next.js**, **React**, **Tailwind**, **ShadCN**, **Supabase**, and **Clerk**.

---

## **1. Overview**

Our LMS needs a flexible yet structured way to store and manage “Modules.” Each Module contains multiple Slides. A Slide can be of different types (e.g., text, quiz, video) and will contain dynamic configuration options. It will works how you add slides in Powerpoint and Mentimeter The system must support two primary user roles:

- **Teacher**: Can create and manage Modules and their Slides.
- **Student**: Can view Modules and their Slides but cannot modify them.

This PRD focuses on the **database and backend** design (using Supabase/Postgres) required to handle this functionality, as well as the overall flow for Teachers and Students.

---

## **2. Objectives**

1. **Store Modules** in a robust, normalized way, ensuring each Module belongs to a specific Course and Teacher.
2. **Store Slides** in a separate table for easier creation, updating, ordering, and RLS (Row Level Security) policies.
3. **Support different Slide types** (video, quiz, text, etc.) via a flexible JSON-based configuration field.
4. **Implement RLS** in Supabase to ensure Teachers can only modify their own Modules and Slides, while Students can only read the Modules/Slides they are permitted to access.
5. **Provide a clear, scalable foundation** for future enhancements (e.g., real-time updates, advanced analytics, additional Slide types).

---

## **3. Scope & Features**

### 3.1 Module Management
- **Create a Module**: A Teacher can create a Module under a specific Course.
- **Update a Module**: A Teacher can update its title, description, etc.
- **Delete a Module**: A Teacher can delete an existing Module (and all associated Slides).
- **View Modules**: Both Teachers and Students can read the Module information.  

### 3.2 Slide Management
- **Add Slides**: A Teacher can add multiple Slides to a Module.
- **Edit Slides**: A Teacher can edit any Slide’s content or configuration (e.g., quiz questions, video URLs).
- **Delete Slides**: A Teacher can remove any Slide from a Module.
- **Reorder Slides**: A Teacher can reorder slides within a Module.
- **View Slides**: Students (and Teachers) can read all Slides for a Module they have access to.

### 3.3 Security & Access
- **Role-Based Access**: Teachers and Students have different permissions.  
- **RLS Policies**: Enforce row-level security on the `modules` and `slides` tables to ensure:
  - Teachers can only modify Modules/Slides that they own.
  - Students can only view Modules/Slides they are allowed to access.

---

## **4. Requirements**

### 4.1 Functional Requirements
1. **Modules**  
   - Must be linked to a Course (i.e., cannot exist without a parent Course).  
   - Must store basic info (e.g., `title`, `description`, `teacher_id`, `course_id`).  
   - Must allow for referencing multiple Slides.  
   - Must be accessible only by authorized Teachers (for modification) and Students (for viewing).  

2. **Slides**  
   - Must reference a parent Module (i.e., cannot exist without a Module).  
   - Must store:
     - A position/order value.
     - A type (e.g., `quiz`, `video`, `text`).
     - A JSON-based config for dynamic data.  
   - Must be updatable independently (a single Slide can be updated without rewriting the entire Module).  

3. **Security**  
   - **RLS**: Ensure that only the owner Teacher can modify the Module/Slides.  
   - **RLS**: Ensure that Students can only read Modules/Slides they have permission to view (e.g., if the Course is published or they are enrolled).  

### 4.2 Non-Functional Requirements
1. **Performance**  
   - For the foreseeable future (small scale, ~10 slides per module), we do not anticipate performance issues.  
   - JSON-based queries should remain performant under these conditions.  

2. **Scalability**  
   - The design should allow for easy addition of new Slide types and new fields in the Slide config without changing the database schema.  
   - Storing Slide data in JSON means minimal schema changes when adding new features.  

3. **Maintainability**  
   - The table structure should remain straightforward.  
   - Future developers can easily add new Slide types or new fields in the config.  

4. **Auditability**  
   - Timestamps (e.g., `created_at`, `updated_at`) will be maintained for Modules and Slides to track changes over time.  

---

## **5. Proposed Data Model (Conceptual)**

> **Note:** The following descriptions avoid explicit SQL or code. They describe the conceptual fields and relationships.

### 5.1 `modules` Table
- **Fields**:
  - **ID** (unique identifier)
  - **Title** (text)
  - **Description** (text)
  - **Teacher ID** (reference to the `users` table, representing the Teacher who owns the Module)
  - **Course ID** (reference to the `courses` table, indicating which Course this Module belongs to)
  - **Created At** (timestamp)
  - **Updated At** (timestamp)

- **Relationships**:
  - **One-to-many** with `slides` (each Module can have multiple Slides).

- **RLS Considerations**:
  - A Teacher can only modify (create, update, delete) a Module if `teacher_id` matches their user ID.
  - A Student can only select (read) a Module if they are allowed to view that Course/Module (e.g., if the Course is published or the Student is enrolled).

### 5.2 `slides` Table
- **Fields**:
  - **ID** (unique identifier)
  - **Module ID** (reference to the `modules` table)
  - **Slide Type** (text indicating the type of slide, e.g. `video`, `quiz`, `text`)
  - **Position** (integer indicating the order of slides within the Module)
  - **Config** (JSON-like structure that stores the Slide’s unique data, e.g., quiz questions, video URL, etc.)
  - **Created At** (timestamp)
  - **Updated At** (timestamp)

- **Relationships**:
  - **Many-to-one** with `modules` (each Slide belongs to exactly one Module).

- **RLS Considerations**:
  - A Teacher can only modify a Slide if they own the parent Module.
  - A Student can only view a Slide if they can view the parent Module.

---

## **6. User Flow**

### 6.1 Teacher Flow
1. **Teacher logs in** via Clerk (role verified as `teacher`).  
2. **Creates a Course** (if needed) or selects an existing Course.  
3. **Creates a new Module**:
   - Inputs `title`, `description`, selects the `course_id`.
   - The system assigns `teacher_id` automatically from the Teacher’s user ID.  
4. **Adds Slides** to the new Module:
   - Specifies `slide_type`, sets `position` (e.g., 1, 2, 3...), and provides any relevant data in `config`.
   - The system links the Slide to the `module_id`.  
5. **Edits or deletes** existing Modules/Slides as needed.  
6. **Publishes** the Course or sets appropriate access so Students can view.  

### 6.2 Student Flow
1. **Student logs in** via Clerk (role verified as `student`).  
2. **Views** a list of Courses or Modules they have access to.  
3. **Selects** a specific Module:
   - The system fetches all Slides for that Module (only if the Student is allowed by RLS policies).  
4. **Navigates** through the Slides:
   - For each Slide, the system displays the Slide Type and the details in `config` (e.g., quiz question, video).  
5. **Completes** quizzes or reads content (any interactivity will be handled at the application level).  

---

## **7. Implementation Plan**

1. **Database Preparation**  
   - Create/ensure the `modules` table and `slides` table exist in Supabase.  
   - Verify that the `users` and `courses` tables already exist or are properly set up.  
   - Set up foreign key relationships (`teacher_id`, `course_id`, `module_id`) to maintain referential integrity.  

2. **RLS Configuration**  
   - **Enable RLS** on the `modules` and `slides` tables.  
   - **Create Policies**:
     1. **Teacher Policy**: Allows `INSERT`, `UPDATE`, `DELETE` where `teacher_id` matches the user ID in `modules`, and likewise for `slides` by checking ownership via the parent `modules` table.  
     2. **Student Policy**: Allows `SELECT` only if the Student has access to the corresponding `course_id` or if the module is “published.”  

3. **Backend Integration** (Supabase + Next.js)  
   - **Create/Update Module** endpoints in the Next.js API routes:
     - Validate user role (Teacher).
     - Insert or update the `modules` table.  
   - **Create/Update Slides** endpoints:
     - Validate user role (Teacher).
     - Insert or update the `slides` table.  
   - **Fetch Modules/Slides** endpoints:
     - Validate user role (Student or Teacher).
     - Select from `modules` and `slides` tables. RLS automatically enforces row-level permissions.  

4. **Front-End Integration** (React + Tailwind + ShadCN)  
   - **Module Management UI**: A form for Teachers to create or edit Modules.  
   - **Slides Management UI**: A drag-and-drop or form-based UI for adding, editing, reordering Slides.  
   - **View Modules**: A read-only interface for Students, displaying each Slide’s content based on `slide_type` and `config`.  

5. **Testing & QA**  
   - **Unit Tests**: Test the logic for creating/updating Modules/Slides (mocking Supabase calls).  
   - **Integration Tests**: Verify that RLS policies correctly restrict actions to the right roles.  
   - **Manual QA**:  
     1. **Teacher** tries to modify another Teacher’s Module (should fail).  
     2. **Student** tries to modify any Module/Slide (should fail).  
     3. **Student** can view Modules/Slides only if allowed.  
---

## **8. Constraints & Considerations**

1. **Small Scale**  
   - We only expect ~10 slides per module in the near term.  
   - A single JSON config column for each slide should be performant enough.  

2. **Role Management**  
   - Clerk manages authentication, but we must ensure role-based logic is consistent (e.g., `teacher` vs. `student` claims).  

3. **RLS Complexity**  
   - RLS can be tricky to configure. We must carefully write policies so that Teachers can only modify their own content.  
---

## **9. Edge Cases**

1. **Teacher Deletes a Module** with existing Slides:
   - The system should cascade or handle slides cleanup to avoid orphaned data.  
2. **Teacher Reorders Slides**:
   - Ensure the `position` field is updated correctly, and the front-end is designed to handle reordering.  
3. **Empty Slide Config**:
   - A Slide with minimal config should still be valid, but the front-end must handle missing fields gracefully.  
4. **Multiple Teachers** assigned to the same Course:
   - If we allow co-teaching, we need additional logic or policy adjustments for shared ownership.  

---

## **10. Success Criteria**

1. **Teachers** can seamlessly create and manage Modules and Slides in the Supabase database.  
2. **Students** can only view Modules/Slides that are relevant to them, with no unauthorized modifications possible.  
3. **RLS** is fully functional, preventing unauthorized data access or modification.  
4. **System** is stable, with no major performance bottlenecks at the current scale.  