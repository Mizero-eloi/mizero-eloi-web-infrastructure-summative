# Deployment Guide

This document provides step-by-step instructions for deploying the Developer Job Search application to the provided web servers and configuring the load balancer.

## Prerequisites

- SSH access to Web01, Web02, and Lb01
- Node.js (v14+) installed on Web01 and Web02
- Nginx installed on Lb01 (and optionally on Web01/Web02)
- Git installed on all servers
- API credentials (Adzuna App ID and App Key)

## Part 1: Deploying to Web Servers (Web01 and Web02)

### Step 1: Connect to Web Server

```bash
ssh user@web01_ip_address
```

### Step 2: Clone the Repository

```bash
cd /var/www
sudo git clone <repository-url> developer-job-search
cd developer-job-search
```

### Step 3: Install Dependencies

```bash
npm install --production
```

### Step 4: Configure Environment Variables

```bash
nano .env
```

Add the following (replace with your actual credentials):

```env
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
PORT=3000
NODE_ENV=production
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 5: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 6: Start the Application

```bash
# Start the application
pm2 start server.js --name job-search

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command
```

### Step 7: Verify the Application is Running

```bash
# Check status
pm2 status

# Check logs
pm2 logs job-search

# Test the application
curl http://localhost:3000/health
```

You should see:
```json
{"status":"ok","timestamp":"..."}
```

### Step 8: Configure Nginx (Optional but Recommended)

```bash
# Copy the configuration file
sudo cp nginx-web.conf /etc/nginx/sites-available/job-search

# Edit if needed
sudo nano /etc/nginx/sites-available/job-search

# Enable the site
sudo ln -s /etc/nginx/sites-available/job-search /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 9: Configure Firewall

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
sudo ufw reload
```

### Step 10: Repeat for Web02

Repeat Steps 1-9 on Web02.

## Part 2: Configuring the Load Balancer (Lb01)

### Step 1: Connect to Load Balancer

```bash
ssh user@lb01_ip_address
```

### Step 2: Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### Step 3: Configure Load Balancer

```bash
# Copy the configuration file
sudo cp nginx-lb.conf /etc/nginx/sites-available/load-balancer

# Edit the configuration
sudo nano /etc/nginx/sites-available/load-balancer
```

**Important**: Replace `web01_ip_address` and `web02_ip_address` with the actual IP addresses of your web servers.

Example:
```nginx
upstream backend {
    server 192.168.1.10:3000;
    server 192.168.1.11:3000;
}
```

### Step 4: Enable the Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/load-balancer /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
```

If the test is successful, you should see:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 5: Start Nginx

```bash
# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Reload configuration
sudo systemctl reload nginx
```

### Step 6: Configure Firewall

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

## Part 3: Testing the Deployment

### Test Individual Web Servers

```bash
# Test Web01
curl http://web01_ip_address:3000/health

# Test Web02
curl http://web02_ip_address:3000/health
```

### Test Load Balancer

```bash
# Test load balancer
curl http://lb01_ip_address/health

# Test multiple requests to see load distribution
for i in {1..10}; do
    echo "Request $i:"
    curl -s http://lb01_ip_address/health
    sleep 1
done
```

### Test from Browser

1. Open a web browser
2. Navigate to `http://lb01_ip_address`
3. Perform a job search
4. Verify the application works correctly

### Monitor Server Logs

```bash
# On Web01 and Web02
pm2 logs job-search

# On Lb01
sudo tail -f /var/log/nginx/job-search-access.log
```

## Part 4: Verification Checklist

- [ ] Application runs on Web01
- [ ] Application runs on Web02
- [ ] Load balancer distributes traffic
- [ ] Health check endpoint works
- [ ] Job search functionality works
- [ ] Error handling works correctly
- [ ] Application is accessible via load balancer IP
- [ ] PM2 keeps application running after reboot
- [ ] Nginx configuration is correct
- [ ] Firewall rules are configured

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs job-search

# Restart application
pm2 restart job-search
```

### Nginx Configuration Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Connection Refused

- Verify the application is running: `pm2 status`
- Check firewall rules: `sudo ufw status`
- Verify port is correct in configuration files
- Check if another service is using port 3000: `sudo netstat -tulpn | grep 3000`

### Load Balancer Not Distributing Traffic

- Verify upstream servers are correct in nginx-lb.conf
- Check if both web servers are accessible from Lb01
- Review Nginx access logs for request distribution
- Test connectivity: `curl http://web01_ip:3000/health` from Lb01

## Maintenance

### Updating the Application

```bash
# On Web01 and Web02
cd /var/www/developer-job-search
git pull
npm install --production
pm2 restart job-search
```

### Viewing Logs

```bash
# Application logs
pm2 logs job-search

# Nginx access logs
sudo tail -f /var/log/nginx/job-search-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/job-search-error.log
```

### Restarting Services

```bash
# Restart application
pm2 restart job-search

# Restart Nginx
sudo systemctl restart nginx
```

## Security Notes

1. **API Keys**: Never commit `.env` files to version control
2. **Firewall**: Only open necessary ports (80, 443, 3000)
3. **SSH**: Use key-based authentication instead of passwords
4. **Updates**: Keep Node.js and Nginx updated
5. **HTTPS**: Consider setting up SSL/TLS certificates for production

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [Adzuna API Documentation](https://developer.adzuna.com/overview)

