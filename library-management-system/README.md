# Libra — Library Management System

A beginner-friendly Library Management System built with **HTML5, CSS3, Vanilla JavaScript, and LocalStorage**. No framework or backend is required.

## 1. Run the project

1. Extract `library-management-system.zip`.
2. Open the extracted folder in Visual Studio Code.
3. Open `index.html` in your browser, or use the VS Code **Live Server** extension.
4. Sign in using one of the demo accounts below.

## 2. Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator / Librarian | `admin@library.com` | Any password |
| Student | `student@library.com` | Any password |

This is a classroom demonstration. The password is not verified and LocalStorage authentication is **not secure**. Do not use it for real private data.

## 3. Included features

- Dashboard with book, student, availability, borrowing, and overdue statistics
- Books: create, read, update, delete, search, and availability filter
- Students: create, read, update, delete, and search
- Categories: create, edit, delete, and book counts
- Borrowing: create a loan, select only books with available copies, set due date
- Returns: process returns, restore available copies, calculate overdue days
- Reports: popular books, active readers, transaction history, print report
- Responsive sidebar and mobile layout
- Form validation, confirmation dialogs, and toast messages
- Demo data is created only on the first run; data remains in LocalStorage

## 4. Project structure

```text
library-management-system/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── storage.js
│   └── app.js
├── images/
│   └── book-covers/
└── README.md
```

## 5. Important business rules

- A book cannot be borrowed when its available quantity is zero.
- Borrowing decreases the available quantity by one.
- Returning a book increases the available quantity by one.
- A transaction cannot be returned twice.
- Duplicate ISBNs, student IDs, emails, and category names are rejected.
- A category with assigned books cannot be deleted.
- A book or student with an active loan cannot be deleted.
- Overdue status is calculated from the due date.

## 6. Reset demo data

To reset the app, open the browser developer tools (usually F12), choose **Console**, and run:

```js
localStorage.clear();
location.reload();
```

This clears all Libra data in that browser for this project.

## 7. Learning notes

- `js/storage.js` contains the LocalStorage functions and initial demo data.
- `js/app.js` contains page navigation, rendering, forms, validation, borrowing, returning, and reports.
- `css/style.css` contains the layout, colors, responsive rules, tables, forms, and modals.

The project is intentionally kept framework-free so first-year students can study the DOM, arrays, objects, events, functions, and LocalStorage.
