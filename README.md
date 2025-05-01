# Image Processing SaaS

An application for image processing, featuring user authentication, image uploads, resizing, and OCR text extraction.

## Features

- **User Authentication**: Register, login, and manage user sessions
- **Image Upload**: Upload JPEG and PNG images via web UI or API
- **Image Resizing**: Resize images by specifying width
- **OCR Text Extraction**: Extract text from images using Tesseract OCR
- **API Key Management**: Generate and manage API keys for programmatic access
- **Usage Dashboard**: Track usage of image processing operations

## Tech Stack

### Backend
- Python + FastAPI
- SQLAlchemy ORM
- Tesseract OCR via pytesseract
- JWT-based authentication
- Local filesystem or AWS S3 storage

### Frontend
- React
- React Router v6
- Mantine UI components
- Axios for API requests

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for local frontend development)
- Python 3.10+ (for local backend development)
- Tesseract OCR (for local backend development)

### Setup with Docker

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/image-processing-saas.git
   cd image-processing-saas
   ```

2. Create environment variables:
   ```
   cp backend/.env.sample backend/.env
   ```

3. Start the application using Docker Compose:
   ```
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:8000
   - Swagger Documentation: http://localhost:8000/docs

### Local Development

#### Backend

1. Install Python dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Run the backend server:
   ```
   uvicorn app.main:app --reload
   ```

#### Frontend

1. Install Node.js dependencies:
   ```
   cd frontend
   npm install
   ```

2. Run the frontend development server:
   ```
   npm start
   ```

## API Usage

### Authentication

```
POST /api/v1/auth/jwt/login
```

### Image Upload

```
POST /api/v1/images
```

### Image Resize

```
POST /api/v1/images/{image_id}/resize
```

### OCR Text Extraction

```
POST /api/v1/images/{image_id}/ocr
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
