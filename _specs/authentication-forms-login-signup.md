# Spec for Authentication Forms (Login & Signup)
branch: claude/feature/authentication-forms-login-signup
figma_component (if used): N/A

## Summary
Add email/password authentication forms to the `/login` and `/signup` pages. Both forms share a similar layout and allow users to switch between them easily. On submission, form details are logged to the console (no backend integration yet).

## Functional Requirements
- The `/login` page renders a login form with:
  - An email input field
  - A password input field with a show/hide toggle icon
  - A submit button labelled "Login"
  - A link/button to switch to the signup form (navigates to `/signup`)
- The `/signup` page renders a signup form with:
  - An email input field
  - A password input field with a show/hide toggle icon
  - A submit button labelled "Sign Up"
  - A link/button to switch to the login form (navigates to `/login`)
- Clicking the show/hide icon on the password field toggles the input type between `password` and `text`
- On form submission, prevent the default browser behaviour and log the submitted email and password values to the browser console
- Both forms should be visually consistent and share the same layout/component structure where possible

## Figma Design Reference (only if referenced)
N/A

## Possible Edge Cases
- User submits the form with empty fields — still logs (no validation required at this stage)
- User rapidly toggles show/hide password — icon and input type should stay in sync
- User navigates between login and signup and back — form state should reset

## Acceptance Criteria
- `/login` page displays the login form with email, password (with toggle), and a "Login" submit button
- `/signup` page displays the signup form with email, password (with toggle), and a "Sign Up" submit button
- The password show/hide icon correctly toggles password visibility
- Submitting either form logs `{ email, password }` to the console and does not navigate or reload the page
- Each form includes a clearly visible link/button to switch to the other form
- Both forms are reachable and navigable without JavaScript errors

## Open Questions
- Should the two forms eventually share a single reusable `AuthForm` component, or remain as separate page-level implementations? Non
- Will a "confirm password" field be needed on the signup form in a future iteration? yes

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- Renders the login form with email field, password field, and submit button
- Renders the signup form with email field, password field, and submit button
- Password field defaults to type `password`
- Clicking the show/hide icon toggles the password field to type `text` and back
- Submitting the login form calls `console.log` with the entered email and password
- Submitting the signup form calls `console.log` with the entered email and password
- The switch link on `/login` points to `/signup` and vice versa


