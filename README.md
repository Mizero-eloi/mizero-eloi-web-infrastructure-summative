# Developer Job Search & Analytics

A modern web application that helps developers find job opportunities by integrating with the Adzuna Job Search API. The application provides real-time job listings with advanced filtering, sorting, and search capabilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [API Configuration](#api-configuration)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Load Balancer Configuration](#load-balancer-configuration)
- [API Documentation](#api-documentation)
- [Challenges and Solutions](#challenges-and-solutions)
- [Credits and Attribution](#credits-and-attribution)

## Overview

This application serves a practical purpose by helping software developers and job seekers find relevant job opportunities across multiple countries. It provides:

- Real-time job search from multiple locations
- Advanced filtering and sorting capabilities
- Salary range filtering
- In-result search functionality
- Responsive, modern user interface
- Comprehensive error handling

## Features

### Core Functionality
- **Job Search**: Search for developer jobs by keywords, location, and salary range
- **Filtering**: Filter results by text search within job listings
- **Sorting**: Sort jobs by relevance, date, or salary (ascending/descending)
- **Pagination**: Navigate through multiple pages of results
- **Error Handling**: Graceful error handling for API failures, network issues, and invalid inputs

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Real-time Feedback**: Loading states and error messages for better user experience
- **Accessibility**: Semantic HTML and keyboard navigation support

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **API Integration**: Axios for HTTP requests
- **Environment Management**: dotenv for secure configuration
- **Server**: Express static file serving

## Prerequisites

Before running this application, ensure you have:

- **Node.js** (v14 or higher) installed
- **npm** (v6 or higher) or **yarn** package manager
- **Adzuna API credentials** (App ID and App Key)
  - Sign up at: https://developer.adzuna.com/overview
  - Free tier available with generous rate limits

## Local Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mizero-eloi-web-infrastructure-summative
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- `express`: Web server framework
- `axios`: HTTP client for API requests
- `dotenv`: Environment variable management
- `cors`: Cross-origin resource sharing support

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API credentials:

```env
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
PORT=3000
NODE_ENV=development
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

### 4. Start the Application

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### 5. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## API Configuration

### Adzuna API Setup

1. Visit [Adzuna Developer Portal](https://developer.adzuna.com/overview)
2. Sign up for a free account
3. Create a new application to get your App ID and App Key
4. Add these credentials to your `.env` file

### API Rate Limits

The Adzuna API has rate limits based on your subscription tier:
- **Free Tier**: 1,000 requests per day
- The application includes error handling for rate limit exceeded scenarios

### API Endpoints Used

- **Job Search**: `GET /v1/api/jobs/{country}/search/{page}`
- **Job Statistics**: `GET /v1/api/jobs/{country}/histogram`

## Running the Application

### Development Mode

```bash
npm start
```

### Production Mode

```bash
NODE_ENV=production npm start
```

The application will:
- Serve static files from the `public` directory
- Handle API requests through the Express server
- Proxy requests to Adzuna API with proper error handling

## Deployment

This section describes how to deploy the application to the provided web servers (Web01 and Web02) and configure the load balancer (Lb01).

### Pre-Deployment Checklist

1. Ensure Node.js is installed on both web servers
2. Have SSH access to Web01, Web02, and Lb01
3. API credentials are ready for configuration
4. Application code is ready in a Git repository

### Deployment Steps

#### Step 1: Prepare the Application

1. **Clone the repository on each web server**:

```bash
# On Web01 and Web02
cd /var/www
git clone <repository-url> developer-job-search
cd developer-job-search
```

2. **Install dependencies**:

```bash
npm install --production
```

3. **Configure environment variables**:

```bash
# Create .env file
nano .env
```

Add the following content:
```env
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
PORT=3000
NODE_ENV=production
```

#### Step 2: Set Up Process Manager (PM2)

Install PM2 to keep the application running:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start server.js --name job-search

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
```

#### Step 3: Configure Nginx (Optional but Recommended)

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/job-search
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/job-search /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 4: Verify Deployment

Test that the application is running:

```bash
# Check if the application is running
curl http://localhost:3000/health

# Check PM2 status
pm2 status
```

Repeat these steps on **Web02**.

## Load Balancer Configuration

This section explains how to configure the load balancer (Lb01) to distribute traffic between Web01 and Web02.

### Using Nginx as Load Balancer

#### Step 1: Install Nginx on Lb01

```bash
sudo apt update
sudo apt install nginx -y
```

#### Step 2: Configure Load Balancer

Edit the Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/load-balancer
```

Add the following configuration:

```nginx
upstream backend {
    # Load balancing method: round-robin (default)
    server web01_ip_address:3000;
    server web02_ip_address:3000;
    
    # Alternative: least connections
    # least_conn;
    
    # Alternative: IP hash for session persistence
    # ip_hash;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Note**: Replace `web01_ip_address` and `web02_ip_address` with the actual IP addresses or hostnames of Web01 and Web02.

#### Step 3: Enable and Test Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/load-balancer /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 4: Configure Firewall (if applicable)

Ensure ports 80 and 443 are open:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### Load Balancing Methods

The configuration above uses **round-robin** (default), which distributes requests evenly. Other options:

1. **Least Connections**: Directs traffic to the server with the fewest active connections
   ```nginx
   least_conn;
   ```

2. **IP Hash**: Ensures the same client always goes to the same server (session persistence)
   ```nginx
   ip_hash;
   ```

3. **Weighted Round-Robin**: Assign different weights to servers
   ```nginx
   server web01_ip:3000 weight=3;
   server web02_ip:3000 weight=1;
   ```

### Testing Load Balancer

1. **Test from command line**:
```bash
# Make multiple requests and check which server responds
for i in {1..10}; do curl -s http://load_balancer_ip/health | grep -o "Web[0-9]*" || echo "Request $i"; done
```

2. **Test from browser**:
   - Access the application via the load balancer IP
   - Perform multiple searches
   - Verify that requests are being distributed

3. **Check server logs**:
```bash
# On Web01 and Web02
pm2 logs job-search
```

### Health Checks and Failover

The load balancer configuration includes:
- Automatic failover if a server becomes unavailable
- Health check endpoint for monitoring
- Error handling for 5xx status codes

## API Documentation

### Application Endpoints

#### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

#### GET /api/jobs/search
Search for jobs.

**Query Parameters**:
- `q` (string, required): Job title or keywords
- `location` (string, optional): Country code (default: "us")
- `page` (number, optional): Page number (default: 1)
- `salary_min` (number, optional): Minimum salary
- `salary_max` (number, optional): Maximum salary
- `sort_by` (string, optional): Sort method (relevance, date, salary_desc, salary_asc)

**Example Request**:
```
GET /api/jobs/search?q=software+engineer&location=us&page=1&salary_min=50000
```

**Success Response** (200):
```json
{
  "success": true,
  "jobs": [
    {
      "id": "123456",
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "description": "Job description...",
      "salary_min": 120000,
      "salary_max": 180000,
      "salary_is_predicted": false,
      "created": "2024-03-15T08:00:00Z",
      "redirect_url": "https://...",
      "category": "IT Jobs"
    }
  ],
  "totalResults": 150,
  "page": 1,
  "totalPages": 8
}
```

**Error Responses**:
- `400`: Bad request
- `429`: Rate limit exceeded
- `500`: Server error
- `503`: Service unavailable

#### GET /api/jobs/stats
Get job statistics (optional endpoint).

**Query Parameters**:
- `location` (string, optional): Country code
- `q` (string, optional): Search query

## Challenges and Solutions

### Challenge 1: API Rate Limiting
**Problem**: The Adzuna API has rate limits that could cause the application to fail if exceeded.

**Solution**: 
- Implemented comprehensive error handling for 429 (Too Many Requests) responses
- Added user-friendly error messages explaining rate limit issues
- Implemented request timeout handling to prevent hanging requests

### Challenge 2: CORS Issues
**Problem**: Browser security policies prevented direct API calls from the frontend.

**Solution**:
- Created an Express backend to proxy API requests
- This also provides security by keeping API keys server-side
- Added CORS middleware for proper cross-origin handling

### Challenge 3: Error Handling for Network Failures
**Problem**: Users need clear feedback when network issues occur.

**Solution**:
- Implemented try-catch blocks around all API calls
- Created specific error messages for different failure scenarios:
  - Network connectivity issues
  - API authentication errors
  - Rate limiting
  - Timeout errors
- Added loading states and error display components

### Challenge 4: Responsive Design
**Problem**: The application needed to work on various screen sizes.

**Solution**:
- Used CSS Grid and Flexbox for responsive layouts
- Implemented mobile-first design principles
- Added media queries for tablet and mobile breakpoints
- Tested on multiple device sizes

### Challenge 5: Load Balancer Configuration
**Problem**: Ensuring traffic is properly distributed and servers handle failures gracefully.

**Solution**:
- Configured Nginx with upstream servers
- Implemented health checks and automatic failover
- Used round-robin distribution for even load
- Added proper proxy headers for client information

### Challenge 6: Environment Variable Security
**Problem**: API keys must not be exposed in the repository.

**Solution**:
- Used `.env` files for local development
- Added `.env` to `.gitignore`
- Created `.env.example` as a template
- Documented the need to configure environment variables on servers

## Credits and Attribution

### APIs Used

**Adzuna Job Search API**
- **Provider**: Adzuna
- **Documentation**: https://developer.adzuna.com/overview
- **Terms of Service**: https://developer.adzuna.com/terms
- **Description**: Provides real-time job listings from multiple job boards across various countries. The API offers comprehensive job data including titles, companies, locations, salaries, and descriptions.

### Libraries and Frameworks

- **Express.js**: Web application framework for Node.js
  - License: MIT
  - Website: https://expressjs.com/

- **Axios**: Promise-based HTTP client
  - License: MIT
  - Website: https://axios-http.com/

- **dotenv**: Environment variable loader
  - License: BSD-2-Clause
  - Website: https://github.com/motdotla/dotenv

- **CORS**: Express middleware for CORS
  - License: MIT
  - Website: https://github.com/expressjs/cors

### Fonts

- **Inter**: Open-source font family
  - License: SIL Open Font License
  - Source: Google Fonts (https://fonts.google.com/specimen/Inter)

### Design Inspiration

The UI design follows modern web design principles with a focus on:
- Clean, minimal aesthetics
- Accessibility and usability
- Responsive design patterns
- User-centered design approach

## License

This project is created for educational purposes as part of a web infrastructure assignment.

## Contact

For questions or issues, please refer to the repository's issue tracker or contact the development team.

---

**Note**: This application is designed for educational purposes and demonstrates best practices in web development, API integration, and server deployment.

