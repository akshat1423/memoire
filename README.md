# Memoire - Your Personal Memory Keeper

Memoire is a beautiful and intuitive React Native application that helps you capture, organize, and relive your precious memories in a unique and engaging way. 

With its vintage UI and rich feature set, Memoire transforms the way you preserve your life's special moments.

## 🌟 Key Features

### 📸 Multi-Format Memory Creation
- Capture memories in various formats: photos, text notes, and voice recordings
- Create beautiful memory collages with multiple media items
- Add rich text formatting to your memory descriptions
- Tag locations to organize your memories

### 🎵 Musical Memories
- Add your favorite songs to your memories to create an emotional connection
- Background music playback while viewing memories
- Create playlists for different memory categories
- Sync with your music library for easy song selection

### 🔍 Smart Search & Discovery
- Advanced search capabilities across all memory content
- Search by date, location, tags, or even emotions
- Filter memories by multiple criteria simultaneously

### 📅 Calendar View
- Browse memories through an intuitive calendar interface
- Jump to specific dates to relive past moments

### 🔒 Account Security
- End-to-end encryption for your memories
- Biometric authentication (fingerprint/face ID)
- Secure cloud backup with zero-knowledge encryption
- Privacy controls for shared memories

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/akshat1423/memoire.git
cd memoire
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Setup Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_STORAGE_API_KEY=
MEM0_API_KEY=
```

4. Start the development server:
```bash
npx expo start
```

# Backend of Memoire

## Features

- 🔍 Advanced memory search with filters
- 📊 Memory analytics and visualization
- 🔄 Batch operations for efficient management
- 📝 Memory history tracking
- 👥 User and agent management
- 🔒 Secure API key management


## Installation

1. Clone the repository:
```bash
git clone https://github.com/akshat1423/memoire.git
cd memoire
cd server
```

2. Create and activate a virtual environment:
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Access the application at `http://localhost:5000`


## API Documentation

### Authentication

All API requests require a valid Mem0 API key. The key can be provided in multiple ways:

1. **Authorization Header** (Recommended for external use):
   ```
   Authorization: Bearer your_api_key_here
   ```

2. **Request Body/Query Parameters** (Alternative for external use):
   - For POST requests: Include `api_key` in the JSON body
   - For GET requests: Include `api_key` as a query parameter

3. **Session** (For web interface):
   - Login through the web interface to store the key in session
   - Use session cookies for subsequent requests

### Endpoints

#### 1. Validate API Key
```http
POST /api/validate
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
    "api_key": "your_api_key_here"
}
```

**Response:**
```json
{
    "valid": true
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your_api_key_here"}'
```

#### 2. Search Memories
```http
POST /api/search
```

**Headers:**
```
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
    "query": "search query",
    "filters": {
        "user_id": "user123",
        "agent_id": "agent456",
        "categories": ["category1", "category2"],
        "created_at": {
            "gte": "2024-01-01",
            "lte": "2024-12-31"
        },
        "metadata": {
            "key": "value"
        }
    }
}
```

**Response:**
```json
{
    "results": [
        {
            "id": "memory_id",
            "text": "memory content",
            "created_at": "timestamp",
            "metadata": {
                "key": "value"
            }
        }
    ],
    "total": 1
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/search \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find memories about travel",
    "filters": {
      "user_id": "user123",
      "categories": ["travel", "vacation"]
    }
  }'
```

#### 3. Get Memories
```http
GET /api/memories
```

**Headers:**
```
Authorization: Bearer your_api_key_here
```

**Query Parameters:**
- `user_id`: Filter by user ID
- `agent_id`: Filter by agent ID
- `categories`: Comma-separated list of categories
- `start_date`: Start date for filtering
- `end_date`: End date for filtering
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 10)

**Response:**
```json
{
    "results": [
        {
            "id": "memory_id",
            "text": "memory content",
            "created_at": "timestamp",
            "metadata": {
                "key": "value"
            }
        }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer your_api_key_here" \
  "http://localhost:5000/api/memories?user_id=user123&page=1&page_size=10"
```

#### 4. Get Memory Details
```http
GET /memory/<memory_id>
```

**Headers:**
```
Authorization: Bearer your_api_key_here
```

**Response:**
```json
{
    "id": "memory_id",
    "text": "memory content",
    "created_at": "timestamp",
    "metadata": {
        "key": "value"
    },
    "history": [
        {
            "version": 1,
            "text": "original content",
            "updated_at": "timestamp"
        }
    ]
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer your_api_key_here" \
  http://localhost:5000/memory/memory_id
```

#### 5. Update Memory
```http
POST /update-memory/<memory_id>
```

**Headers:**
```
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
    "new_text": "updated memory content"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Memory updated successfully"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/update-memory/memory_id \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"new_text": "updated memory content"}'
```

#### 6. Batch Operations
```http
POST /batch-operations
```

**Headers:**
```
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
    "operation": "update",
    "memories": [
        {
            "memory_id": "id1",
            "text": "new content 1"
        },
        {
            "memory_id": "id2",
            "text": "new content 2"
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "updated_count": 2
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/batch-operations \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "update",
    "memories": [
      {"memory_id": "id1", "text": "new content 1"},
      {"memory_id": "id2", "text": "new content 2"}
    ]
  }'
```

## Example Usage

### Python Example
```python
import requests

# Set up API key and headers
API_KEY = "your_api_key_here"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Validate API key
response = requests.post(
    'http://localhost:5000/api/validate',
    json={'api_key': API_KEY}
)
if not response.json()['valid']:
    raise Exception("Invalid API key")

# Search memories
response = requests.post(
    'http://localhost:5000/api/search',
    headers=headers,
    json={
        'query': 'Find memories about travel',
        'filters': {
            'user_id': 'user123',
            'categories': ['travel', 'vacation']
        }
    }
)

# Get memories
response = requests.get(
    'http://localhost:5000/api/memories',
    headers=headers,
    params={
        'user_id': 'user123',
        'page': 1,
        'page_size': 10
    }
)

# Get memory details
response = requests.get(
    'http://localhost:5000/memory/memory_id',
    headers=headers
)

# Update memory
response = requests.post(
    'http://localhost:5000/update-memory/memory_id',
    headers=headers,
    json={'new_text': 'updated memory content'}
)

# Batch operations
response = requests.post(
    'http://localhost:5000/batch-operations',
    headers=headers,
    json={
        'operation': 'update',
        'memories': [
            {'memory_id': 'id1', 'text': 'Updated content 1'},
            {'memory_id': 'id2', 'text': 'Updated content 2'}
        ]
    }
)
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid input parameters
- `401 Unauthorized`: Missing or invalid API key
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

Example error response:
```json
{
    "error": "Error message description"
}
```