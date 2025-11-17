# Admin Panel Project Design Specification

## 1. Overview
Web application: Admin Panel (Next.js 16 + Supabase)
Admin usage: Single-user (คุณใช้งานคนเดียว)
Backend: Supabase (Auth + Database)
Frontend: Next.js 16 (App Router) with modern UI layout.

---

## 2. System Modules
### 2.1 Core Modules
- **Dashboard** – สรุปข้อมูลรวม
- **Projects** – จัดการโปรเจกต์ (list / add / edit / delete)
- **Docs** – จัดการคู่มือเอกสารแบบแบ่งหมวดหมู่เหมือน OpenAI Docs
- **Certifications** – เก็บข้อมูลใบเซิร์ตทั้งหมด
- **Profile** – ข้อมูลโปรไฟล์ของคุณ
- **Login** – ระบบเข้าสู่ระบบผ่าน Supabase Auth


---

## 3. Docs Architecture (สำคัญมาก)
แยกเป็น 2 ตารางเพื่อรองรับระบบ Docs หน้าบ้านในอนาคต แบบ OpenAI Docs:

### 3.1 `doc_sections`
> หัวข้อใหญ่สำหรับ Sidebar

Fields:
- id (PK)
- title
- slug
- sort_order
- created_at
- updated_at

### 3.2 `doc_pages`
> หน้าเนื้อหาจริงของ Docs

Fields:
- id
- section_id (FK → doc_sections.id)
- title
- slug
- summary
- content (markdown)
- tags (optional)
- status (draft / published)
- sort_order
- created_at
- updated_at

---

## 4. Other Database Tables
### 4.1 `projects`
Fields:
- id
- title
- slug
- description
- status (draft / in_progress / done / archived)
- tech_stack (json/text)
- github_url
- demo_url
- started_at
- finished_at
- created_at
- updated_at

### 4.2 `certifications`
Fields:
- id
- name
- issuer
- issue_date
- expire_date
- certificate_id
- certificate_url
- status (active / expired / planned)
- created_at
- updated_at

### 4.3 `users`
> Supabase Auth ใช้ผู้ใช้หนึ่งเดียว (คุณ)

เพิ่ม table เสริมเพื่อเก็บข้อมูลโปรไฟล์:

### 4.4 `profiles`
Fields:
- id (pk, same uuid from Supabase auth)
- full_name
- title
- bio
- avatar_url
- github
- linkedin
- created_at
- updated_at

---

## 5. Page Structure (Next.js 16 App Router)
```
/app
  /login
    page.tsx

  /(admin)
    layout.tsx        # sidebar + topbar layout
    /dashboard
      page.tsx
    /projects
      page.tsx
      /new
      /[id]
    /docs
      page.tsx
      /sections
      /pages
    /certifications
      page.tsx
    /profile
      page.tsx
```

---

## 6. Authentication Flow
- User → `/login`
- Supabase email/password (เฉพาะคุณ)
- สำเร็จ → redirect `/admin/dashboard`
- ทุกหน้าใน `/admin` จะมี middleware เช็ค session

---

## 7. Future Public Docs (หน้าบ้าน)
ระบบหลังบ้านรองรับหน้าบ้านแบบ OpenAI Docs ด้านล่าง:
```
/docs/[section]/[page]
```
Sidebar สร้างจาก `doc_sections` และ `doc_pages` ตามลำดับ

---

## 8. Next Steps
1. เตรียม Supabase project (✅ Done)
2. สร้าง database schema ตามนี้ (✅ Done)
3. เตรียม Next.js project
4. เชื่อม Supabase client ใน Next.js
5. เริ่มหน้าแรก: **/login** (Supabase Email/Password)
6. ทำ layout หลัก `(admin)`
7. ทำ Modules ทีละหน้า (Projects → Docs → Certs → Profile)

---

## 9. Implementation Notes
- Frontend: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Auth: Supabase Auth (email/password) สำหรับ admin คนเดียว
- Supabase client: ใช้ `@supabase/supabase-js` ฝั่ง client + server ได้
- Environment variables ที่ต้องมีใน Next.js:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Section นี้จะอัปเดตเพิ่มรายละเอียดโครงไฟล์และตัวอย่างโค้ดพื้นฐาน (เช่น supabase client, layout, auth guard) ระหว่างที่เราลงมือ implement โปรเจกต์ร่วมกัน

