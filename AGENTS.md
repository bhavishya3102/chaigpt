<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Match project layout to the [chai-gpt-build](https://github.com/Aestheticsuraj234/chai-gpt-build) reference: root-level `app/`, `components/`, `hooks/`, `lib/`, `features/` — not `src/`.
- When restructuring, move or adapt only existing user-written code; do not add extra folders or files beyond what the user has written.
- Keep Clerk sign-in at a clean `/sign-in` URL using hash routing on the `SignIn` component.
- Use pnpm for package management and Prisma CLI (`pnpm exec prisma` or `pnpm prisma`, not `pnpm dlx prisma`).

## Learned Workspace Facts

- ChaiGPT is a Next.js App Router project using TypeScript, Tailwind CSS v4, and pnpm.
- Clerk auth is integrated; route protection lives in `proxy.ts` with only `/sign-in` public.
- Prisma 7 client output is at `lib/generated/prisma`; use `@prisma/adapter-pg` with a singleton client pattern when adding database access.
- Prisma 7 requires Node.js 20.19+; the project pins Node 22 via `.nvmrc`.
- UI primitives use Base UI (`@base-ui/react`); compose triggers with the `render` prop, not Radix `asChild`.
