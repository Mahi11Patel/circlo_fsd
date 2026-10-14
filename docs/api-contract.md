# Circlo REST API Contract & Specification

This document establishes the official API contract between **Partner A** (Frontend lead) and **Partner B** (Backend & DB lead).
All routes, parameter names, JSON keys, and HTTP status codes are finalized here.

---

## 1. Authentication & Security Headers

- **Public endpoints**: Do not require headers.
- **Protected endpoints**: Must include the authorization token:
  ```http
  Authorization: Bearer <token>
  ```
  *(Alternative accepted header: `x-auth-token: <token>`)*
- **Response Format**: All responses return `Content-Type: application/json; charset=utf-8`.
- **Status Codes Standard (from FSD_PR-9)**:
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created.
  - `400 Bad Request`: Validation failure or malformed payload.
  - `401 Unauthorized`: Authentication failed (`{"message": "Authentication failed"}`).
  - `403 Forbidden`: Access denied (`{"message": "Access denied. Admin only."}` or not owner).
  - `404 Not Found`: Resource does not exist (`{"message": "Resource not found"}`).
  - `409 Conflict`: Unique constraint violation (e.g. duplicate username or email).
  - `500 Internal Server Error`: Server or database failure.

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 User Registration
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "username": "student",
    "email": "student@circlo.local",
    "password": "1234",
    "full_name": "Rahul Sharma",
    "phone": "9876543210",
    "location": "Hostel Block A"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "userId": 2
  }
  ```
- **Error Response (400 / 409)**:
  ```json
  {
    "success": false,
    "message": "Username or email already exists"
  }
  ```

### 2.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "username": "student",
    "password": "1234"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOi...",
    "user": {
      "id": 2,
      "username": "student",
      "email": "student@circlo.local",
      "full_name": "Rahul Sharma",
      "role": "user",
      "status": "active"
    }
  }
  ```
- **Error Response (401 Unauthorized - PR-9)**:
  ```json
  {
    "success": false,
    "message": "Authentication failed"
  }
  ```

### 2.3 Current Authenticated User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: Required (`Bearer <token>`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": 2,
      "username": "student",
      "email": "student@circlo.local",
      "full_name": "Rahul Sharma",
      "phone": "9876543210",
      "location": "Hostel Block A",
      "role": "user",
      "status": "active"
    }
  }
  ```

---

## 3. Categories Endpoints (`/api/categories`)

### 3.1 List All Categories
- **Method**: `GET`
- **Path**: `/api/categories`
- **Auth**: None (Public)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "categories": [
      { "id": 1, "name": "Books & Academics", "description": "Textbooks, notes, reference manuals" },
      { "id": 2, "name": "Electronics & Gadgets", "description": "Calculators, chargers, accessories" }
    ]
  }
  ```

---

## 4. Items Endpoints (`/api/items`)

### 4.1 Browse and Filter Items
- **Method**: `GET`
- **Path**: `/api/items`
- **Auth**: None (Public)
- **Query Parameters**:
  - `category` (optional, INT category_id)
  - `location` (optional, STRING partial match)
  - `search` (optional, STRING query for title/description)
  - `available` (optional, 'true' or 'false')
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "items": [
      {
        "id": 1,
        "owner_id": 2,
        "owner_name": "Rahul Sharma",
        "category_id": 1,
        "category_name": "Books & Academics",
        "title": "Data Structures & Algorithms in C++",
        "description": "Standard textbook for 3rd semester DSA course.",
        "item_condition": "good",
        "location": "Hostel Block A",
        "deposit_amount": "0.00",
        "is_available": 1,
        "image_url": "/images/placeholder.png",
        "created_at": "2026-10-14T10:00:00.000Z"
      }
    ]
  }
  ```

### 4.2 Get Item Details
- **Method**: `GET`
- **Path**: `/api/items/:id`
- **Auth**: None (Public)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "item": {
      "id": 1,
      "title": "Data Structures & Algorithms in C++",
      "description": "Standard textbook for 3rd semester DSA course.",
      "category_id": 1,
      "category_name": "Books & Academics",
      "item_condition": "good",
      "location": "Hostel Block A",
      "deposit_amount": "0.00",
      "is_available": 1,
      "image_url": "/images/placeholder.png",
      "created_at": "2026-10-14T10:00:00.000Z",
      "owner": {
        "id": 2,
        "username": "student",
        "full_name": "Rahul Sharma",
        "location": "Hostel Block A",
        "rating": 5.0,
        "total_reviews": 1
      }
    }
  }
  ```

### 4.3 Create Item Listing
- **Method**: `POST`
- **Path**: `/api/items`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "title": "Scientific Calculator fx-991EX",
    "category_id": 2,
    "description": "Battery included, ideal for engineering mathematics exams.",
    "item_condition": "like_new",
    "location": "Hostel Block B",
    "deposit_amount": 200.00,
    "image_url": "/images/calculator.png"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Item listed successfully",
    "itemId": 3
  }
  ```

### 4.4 Update Item
- **Method**: `PUT`
- **Path**: `/api/items/:id`
- **Auth**: Required (Owner or Admin)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Item updated successfully"
  }
  ```

### 4.5 Delete Item
- **Method**: `DELETE`
- **Path**: `/api/items/:id`
- **Auth**: Required (Owner or Admin)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Item deleted successfully"
  }
  ```

---

## 5. Borrowing Workflow Endpoints (`/api/requests`)

### 5.1 Create Borrow Request
- **Method**: `POST`
- **Path**: `/api/requests`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "item_id": 1,
    "start_date": "2026-10-20",
    "end_date": "2026-10-25",
    "message": "Need this for upcoming mid-semester exam revision."
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Borrow request submitted successfully",
    "requestId": 1
  }
  ```

### 5.2 Get Incoming Requests (For items owned by logged-in user)
- **Method**: `GET`
- **Path**: `/api/requests/incoming`
- **Auth**: Required
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "requests": [
      {
        "id": 1,
        "item_id": 1,
        "item_title": "Data Structures & Algorithms in C++",
        "borrower_id": 3,
        "borrower_name": "Priya Patel",
        "start_date": "2026-10-20",
        "end_date": "2026-10-25",
        "message": "Need this for upcoming exam.",
        "status": "pending",
        "created_at": "2026-10-14T12:00:00.000Z"
      }
    ]
  }
  ```

### 5.3 Get Outgoing Requests (Borrow requests made by logged-in user)
- **Method**: `GET`
- **Path**: `/api/requests/outgoing`
- **Auth**: Required
- **Success Response (200 OK)**: Returns list of user's requests and statuses.

### 5.4 Update Request Status (Approve / Reject / Mark Borrowed / Mark Returned)
- **Method**: `PUT`
- **Path**: `/api/requests/:id/status`
- **Auth**: Required (Owner or Borrower depending on action)
- **Request Body**:
  ```json
  {
    "status": "approved",
    "owner_response_note": "You can collect it from Hostel Block A at 6 PM."
  }
  ```
- **Allowed Status Transitions**:
  - `pending` -> `approved` (Owner)
  - `pending` -> `rejected` (Owner)
  - `approved` -> `borrowed` (Owner/Borrower confirmation)
  - `borrowed` -> `returned` (Owner marks item safely returned)
  - `pending` -> `cancelled` (Borrower cancels)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Request status updated to approved"
  }
  ```

---

## 6. Reviews & Ratings Endpoints (`/api/reviews`)

### 6.1 Submit Review for a Completed Borrowing
- **Method**: `POST`
- **Path**: `/api/reviews`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "request_id": 1,
    "reviewee_id": 2,
    "rating": 5,
    "comment": "Item was in great condition, smooth handover!"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Review submitted successfully"
  }
  ```

---

## 7. Reports Endpoints (`/api/reports`)

### 7.1 Submit a Report
- **Method**: `POST`
- **Path**: `/api/reports`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "reported_user_id": 4,
    "reported_item_id": null,
    "reason": "Late return / No response",
    "details": "Item was not returned on scheduled end date."
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Report submitted successfully"
  }
  ```

---

## 8. Admin Endpoints (`/api/admin`) — FSD_PR-9 Protected

All admin routes require `user.role === 'admin'`. Non-admins receive `403 Forbidden` (`{"message": "Access denied. Admin only."}`).

### 8.1 Admin Dashboard Metrics
- **Method**: `GET`
- **Path**: `/api/admin/stats`
- **Auth**: Required (`role === 'admin'`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "stats": {
      "totalUsers": 15,
      "totalItems": 32,
      "activeRequests": 6,
      "pendingReports": 2
    }
  }
  ```

### 8.2 Admin List Users
- **Method**: `GET`
- **Path**: `/api/admin/users`
- **Auth**: Required (`role === 'admin'`)
- **Success Response (200 OK)**: List of all users.

### 8.3 Admin Block/Unblock User
- **Method**: `PUT`
- **Path**: `/api/admin/users/:id/status`
- **Auth**: Required (`role === 'admin'`)
- **Request Body**:
  ```json
  {
    "status": "blocked"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User status updated to blocked"
  }
  ```

### 8.4 Admin List Reports
- **Method**: `GET`
- **Path**: `/api/admin/reports`
- **Auth**: Required (`role === 'admin'`)
- **Success Response (200 OK)**: List of all submitted reports.

### 8.5 Admin Review Report
- **Method**: `PUT`
- **Path**: `/api/admin/reports/:id`
- **Auth**: Required (`role === 'admin'`)
- **Request Body**:
  ```json
  {
    "status": "reviewed",
    "admin_notes": "Contacted borrower; item returned."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Report updated successfully"
  }
  ```
