# Login Screen: Test Cases

Practice app. Rules below are the assumed requirements; change them if your sample app differs.

## Assumed requirements
- Errors for wrong credentials show after tapping Log in, using a generic message plus attempts left: "Incorrect email or password. N attempts left." (4, 3, 2, then "1 attempt left."; the 5th failure locks the account)
- Format errors show as red text under the field after the user leaves it.
- Empty fields: Log in button stays enabled; red text under each empty field.
- Lockout after 5 failed attempts for 15 minutes, or until password reset. The lockout message contains a working "reset your password" link.
- Forgot password screen: enter email, tap Reset password, then go back and log in. (Simplified: a real app would email a reset link first.)
- Email: max 254 chars, leading/trailing spaces trimmed, emoji rejected. Password: 8-64 chars, spaces kept.
- Password field has a Show/Hide (eye icon) toggle so the user can check what they typed.
- "Forgot password?" is a button-style link with a lock icon, not plain text.
- Brand header with logo and decorative background.
- No network: message with Retry button; email stays filled; Retry resubmits login.
- Backgrounding the app keeps the screen and fields as they were. A killed app restarts at a fresh login screen.

## Test cases

"Auto" = covered by a Playwright test. "Manual" = check by eye (for example on the iOS Simulator).

| ID | Area | Scenario | Steps | Expected result | Status |
|----|------|----------|-------|-----------------|--------|
| LG-01 | Core | Valid login | Enter valid email and password, tap Log in | User lands on home screen | Auto |
| LG-02 | Core | Invalid email format | Enter "not-an-email", valid password, tap Log in | Red text under email: "Enter a valid email"; no login attempt | |
| LG-03 | Core | Wrong password | Valid email, wrong password, tap Log in | "Incorrect email or password. 4 attempts left." shown after tap; stays on login | Auto |
| LG-04 | Core | Error timing | Type a wrong password without tapping Log in | No credential error appears while typing | |
| LG-05 | Lockout | Lock after 5 failures | Submit wrong password 5 times | Message: "Account locked. Try again in 15 minutes or reset your password." | Auto |
| LG-06 | Lockout | Locked account, correct password | After lockout, submit the correct password | Login blocked; lockout message still shown | Auto |
| LG-07 | Lockout | Full reset flow | Lock the account (5 wrong passwords), tap the blue Reset password button, enter email + new password twice, tap Reset password, tap Back to log in, log in with the new password, tap Log out | Reset screen opens; success message "...You can log in now."; login with the new password reaches Welcome home; Log out returns to login | Auto |
| LG-08 | Empty | Both fields empty | Tap Log in with nothing entered | "Email is required" and "Password is required" in red; button stays enabled | Auto |
| LG-09 | Empty | Only email filled | Fill email, tap Log in | "Password is required" in red | |
| LG-10 | Empty | Only password filled | Fill password, tap Log in | "Email is required" in red | |
| LG-11 | Input | Very long email | Enter 255+ chars in email | Input capped at 254 or error shown; no crash | |
| LG-12 | Input | Password length limits | Try 7, 8, 64 and 65 characters | 7 and 65 rejected; 8 and 64 accepted | |
| LG-13 | Input | Special characters in password | Use !@#$%^&*() in a valid password | Login works; password not altered | |
| LG-14 | Input | Emoji in email | Enter an emoji in email | Rejected with email format error | |
| LG-15 | Input | Spaces | Leading/trailing spaces in email; spaces in password | Email trimmed and accepted; password spaces kept | |
| LG-16 | Behavior | Double-tap Log in | Double-tap quickly | Only one request sent; no duplicate error or double navigation | Auto |
| LG-17 | Behavior | Offline login | Turn network off, tap Log in | "No internet connection. Check your connection and try again." with Retry; email still filled | Auto |
| LG-18 | Behavior | Retry after reconnect | Restore network, tap Retry | Login resubmits; success goes to home, failure stays on login | Auto |
| LG-19 | Behavior | Slow network | Throttle network, tap Log in | Loading indicator shown; button disabled until response | |
| LG-20 | Behavior | Forgot password link | Tap "Forgot password?", then "Back to log in" | Reset screen opens; back returns to login | Auto |
| LG-21 | Behavior | Password masking | Type password | Characters masked | |
| LG-22 | Behavior | Keyboard Go key | Press Go on the keyboard | Submits the form like tapping Log in | |
| LG-23 | Session | Background then foreground | Background the app mid-entry, return | Same screen, fields intact | |
| LG-24 | Session | App killed during login | Kill app mid-login, relaunch | Fresh login screen; no partial session | |
| LG-25 | Session | Rotate device | Rotate mid-entry | Layout adapts; entered text kept | Manual |
| LG-26 | Lockout | Attempts-left warning | Submit a wrong password 4 times | After each: "...4 attempts left.", "...3...", "...2...", "...1 attempt left."; nothing shown while typing | Auto |
| LG-27 | Input | Show/Hide password | Type a password, tap the eye icon, tap it again | First tap shows the typed text; second tap masks it again | Auto |
| LG-28 | Visual | Forgot password styling | Look at the login screen | "Forgot password?" looks like a button with a lock icon, easy to tap with a thumb | Manual |
| LG-29 | Visual | Brand header | Open the login screen | Logo and app name shown in a header with a decorative background | Auto |
| LG-30 | Visual | Buttons clear the keyboard | Tap the Email field, then the Password field, with the on-screen keyboard open | Page scrolls so "Log in" and "Forgot password?" are both fully visible above the keyboard; nothing is hidden or untappable | Manual |
| LG-31 | Visual | Steady layout while typing | Tap Email, type a full address, tap Password, type a password | Screen scrolls once to clear the keyboard, then stays still while typing; header is not pushed off screen; blank space under "Forgot password?" is no larger than the keyboard | Manual |
| LG-32 | Lockout | Old password after reset | Reset the password, go back to log in, use the OLD password | Login fails with the generic error; only the new password works | Auto |
| LG-33 | Input | Reset form validation | On the reset screen use a 5-character new password and a different confirmation | "Password must be 8 to 64 characters" and "Passwords do not match" shown; no success message | Auto |
| LG-34 | Lockout | Lock expires | Lock the account, wait 15 minutes, submit a wrong password | Counter starts again: "4 attempts left", not an instant lock | Manual |
| LG-35 | Visual | Error fits on one line | Submit one wrong password on a phone | "Incorrect email or password. 4 attempts left." fits on one line | Manual |
| LG-36 | Visual | Home screen background | Log in successfully | Home screen has the brand header and gradient background | Manual |

## Found while exploring on the iOS Simulator
- Forgot password was plain link text, so it was changed to a button style (LG-28).
- Users could not check what they typed, so a Show/Hide toggle was added (LG-27).
- The "reset your password" text in the lockout message was not a link, so it became a working link (LG-07).
- The screen looked bare, so a brand header was added (LG-29).
- The on-screen keyboard covered the Log in and Forgot password buttons, so the page now adds scroll room and scrolls them into view when a field is focused (LG-30).
- That first fix added too much blank space and kept moving the page while typing, so it now measures the real keyboard height and scrolls once, only as far as needed (LG-31).
- The lockout message had its reset text inside the red box, so a separate Reset password button now sits under it (LG-07).
- The reset screen only unlocked the account, so it now sets a new password, with a success message and a login with the new password (LG-07, LG-32, LG-33).
- After a lock ran out, the attempt counter was not cleared, so the first wrong password locked the account again. The counter now restarts (LG-34).
- The attempts-left message wrapped onto two lines, so the text was made smaller (LG-35). The home screen got a background (LG-36).
