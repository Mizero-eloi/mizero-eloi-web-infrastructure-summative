# SSH Setup Guide

This guide helps you set up SSH access to your servers.

## Your Server Information

- **Web01**: `ubuntu@44.211.196.180`
- **Web02**: `ubuntu@34.227.163.35`
- **Lb01**: `ubuntu@3.94.82.244`

## Option 1: Using SSH Key File (.pem)

If you have a `.pem` or private key file:

### Step 1: Set Permissions

```bash
chmod 400 /path/to/your/key.pem
```

### Step 2: Test Connection

```bash
ssh -i /path/to/your/key.pem ubuntu@44.211.196.180
```

### Step 3: Add to SSH Config (Optional but Recommended)

Create or edit `~/.ssh/config`:

```bash
nano ~/.ssh/config
```

Add:

```
Host web01
    HostName 44.211.196.180
    User ubuntu
    IdentityFile /path/to/your/key.pem

Host web02
    HostName 34.227.163.35
    User ubuntu
    IdentityFile /path/to/your/key.pem

Host lb01
    HostName 3.94.82.244
    User ubuntu
    IdentityFile /path/to/your/key.pem
```

Save and exit. Now you can connect simply:

```bash
ssh web01
ssh web02
ssh lb01
```

## Option 2: Using SSH Agent

If your key is already in your SSH agent:

### Step 1: Add Key to Agent

```bash
ssh-add ~/.ssh/your_private_key
```

### Step 2: Test Connection

```bash
ssh ubuntu@44.211.196.180
```

## Option 3: Password Authentication (if enabled)

If password authentication is enabled:

```bash
ssh ubuntu@44.211.196.180
# Enter password when prompted
```

## Troubleshooting SSH Access

### Issue: "Permission denied (publickey)"

**Solution 1**: Make sure your key file has correct permissions:
```bash
chmod 400 /path/to/your/key.pem
```

**Solution 2**: Specify the key explicitly:
```bash
ssh -i /path/to/your/key.pem ubuntu@44.211.196.180
```

**Solution 3**: Check if key is in SSH agent:
```bash
ssh-add -l
# If empty, add your key:
ssh-add ~/.ssh/your_key
```

### Issue: "Host key verification failed"

**Solution**: Remove old host key:
```bash
ssh-keygen -R 44.211.196.180
ssh-keygen -R 34.227.163.35
ssh-keygen -R 3.94.82.244
```

### Issue: "Connection timed out"

**Solution**: 
- Check that the server is running
- Verify the IP address is correct
- Check your firewall/network settings

## Quick Test Script

Create a test script to verify all connections:

```bash
#!/bin/bash

echo "Testing SSH connections..."

for server in "44.211.196.180:Web01" "34.227.163.35:Web02" "3.94.82.244:Lb01"; do
    IFS=':' read -r ip name <<< "$server"
    echo -n "Testing $name ($ip)... "
    if ssh -o ConnectTimeout=5 -o BatchMode=yes ubuntu@$ip "echo 'OK'" 2>/dev/null; then
        echo "✓ Connected"
    else
        echo "✗ Failed"
    fi
done
```

Save as `test-ssh.sh`, make executable (`chmod +x test-ssh.sh`), and run it.

## Next Steps

Once SSH is working, proceed to deployment:
1. Read `DEPLOYMENT_GUIDE.md`
2. Use `deploy-to-server.sh` script for automated deployment
3. Or follow manual steps in the deployment guide

