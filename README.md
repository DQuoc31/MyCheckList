# CheckFlow - Monorepo Scheduling & Checklist System 🚀

Hệ thống quản lý **Lập lịch trình (Scheduler) & Checklist công việc đa cấp** được xây dựng theo kiến trúc **Monorepo** tiêu chuẩn với Front-end React (Vite) và Back-end Node.js Express kết nối cơ sở dữ liệu **MongoDB**.

---

## 🏗️ Kiến Trúc Monorepo (Project Structure)

Dự án sử dụng **npm workspaces** để quản lý ứng dụng và thư viện dùng chung:

```text
c:\Documents\MyCheckList\
├── package.json               # Cấu hình workspace gốc & scripts tổng
├── tsconfig.json              # Cấu hình TypeScript cơ sở
├── README.md                  # Hướng dẫn dự án
├── packages/
│   └── shared/                # Package @mychecklist/shared
│       ├── src/index.ts       # Shared TypeScript Types, Interfaces & DTOs
│       └── package.json
└── apps/
    ├── backend/               # Package @mychecklist/backend (Express REST API)
    │   ├── src/
    │   │   ├── config/db.ts   # Kết nối Mongoose MongoDB
    │   │   ├── models/        # Schemas: Task (Checklist) & ScheduleEvent
    │   │   ├── routes/        # Express API Routers
    │   │   └── server.ts      # Main Express Server
    │   ├── .env.example
    │   └── package.json
    └── frontend/              # Package @mychecklist/frontend (React + Vite)
        ├── src/
        │   ├── components/    # ChecklistView, CalendarView, AnalyticsView
        │   ├── index.css      # Glassmorphism Dark Theme Design System
        │   ├── App.tsx        # App layout
        │   └── services/api.ts# REST API Client
        ├── vite.config.ts
        └── package.json
```

---

## 🛠️ Yêu Cầu Tiền Trạm (Prerequisites)

- **Node.js**: phiên bản `>= 18.0.0`
- **npm**: phiên bản `>= 9.0.0`
- **MongoDB** (Tùy chọn):
  - Chạy local MongoDB tại `mongodb://localhost:27017/mychecklist`
  - HOẶC dùng **MongoDB Atlas (Cloud)**
  - *Lưu ý*: Nếu chưa bật MongoDB, backend tự động hoạt động ở chế độ **Fallback In-Memory** để thử nghiệm ngay.

---

## ⚡ Hướng Dẫn Khởi Chạy (Quick Start)

### 1. Cài đặt các gói phụ thuộc (Dependencies)
Mở terminal tại thư mục gốc của dự án (`c:\Documents\MyCheckList`) và chạy:

```bash
npm install
```

### 2. Khởi chạy toàn bộ ứng dụng (Dev Mode)
Chạy đồng thời cả **Frontend (Port 3000)** và **Backend (Port 5000)** bằng một lệnh duy nhất:

```bash
npm run dev
```

Sau đó mở trình duyệt truy cập:
👉 **Frontend App**: `http://localhost:3000`
👉 **Backend API**: `http://localhost:5000/api/health`

---

## 📜 Các Lệnh Command Chính (Scripts)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Khởi chạy đồng thời ứng dụng Frontend và Backend |
| `npm run dev:frontend` | Chỉ khởi chạy giao diện Frontend (Vite) tại cổng 3000 |
| `npm run dev:backend` | Chỉ khởi chạy máy chủ Backend (Express API) tại cổng 5000 |
| `npm run build` | Biên dịch TypeScript và build toàn bộ monorepo (shared, backend, frontend) |
| `npm run build:shared` | Biên dịch riêng package `@mychecklist/shared` |

---

## 🍃 Cấu Hình Cơ Sở Dữ Liệu MongoDB

Tạo file `.env` tại thư mục `apps/backend/.env` (có thể copy từ `apps/backend/.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mychecklist
```

Nếu dùng **MongoDB Atlas Cloud**, thay đổi chuỗi kết nối:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mychecklist?retryWrites=true&w=majority
```

---

## 📡 Các API Endpoints Chính

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | Lấy danh sách checklist tasks |
| `POST` | `/api/tasks` | Tạo task mới kèm sub-items |
| `PUT` | `/api/tasks/:id` | Cập nhật task |
| `PATCH` | `/api/tasks/:id/checklist/:subId/toggle` | Đánh dấu hoàn thành/chưa hoàn thành sub-task |
| `DELETE` | `/api/tasks/:id` | Xóa task |
| `GET` | `/api/schedule` | Lấy danh sách khung giờ lịch trình |
| `POST` | `/api/schedule` | Tạo mốc thời gian lịch trình mới |
| `GET` | `/api/analytics` | Lấy báo cáo thống kê chỉ số năng suất |

---

## ✨ Tính Năng Nổi Bật

- **Checklist Đa Cấp**: Quản lý sub-tasks với thanh tiến độ % tự động, tag màu sắc, độ ưu tiên (`URGENT`, `HIGH`, `MEDIUM`, `LOW`).
- **Lịch Trình Trực Quan (Scheduler)**: Phân bổ khung thời gian từ 08:00 đến 20:00 theo từng danh mục công việc.
- **Biểu Đồ Năng Suất**: Báo cáo tổng hợp số lượng task hoàn thành, tỷ lệ hoàn thành checklist.
- **Glassmorphism Theme**: Giao diện tối (Dark Mode) hiện đại, mượt mà và trực quan.
