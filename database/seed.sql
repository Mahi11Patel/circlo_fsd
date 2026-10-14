-- ====================================================================
-- Circlo – The Community Sharing Network
-- Database Seed Data (database/seed.sql)
-- Safe demo data for development, testing, and viva demonstration
-- All demo user accounts use password: "1234"
-- Bcrypt Hash: $2b$10$RmBsu6Yo6zH8MXQmiTHtTu0j2AqxcNoNb1zvLWvLuunJt6ZSgScqK
-- ====================================================================

USE circlo_db;

-- --------------------------------------------------------------------
-- 1. Insert Initial Users
-- --------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, full_name, phone, location, role, status) VALUES
(1, 'admin', 'admin@circlo.local', '$2b$10$RmBsu6Yo6zH8MXQmiTHtTu0j2AqxcNoNb1zvLWvLuunJt6ZSgScqK', 'Platform Administrator', '9876543210', 'Campus Admin Block', 'admin', 'active'),
(2, 'student', 'student@circlo.local', '$2b$10$RmBsu6Yo6zH8MXQmiTHtTu0j2AqxcNoNb1zvLWvLuunJt6ZSgScqK', 'Rahul Sharma', '9876543211', 'Hostel Block A', 'user', 'active'),
(3, 'priya', 'priya@circlo.local', '$2b$10$RmBsu6Yo6zH8MXQmiTHtTu0j2AqxcNoNb1zvLWvLuunJt6ZSgScqK', 'Priya Patel', '9876543212', 'Engineering Block 3', 'user', 'active'),
(4, 'spammer', 'spammer@circlo.local', '$2b$10$RmBsu6Yo6zH8MXQmiTHtTu0j2AqxcNoNb1zvLWvLuunJt6ZSgScqK', 'Bad Actor Demo', '9876543213', 'Off Campus', 'user', 'blocked');

-- --------------------------------------------------------------------
-- 2. Insert Standard Categories
-- --------------------------------------------------------------------
INSERT INTO categories (id, name, description, icon) VALUES
(1, 'Books & Academics', 'Textbooks, course notes, reference guides, exam material', 'book'),
(2, 'Electronics & Gadgets', 'Scientific calculators, chargers, adapters, headphones', 'cpu'),
(3, 'Lab & Project Equipment', 'Arduino kits, sensors, breadboards, multimeters', 'tool'),
(4, 'Sports & Fitness', 'Badminton rackets, cricket kits, yoga mats, footballs', 'activity'),
(5, 'Camping & Outdoors', 'Tents, sleeping bags, backpacks, flashlights', 'compass'),
(6, 'Miscellaneous Tools', 'Screwdriver sets, glue guns, measuring tapes', 'wrench');

-- --------------------------------------------------------------------
-- 3. Insert Demo Community Items
-- --------------------------------------------------------------------
INSERT INTO items (id, owner_id, category_id, title, description, item_condition, location, deposit_amount, is_available, image_url) VALUES
(1, 2, 1, 'Data Structures & Algorithms in C++ (Mark Allen Weiss)', 'Required textbook for semester 3. Highlighted key concepts, all pages intact.', 'good', 'Hostel Block A', 0.00, TRUE, '/images/book.png'),
(2, 2, 2, 'Casio FX-991EX ClassWiz Scientific Calculator', 'High-resolution display calculator, permitted in university examinations. Comes with protective slide cover.', 'like_new', 'Hostel Block A', 200.00, TRUE, '/images/calc.png'),
(3, 3, 3, 'Arduino Uno R3 Starter Kit with 30+ Sensors', 'Complete maker kit including ultrasonic sensor, servo motors, jumper wires, and breadboard. Great for IoT lab work.', 'new', 'Engineering Block 3', 500.00, TRUE, '/images/arduino.png'),
(4, 3, 4, 'Yonex Carbonex 8000 Badminton Racket', 'Strung at 24 lbs tension with grip tape. Comes with protective thermal bag.', 'good', 'Engineering Block 3', 100.00, TRUE, '/images/racket.png'),
(5, 2, 3, 'Digital Multimeter with Continuity Buzzer', 'Measures AC/DC voltage, current, resistance and diodes. Includes red/black test probe cables.', 'good', 'Hostel Block A', 150.00, TRUE, '/images/multimeter.png');

-- --------------------------------------------------------------------
-- 4. Insert Demo Borrow Requests (Demonstrating Workflow Transitions)
-- --------------------------------------------------------------------
INSERT INTO borrow_requests (id, item_id, borrower_id, start_date, end_date, message, status, owner_response_note) VALUES
-- Completed borrow cycle: returned and reviewed
(1, 1, 3, '2026-09-01', '2026-09-10', 'Need DSA book for revision before mid-sem tests.', 'returned', 'Returned on time and in great condition. Thank you!'),
-- Active approved booking: item reserved
(2, 2, 3, '2026-10-20', '2026-10-28', 'Need scientific calculator for Engineering Mathematics II exam.', 'approved', 'Approved! You can pick it up from Hostel Block A room 204.'),
-- Pending incoming request: waiting for owner response
(3, 3, 2, '2026-10-25', '2026-10-30', 'Working on embedded systems term project, need Arduino kit for 5 days.', 'pending', NULL);

-- --------------------------------------------------------------------
-- 5. Insert Completed Review (Demonstrating Rating System)
-- --------------------------------------------------------------------
INSERT INTO reviews (id, request_id, reviewer_id, reviewee_id, rating, comment) VALUES
(1, 1, 3, 2, 5, 'Rahul was very helpful and responsive! The textbook was in clean condition.');

-- --------------------------------------------------------------------
-- 6. Insert Demo Report (Demonstrating Admin Moderation Queue)
-- --------------------------------------------------------------------
INSERT INTO reports (id, reporter_id, reported_user_id, reported_item_id, reason, details, status, admin_notes) VALUES
(1, 2, 4, NULL, 'Unresponsive / Rule Violation', 'User did not return borrowed toolkit on the agreed date and was unreachable.', 'pending', NULL);
