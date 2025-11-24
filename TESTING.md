# Testing Guide

This guide will help you thoroughly test the Developer Job Search application before submission.

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [API Configuration Testing](#api-configuration-testing)
3. [Local Application Testing](#local-application-testing)
4. [Functionality Testing](#functionality-testing)
5. [Error Handling Testing](#error-handling-testing)
6. [UI/UX Testing](#uiux-testing)
7. [Deployment Testing](#deployment-testing)
8. [Load Balancer Testing](#load-balancer-testing)
9. [Performance Testing](#performance-testing)

## Pre-Testing Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit with your API credentials
nano .env  # or use your preferred editor
```

Add your Adzuna API credentials:
```env
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
PORT=3000
NODE_ENV=development
```

## API Configuration Testing

### Test 1: Verify API Keys

```bash
node test-api.js
```

**Expected Result:**
- ✅ API keys found in .env file
- ✅ API connection successful
- ✅ Jobs found: [number]

**If it fails:**
- Check that `.env` file exists and has correct credentials
- Verify API keys are valid at https://developer.adzuna.com/
- Check internet connection

### Test 2: Manual API Test

```bash
# Test the health endpoint
curl http://localhost:3000/health
```

**Expected Result:**
```json
{"status":"ok","timestamp":"2024-03-15T10:30:00.000Z"}
```

## Local Application Testing

### Step 1: Start the Server

```bash
npm start
```

You should see:
```
Server running on port 3000
Environment: development
```

### Step 2: Open in Browser

Navigate to: `http://localhost:3000`

**Check:**
- ✅ Page loads without errors
- ✅ No console errors in browser developer tools
- ✅ UI displays correctly
- ✅ Search form is visible

## Functionality Testing

### Test 1: Basic Job Search

1. Enter "developer" in the job search field
2. Select a location (e.g., "United States")
3. Click "Search Jobs"

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Results display after a few seconds
- ✅ Job cards show: title, company, location, salary, description
- ✅ Results count is displayed
- ✅ Pagination appears if more than 20 results

### Test 2: Search with Filters

1. Search for "software engineer"
2. Set minimum salary: 50000
3. Set maximum salary: 150000
4. Click "Search Jobs"

**Expected Results:**
- ✅ Only jobs within salary range are shown
- ✅ Salary information is displayed on job cards
- ✅ Results are relevant to the search query

### Test 3: Sorting Functionality

1. Perform a search
2. Change "Sort By" dropdown to different options:
   - Relevance
   - Date Posted
   - Salary (High to Low)
   - Salary (Low to High)

**Expected Results:**
- ✅ Results reorder based on selected sort option
- ✅ Date sorting shows newest first
- ✅ Salary sorting works correctly (high to low / low to high)

### Test 4: Filter Results (In-Result Search)

1. Perform a search to get results
2. Type in the "Filter Results" field (e.g., "Python", "remote", "senior")

**Expected Results:**
- ✅ Results filter in real-time as you type
- ✅ Only matching jobs remain visible
- ✅ Results count updates
- ✅ Filter works across title, company, location, description

### Test 5: Pagination

1. Perform a search that returns many results
2. Click "Next" button
3. Click page numbers
4. Click "Previous" button

**Expected Results:**
- ✅ Pagination controls work correctly
- ✅ Different pages show different results
- ✅ Current page is highlighted
- ✅ Previous/Next buttons enable/disable appropriately

### Test 6: Location Selection

1. Test different locations:
   - United States
   - United Kingdom
   - Canada
   - Australia
   - Germany
   - France

**Expected Results:**
- ✅ Each location returns relevant jobs
- ✅ Job locations match selected country
- ✅ Results are appropriate for the region

### Test 7: Multiple Searches

1. Search for "python developer"
2. Then search for "javascript engineer"
3. Then search for "data scientist"

**Expected Results:**
- ✅ Each search returns different results
- ✅ Previous results are cleared
- ✅ New results load correctly
- ✅ No errors occur

## Error Handling Testing

### Test 1: Empty Search Query

1. Leave search field empty
2. Click "Search Jobs"

**Expected Result:**
- ✅ Error message appears: "Please enter a job title or keywords to search."
- ✅ No API call is made

### Test 2: Network Failure Simulation

**Option A: Disconnect Internet**
1. Disconnect from internet
2. Perform a search

**Expected Result:**
- ✅ Error message appears about connection issues
- ✅ User-friendly message: "Unable to connect to the server..."

**Option B: Stop the Server**
1. Stop the server (Ctrl+C)
2. Try to perform a search in the browser

**Expected Result:**
- ✅ Error message about connection failure
- ✅ Clear error indication

### Test 3: Invalid API Keys

1. Temporarily change API keys in `.env` to invalid values
2. Restart server
3. Perform a search

**Expected Result:**
- ✅ Error message about authentication
- ✅ Message: "Invalid API credentials. Please contact the administrator."
- ✅ No crash, graceful error handling

### Test 4: Rate Limiting (if applicable)

1. Make many rapid searches (if you hit rate limit)

**Expected Result:**
- ✅ Error message about rate limiting
- ✅ Message: "Too many requests. Please try again later."
- ✅ Application doesn't crash

## UI/UX Testing

### Test 1: Responsive Design

1. Open browser developer tools (F12)
2. Test different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

**Expected Results:**
- ✅ Layout adapts to screen size
- ✅ Text is readable
- ✅ Buttons are clickable
- ✅ Forms are usable
- ✅ No horizontal scrolling

### Test 2: Loading States

1. Perform a search
2. Observe the loading indicator

**Expected Results:**
- ✅ Loading spinner appears
- ✅ "Searching for jobs..." message shows
- ✅ Search button is disabled during loading
- ✅ Loading disappears when results arrive

### Test 3: Error Message Display

1. Trigger an error (empty search, network issue, etc.)

**Expected Results:**
- ✅ Error message is clearly visible
- ✅ Error message is styled (red background)
- ✅ Error message is dismissible (when new search is made)
- ✅ Error doesn't break the UI

### Test 4: Job Card Interaction

1. Hover over job cards
2. Click "View Job →" links

**Expected Results:**
- ✅ Cards have hover effect (slight lift/shadow)
- ✅ Links open in new tab
- ✅ Links go to correct job posting URL

### Test 5: Keyboard Navigation

1. Use Tab key to navigate through form
2. Press Enter in search field

**Expected Results:**
- ✅ Tab navigation works logically
- ✅ Enter key triggers search
- ✅ All interactive elements are accessible

## Deployment Testing

### Test 1: Server Health Check

On each web server (Web01 and Web02):

```bash
# Check if application is running
pm2 status

# Check health endpoint
curl http://localhost:3000/health

# Check application logs
pm2 logs job-search
```

**Expected Results:**
- ✅ PM2 shows application as "online"
- ✅ Health endpoint returns OK status
- ✅ No errors in logs

### Test 2: Direct Server Access

From your local machine or another server:

```bash
# Test Web01
curl http://web01_ip_address:3000/health

# Test Web02
curl http://web02_ip_address:3000/health
```

**Expected Results:**
- ✅ Both servers respond correctly
- ✅ Health checks return OK
- ✅ No connection refused errors

### Test 3: Nginx Configuration (if used)

On web servers:

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Test through Nginx
curl http://localhost/health
```

**Expected Results:**
- ✅ Nginx configuration is valid
- ✅ Nginx is running
- ✅ Requests are proxied correctly

## Load Balancer Testing

### Test 1: Load Balancer Health

```bash
# Test load balancer health endpoint
curl http://lb01_ip_address/health

# Test main application through load balancer
curl http://lb01_ip_address/
```

**Expected Results:**
- ✅ Load balancer responds
- ✅ Application is accessible
- ✅ No 502/503 errors

### Test 2: Traffic Distribution

```bash
# Make multiple requests and check which server handles them
for i in {1..20}; do
    echo "Request $i:"
    curl -s http://lb01_ip_address/health
    sleep 0.5
done
```

**Expected Results:**
- ✅ Requests are distributed between servers
- ✅ Both servers receive traffic
- ✅ No single server is overloaded

### Test 3: Failover Testing

1. Stop the application on Web01:
```bash
pm2 stop job-search
```

2. Make requests through load balancer

**Expected Results:**
- ✅ Load balancer routes to Web02
- ✅ Application continues to work
- ✅ No errors for end users

3. Restart Web01:
```bash
pm2 start job-search
```

**Expected Results:**
- ✅ Load balancer resumes sending traffic to Web01
- ✅ Both servers are active again

### Test 4: End-to-End Through Load Balancer

1. Open browser
2. Navigate to load balancer IP
3. Perform complete workflow:
   - Search for jobs
   - Filter results
   - Sort results
   - Navigate pages
   - Click job links

**Expected Results:**
- ✅ All functionality works through load balancer
- ✅ No errors occur
- ✅ Performance is acceptable
- ✅ User experience is seamless

## Performance Testing

### Test 1: Response Time

```bash
# Time a search request
time curl -s "http://localhost:3000/api/jobs/search?q=developer&location=us&page=1" > /dev/null
```

**Expected Results:**
- ✅ Response time under 3 seconds
- ✅ Acceptable for user experience

### Test 2: Concurrent Requests

```bash
# Simulate multiple users
for i in {1..10}; do
    curl -s "http://localhost:3000/api/jobs/search?q=developer&location=us" > /dev/null &
done
wait
```

**Expected Results:**
- ✅ All requests complete successfully
- ✅ No crashes or errors
- ✅ Server handles concurrent load

## Browser Compatibility Testing

Test in multiple browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Check:**
- ✅ All features work
- ✅ UI displays correctly
- ✅ No JavaScript errors
- ✅ Responsive design works

## Final Checklist Before Submission

- [ ] API configuration test passes
- [ ] All functionality tests pass
- [ ] Error handling works correctly
- [ ] UI is responsive and works on mobile
- [ ] Application runs on Web01
- [ ] Application runs on Web02
- [ ] Load balancer distributes traffic
- [ ] Load balancer handles failover
- [ ] All features work through load balancer
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] README is complete
- [ ] API credentials documented (for submission)
- [ ] Demo video script prepared

## Quick Test Script

Run this comprehensive test:

```bash
#!/bin/bash
echo "=== Testing Developer Job Search Application ==="
echo ""

echo "1. Testing API configuration..."
node test-api.js
echo ""

echo "2. Testing server health..."
curl -s http://localhost:3000/health | jq .
echo ""

echo "3. Testing job search endpoint..."
curl -s "http://localhost:3000/api/jobs/search?q=developer&location=us&page=1" | jq '.success, .jobs | length'
echo ""

echo "=== Tests Complete ==="
```

Save as `quick-test.sh`, make executable (`chmod +x quick-test.sh`), and run it.

## Troubleshooting Common Issues

### Issue: "Cannot find module 'dotenv'"
**Solution:** Run `npm install`

### Issue: "API connection failed"
**Solution:** 
- Check `.env` file exists and has correct credentials
- Verify internet connection
- Test API keys at Adzuna developer portal

### Issue: "Port 3000 already in use"
**Solution:**
- Change PORT in `.env` file
- Or stop the process using port 3000: `lsof -ti:3000 | xargs kill`

### Issue: "Application not accessible through load balancer"
**Solution:**
- Check firewall rules on all servers
- Verify Nginx configuration: `sudo nginx -t`
- Check upstream servers are accessible from load balancer
- Review Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

---

**Remember**: Test thoroughly before submission to ensure everything works as expected!

