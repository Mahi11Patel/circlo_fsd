# Circlo – The Community Sharing Network
> *"Don't Buy It, Borrow It"*

Circlo is a full-stack college project developed by **Archi Gajera** (Frontend Lead) and **Mahi Patel** (Backend & Database Lead). Circlo enables students and community members to list unused items, search and filter available goods, submit and approve borrow requests, track borrowing and returns, submit reviews and ratings, and report issues for admin moderation.

---

## 1. Project Architecture & Standards

- **Frontend**: Multi-page HTML5, external CSS with responsive media queries (**Practical-3**), Vue 2 via CDN script tags with reactive instances and custom directives (**Practical-7**).
- **Backend**: Node.js with Express.js (CommonJS `require`/`module.exports`), custom authentication and role-based authorization middleware (**FSD_PR-9**).
- **Database**: MySQL with the `mysql` npm package and callback-style parameterized queries (**Practical-8**).

---

## 2. Database Setup (XAMPP / phpMyAdmin)

Follow **Practical-8 (Step 4)** to start your MySQL server:

1. **Start XAMPP Control Panel**:
   - Click **Start** next to **Apache**.
   - Click **Start** next to **MySQL** (Default port: `3306`).
2. **Access phpMyAdmin**:
   - Open your browser to `http://localhost/phpmyadmin/`.
3. **Import Database Schema & Seeds**:
   - **Method A (phpMyAdmin Web UI)**:
     1. Click the **Import** tab.
     2. Choose file `database/schema.sql` and click **Go**.
     3. Choose file `database/seed.sql` and click **Go**.
   - **Method B (Windows Command Prompt)**:
     ```cmd
     mysql -u root -p < database\schema.sql
     mysql -u root -p < database\seed.sql
     ```
     *(Press Enter if your root user has no password)*

---

## 3. Environment Configuration

Copy the sample environment file to `.env`:

```cmd
copy .env.example .env
```

Verify your database settings in `.env`:
```ini
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=circlo_db
JWT_SECRET=circlo_super_secret_jwt_key_2026_change_in_production
```

---

## 4. Default Seed Demo Accounts

All demo accounts are seeded with password: **`1234`**

| Username | Role | Location | Purpose in Testing |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin` | Campus Admin Block | Access admin moderation, stats, user blocking, and reports review (FSD_PR-9) |
| **`student`** | `user` | Hostel Block A | Primary demo user (Rahul Sharma); owns items, requests items, leaves reviews |
| **`priya`** | `user` | Engineering Block 3 | Secondary demo user (Priya Patel); borrows items and provides ratings |
| **`spammer`** | `user` (blocked) | Off Campus | Demonstrates blocked account handling and report review |

---

## 5. API Documentation

Refer to [`docs/api-contract.md`](docs/api-contract.md) for the complete endpoint specification, request/response formats, and status codes.
