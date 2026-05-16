# Smart_Restaurants_Recommendation
A smart AI-based restaurant recommendation platform that personalizes dining suggestions using NLP, recommendation algorithms, weather and location context.

🍽️ Smart Restaurant Recommendation System
📌 Overview

Smart Restaurant Recommendation System là một hệ thống gợi ý quán ăn thông minh dựa trên vị trí, thời tiết và sở thích người dùng.
Hệ thống kết hợp backend AI, dữ liệu bản đồ và frontend trực quan để đưa ra các đề xuất nhà hàng phù hợp theo ngữ cảnh thời gian thực.

🚀 Features
🔍 Gợi ý nhà hàng theo vị trí người dùng
🌤️ Tích hợp thời tiết để điều chỉnh đề xuất (nắng, mưa, nóng…)
🤖 AI ranking (Gemini API / NLP scoring)
❤️ Lưu danh sách yêu thích (Favorites)
👤 Hệ thống user authentication (JWT)
📊 Lưu lịch sử gợi ý
🗺️ Tích hợp dữ liệu bản đồ (OpenStreetMap / Google Maps API)
🏗️ System Architecture

Hệ thống được thiết kế theo mô hình Client–Server + Service-based architecture

Frontend (React/Vite)
        ↓
Backend (FastAPI / Flask)
        ↓
Services Layer
 ├── AI Service (Gemini)
 ├── Weather Service
 ├── Location Service
 ├── Recommendation Engine
        ↓
External APIs
 ├── OpenWeather API
 ├── Google Maps / OpenStreetMap
 ├── Gemini API
📁 Project Structure
smart-restaurant-recommendation/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── api/
│   ├── services/
│   ├── recommendation/
│   ├── models/
│   ├── repositories/
│   ├── auth/
│   ├── ai/
│   ├── weather/
│   ├── location/
│   ├── utils/
│   └── tests/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── App.jsx
│
├── docs/
│   ├── architecture/
│   ├── diagrams/
│   └── report/
│
├── docker-compose.yml
├── README.md
└── LICENSE
⚙️ Installation & Setup
1. Clone repository
git clone https://github.com/<username>/smart-restaurant-recommendation.git
cd smart-restaurant-recommendation
2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows

pip install -r requirements.txt
Run backend
uvicorn app:app --reload

Backend chạy tại:

http://localhost:8000
3. Frontend setup
cd frontend
npm install
npm run dev

Frontend chạy tại:

http://localhost:5173
🔐 Environment Variables

Tạo file .env trong thư mục backend/:

GEMINI_API_KEY=your_api_key
OPENWEATHER_API_KEY=your_api_key
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key

👉 Hoặc tham khảo file .env.example

🤖 AI Recommendation Logic

Hệ thống gợi ý dựa trên:

📍 Khoảng cách địa lý
🌤️ Điều kiện thời tiết
🍜 Loại món ăn & sở thích người dùng
⭐ Scoring engine (ranking module)
🧠 AI re-ranking bằng Gemini API
🧪 Testing

Backend có các test modules:

Auth tests
NLP tests
Scoring tests
Recommendation tests

Chạy test:

pytest
🐳 Docker (Optional)
docker-compose up --build
📌 Tech Stack

Backend

FastAPI / Flask
Python
JWT Authentication
Gemini API

Frontend

React (Vite)
Axios
Tailwind CSS (optional)

External APIs

OpenWeather API
OpenStreetMap / Google Maps API
Gemini AI
👨‍💻 Contributors
M1–M6 Team Members
Course Project: Smart Systems / AI Applications
📄 License

This project is for educational purposes.

⭐ Notes
Do not commit .env file
Use .env.example for configuration template
Ensure all API keys are valid before running project