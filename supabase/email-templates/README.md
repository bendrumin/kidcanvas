# KidCanvas Email Templates

Beautiful, branded email templates for Supabase authentication emails.

## How to Apply

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication → Email Templates**
4. For each template type, copy the HTML content from the corresponding file below

## Template Files

| Supabase Template | File |
|-------------------|------|
| **Confirm signup** | `confirm-signup.html` |
| **Magic Link** | `magic-link.html` |
| **Reset Password** | `reset-password.html` |
| **Invite user** | `invite-user.html` |
| **Change Email Address** | `change-email.html` |

## Email Subject Lines

Update these in the Supabase dashboard as well:

| Template | Subject Line |
|----------|-------------|
| Confirm signup | `Welcome to KidCanvas! 🎨 Confirm your email` |
| Magic Link | `Your KidCanvas magic link ✨` |
| Reset Password | `Reset your KidCanvas password 🔐` |
| Invite user | `You're invited to join a family on KidCanvas! 🎉` |
| Change Email | `Confirm your new email for KidCanvas 📧` |

## Notes

- Templates use the `{{ .ConfirmationURL }}` variable which Supabase replaces with the actual link
- All templates are responsive and work on mobile devices
- Colors match the KidCanvas brand (pink/purple gradient theme)

