# CareConnect Architecture

## System Overview

CareConnect is a three-tier web application connecting elderly people with local volunteers.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  (HTML/CSS/JavaScript + TailwindCSS + Socket.IO Client)     │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTP/REST & WebSocket
                              │
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Flask)                        │
│  ├── Authentication (JWT)                                   │
│  ├── User Management                                        │
│  ├── Service Requests (with AI Matching)                   │
│  ├── Payments & Tips                                        │
│  └── Real-time Updates (Socket.IO)                         │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    PostgreSQL           Redis Cache          Claude API
    (Database)         (Sessions/Cache)      (AI Reports)
```

## Component Architecture

### 1. Frontend (Public Web App)

**Location**: `frontend/public/`

**Technology**: HTML5 + CSS3 (TailwindCSS) + Vanilla JavaScript + Socket.IO Client

**Components**:
- `index.html` - Main page with role-based dashboards
- `js/app.js` - Client-side application logic
- Authentication management
- Real-time updates via WebSocket

**Features**:
- Responsive design (mobile/tablet/desktop)
- Three separate dashboards (family, volunteer, elderly)
- Real-time notifications
- Location tracking integration

### 2. Backend API (Flask)

**Location**: `backend/`

**Structure**:

```
app/
├── __init__.py              # Flask app factory, SocketIO setup
├── models/
│   └── __init__.py         # SQLAlchemy ORM models
├── routes/
│   ├── __init__.py
│   ├── auth.py            # Authentication endpoints
│   ├── users.py           # User CRUD
│   ├── requests.py        # Service requests + matching
│   ├── payments.py        # Payment processing
│   └── notifications.py   # Real-time notifications
├── services/
│   └── __init__.py        # Business logic
│       - AIMatchingService
│       - ReportGenerationService
│       - AuthService
├── config.py              # Environment config
└── run.py                 # Entry point with SocketIO
```

### 3. Database Layer

**Technology**: PostgreSQL 12+

**Schema**:

```sql
users (base table)
  ├── id (UUID)
  ├── email (unique)
  ├── password_hash
  ├── role (enum: elderly, volunteer, family)
  ├── verified (bool)
  └── timestamps

elderly_profiles
  ├── user_id (FK)
  ├── address, coordinates
  ├── health_conditions (JSON)
  ├── emergency_contact
  └── mobility_level

volunteer_profiles
  ├── user_id (FK)
  ├── skills (JSON array)
  ├── ratings (float)
  ├── completed_tasks (int)
  └── verification status

family_profiles
  ├── user_id (FK)
  ├── elderly_id (FK)
  └── relationship

service_requests
  ├── family_id, elderly_id, volunteer_id (FKs)
  ├── service_type
  ├── status
  ├── preferred_date
  └── timestamps

service_completions
  ├── request_id (FK)
  ├── volunteer_notes
  ├── ai_report
  ├── family_rating
  └── tip_amount

payments
  ├── payer_id (FK)
  ├── amount
  ├── payment_type
  ├── stripe_id
  └── status

notifications
  ├── user_id (FK)
  ├── type
  ├── content
  ├── read (bool)
  └── data (JSON)
```

### 4. External Services

#### Claude API (Anthropic)
- **Purpose**: Generate warm, family-friendly care reports
- **Integration**: `ReportGenerationService`
- **Input**: Volunteer notes + service details
- **Output**: Narrative report in Vietnamese

#### Stripe API (Payment Processing)
- **Purpose**: Process family payments
- **Integration**: `PaymentService` (partially implemented)
- **Features**: Tips, subscriptions, service charges

#### Redis (Session Cache)
- **Purpose**: Session storage, real-time data caching
- **Configuration**: Optional but recommended for production

## Data Flow

### Service Request Workflow

```
1. Family creates request
   └─> POST /api/requests
       {elderly_id, service_type, description, preferred_date}

2. AI Matching Service triggered
   └─> Scores all nearby volunteers based on:
       • Distance (30 points)
       • Skills match (30 points)
       • Rating (20 points)
       • Availability (20 points)

3. Best volunteer assigned
   └─> ServiceRequest.status = "assigned"
   └─> Notification sent to volunteer (SocketIO)

4. Volunteer accepts/rejects
   └─> PUT /api/requests/{id}/accept
   └─> ServiceRequest.status = "in_progress"

5. Volunteer completes service
   └─> POST /api/requests/{id}/complete
   └─> {volunteer_notes}

6. AI generates report
   └─> Claude API process notes
   └─> ServiceCompletion record created
   └─> Family notified with report

7. Family rates and tips
   └─> POST /api/requests/{id}/rate
   └─> {rating, feedback, tip_amount}
   └─> Volunteer rating updated

8. Payment processed
   └─> Stripe or internal payment
   └─> Tip transfers to volunteer
```

## API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/auth/register | - | Create account |
| POST | /api/auth/login | - | Get JWT token |
| GET | /api/users/{id} | ✓ | Get user profile |
| PUT | /api/users/{id} | ✓ | Update profile |
| POST | /api/requests | ✓ | Create service request |
| GET | /api/requests/{id} | ✓ | Get request details |
| POST | /api/requests/{id}/accept | ✓ | Volunteer accepts |
| POST | /api/requests/{id}/complete | ✓ | Mark completed |
| POST | /api/requests/{id}/rate | ✓ | Rate service |
| POST | /api/payments | ✓ | Create payment |
| POST | /api/payments/{id}/tip | ✓ | Add tip |
| GET | /api/notifications | ✓ | Get notifications |

## Real-time Communication

### Socket.IO Events

**Client → Server**:
- `volunteer:location_update` - Send location coordinates
- `user:join_room` - Join room for real-time updates

**Server → Client**:
- `volunteer:location_updated` - Broadcast location to watchers
- `request:status_updated` - Broadcast request status change
- `notification:new` - Send new notification

## Security Implementation

### Authentication (JWT)
- Header: `Authorization: Bearer <token>`
- Payload: `{user_id, role, exp, iat}`
- Algorithm: HS256
- Expiration: 30 days

### Password Security
- Hash: bcrypt
- Salt rounds: 12

### Data Protection
- CORS enabled (configurable)
- SQL injection prevention (SQLAlchemy ORM)
- HTTPS ready (Railway/Docker)
- Environment variables for secrets

### Role-Based Access Control

```
Elderly:
  - View own support history
  - Cannot create requests

Volunteer:
  - View assigned requests
  - Update service status
  - View ratings

Family:
  - Create requests
  - View all requests & reports
  - Rate and tip
```

## Performance Considerations

### Database Optimization
- Indexed on: email, status, user_id
- Connection pooling via SQLAlchemy
- Query optimization for location searches

### API Optimization
- JWT reduces database hits (stateless)
- SocketIO eliminates polling
- Pagination on list endpoints (limit 20)
- Lazy loading for related data

### Caching Strategy
- User profiles (Redis)
- Available volunteers (in-memory)
- AI reports (database)

### Scalability
- Horizontal scaling ready (stateless sessions)
- Database replication support
- Load balancing compatible
- Async task processing ready

## Deployment Architecture

### Development
```
Local Machine
├── PostgreSQL (Docker)
├── Redis (Docker)
├── Flask Backend (port 5000)
└── Static Frontend (port 8000)
```

### Production (Railway/Docker)
```
Cloud Container
├── App Container (Gunicorn + Flask)
├── PostgreSQL Database
├── Redis Cache
└── CDN for static files
```

## Error Handling

### HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Auth required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource missing
- `500 Server Error` - Internal error

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional details if applicable"
}
```

## Monitoring & Logging

### Logs to Track
- Authentication attempts
- API response times
- Database query performance
- Payment transactions
- Error rates

### Metrics
- API calls per minute
- Average response time
- Database connection pool usage
- Active users
- Success/failure rates

## Testing Strategy

### Unit Tests
- Service functions
- Database models
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- Complete user workflows
- Payment processing
- Real-time updates

## Future Enhancements

1. **Mobile Apps** (React Native)
2. **Video Consultation** (WebRTC)
3. **Advanced Analytics** (Dashboard)
4. **SMS/Email Notifications**
5. **Multi-language Support**
6. **Machine Learning** (Better matching)
7. **Insurance Integration**
8. **Emergency Response** (SOS button)

---

**Architecture Version**: 1.0
**Last Updated**: 2024
