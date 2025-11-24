/**
 * Express Server for Developer Job Search Application
 * Handles API requests and serves static files
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Configuration - Adzuna
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Search jobs endpoint
 * GET /api/jobs/search?q=query&location=location&page=page
 */
app.get('/api/jobs/search', async (req, res) => {
  try {
    const { q = 'developer', location = 'us', page = 1, salary_min, salary_max, sort_by } = req.query;

    // Validate API keys
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      return res.status(500).json({
        error: 'API configuration error',
        message: 'Server API keys are not configured. Please contact the administrator.'
      });
    }

    // Build query parameters
    // Note: 'where' and 'page' are in the URL path, not in params
    const params = {
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_APP_KEY,
      results_per_page: 20,
      what: q
    };

    // Add optional parameters
    // Note: Adzuna API expects salary in the currency of the location
    // For US, salary is typically in USD and should be reasonable (e.g., 30000+)
    if (salary_min) {
      const minSalary = parseInt(salary_min);
      if (minSalary > 0) {
        params.salary_min = minSalary;
      }
    }
    if (salary_max) {
      const maxSalary = parseInt(salary_max);
      if (maxSalary > 0 && (!params.salary_min || maxSalary >= params.salary_min)) {
        params.salary_max = maxSalary;
      }
    }
    if (sort_by) params.sort_by = sort_by;

    // Make API request to Adzuna API
    // Note: Adzuna API format is: /v1/api/jobs/{country}/search/{page}
    // 'where' and 'page' are in the URL path, not in query params
    const apiUrl = `${ADZUNA_BASE_URL}/${location}/search/${page}`;
    
    const response = await axios.get(apiUrl, {
      params,
      timeout: 10000 // 10 second timeout
    });

    // Transform and return data
    const jobs = response.data.results || [];
    const totalResults = response.data.count || 0;

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company?.display_name || 'Not specified',
        location: job.location?.display_name || 'Not specified',
        description: job.description || '',
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_is_predicted: job.salary_is_predicted,
        created: job.created,
        redirect_url: job.redirect_url,
        category: job.category?.label || 'Not specified'
      })),
      totalResults,
      page: parseInt(page),
      totalPages: Math.ceil(totalResults / 20)
    });

  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    }

    // Handle different error types
    if (error.response) {
      // API returned an error response
      const status = error.response.status;
      const errorData = error.response.data;
      
      // Get detailed error message
      let message = 'API request failed';
      if (errorData?.error) {
        message = errorData.error;
      } else if (errorData?.message) {
        message = errorData.message;
      } else if (typeof errorData === 'string') {
        message = errorData;
      }

      if (status === 401 || status === 403) {
        return res.status(500).json({
          error: 'Authentication error',
          message: 'Invalid API credentials. Please contact the administrator.'
        });
      } else if (status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.'
        });
      } else if (status === 400) {
        return res.status(400).json({
          error: 'Bad request',
          message: message || 'Invalid request parameters. Please check your search criteria (salary ranges, location, etc.).',
          details: errorData
        });
      } else {
        return res.status(status).json({
          error: 'API error',
          message: message,
          details: errorData
        });
      }
    } else if (error.request) {
      // Request was made but no response received
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Unable to connect to the job search service. Please check your internet connection and try again.'
      });
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      return res.status(504).json({
        error: 'Request timeout',
        message: 'The request took too long to complete. Please try again.'
      });
    } else {
      // Other errors
      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.'
      });
    }
  }
});

/**
 * Get job statistics endpoint
 * GET /api/jobs/stats?location=location
 */
app.get('/api/jobs/stats', async (req, res) => {
  try {
    const { location = 'us', q = 'developer' } = req.query;

    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      return res.status(500).json({
        error: 'API configuration error',
        message: 'Server API keys are not configured.'
      });
    }

    const params = {
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_APP_KEY,
      what: q,
      where: location
    };

    const response = await axios.get(`${ADZUNA_BASE_URL}/${location}/histogram`, {
      params,
      timeout: 10000
    });

    res.json({
      success: true,
      stats: response.data
    });

  } catch (error) {
    console.error('Error fetching stats:', error.message);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'Unable to retrieve job statistics at this time.'
    });
  }
});

/**
 * Serve main page
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

