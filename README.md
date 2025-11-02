# 🌤️ WeatherHub

ระบบแดชบอร์ดแสดงสภาพอากาศแบบ Real-time พร้อมฟีเจอร์ดูข้อมูลย้อนหลัง สรุปรายวัน และเปรียบเทียบระหว่างเมือง โดยใช้ข้อมูลจาก Open-Meteo API

## 🌟 ฟีเจอร์หลัก

### 📊 แดชบอร์ด

- เลือกเมืองและค้นหา
- แสดงข้อมูลล่าสุด (อุณหภูมิ, ความชื้น, ลม, ฝน, สภาพอากาศ)
- กราฟข้อมูลรายชั่วโมง/รายวัน
- Dark Mode รองรับทุกหน้า
- Responsive

### 📍 จัดการเมือง

- แผนที่เลือกพิกัด (Leaflet + OpenStreetMap)
- เพิ่ม/ลบเมืองที่ติดตาม
- Backfill ข้อมูลย้อนหลัง 3 วัน

### 🔄 เปรียบเทียบ

- เลือก 2 เมืองเพื่อเทียบ
- กราฟเปรียบเทียบอุณหภูมิและปริมาณฝน
- ดูข้อมูลย้อนหลัง 7 วัน

## 🛠️ เทคโนโลยีที่ใช้

### Frontend

- Vue 3 + Vite 
- Vue Router 
- Chart.js - สำหรับแสดงกราฟข้อมูล
- Leaflet - สำหรับระบบแผนที่
- TailwindCSS - UI Framework
- Axios + Cache - API Client with caching
- SweetAlert2 - สำหรับ UI Notifications
- Lucide Icons - สำหรับ UI Icons

### Backend

- Node.js + Express
- Prisma - Type-safe ORM
- PostgreSQL - Database
- JWT Authentication - สำหรับ Authentication
- Open-Meteo API - Free Weather API
- Node-Cron - สำหรับ Scheduled Tasks
- Moment-timezone - สำหรับจัดการ Timezone
- Dotenv - สำหรับจัดการ Environment Variables
- Nodemon - สำหรับ Development

## 📋 ความต้องการของระบบ

- Node.js
- PostgreSQL (หรือใช้ Docker)
- npm
- Git

## 📦 การติดตั้ง

### 1. Clone Repository

```bash
git clone https://github.com/nwpptrs/weather-hub
cd weather-hub
```

### 2. ติดตั้ง Dependencies

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd ../client
npm install
```

### 3. ตั้งค่าฐานข้อมูล PostgreSQL

#### ตัวเลือกที่ 1: ใช้ Docker (แนะนำ)

ถ้ามีไฟล์ `docker-compose.yml` อยู่แล้ว:

```bash
# รัน PostgreSQL ด้วย Docker
docker-compose up -d
```

#### ตัวเลือกที่ 2: ติดตั้ง PostgreSQL แบบปกติ

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**

```bash
brew install postgresql
brew services start postgresql
```

**Windows:**

- ดาวน์โหลดและติดตั้งจาก [postgresql.org](https://www.postgresql.org/download)

**สร้างฐานข้อมูล:**

```bash
# เข้าสู่ PostgreSQL
psql -U postgres

# สร้าง Database
CREATE DATABASE mydatabase;

# สร้าง User
CREATE USER myuser WITH PASSWORD 'mypassword';

# ให้สิทธิ์
GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;

# ออกจาก psql
\q
```

### 4. ตั้งค่า Environment Variables

#### Backend (.env)

สร้างไฟล์ `.env` ในโฟลเดอร์ `server/`:

```env
# Database Configuration
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydatabase"

# Authentication
JWT_SECRET="weather_hub_super_secret"
```

> **หมายเหตุ:**
>
> - ถ้าใช้ Docker ให้ปรับ `DATABASE_URL` ตามค่าใน `docker-compose.yml`

#### Frontend (.env)

สร้างไฟล์ `.env` ในโฟลเดอร์ `client/`:

```env
VITE_API_URL=http://localhost:3000
```

### 5. รัน Database Migration

```bash
cd server
npx prisma migrate dev
```

หรือ

```bash
npx prisma db push
```

## 🚀 การรันโปรเจกต์

### 1. รัน Backend

```bash
cd server
npm run dev
```

Backend จะทำงานที่ `http://localhost:3000`

### 2. รัน Frontend

เปิด Terminal:

```bash
cd client
npm run dev
```

Frontend จะทำงานที่ `http://localhost:5173`

## 🌦️ Weather Condition Codes

| Code | สภาพอากาศ          | คำอธิบาย                |
| ---- | ------------------ | ----------------------- |
| 0    | แจ่มใส             | ท้องฟ้าโปร่ง ไม่มีเมฆ   |
| 1    | แจ่มใสเป็นส่วนใหญ่ | มีเมฆน้อย (1-2 ส่วน)    |
| 2    | มีเมฆเป็นบางส่วน   | มีเมฆปานกลาง (3-5 ส่วน) |
| 3    | มีเมฆมาก           | มีเมฆมาก (6-8 ส่วน)     |
| 45   | หมอก               | ทัศนวิสัยต่ำกว่า 1 กม.  |
| 48   | หมอกน้ำแข็ง        | หมอกแข็งตัวเป็นน้ำแข็ง  |
| 51   | ฝนปรอยเบา          | ≤ 0.1 mm/hr             |
| 53   | ฝนปรอยปานกลาง      | 0.1-0.5 mm/hr           |
| 55   | ฝนปรอยหนัก         | > 0.5 mm/hr             |
| 61   | ฝนตกเบา            | ≤ 2.5 mm/hr             |
| 63   | ฝนตกปานกลาง        | 2.5-10 mm/hr            |
| 65   | ฝนตกหนัก           | > 10 mm/hr              |
| 95   | พายุฝนฟ้าคะนอง     | ฝนฟ้าคะนองรุนแรง        |

## ⚡ การทำงานของระบบ

### Cron Job และการอัพเดทข้อมูล

- รันทุก 1 ชั่วโมง (`0 * * * *`)
- ดึงข้อมูลจาก Open-Meteo API สำหรับทุกเมือง
- บันทึกข้อมูลรายชั่วโมงใน WeatherHourly
- คำนวณและบันทึกค่าสถิติรายวันใน WeatherDaily

### Cache System

- Frontend: Cache API responses 60 วินาที
- Auto-retry เมื่อ network error (สูงสุด 3 ครั้ง)

### Security

- JWT Authentication (หมดอายุใน 1 ชั่วโมง)
- Input Validation

### Error Handling

- API Timeout: 5 วินาที
- Network Retry: 3 ครั้ง (delay 500ms)
- Error Logging & Monitoring
- Graceful Degradation

## 🔑 ข้อมูล Login

- **Token Validity:** 1 ชั่วโมง
- **Auto Logout:** เมื่อ Token หมดอายุ

## 📡 API Endpoints

### Authentication

| Method | Endpoint          | Description |
| ------ | ----------------- | ----------- |
| `POST` | `/api/login` | Login       |

### Weather Data

| Method | Endpoint              | Description            | Query Params  |
| ------ | --------------------- | ---------------------- | ------------- |
| `GET`  | `/api/weather/latest` | ข้อมูลสภาพอากาศล่าสุด  | `location_id` |
| `GET`  | `/api/weather/hourly` | ข้อมูลรายชั่วโมง 7 วัน | `location_id` |
| `GET`  | `/api/weather/daily`  | ข้อมูลรายวัน 7 วัน     | `location_id` |
| `POST`   | `/api/weather/backfill` | ดึงข้อมูลย้อนหลัง  | `location_id` |

### Locations

| Method   | Endpoint                      | Description        | Query Params  |
| -------- | ----------------------------- | ------------------ | ------------- |
| `GET`    | `/api/locations`              | รายการเมืองทั้งหมด |
| `POST`   | `/api/location`              | เพิ่มเมืองใหม่     |
| `DELETE` | `/api/location/:id`          | ลบเมือง            |`location_id` |


## 🗺️ พิกัดเมืองในไทย

| เมือง     | Latitude | Longitude |
| --------- | -------- | --------- |
| กรุงเทพ   | 13.7563  | 100.5018  |
| เชียงใหม่ | 18.7883  | 98.9853   |
| ภูเก็ต    | 7.8804   | 98.3923   |
| ขอนแก่น   | 16.4322  | 102.8236  |

## 🔧 Database Schema

```prisma
model Location {
  id            Int             @id @default(autoincrement())
  name          String
  lat           Float
  lon           Float
  timezone      String
  weatherHourly WeatherHourly[]
  weatherDaily  WeatherDaily[]
}

model WeatherHourly {
  id          Int      @id @default(autoincrement())
  timestamp   DateTime
  temperature Float
  humidity    Float
  windspeed   Float?
  rain        Float?
  condition   Int?
  location_id Int
  location    Location @relation(fields: [location_id], references: [id])

  @@unique([location_id, timestamp])
}

model WeatherDaily {
  id          Int      @id @default(autoincrement())
  date        DateTime
  temp_max    Float
  temp_min    Float
  rain_sum    Float
  location_id Int
  location    Location @relation(fields: [location_id], references: [id])

  @@unique([location_id, date])
}
```
