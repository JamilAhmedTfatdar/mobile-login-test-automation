# Login Screen: Test Cases

Practice app. Rules below are the assumed requirements; change them if your sample app differs.

## Assumed requirements
- Errors for wrong credentials show after tapping Log in, using a generic message plus attempts left: "Incorrect email or password. N attempts left." (4, 3, 2, then "1 attempt left."; the 5th failure locks the account)
- Format errors show as red text under the field after the user leaves it.
- Empty fields: Log in button stays enabled; red text under each empty field.
- Lockout after 5 failed attempts for 15 minutes, or until password reset.
- Email: max 254 chars, leading/trailing spaces trimmed, emoji rejected. Password: 8-64 chars, spaces kept.
- No network: message with Retry button; email stays filled; Retry resubmits login.
- Backgrounding the app keeps the screen and fields as they were. A killed app restarts at a fresh login screen.

## Test cases

| ID | Area | Scenario | Steps | Expected result |
|----|------|----------|-------|-----------------|
| LG-01 | Core | Valid login | Enter valid email and password, tap Log in | User lands on home screen |
| LG-02 | Core | Invalid email format | Enter "not-an-email", valid password, tap Log in | Red text under email: "Enter a valid email"; no login attempt |
| LG-03 | Core | Wrong password | Valid email, wrong password, tap Log in | "Incorrect email or password. 4 attempts left." shown after tap; stays on login |
| LG-04 | Core | Error timing | Type a wrong password without tapping Log in | No credential error appears while typing |
| LG-05 | Lockout | Lock after 5 failures | Submit wrong password 5 times | Message: "Account locked. Try again in 15 minutes or reset your password." |
| LG-06 | Lockout | Locked account, correct password | After lockout, submit the correct password | Login blocked; lockout message still shown |
| LG-07 | Lockout | Reset unlocks account | Locked account, complete Forgot password flow, log in | Login succeeds |
| LG-08 | Empty | Both fields empty | Tap Log in with nothing entered | "Email is required" and "Password is required" in red; button stays enabled |
| LG-09 | Empty | Only email filled | Fill email, tap Log in | "Password is required" in red |
| LG-10 | Empty | Only password filled | Fill password, tap Log in | "Email is required" in red |
| LG-11 | Input | Very long email | Enter 255+ chars in email | Input capped at 254 or error shown; no crash |
| LG-12 | Input | Password length limits | Try 7, 8, 64 and 65 characters | 7 and 65 rejected; 8 and 64 accepted |
| LG-13 | Input | Special characters in password | Use !@#$%^&*() in a valid password | Login works; password not altered |
| LG-14 | Input | Emoji in email | Enter an emoji in email | Rejected with email format error |
| LG-15 | Input | Spaces | Leading/trailing spaces in email; spaces in password | Email trimmed and accepted; password spaces kept |
| LG-16 | Behavior | Double-tap Log in | Double-tap quickly | Only one request sent; no duplicate error or double navigation |
| LG-17 | Behavior | Offline login | Turn network off, tap Log in | "No internet connection. Check your connection and try again." with Retry; email still filled |
| LG-18 | Behavior | Retry after reconnect | Restore network, tap Retry | Login resubmits; success goes to home, failure stays on login |
| LG-19 | Behavior | Slow network | Throttle network, tap Log in | Loading indicator shown; button disabled until response |
| LG-20 | Behavior | Forgot password link | Tap "Forgot password?" | Reset screen opens; back returns to login |
| LG-21 | Behavior | Password masking | Type password | Characters masked; show/hide toggle works if present |
| LG-22 | Behavior | Keyboard Go key | Press Go on the keyboard | Submits the form like tapping Log in |
| LG-23 | Session | Background then foreground | Background the app mid-entry, return | Same screen, fields intact |
| LG-24 | Session | App killed during login | Kill app mid-login, relaunch | Fresh login screen; no partial session |
| LG-25 | Session | Rotate device | Rotate mid-entry | Layout adapts; entered text kept |
| LG-26 | Lockout | Attempts-left warning | Submit a wrong password 4 times | After each: "...4 attempts left.", "...3...", "...2...", "...1 attempt left."; nothing shown while typing |
