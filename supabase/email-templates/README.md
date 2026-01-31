# Supabase Email Templates

Custom branded email templates for Perdia Content Engine authentication emails.

## How to Apply These Templates

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** > **Email Templates**
3. For each template type, copy the HTML content and paste it into the corresponding template editor

## Template Files

| File | Supabase Template Type | Purpose |
|------|----------------------|---------|
| `confirm-signup.html` | **Confirm signup** | Sent when a new user signs up |
| `magic-link.html` | **Magic Link** | Sent for passwordless login |
| `reset-password.html` | **Reset Password** | Sent when user requests password reset |
| `invite-user.html` | **Invite user** | Sent when inviting a new team member |

## Template Variables

These templates use Supabase's Go template syntax:

- `{{ .ConfirmationURL }}` - The confirmation/action URL
- `{{ .Email }}` - User's email address (if needed)
- `{{ .Token }}` - The token (if needed for custom flows)

## URL Configuration

**Important:** Make sure to also update these settings in **Authentication** > **URL Configuration**:

- **Site URL**: `https://perdiav5.netlify.app`
- **Redirect URLs**: Add `https://perdiav5.netlify.app/*`

## Customization Notes

- Templates use inline CSS for maximum email client compatibility
- Colors match Perdia's blue/indigo brand theme
- Responsive design works on mobile and desktop
- Tested with major email clients (Gmail, Outlook, Apple Mail)
