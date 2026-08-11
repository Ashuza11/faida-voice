# Plan: Authentication Forms (Login & Signup)

## Context
The `/login` and `/signup` pages are currently stubs — they render only a heading with no form. The spec calls for email + password fields, a password show/hide toggle, a submit button, console logging on submit, and a link to switch between the two forms. The open questions in the spec were answered: the two forms **should** share a single reusable `AuthForm` component, and a confirm-password field may be added in a future iteration (not now).

## Approach

### 1. Create two separate form components
Each form is its own standalone client component — no shared `AuthForm`.

**New files:**
- `components/LoginForm/LoginForm.tsx`
- `components/LoginForm/index.ts`
- `components/SignupForm/SignupForm.tsx`
- `components/SignupForm/index.ts`

Each component manages its own state internally:
- Controlled `email` and `password` state
- `showPassword` boolean state (toggled by the eye icon)

**`LoginForm` renders:**
- `<input type="email">` for email
- `<input type="password" | "text">` for password with `Eye`/`EyeOff` toggle
- `<button type="submit">` labelled **"Login"**
- A `<Link href="/signup">` to switch to signup

**`SignupForm` renders:**
- `<input type="email">` for email
- `<input type="password" | "text">` for password with `Eye`/`EyeOff` toggle
- `<button type="submit">` labelled **"Sign Up"**
- A `<Link href="/login">` to switch to login

On `<form onSubmit>`: call `e.preventDefault()` then `console.log({ email, password })`.

Styling uses existing Tailwind utility classes and CSS custom properties — no new CSS files needed.

### 2. Update the page stubs
- `app/(public)/login/page.tsx` — import and render `<LoginForm />`. Fix the naming bug: rename exported function from `SignupPage` → `LoginPage`.
- `app/(public)/signup/page.tsx` — import and render `<SignupForm />`.

Both pages keep their existing `.center-content` / `.page-content` wrappers.

### 3. Add tests
**New file:** `tests/components/AuthForm.test.tsx`

Tests (using Vitest + @testing-library/react + @testing-library/user-event, following the Navbar test pattern):
- Renders login form: email field, password field, "Login" button present
- Renders signup form: email field, password field, "Sign Up" button present
- Password field defaults to `type="password"`
- Clicking the toggle button switches input to `type="text"`, clicking again reverts to `type="password"`
- Submitting the login form calls `console.log` with `{ email, password }`
- Submitting the signup form calls `console.log` with `{ email, password }`
- Login form contains a link to `/signup`
- Signup form contains a link to `/login`

## Files to create / modify
| Action | Path |
|--------|------|
| Create | `components/LoginForm/LoginForm.tsx` |
| Create | `components/LoginForm/index.ts` |
| Create | `components/SignupForm/SignupForm.tsx` |
| Create | `components/SignupForm/index.ts` |
| Modify | `app/(public)/login/page.tsx` |
| Modify | `app/(public)/signup/page.tsx` |
| Create | `tests/components/AuthForm.test.tsx` |

## Reuse / references
- `lucide-react` `Eye` / `EyeOff` icons — same import pattern as `Clock8` in `components/Navbar/Navbar.tsx`
- `Link` from `next/link` — same as Navbar
- Tailwind CSS custom properties defined in `app/globals.css` (`--color-primary`, `--color-error`, etc.)
- Existing layout classes: `.center-content`, `.page-content`, `.form-title`

## Verification
1. Run `npm run dev` and visit `http://localhost:3000/login` — confirm the form renders with email, password, toggle icon, "Login" button, and a "Sign Up" link.
2. Visit `http://localhost:3000/signup` — confirm analogous signup form.
3. Click the toggle icon — confirm password visibility switches.
4. Submit each form with values — confirm `{ email, password }` appears in the browser console.
5. Click the switch link on each page — confirm navigation to the other form.
6. Run `npm test` — all AuthForm tests should pass.
