# Quick Deployment Summary

## Your Servers

- **Web01**: `ubuntu@44.211.196.180`
- **Web02**: `ubuntu@34.227.163.35`
- **Lb01**: `ubuntu@3.94.82.244`

## Quick Start (Automated)

### 1. Test SSH Access

```bash
# Test each server
ssh ubuntu@44.211.196.180
ssh ubuntu@34.227.163.35
ssh ubuntu@3.94.82.244
```

If using a key file:
```bash
ssh -i /path/to/key.pem ubuntu@44.211.196.180
```

### 2. Deploy to Web Servers

Use the automated script:

```bash
# Deploy to Web01
./deploy-to-server.sh 44.211.196.180

# Deploy to Web02
./deploy-to-server.sh 34.227.163.35
```

### 3. Configure Load Balancer

SSH to Lb01 and follow the load balancer setup in `DEPLOYMENT_GUIDE.md` (Step 5).

## Manual Deployment (Step by Step)

### On Web01 and Web02:

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install PM2
sudo npm install -g pm2

# 3. Clone repository
cd /home/ubuntu
git clone <your-repo-url> apps/developer-job-search
cd apps/developer-job-search

# 4. Install dependencies
npm install --production

# 5. Create .env file
nano .env
# Add your API keys

# 6. Start application
pm2 start server.js --name job-search
pm2 save
pm2 startup  # Follow instructions

# 7. Configure firewall
sudo ufw allow 3000/tcp
sudo ufw enable
```

### On Lb01:

```bash
# 1. Install Nginx
sudo apt update
sudo apt install -y nginx

# 2. Configure load balancer
sudo nano /etc/nginx/sites-available/load-balancer
# Copy configuration from DEPLOYMENT_GUIDE.md

# 3. Enable site
sudo ln -s /etc/nginx/sites-available/load-balancer /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 4. Configure firewall
sudo ufw allow 80/tcp
sudo ufw enable
```

## Testing

```bash
# Test Web01
curl http://44.211.196.180:3000/health

# Test Web02
curl http://34.227.163.35:3000/health

# Test Load Balancer
curl http://3.94.82.244/health
curl http://3.94.82.244/
```

## Docker Option (Optional/Bonus)

If you want to use Docker:

### Build and Push Image

```bash
# Build image
docker build -t developer-job-search .

# Tag for your registry (if using one)
# docker tag developer-job-search your-registry/developer-job-search

# Or use docker-compose
docker-compose up -d
```

### Deploy with Docker on Servers

```bash
# On each web server
docker run -d \
  --name job-search \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  developer-job-search
```

**Note**: Docker is optional. The standard Node.js + PM2 deployment is sufficient and recommended for this assignment.

## Access Your Application

Once deployed, your application will be accessible at:

- **Load Balancer**: `http://3.94.82.244`
- **Web01 Direct**: `http://44.211.196.180:3000`
- **Web02 Direct**: `http://34.227.163.35:3000`

## Need Help?

- **SSH Issues**: See `SSH_SETUP.md`
- **Detailed Steps**: See `DEPLOYMENT_GUIDE.md`
- **Troubleshooting**: Check the troubleshooting section in `DEPLOYMENT_GUIDE.md`

