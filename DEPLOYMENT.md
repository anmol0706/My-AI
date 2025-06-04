# Render Deployment Guide for My-AI

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- API keys for Gemini and Hugging Face

## Step-by-Step Deployment

### 1. Prepare Your Repository
Your repository is already configured with:
- ✅ `render.yaml` - Render configuration
- ✅ `runtime.txt` - Python version specification
- ✅ `requirements.txt` - Dependencies
- ✅ Production-ready settings

### 2. Deploy on Render

#### Option A: Using Render Dashboard (Recommended)
1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign up/Login with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `anmol0706/My-AI`
   - Select the repository

3. **Configure Service**
   - **Name**: `my-ai-app` (or any name you prefer)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables**
   Add these environment variables in Render dashboard:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key
   HUGGINGFACE_API_KEY=your_actual_huggingface_api_key
   DEBUG=false
   HOST=0.0.0.0
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

#### Option B: Using render.yaml (Infrastructure as Code)
1. **Fork/Clone Repository**
2. **Update render.yaml** with your environment variables
3. **Deploy via Render Dashboard** by selecting "Infrastructure as Code"

### 3. Access Your Application
- After deployment, Render will provide a URL like:
  `https://my-ai-app.onrender.com`
- Your app will be live at this URL

### 4. Custom Domain (Optional)
- In Render dashboard, go to Settings → Custom Domains
- Add your custom domain if you have one

## Important Notes

### Free Tier Limitations
- **Sleep Mode**: Free services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep takes 30-60 seconds
- **Build Time**: Limited build minutes per month

### Production Considerations
- **Paid Plan**: For production use, consider upgrading to paid plan
- **Environment Variables**: Never commit API keys to repository
- **Monitoring**: Use Render's built-in monitoring and logs

### Troubleshooting

#### Common Issues
1. **Build Failures**
   - Check Python version in `runtime.txt`
   - Verify all dependencies in `requirements.txt`

2. **Environment Variables**
   - Ensure all required env vars are set in Render dashboard
   - Check variable names match exactly

3. **Port Issues**
   - Render automatically sets `$PORT` environment variable
   - App should bind to `0.0.0.0:$PORT`

4. **API Key Issues**
   - Verify API keys are valid and have proper permissions
   - Check API quotas and limits

#### Logs and Debugging
- View logs in Render dashboard under "Logs" tab
- Enable debug mode temporarily by setting `DEBUG=true`

## Post-Deployment

### Testing Your Deployment
1. **Health Check**: Visit `https://your-app.onrender.com/health`
2. **Chat Interface**: Test the main chat functionality
3. **Image Generation**: Test image generation features
4. **API Endpoints**: Test API endpoints directly

### Monitoring
- Monitor app performance in Render dashboard
- Set up alerts for downtime or errors
- Check resource usage and scaling needs

## Updating Your App
1. **Push to GitHub**: Any push to master branch triggers auto-deployment
2. **Manual Deploy**: Use "Manual Deploy" in Render dashboard
3. **Environment Updates**: Update env vars in Render dashboard

## Support
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Community**: Render Discord/Forum
- **GitHub Issues**: Report issues in your repository
