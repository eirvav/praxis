# Implementation Plan: Dashboard Layout & Sidebar Structure

## 1. Overview
This implementation plan focuses on structuring the dashboard layout in a way that allows each page to define its own content while still reusing common UI components. The goal is to provide flexibility for different dashboards (student vs. teacher) while ensuring maintainability and scalability.

## 2. Project Structure Adjustments
- **Each dashboard page (`student` and `teacher`) will define its own sidebar.**
- A **global layout file (`layout.tsx`)** will be used to maintain the general page structure, but it will not contain sidebar logic.
- **Reusable UI elements** (like navigation links, buttons, or widgets) will be stored in a `_components` folder within the `(dashboard)` directory.
- **Global ShadCN components should be used from `/components/ui` whenever possible** instead of creating new ones.
- **Each page (`page.tsx`) will import and define its sidebar** instead of relying on a shared one.

## 3. Layout & Sidebar Implementation
### 3.1 Global Layout (`layout.tsx`) Responsibilities
- Define the **general structure** of the dashboard pages (e.g., grid or flexbox layout for sidebar + content).
- Provide a **consistent wrapper** for styling, spacing, and page transitions.
- **Does not include any sidebar logic**, as each page will handle that individually.

### 3.2. Role-Specific Sidebars
- `StudentSidebar.tsx` and `TeacherSidebar.tsx` will be separate components.
- This ensures **each dashboard has its own distinct sidebar**, avoiding unnecessary complexity in role-based conditionals.
- Any common sidebar elements (e.g., navigation links, branding) can be stored in `_components/Sidebar.tsx` and imported where needed.
- **ShadCN components should be imported from `/components/ui` where applicable.**

## 4. Page-Level Control of Content
- Each dashboard page (`student/page.tsx` and `teacher/page.tsx`) will:
  - Import its respective sidebar component.
  - Wrap the content using the `LayoutWrapper.tsx` component to maintain styling consistency.
  - Define its own unique content area.

## 5. Styling & Responsiveness
- Use **CSS grid or flexbox** to ensure:
  - The sidebar remains fixed while the main content area is dynamic.
  - The layout is responsive for different screen sizes.
- Implement a **collapsible sidebar** feature for mobile users.
- Ensure **consistent spacing, typography, and theme** using `LayoutWrapper.tsx`.
- Utilize **Tailwind CSS** for styling consistency.

## 6. Reusability & Maintainability
- Keeping **common UI elements** in `_components/` allows:
  - Avoiding duplicate code between `StudentSidebar.tsx` and `TeacherSidebar.tsx`.
  - Making future modifications to shared elements easier.
- **ShadCN components should be used from `/components/ui` instead of creating duplicates.**
- Ensuring **each page maintains autonomy** over its sidebar and content while reusing styling and layout elements.

## 7. Testing & Debugging
- Verify:
  - The correct sidebar is displayed for each dashboard.
  - Role-based navigation works as expected.
  - Responsiveness is handled properly across devices.
  - Styling and spacing remain consistent across different dashboard pages.
