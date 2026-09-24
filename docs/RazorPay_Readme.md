# Razorpay Integration Guide

This document summarizes the Razorpay payment system integration within the Zestos application, including file architecture, testing procedures, and production setup.

## 1. Architecture Overview

The Razorpay integration is split between a secure backend and a frontend modal trigger. **Crucially, all cryptographic logic and order creation happens on the backend** to prevent exposing secret keys to the client.

### Key Files
*   **`src/lib/razorpay.ts`**: The core utility library. Initializes the Razorpay client, creates orders, and contains the logic for verifying payment and webhook signatures. *(Note: This is exclusively imported and executed on the backend).*
*   **`src/components/RegistrationForm.tsx`**: The frontend component where the user clicks "Register" and the Razorpay payment modal is triggered.
*   **`src/app/api/checkout/route.ts`**: The backend endpoint called by the frontend to create a secure Order ID via Razorpay before the modal opens.
*   **`src/app/api/verify-payment/route.ts`**: The backend endpoint called by the frontend *after* a successful payment in the modal. It cryptographically verifies the signature to prevent spoofing and marks the user as paid.
*   **`src/app/api/webhooks/razorpay/route.ts`**: The background listener that Razorpay's servers ping to confirm payments (a safety net for edge cases where the browser closes prematurely).

---

## 2. Local Testing Setup

The codebase is designed to seamlessly switch between a graceful "Mock Mode" and "Live Mode" based entirely on your environment variables. **No code changes are required to start testing.**

1. Create a `.env` file at the root of your project.
2. Obtain Test Keys from your Razorpay Dashboard (ensure you are in Test Mode).
3. Add your keys to the `.env` file:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_YourTestKeyId"
RAZORPAY_KEY_ID="rzp_test_YourTestKeyId"
RAZORPAY_KEY_SECRET="YourTestKeySecret"
# You can leave the webhook secret as a placeholder for initial testing
RAZORPAY_WEBHOOK_SECRET="placeholder_webhook_secret"
```

Restart your Next.js development server. The application will now generate actual test orders via Razorpay.

### Mock Payment Details
When the Razorpay modal opens in test mode, select "Card" and use the following details to simulate a successful payment:
- **Card Number:** `4100 2800 0000 1007`
- **Expiry Date:** Any future date (e.g., `12/28`)
- **CVV:** Any random 3 digits (e.g., `123`)

---

## 3. Production & Webhook Setup

When you are ready to deploy to production, migrating your webhooks requires zero code changes:

1. Generate **Live Keys** from your Production Razorpay account.
2. Add the Live Key ID and Live Key Secret to your production server's environment variables (e.g., in Vercel or AWS).
3. In the Razorpay Production Dashboard, go to **Settings -> Webhooks -> Add New Webhook**.
4. Enter your production URL: `https://www.your-domain.com/api/webhooks/razorpay`.
5. Create a strong, random password and enter it in the Razorpay Webhook **Secret** field. Select the `payment.captured` and `order.paid` events.
6. Copy that exact same password and add it to your production server's environment variables as `RAZORPAY_WEBHOOK_SECRET`.

---

## 4. Frequently Asked Questions (Q&A)

**Q: Why do I need to make a `.env` file when `.env.example` is already there?**
**A:** `.env.example` is a template committed to version control (GitHub) so developers know which variables are required. If you put real secrets in it, they become public. A `.env` file is ignored by Git, ensuring your real keys stay secure on your local machine.

**Q: Are signature verifications handled in the client logic?**
**A:** No. While it may look like it because `src/lib/razorpay.ts` contains the functions, that file is only imported by backend API routes. Verifying signatures on the client would require sending your `RAZORPAY_KEY_SECRET` to the browser, which is a massive security risk.

**Q: Do I need webhooks implemented to start testing?**
**A:** No. The primary "happy path" relies on the `verify-payment` route being triggered by the frontend immediately after a successful modal payment. Webhooks act as a safety net (e.g., if the user's internet drops immediately after paying) and can be set up later for production.

**Q: Do I need to modify the code to connect a new Razorpay account?**
**A:** No. The code dynamically pulls credentials via `process.env`. Updating your `.env` file (or production environment variables) will automatically point the application to the new account.

**Q: What happens if a user accidentally double-clicks the "Pay & Register" button, or closes the Razorpay modal?**
**A:** The frontend `RegistrationForm` component implements a "Hard Lock" state (`isLocked`). Once a user successfully triggers the backend checkout and the Razorpay modal pops up, the submit button locks permanently for that specific browser session (changing to "Please complete payment..."). This guarantees no duplicate orders can be created accidentally. If the user intentionally closes the modal without paying, they will need to refresh the page to restart the process (their typed data is safely preserved via the Draft Recovery system).
