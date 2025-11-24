# Complete Deployment Guide

This guide will help you deploy the Developer Job Search application to your servers and configure the load balancer.

## Your Server Information

Based on your server dashboard:
- **Web01**: `44.211.196.180` (ubuntu)
- **Web02**: `34.227.163.35` (ubuntu)
- **Lb01**: `3.94.82.244` (ubuntu)

## Prerequisites

1. **SSH Key Setup**
   - You mentioned you have an SSH key
   - Make sure it's added to your SSH agent
   - Test SSH access to each server

2. **Git Repository**
   - Your code should be in a Git repository
   - Make sure all files are committed

## Step 1: Test SSH Access

First, test that you can connect to each server:

```bash
# Test Web01
ssh ubuntu@44.211.196.180

# Test Web02
ssh ubuntu@34.227.163.35

# Test Lb01
ssh ubuntu@3.94.82.244
```

If you get "Permission denied", you may need to:
1. Add your SSH key to the server (if not already done)
2. Use `ssh -i /path/to/your/key.pem ubuntu@IP_ADDRESS`

## Step 2: Prepare Your Local Machine

### Option A: Using SSH Key File

If you have a `.pem` or key file:

```bash
# Make it readable only by you
chmod 400 /path/to/your/key.pem

# Test connection
ssh -i /path/to/your/key.pem ubuntu@44.211.196.180
```

### Option B: Using SSH Agent

If your key is already in your SSH agent:

```bash
# Add key to agent (if not already added)
ssh-add ~/.ssh/your_key

# Test connection
ssh ubuntu@44.211.196.180
```

## Step 3: Deploy to Web Servers (Web01 and Web02)

### 3.1: Initial Server Setup

Run these commands on **both Web01 and Web02**:

```bash
# Connect to server
ssh ubuntu@44.211.196.180  # or Web02 IP

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git (if not already installed)
sudo apt install -y git

# Install Nginx (optional, for reverse proxy)
sudo apt install -y nginx
```

### 3.2: Clone and Setup Application

On **both Web01 and Web02**:

```bash
# Create application directory
cd /home/ubuntu
mkdir -p apps
cd apps

# Clone your repository (replace with your actual repo URL)
# Option 1: If using HTTPS
git clone https://github.com/yourusername/your-repo-name.git developer-job-search

# Option 2: If using SSH
git clone git@github.com:yourusername/your-repo-name.git developer-job-search

cd developer-job-search

# Install dependencies
npm install --production

# Create .env file
nano .env
```

Add your environment variables to `.env`:

```env
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
PORT=3000
NODE_ENV=production
```

Save and exit (Ctrl+X, then Y, then Enter).

### 3.3: Start Application with PM2

On **both Web01 and Web02**:

```bash
# Start the application
pm2 start server.js --name job-search

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions provided (usually involves running a sudo command)

# Check status
pm2 status
pm2 logs job-search
```

### 3.4: Configure Firewall

On **both Web01 and Web02**:

```bash
# Allow HTTP, HTTPS, and your app port
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 3000/tcp   # Your application
sudo ufw enable

# Check status
sudo ufw status
```

### 3.5: Test Application

On **both Web01 and Web02**:

```bash
# Test locally on the server
curl http://localhost:3000/health

# Should return: {"status":"ok","timestamp":"..."}
```

## Step 4: Configure Nginx on Web Servers (Optional but Recommended)

This step is optional but recommended for production. It allows you to:
- Serve the app on port 80 (standard HTTP)
- Add SSL/HTTPS later
- Better security and performance

On **both Web01 and Web02**:

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/job-search
```

Add this configuration:

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

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

Save and exit, then:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/job-search /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

Now you can access the app via port 80:
```bash
curl http://localhost/
```

## Step 5: Configure Load Balancer (Lb01)

### 5.1: Install Nginx on Load Balancer

```bash
# Connect to Lb01
ssh ubuntu@3.94.82.244

# Update and install Nginx
sudo apt update
sudo apt install -y nginx
```

### 5.2: Configure Load Balancer

```bash
# Create load balancer configuration
sudo nano /etc/nginx/sites-available/load-balancer
```

Add this configuration (replace IPs with your actual server IPs):

```nginx
upstream backend {
    # Round-robin load balancing (default)
    server 44.211.196.180:3000;
    server 34.227.163.35:3000;
    
    # Alternative: Least connections
    # least_conn;
    
    # Alternative: IP hash for session persistence
    # ip_hash;
}

server {
    listen 80;
    server_name _;

    # Logging
    access_log /var/log/nginx/job-search-access.log;
    error_log /var/log/nginx/job-search-error.log;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        
        # Headers for proper proxying
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Health check and failover
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 10s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Save and exit, then:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/load-balancer /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Reload configuration
sudo systemctl reload nginx
```

### 5.3: Configure Firewall on Load Balancer

```bash
# Allow HTTP and HTTPS
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

## Step 6: Testing

### 6.1: Test Individual Servers

From your local machine:

```bash
# Test Web01
curl http://44.211.196.180:3000/health

# Test Web02
curl http://34.227.163.35:3000/health
```

Both should return: `{"status":"ok","timestamp":"..."}`

### 6.2: Test Load Balancer

```bash
# Test through load balancer
curl http://3.94.82.244/health

# Test the main application
curl http://3.94.82.244/
```

### 6.3: Test Load Distribution

```bash
# Make multiple requests and check which server handles them
for i in {1..10}; do
    echo "Request $i:"
    curl -s http://3.94.82.244/health
    sleep 1
done
```

### 6.4: Test in Browser

Open your browser and navigate to:
```
http://3.94.82.244
```

You should see the Developer Job Search application!

## Step 7: Monitoring and Maintenance

### Check Application Status

On Web01 and Web02:
```bash
pm2 status
pm2 logs job-search
pm2 monit
```

### Check Load Balancer Logs

On Lb01:
```bash
sudo tail -f /var/log/nginx/job-search-access.log
sudo tail -f /var/log/nginx/job-search-error.log
```

### Restart Services

```bash
# Restart application
pm2 restart job-search

# Restart Nginx
sudo systemctl restart nginx
```

## Troubleshooting

### Issue: Cannot connect via SSH
- Check that your SSH key is properly configured
- Verify the server IP addresses
- Try: `ssh -v ubuntu@IP_ADDRESS` for verbose output

### Issue: Application not starting
- Check PM2 logs: `pm2 logs job-search`
- Verify .env file has correct API keys
- Check Node.js version: `node --version`
- Verify dependencies: `npm install`

### Issue: Load balancer not working
- Check Nginx status: `sudo systemctl status nginx`
- Test configuration: `sudo nginx -t`
- Check error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify both web servers are accessible from Lb01

### Issue: 502 Bad Gateway
- Check that applications are running on Web01 and Web02
- Verify firewall allows port 3000
- Check Nginx proxy configuration

## Next Steps

1. **Update Application**: When you make changes, pull the latest code and restart:
   ```bash
   cd /home/ubuntu/apps/developer-job-search
   git pull
   npm install --production
   pm2 restart job-search
   ```

2. **SSL/HTTPS**: Consider adding SSL certificates (Let's Encrypt) for HTTPS

3. **Monitoring**: Set up monitoring tools to track server health

## Making Your Application Accessible Online

Your application is now accessible at:
- **Load Balancer**: `http://3.94.82.244`
- **Web01 Direct**: `http://44.211.196.180:3000`
- **Web02 Direct**: `http://34.227.163.35:3000`

The load balancer distributes traffic between the two web servers automatically!

