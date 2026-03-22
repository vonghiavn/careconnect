# CareConnect - Kết nối thế hệ

> Mạng lưới hỗ trợ người cao tuổi được cấp năng lượng bởi AI
> "Kết nối thế hệ — Không ai bị bỏ lại một mình"

## 🎯 Tầm nhìn

CareConnect là nền tảng kết nối người cao tuổi cần hỗ trợ với những tình nguyện viên đầy nhiệt tình gần nhà — nhanh chóng, an toàn, và có AI đứng phía sau để đảm bảo mọi thứ hoạt động đúng.

## 📋 Tính năng chính

- **AI Matching thông minh**: Tìm kiếm tình nguyện viên phù hợp nhất trong vòng 60 giây dựa trên kỹ năng, lịch sử, và rating
- **Báo cáo AI**: Claude API chuyển ghi chú thô thành báo cáo ấm áp gửi gia đình
- **Realtime tracking**: SocketIO cập nhật trạng thái tức thì
- **Không cần smartphone**: Người cao tuổi chỉ nhận SMS và xác thực QR
- **Tips minh bạch**: 100% đến tay tình nguyện viên, platform không giữ lại

## 🏥 Các Loại Dịch Vụ

CareNet cung cấp **19 loại dịch vụ** đa dạng cho người cao tuổi với giá cả hợp lý:

### 💊 Sức Khỏe ($35-45)
- 🏥 **Khám bệnh viện** - $45: Đi kèm đến bệnh viện, phòng khám
- 💊 **Quản lý thuốc** - $35: Tổ chức, nhắc nhở, và hỗ trợ dùng thuốc an toàn
- 🧴 **Chăm sóc cá nhân** - $40: Hỗ trợ tắm rửa, mặc quần áo, vệ sinh cá nhân
- 🏃‍♂️ **Tập thể dục nhẹ** - $35: Bài tập nhẹ nhàng, hỗ trợ đi bộ, vận động

### 🏠 Nhà Ở ($20-35)
- 🍳 **Nấu ăn** - $35: Chuẩn bị bữa ăn dinh dưỡng, hỗ trợ ăn uống
- 🧹 **Dọn dẹp nhà cửa** - $30: Lau dọn, giặt ủi, tổ chức nhà cửa
- 👔 **Giặt ủi** - $30: Giặt, sấy, gấp đồ và ủi nhẹ
- 🌿 **Chăm sóc cây** - $20: Tưới cây, cắt tỉa cây cảnh trong nhà

### 💬 Xã Hội ($25-30)
- 💬 **Thân mật & trò chuyện** - $25: Trò chuyện, lắng nghe, hỗ trợ tinh thần
- 🎭 **Hoạt động xã hội** - $30: Đi kèm đến sự kiện cộng đồng, lớp học
- 📖 **Đọc sách & kể chuyện** - $25: Đọc sách, báo, chia sẻ câu chuyện
- 🧠 **Trò chơi trí tuệ** - $30: Chơi ô chữ, bài, trò chơi kích thích trí não

### 🛒 Việc Vặt ($25-30)
- 🛒 **Mua sắm & việc vặt** - $30: Đi chợ, mua thuốc, gửi thư
- 🚗 **Vận chuyển** - $25: Đưa đón an toàn đến các địa điểm
- 📬 **Quản lý thư & hóa đơn** - $25: Sắp xếp thư, thanh toán hóa đơn

### 🔧 Bảo Trì & Công Nghệ ($30-40)
- 📱 **Hỗ trợ công nghệ** - $30: Giúp dùng điện thoại, máy tính, thiết bị thông minh
- 🔧 **Sửa chữa nhỏ** - $40: Thay bóng đèn, sửa chữa cơ bản
- 🌱 **Làm vườn & sân** - $35: Chăm sóc vườn, cắt cỏ nhẹ
- 🐕 **Chăm sóc thú cưng** - $25: Cho ăn, dắt đi dạo, chăm sóc thú cưng

### 💰 Giá Cả & Thanh Toán
- **Giá trung bình**: $31/dịch vụ
- **Khoảng giá**: $20 - $45
- **Thanh toán**: Tips 100% đến tay tình nguyện viên
- **Thời gian**: 1-2 giờ/dịch vụ (tùy loại)

## 🏗️ Cấu trúc dự án

```
CareNet/
├── backend/              # Flask API
│   ├── app/
│   │   ├── models/      # Database models
│   │   ├── routes/      # API endpoints
│   │   └── services/    # Business logic
│   ├── config.py        # Configuration
│   └── run.py           # Entry point
├── frontend/            # Web application
│   ├── public/
│   │   ├── index.html
│   │   └── js/
│   └── src/
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
└── docker-compose.yml   # Database setup
```

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Python 3.8+
- PostgreSQL 12+
- Node.js (optional, cho development)
- Docker & Docker Compose (recommended)

### 1. Clone repository
```bash
git clone <repository-url>
cd CareNet
```

### 2. Setup Database
```bash
# Với Docker (recommended)
docker-compose up -d

# Hoặc tạo PostgreSQL thủ công
# Tạo database: createdb carenet_dev
# Tạo user: createuser carenet_user
```

### 3. Setup Backend
```bash
cd backend

# Cài đặt dependencies
pip install -r ../requirements.txt

# Setup environment
cp ../.env .env
# Edit .env và cập nhật DATABASE_URL, JWT_SECRET_KEY, ANTHROPIC_API_KEY, etc.

# Chạy server
python run.py
```

Server sẽ chạy tại: http://localhost:5000

### 4. Setup Frontend
```bash
# Mở file frontend/public/index.html trong trình duyệt
# hoặc chạy Python server nhẹ:
cd frontend/public
python -m http.server 8000
```

Truy cập: http://localhost:8000

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất

### Users
- `GET /api/users/<user_id>` - Lấy thông tin người dùng
- `PUT /api/users/<user_id>` - Cập nhật thông tin
- `GET /api/users/volunteers/nearby` - Lấy tình nguyện viên gần đó
- `GET /api/users/search` - Tìm kiếm người dùng

### Service Requests
- `POST /api/requests` - Tạo yêu cầu hỗ trợ
- `GET /api/requests/<request_id>` - Lấy chi tiết yêu cầu
- `POST /api/requests/<request_id>/accept` - Tình nguyện viên nhận việc
- `POST /api/requests/<request_id>/complete` - Hoàn thành yêu cầu
- `POST /api/requests/<request_id>/rate` - Gia đình đánh giá dịch vụ

### Payments
- `POST /api/payments` - Tạo thanh toán
- `GET /api/payments/<payment_id>` - Lấy chi tiết thanh toán
- `POST /api/payments/<request_id>/tip` - Thêm tip

### Notifications
- `GET /api/notifications` - Lấy thông báo
- `POST /api/notifications/<notification_id>/mark-read` - Đánh dấu đã đọc

## 🔧 Biến môi trường

Tạo file `.env` trong thư mục gốc:

```env
# Flask
FLASK_ENV=development
FLASK_DEBUG=True

# Database
DATABASE_URL=postgresql://carenet_user:carenet_password@localhost:5432/carenet_dev

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production

# Claude API (Anthropic)
ANTHROPIC_API_KEY=your-claude-api-key-here

# Stripe (Payment)
STRIPE_SECRET_KEY=your-stripe-secret-key-here
STRIPE_PUBLIC_KEY=your-stripe-public-key-here

# Redis
REDIS_URL=redis://localhost:6379/0
```

## 🏃 Chạy ứng dụng

### Development
```bash
# Terminal 1: Backend
cd backend
python run.py

# Terminal 2: Frontend
cd frontend/public
python -m http.server 8000
```

### Production
```bash
# Build with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📱 Các loại người dùng

### 1. **Người cao tuổi**
- Nhận yêu cầu từ gia đình
- Không cần cài app - chỉ cần SMS + QR để xác thực
- Nhận hỗ trợ thực tế từ tình nguyện viên

### 2. **Tình nguyện viên**
- Nhận thông báo về công việc gần nhà
- Chấp nhận/từ chối yêu cầu
- Nhận tips và đánh giá từ gia đình

### 3. **Gia đình (Con cái)**
- Đặt yêu cầu hỗ trợ cho bố/mẹ
- Theo dõi trạng thái realtime
- Đọc báo cáo AI và đánh giá dịch vụ
- Trả phí và gửi tips

## 💰 Mô hình doanh thu

- **Pay-per-service**: Platform giữ 15% hoa hồng
- **Subscription gia đình**: 99–299k/tháng
- **Caregiver chuyên nghiệp**: 15–20% hoa hồng
- **Tips**: 100% đến tay tình nguyện viên

## 🛠️ Tech Stack

- **Backend**: Flask + Python
- **Database**: PostgreSQL
- **Realtime**: Socket.IO
- **AI**: Claude API (Anthropic)
- **Frontend**: HTML/CSS/JavaScript + TailwindCSS
- **Deployment**: Railway / Docker

## 📖 Hướng dẫn phát triển

### Thêm feature mới
1. Cập nhật database models trong `backend/app/models/`
2. Thêm API endpoints trong `backend/app/routes/`
3. Thêm business logic trong `backend/app/services/`
4. Cập nhật frontend UI

### Database migrations
```bash
# Tạo migration mới
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## 🧪 Testing

```bash
cd backend
pytest tests/
```

## 🐛 Troubleshooting

### Connection refused
- Kiểm tra PostgreSQL có chạy: `psql -U carenet_user -d carenet_dev`
- Kiểm tra Flask server: `curl http://localhost:5000`

### CORS errors
- Kiểm tra CORS_ALLOWED_ORIGINS trong config

### SocketIO connection failed
- Kiểm tra Socket.IO port: http://localhost:5000/socket.io

## 📝 License

MIT License - Xem [LICENSE](LICENSE) để biết chi tiết

## 👥 Contributors

CareConnect được phát triển với ❤️ cho cộng đồng

## 📞 Liên hệ

Email: support@careconnect.vn
Website: https://careconnect.vn (coming soon)
