## Project Guide

## Project Structure
.
├── app
│   ├── (admin)
│   │   ├── _components
│   │   │   ├── dashboard-shell.tsx
│   │   │   ├── role-badge.tsx
│   │   │   └── role-gate.tsx
│   │   ├── admin
│   │   │   ├── actions.ts
│   │   │   ├── columns.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── CHANGES.md
│   ├── (dashboard)
│   │   ├── _components
│   │   ├── student
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── teacher
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── CHANGES.md
│   ├── (module_builder)
│   │   ├── teacher
│   │   │   └── create
│   │   │       └── [moduleId]
│   │   │           ├── _components
│   │   │           │   ├── builder-context.tsx
│   │   │           │   ├── builder-header.tsx
│   │   │           │   └── builder-shell.tsx
│   │   │           ├── step-1
│   │   │           │   └── page.tsx
│   │   │           ├── step-2
│   │   │           │   ├── _components
│   │   │           │   │   ├── slide-types
│   │   │           │   │   │   ├── context-slide
│   │   │           │   │   │   │   ├── context-slide.tsx
│   │   │           │   │   │   │   └── toolbar-plugin.tsx
│   │   │           │   │   │   ├── likert-scale-slide
│   │   │           │   │   │   │   ├── CHANGES.md
│   │   │           │   │   │   │   ├── likert-scale-settings.tsx
│   │   │           │   │   │   │   └── likert-scale-slide.tsx
│   │   │           │   │   │   ├── quiz-slide
│   │   │           │   │   │   │   ├── CHANGES.md
│   │   │           │   │   │   │   ├── quiz-settings.tsx
│   │   │           │   │   │   │   └── quiz-slide.tsx
│   │   │           │   │   │   ├── text-response-slide
│   │   │           │   │   │   │   ├── CHANGES.md
│   │   │           │   │   │   │   ├── text-response-settings.tsx
│   │   │           │   │   │   │   └── text-response-slide.tsx
│   │   │           │   │   │   ├── video-response-slide
│   │   │           │   │   │   │   ├── CHANGES.md
│   │   │           │   │   │   │   ├── video-response-settings.tsx
│   │   │           │   │   │   │   └── video-response-slide.tsx
│   │   │           │   │   │   └── video-upload-slide
│   │   │           │   │   │       ├── CHANGES.md
│   │   │           │   │   │       ├── video-upload-settings.tsx
│   │   │           │   │   │       └── video-upload-slide.tsx
│   │   │           │   │   ├── CHANGES.md
│   │   │           │   │   ├── main-content-middle.tsx
│   │   │           │   │   ├── slide-manager-left.tsx
│   │   │           │   │   └── slide-settings-right.tsx
│   │   │           │   └── page.tsx
│   │   │           ├── step-3
│   │   │           │   ├── _components
│   │   │           │   │   ├── CHANGES.md
│   │   │           │   │   ├── slide-preview.tsx
│   │   │           │   │   └── slide-review.tsx
│   │   │           │   ├── CHANGES.md
│   │   │           │   └── page.tsx
│   │   │           ├── actions.ts
│   │   │           ├── layout.tsx
│   │   │           └── types.ts
│   │   ├── AGENTS.md
│   │   └── CHANGES.md
│   ├── auth
│   │   ├── confirm
│   │   │   └── route.ts
│   │   ├── error
│   │   │   └── page.tsx
│   │   ├── forgot-password
│   │   │   └── page.tsx
│   │   ├── login
│   │   │   └── page.tsx
│   │   ├── sign-up
│   │   │   └── page.tsx
│   │   ├── sign-up-success
│   │   │   └── page.tsx
│   │   └── update-password
│   │       └── page.tsx
│   ├── CHANGES.md
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── hooks
│   └── use-mobile.ts
├── lib
│   ├── supabase
│   │   ├── client.ts
│   │   ├── proxy.ts
│   │   └── server.ts
│   ├── auth.ts
│   ├── CHANGES.md
│   ├── roles.ts
│   └── utils.ts
├── public
│   └── logo.svg
├── AGENTS.md
├── components.json
├── DEV-GUIDE.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── proxy.ts
├── push.sh
├── README.md
├── tailwind.config.ts
├── tree.sh
└── tsconfig.json

## Useful Commands

### View Project Structure
To see only relevant files (excludes node_modules, .next, build artifacts, etc.):

```bash
npm run tree
```

Or use the standalone script:
```bash
./tree.sh
```

The tree command excludes:
- `node_modules/`
- `.next/`
- `.git/`
- `.vercel/`
- `out/`, `build/`, `coverage/`
- Files inside `components/ui/` (folder structure is shown, but not file contents)
- `.DS_Store`, log files, TypeScript build info
- Environment files (`.env*`)