# Next.js React Redux TypeScript Development Guide

## Project Overview

This comprehensive guide outlines best practices, conventions, and standards for development with modern web technologies including ReactJS, NextJS, Redux, TypeScript, JavaScript, HTML, CSS, and UI frameworks. The guide emphasizes clean, maintainable, and scalable code following SOLID principles and functional programming patterns.

## Tech Stack

- **Frontend Framework**: Next.js 16+ with App Router
- **UI Library**: React 19+ with TypeScript
- **Styling**: Tailwind CSS + Shadcn UI + Radix UI
- **Form Handling**: React Hook Form + Zod validation
- **Data Sanitization**: DOMPurify
- **Testing**: Jest + React Testing Library
- **Code Quality**: ESLint + Prettier + TypeScript strict mode

## Project Structure
- `app/`
  - `layout.tsx` - root layout with theme provider and font setup
  - `globals.css` - global styles and theme tokens
  - `CHANGES.md` - notes for modifications inside `app`
  - `page.tsx` - dynamic entry point that loads the authenticated user and redirects to the matching role dashboard
  - `(admin)/_components/` - shared dashboard shell + role badge utilities (moved from `(dashboard)/_components/`)
  - `(admin)/admin/` - admin-only dashboard with Shadcn data table + role actions
  - `(module_builder)/teacher/create/[moduleId]/` - full-screen teacher module builder with shared layout and three steps (overview, slides, review/publish)
  - `(dashboard)/teacher/` - guarded teacher workspace layout with dashboard component (includes `page.tsx` and `data.json`)
  - `(dashboard)/student/` - guarded student workspace layout with dashboard component (includes `page.tsx` and `data.json`)
  - _Removed_ `protected/` route group; its redirect lived in `page.tsx`
  - _Removed_ `dashboard/` folder; dashboard content moved to teacher and student folders
- `tailwind.config.ts` - Tailwind and theme tokens config
- `AGENTS.md` - project-wide guide and history
- `components/ui/table.tsx` & `components/ui/data-table.tsx` - Shadcn data table primitives
- `components/dashboard-fallback.tsx` - Suspense skeleton used while dashboard client widgets hydrate
- `lib/auth.ts` & `lib/roles.ts` - centralized Supabase role helpers and route mapping

## Development Guidelines

### Development Philosophy

- Write clean, maintainable, and scalable code
- Follow SOLID principles
- Prefer functional and declarative programming patterns over imperative
- Emphasize type safety and static analysis
- Practice component-driven development

### Code Implementation Guidelines

#### Planning Phase

- Begin with step-by-step planning
- Write detailed pseudocode before implementation
- Document component architecture and data flow
- Consider edge cases and error scenarios

#### Code Style Standards

- Use tabs for indentation
- Use single quotes for strings (except to avoid escaping)
- Omit semicolons (unless required for disambiguation)
- Eliminate unused variables
- Add space after keywords
- Add space before function declaration parentheses
- Always use strict equality (===) instead of loose equality (==)
- Space infix operators
- Add space after commas
- Keep else statements on the same line as closing curly braces
- Use curly braces for multi-line if statements
- Always handle error parameters in callbacks
- Limit line length to 80 characters
- Use trailing commas in multiline object/array literals

### Naming Conventions

#### General Rules

- **PascalCase for**: Components, Type definitions, Interfaces
- **kebab-case for**: Directory names (e.g., components/auth-wizard), File names (e.g., user-profile.tsx)
- **camelCase for**: Variables, Functions, Methods, Hooks, Properties, Props
- **UPPERCASE for**: Environment variables, Constants, Global configurations

#### Specific Naming Patterns

- Prefix event handlers with 'handle': `handleClick`, `handleSubmit`
- Prefix boolean variables with verbs: `isLoading`, `hasError`, `canSubmit`
- Prefix custom hooks with 'use': `useAuth`, `useForm`
- Use complete words over abbreviations except for:
  - err (error)
  - req (request)
  - res (response)
  - props (properties)
  - ref (reference)

## Environment Setup

### Environment Variables Configuration

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_mVWChlvfokq7Ooj5dB1FMQ_2SeGP0Fg
SUPABASE_SECRET_KEY=XXXXX
```

## Core Feature Implementation

### React Component Best Practices

#### Component Architecture

- Use functional components with TypeScript interfaces
- Define components using the function keyword
- Extract reusable logic into custom hooks
- Implement proper component composition
- Use React.memo() strategically for performance
- Implement proper cleanup in useEffect hooks


#### React Performance Optimization

- Use useCallback for memoizing callback functions
- Implement useMemo for expensive computations
- Avoid inline function definitions in JSX
- Implement code splitting using dynamic imports
- Implement proper key props in lists (avoid using index as key)


### Next.js Best Practices

#### Core Concepts

- Utilize App Router for routing
- Implement proper metadata management
- Use proper caching strategies
- Implement proper error boundaries

#### Components and Features

- Use Next.js built-in components:
  - Image component for optimized images
  - Link component for client-side navigation
  - Script component for external scripts
  - Head component for metadata
- Implement proper loading states
- Use proper data fetching methods

#### Server Components

- Default to Server Components
- Use URL query parameters for data fetching and server state management
- Use 'use client' directive only when necessary:
  - Event listeners
  - Browser APIs
  - State management
  - Client-side-only libraries

### TypeScript Implementation

- Enable strict mode
- Define clear interfaces for component props, state, and Redux state structure
- Use type guards to handle potential undefined or null values safely
- Apply generics to functions, actions, and slices where type flexibility is needed
- Utilize TypeScript utility types (Partial, Pick, Omit) for cleaner and reusable code
- Prefer interface over type for defining object structures, especially when extending
- Use mapped types for creating variations of existing types dynamically

## State Management

### Local State

- Use useState for component-level state
- Implement useReducer for complex state
- Use useContext for shared state
- Implement proper state initialization

## UI and Styling

### Component Libraries

- Use Shadcn UI for consistent, accessible component design
- Integrate Radix UI primitives for customizable, accessible UI elements
- Apply composition patterns to create modular, reusable components

### Styling Guidelines

- Use Tailwind CSS for utility-first, maintainable styling
- Design with mobile-first, responsive principles for flexibility across devices
- Implement dark mode using CSS variables or Tailwind's dark mode features
- Ensure color contrast ratios meet accessibility standards for readability
- Maintain consistent spacing values to establish visual harmony
- Define CSS variables for theme colors and spacing to support easy theming and maintainability

## Testing Strategy

### Unit Testing

- Write thorough unit tests to validate individual functions and components
- Use Jest and React Testing Library for reliable and efficient testing of React components
- Follow patterns like Arrange-Act-Assert to ensure clarity and consistency in tests
- Mock external dependencies and API calls to isolate unit tests

### Integration Testing

- Focus on user workflows to ensure app functionality
- Set up and tear down test environments properly to maintain test independence
- Use snapshot testing selectively to catch unintended UI changes without over-relying on it
- Leverage testing utilities (e.g., screen in RTL) for cleaner and more readable tests

## Error Handling and Validation

### Form Validation

- Use Zod for schema validation
- Implement proper error messages
- Use proper form libraries (e.g., React Hook Form)

### Error Boundaries

- Use error boundaries to catch and handle errors in React component trees gracefully
- Log caught errors to an external service (e.g., Sentry) for tracking and debugging
- Design user-friendly fallback UIs to display when errors occur, keeping users informed without breaking the app

## Performance Optimization

### Frontend Optimization

- Code splitting with dynamic imports
- Lazy loading for non-critical components
- Caching strategies for API responses
- Image optimization with Next.js Image component

### Backend Optimization

- Database query optimization
- Load balancing strategies
- API response optimization

## Security Considerations

### Data Security

- Implement input sanitization to prevent XSS attacks
- Use DOMPurify for sanitizing HTML content
- Use proper authentication methods
- Validate all user inputs

### Authentication & Authorization

- Implement proper user authentication flow
- Use JWT tokens securely
- Implement role-based access control
- Secure API endpoints

## Accessibility (a11y)

### Core Requirements

- Use semantic HTML for meaningful structure
- Apply accurate ARIA attributes where needed
- Ensure full keyboard navigation support
- Manage focus order and visibility effectively
- Maintain accessible color contrast ratios
- Follow a logical heading hierarchy
- Make all interactive elements accessible
- Provide clear and accessible error feedback

## Monitoring and Logging

### Application Monitoring

- Performance metrics tracking
- Error tracking with Sentry
- User behavior analytics
- Core Web Vitals monitoring

### Log Management

- Structured logging with appropriate log levels
- Centralized log storage
- Error alerting and notification

## Common Issues

### Issue 1: Hydration Mismatch Errors

**Solution**:

- Ensure server and client render the same content
- Use `useEffect` for client-only code
- Use `dynamic` imports with `ssr: false` for client-only components
- Check for differences in date/time formatting between server and client

### Issue 2: Performance Issues with Large Lists

**Solution**:

- Implement virtualization for large datasets
- Use pagination or infinite scrolling
- Optimize re-renders with `React.memo` and `useMemo`
- Consider server-side filtering and sorting

### Issue 3: TypeScript Type Errors in Production Build

**Solution**:

- Enable strict mode in TypeScript configuration
- Fix all type errors before deployment
- Use proper type definitions for third-party libraries
- Implement proper error boundaries for runtime type issues

### Issue 4: SEO and Meta Tags Not Working

**Solution**:

- Use Next.js `Metadata` API in App Router
- Implement proper Open Graph tags
- Ensure meta tags are rendered server-side
- Test with social media debuggers

## Reference Resources

- [Next.js Official Documentation](https://nextjs.org/docs)
- [React Official Documentation](https://react.dev/)
- [TypeScript Official Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)

## LMS Auth Implementation

- Supabase `user_role` enum: `admin|teacher|student`; the column lives on
  `public.users` and defaults to `student` via the `handle_new_user` trigger
  that mirrors inserts from `auth.users`. The same trigger captures
  `first_name` / `last_name` from the sign-up metadata so dashboards can show
  friendly greetings without trusting client-side role changes.
- `is_admin()` helper powers RLS policies so authenticated users can select
  their own row while only admins can update roles.
- `updateUserRoleAction` (see `app/(admin)/admin/actions.ts`) requires admin
  privileges before updating Supabase and revalidates `/admin`.
- `getUserWithRole` / `requireRole` enforce access guards in layouts, while
  the login form redirects users to `/admin`, `/teacher`, or `/student`
  according to the stored role.
- The admin dashboard is the only supported way to promote users; seed the
  first admin manually in Supabase if needed.