# Privacy Policy

**Effective Date:** February 22, 2026

Stoyco ("we," "us," or "our") operates Mockingbird, a social media platform available at mockingbird.club (the "Service"). This Privacy Policy explains what information we collect, how we use it, and your choices regarding your information.

By using Mockingbird, you agree to the practices described in this policy.

---

## 1. Information We Collect

### Information You Provide

- **Account information:** When you register, we collect your name and email address. If you use email/password sign-in, your password is stored as a one-way cryptographic hash (bcrypt) and is never stored or transmitted in plain text.
- **Profile information:** Your display name and profile photo, which may come from your OAuth provider (GitHub or Google) or be set by you.
- **Content:** Posts, comments, and images you create or upload on the Service.

### Information Collected Automatically

- **OAuth tokens:** If you sign in via GitHub or Google, we receive an access token from that provider and store session data to keep you logged in.
- **Session data:** We use JSON Web Tokens (JWTs) to manage your session. These tokens are stored securely and are not accessible to other users.
- **Server logs:** We maintain server-side logs for security, debugging, and operational purposes. Logs may include IP addresses, request timestamps, and error information. Logs are retained for a limited time and are not used for marketing.

### CAPTCHA (Bot Detection)

We use **Cloudflare Turnstile** on account creation and sign-in flows to distinguish humans from automated bots. Cloudflare may collect certain technical information (such as browser characteristics) to make this determination. Cloudflare's use of this data is governed by [Cloudflare's Privacy Policy](https://www.cloudflare.com/privacypolicy/).

---

## 2. How We Use Your Information

We use the information we collect to:

- Create and manage your account
- Display your profile, posts, images, and friend connections to other users
- Authenticate you when you sign in
- Send you account-related notifications (e.g., if your account status changes)
- Ensure the security and integrity of the Service
- Comply with legal obligations

We do **not** sell your personal information. We do **not** use your information for targeted advertising.

---

## 3. How We Share Your Information

### Public and Private Content

Posts you create may be set to **Public** (visible to all users) or **Private** (visible only to your friends). Your display name and profile photo are visible to other logged-in users.

### Third-Party Service Providers

We share information with the following providers solely to operate the Service:

| Provider        | Purpose                                           | Privacy Policy                                                                                                                           |
| --------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare**  | Image storage (R2) and bot protection (Turnstile) | [cloudflare.com/privacypolicy](https://www.cloudflare.com/privacypolicy/)                                                                |
| **Vercel**      | Application hosting and deployment                | [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy)                                                               |
| **GitHub**      | OAuth sign-in (if used)                           | [docs.github.com/site-policy/privacy-policies](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) |
| **Google**      | OAuth sign-in (if used)                           | [policies.google.com/privacy](https://policies.google.com/privacy)                                                                       |
| **CockroachDB** | Database hosting                                  | [cockroachlabs.com/privacy](https://www.cockroachlabs.com/privacy/)                                                                      |

We do not share your information with any other third parties except as required by law.

### Legal Requirements

We may disclose your information if required to do so by law, court order, or valid governmental request.

---

## 4. Data Retention

- **Account data** is retained for as long as your account exists.
- **Posts and images** are retained until you delete them or delete your account.
- **Server logs** are retained for a limited operational period and then deleted.
- When you delete your account, your profile, posts, comments, images, and friend connections are permanently deleted. Some information may remain in backups for a short period before being purged.

---

## 5. Your Choices

- **Edit your profile:** You can update your display name and profile photo at any time from your profile settings.
- **Delete content:** You can delete individual posts and images at any time.
- **Delete your account:** You can permanently delete your account from your profile settings. Account deletion is irreversible.
- **Disconnect OAuth:** You may revoke Mockingbird's access to your GitHub or Google account through those providers' settings. This will not delete your Mockingbird account.

---

## 6. Children's Privacy

The Service is not directed to children under the age of **13**. We do not knowingly collect personal information from anyone under 13. If we learn that we have inadvertently collected information from a child under 13, we will delete it promptly. If you believe we have collected such information, please contact us at **admin@mockingbird.club**.

---

## 7. Security

We take reasonable technical and organizational measures to protect your information, including:

- Encrypted HTTPS connections for all data in transit
- Bcrypt hashing for passwords
- JWT-based session management
- Cloudflare infrastructure protection

No method of transmission or storage is 100% secure. We cannot guarantee absolute security.

---

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. When we do, we will post the updated policy on this page and update the effective date. Continued use of the Service after changes are posted constitutes your acceptance of the updated policy.

---

## 9. Contact

If you have questions or concerns about this Privacy Policy, please contact us at:

**Stoyco**
Email: [admin@mockingbird.club](mailto:admin@mockingbird.club)
