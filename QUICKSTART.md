# Quick Start Guide

Get the Developer Job Search application up and running in 5 minutes!

## Step 1: Get API Credentials

1. Visit https://developer.adzuna.com/overview
2. Sign up for a free account
3. Create a new application
4. Copy your **App ID** and **App Key**

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
PORT=3000
NODE_ENV=development
```

## Step 4: Test API Configuration (Optional)

```bash
node test-api.js
```

This will verify your API keys are working correctly.

## Step 5: Start the Application

```bash
npm start
```

## Step 6: Open in Browser

Navigate to: http://localhost:3000

## That's It! 🎉

You can now:
- Search for developer jobs
- Filter by location and salary
- Sort results
- Search within results

## Need Help?

- See [README.md](README.md) for detailed documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions
- Check the API documentation: https://developer.adzuna.com/overview

