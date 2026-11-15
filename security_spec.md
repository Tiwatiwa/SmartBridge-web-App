# SmartBridge Market — Firestore Security Specification

## 1. Admin & Trust Root
- **Primary Admin Account UID:** `61wF1x8kb7UxJ6GOW7d9450IkYN2` (enforced via `request.auth.uid == '61wF1x8kb7UxJ6GOW7d9450IkYN2'`)
- **Verified Runtime Admin Email:** `tiwongenkhoma@gmail.com` (strictly requires `request.auth.token.email_verified == true`)
- **Additional Admins Collection:** `/admins/{adminId}` (only readable by owner/admin; only writable by verified existing admins; primary admin UID cannot be deleted).

## 2. Core Data Invariants
1. **Global Default-Deny:** The root catch-all `match /{document=**} { allow read, write: if false; }` is the first rule inside `match /databases/{database}/documents`.
2. **PII Isolation:** Public profile fields reside in `/users/{userId}` without email, phone, or address. Private PII (`email`, `phone`) is isolated in `/users/{userId}/private/{docId}`, readable/writable only by `userId` or Admin.
3. **Self-Assigned Privilege Prevention:** Users cannot create `/users/{userId}` with `role == 'admin'` or `verifiedBusiness == true`, nor escalate `role` on update, unless already `isAdmin()`.
4. **Master Gate & Existence Checks:** Subcollections (`reviews`, `items`, `participants`, `messages`) verify parent document existence via `exists(...)` / `get(...)` on write and never use `get()`/`exists()` inside `allow list`.
5. **Temporal Integrity & Immutability:** All `createdAt` / `joinedAt` and `updatedAt` timestamps must equal `request.time`. Owner/creator/parent IDs and `createdAt` are immutable on update.
6. **Action-Based Updates & Terminal State Locking:** Multi-actor updates (`orders`, `negotiations`, `groupBuys`, `liveStreams`) branch into explicit allowed `affectedKeys().hasOnly(...)` actions and lock terminal statuses (`Delivered`, `Accepted`, `Declined`, `Completed`, `Ended`) with an `|| isAdmin()` escape hatch.
7. **System-Managed Collections:** `/rewards/{userId}` and `/fraudAlerts/{alertId}` forbid non-admin client writes so users cannot mint loyalty points or dismiss fraud alerts.

## 3. "Dirty Dozen" Adversarial Test Payloads (Expected: `PERMISSION_DENIED`)
1. **Identity Spoofing (Product):** User `attacker` creates `/products/p1` with `userId: "victimTraderUid"`. Rejected by `incoming().userId == request.auth.uid || isAdmin()`.
2. **Privilege Escalation (User Profile):** Standard user creates `/users/attacker` with `role: "admin"` and `verifiedBusiness: true`. Rejected by `incoming().role in ['customer', 'trader']` and `!('verifiedBusiness' in incoming()) || incoming().verifiedBusiness == false`.
3. **Email Spoofing (Admin Bypass):** Unverified user with `email: "tiwongenkhoma@gmail.com"`, `email_verified: false`, `uid: "spoofUid"` tries to read `/fraudAlerts/a1`. Rejected because email admin check strictly enforces `request.auth.token.email_verified == true`.
4. **Shadow Field Injection:** Verified trader updates `/products/p1` adding `{ isFeatured: true }`. Rejected by `isValidProduct(incoming())` (`hasOnly`) and `affectedKeys().hasOnly(...)`.
5. **ID Poisoning (1.5KB Document ID):** Attacker writes `/products/<1500-char-id>` or `/products/bad$id`. Rejected by `isValidId(productId)` (`<= 128` and `^[a-zA-Z0-9_\-]+$`).
6. **PII Blanket Read:** Non-owner signed-in user attempts `get` on `/users/victim/private/info` or `/orders/ord1`. Rejected by `isOwner(...) || isAdmin()`.
7. **State Shortcutting (Order):** Trader updates `/orders/ord1` directly from `Pending` to `Delivered`, skipping `Preparing` and `Out for Delivery`. Rejected by transition guard.
8. **Terminal State Tampering:** Trader attempts to revert a `Delivered` order back to `Pending`. Rejected by `existing().status != 'Delivered'`.
9. **Timestamp Backdating:** Attacker creates `/chats/c1` with client-supplied `createdAt` in 2020 instead of server timestamp. Rejected by `incoming().createdAt == request.time`.
10. **Orphaned Subcollection Write:** Attacker creates `/products/nonexistentProd/reviews/r1`. Rejected by `exists(/databases/$(database)/documents/products/$(productId))`.
11. **Group Buy Sync Bypass:** Attacker increments `currentBuyers` on `/groupBuys/gb1` without creating `/groupBuys/gb1/participants/{uid}` in the same atomic batch. Rejected by `existsAfter(...)`.
12. **Reward Points Forgery:** Customer writes `{ points: 999999 }` to `/rewards/{uid}`. Rejected because `/rewards/{userId}` writes require `isAdmin()`.
