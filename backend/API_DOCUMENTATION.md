# RideHub API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new user (driver or passenger).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "contact": "9876543210",
  "age": "30",
  "role": "DRIVER",
  "gender": "male",
  "carModel": "Toyota Innova",
  "licensePlate": "MH-01-AB-1234",
  "capacity": "4"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "9876543210",
    "age": "30",
    "role": "DRIVER",
    "gender": "male",
    "carModel": "Toyota Innova",
    "licensePlate": "MH-01-AB-1234",
    "capacity": "4"
  }
}
```

---

### Login

**POST** `/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "DRIVER"
  }
}
```

---

## Ride Endpoints

### Create Ride (Driver Only)

**POST** `/rides`

Create a new ride offering.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "source": "Mumbai, Maharashtra",
  "destination": "Pune, Maharashtra",
  "rideDate": "2025-12-01",
  "rideTime": "10:00",
  "totalSeats": 3,
  "farePerKm": 15.0,
  "distance": 148.5
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "source": "Mumbai, Maharashtra",
  "destination": "Pune, Maharashtra",
  "rideDate": "2025-12-01",
  "rideTime": "10:00",
  "totalSeats": 3,
  "availableSeats": 3,
  "farePerKm": 15.0,
  "distance": 148.5,
  "status": "AVAILABLE",
  "driver": "John Doe",
  "driverGender": "male",
  "car": "Toyota Innova",
  "licensePlate": "MH-01-AB-1234",
  "driverId": 1
}
```

---

### Get My Rides (Driver Only)

**GET** `/rides/my-rides`

Get all rides created by the authenticated driver.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "source": "Mumbai, Maharashtra",
    "destination": "Pune, Maharashtra",
    "rideDate": "2025-12-01",
    "rideTime": "10:00",
    "totalSeats": 3,
    "availableSeats": 2,
    "farePerKm": 15.0,
    "distance": 148.5,
    "status": "AVAILABLE",
    "driver": "John Doe",
    "driverGender": "male",
    "car": "Toyota Innova",
    "licensePlate": "MH-01-AB-1234"
  }
]
```

---

### Search Rides (Public)

**GET** `/rides/search`

Search for available rides by source, destination, and date.

**Query Parameters:**
- `source` (required): Source city
- `destination` (required): Destination city
- `date` (required): Ride date (YYYY-MM-DD)

**Example:**
```
GET /rides/search?source=Mumbai,%20Maharashtra&destination=Pune,%20Maharashtra&date=2025-12-01
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "source": "Mumbai, Maharashtra",
    "destination": "Pune, Maharashtra",
    "rideDate": "2025-12-01",
    "rideTime": "10:00",
    "availableSeats": 2,
    "farePerKm": 15.0,
    "driver": "John Doe",
    "driverGender": "male",
    "car": "Toyota Innova"
  }
]
```

---

### Get All Available Rides (Public)

**GET** `/rides/available`

Get all available rides from today onwards.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "source": "Mumbai, Maharashtra",
    "destination": "Pune, Maharashtra",
    "rideDate": "2025-12-01",
    "availableSeats": 2,
    "farePerKm": 15.0
  }
]
```

---

### Get Rides by Driver Gender (Public)

**GET** `/rides/available/gender/{gender}`

Filter rides by driver's gender.

**Path Parameters:**
- `gender`: "male" or "female"

**Example:**
```
GET /rides/available/gender/female
```

**Response:** `200 OK`
```json
[
  {
    "id": 2,
    "driver": "Jane Smith",
    "driverGender": "female",
    "source": "Delhi, Delhi",
    "destination": "Jaipur, Rajasthan",
    "availableSeats": 3
  }
]
```

---

### Get Ride by ID

**GET** `/rides/{id}`

Get detailed information about a specific ride.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "source": "Mumbai, Maharashtra",
  "destination": "Pune, Maharashtra",
  "rideDate": "2025-12-01",
  "rideTime": "10:00",
  "totalSeats": 3,
  "availableSeats": 2,
  "farePerKm": 15.0,
  "distance": 148.5,
  "status": "AVAILABLE",
  "driver": "John Doe",
  "car": "Toyota Innova"
}
```

---

## Booking Endpoints

### Create Booking (Passenger Only)

**POST** `/bookings`

Book seats on a ride.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rideId": 1,
  "seatsBooked": 2,
  "pickupLocation": "Andheri, Mumbai",
  "dropLocation": "Kothrud, Pune",
  "segmentDistance": 145.0,
  "totalFare": 2175.0
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "rideId": 1,
  "source": "Mumbai, Maharashtra",
  "destination": "Pune, Maharashtra",
  "rideDate": "2025-12-01",
  "rideTime": "10:00",
  "seatsBooked": 2,
  "pickupLocation": "Andheri, Mumbai",
  "dropLocation": "Kothrud, Pune",
  "segmentDistance": 145.0,
  "totalFare": 2175.0,
  "status": "CONFIRMED",
  "bookedAt": "2025-11-21 14:30:00",
  "driver": "John Doe",
  "driverContact": "9876543210",
  "car": "Toyota Innova",
  "passengerName": "Alice Johnson",
  "passengerContact": "9998887776"
}
```

**Note:** This triggers email notifications to both passenger and driver.

---

### Get My Bookings (Passenger Only)

**GET** `/bookings/my-bookings`

Get all bookings made by the authenticated passenger.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "rideId": 1,
    "source": "Mumbai, Maharashtra",
    "destination": "Pune, Maharashtra",
    "rideDate": "2025-12-01",
    "seatsBooked": 2,
    "totalFare": 2175.0,
    "status": "CONFIRMED",
    "driver": "John Doe"
  }
]
```

---

### Get Ride Bookings (Driver Only)

**GET** `/bookings/ride/{rideId}`

Get all bookings for a specific ride (only accessible by the ride's driver).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "seatsBooked": 2,
    "pickupLocation": "Andheri, Mumbai",
    "dropLocation": "Kothrud, Pune",
    "totalFare": 2175.0,
    "passengerName": "Alice Johnson",
    "passengerContact": "9998887776"
  }
]
```

---

### Get Booking by ID

**GET** `/bookings/{id}`

Get detailed information about a specific booking.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "rideId": 1,
  "source": "Mumbai, Maharashtra",
  "destination": "Pune, Maharashtra",
  "rideDate": "2025-12-01",
  "rideTime": "10:00",
  "seatsBooked": 2,
  "pickupLocation": "Andheri, Mumbai",
  "dropLocation": "Kothrud, Pune",
  "totalFare": 2175.0,
  "status": "CONFIRMED",
  "driver": "John Doe",
  "passengerName": "Alice Johnson"
}
```

---

### Cancel Booking (Passenger Only)

**DELETE** `/bookings/{id}`

Cancel a booking and restore seats to the ride.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

## Error Responses

### 400 Bad Request
```json
{
  "timestamp": "2025-11-21T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed"
}
```

### 401 Unauthorized
```json
{
  "timestamp": "2025-11-21T14:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required"
}
```

### 404 Not Found
```json
{
  "timestamp": "2025-11-21T14:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Ride not found"
}
```

---

## Data Models

### User
```typescript
{
  id: number;
  name: string;
  email: string;
  contact: string;
  age: string;
  role: "DRIVER" | "PASSENGER";
  gender?: string;
  carModel?: string;
  licensePlate?: string;
  capacity?: string;
}
```

### Ride
```typescript
{
  id: number;
  source: string;
  destination: string;
  rideDate: string;
  rideTime: string;
  totalSeats: number;
  availableSeats: number;
  farePerKm: number;
  distance?: number;
  status: "AVAILABLE" | "FULL" | "COMPLETED" | "CANCELLED";
  driver: string;
  driverGender?: string;
  car?: string;
  licensePlate?: string;
}
```

### Booking
```typescript
{
  id: number;
  rideId: number;
  seatsBooked: number;
  pickupLocation: string;
  dropLocation: string;
  segmentDistance?: number;
  totalFare: number;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  bookedAt: string;
  passengerName: string;
  passengerContact: string;
}
```

---

## Testing with cURL

### Register and Login
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"123456","contact":"9876543210","age":"30","role":"DRIVER","gender":"male","carModel":"Innova","licensePlate":"MH-01-AB-1234","capacity":"4"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"123456"}'
```

### Create and Search Rides
```bash
# Create Ride
curl -X POST http://localhost:8080/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"source":"Mumbai, Maharashtra","destination":"Pune, Maharashtra","rideDate":"2025-12-01","rideTime":"10:00","totalSeats":3,"farePerKm":15.0,"distance":148.5}'

# Search Rides
curl "http://localhost:8080/api/rides/search?source=Mumbai,%20Maharashtra&destination=Pune,%20Maharashtra&date=2025-12-01"
```

### Book a Ride
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASSENGER_TOKEN" \
  -d '{"rideId":1,"seatsBooked":2,"pickupLocation":"Mumbai","dropLocation":"Pune","totalFare":2175.0}'
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding:
- Rate limiting per IP
- Rate limiting per user
- Request throttling

## Pagination

For large result sets, consider adding pagination parameters:
- `page` (default: 0)
- `size` (default: 20)
- `sort` (optional)

This will be implemented in future versions.
