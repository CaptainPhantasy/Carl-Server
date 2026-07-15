# Carl Server - 317 Plumber CRM SuperMind Agent

Backend API server for the Carl - 317 Plumber CRM SuperMind Agent, providing webhook endpoints for ElevenLabs agent tools to interact with the Housecall Pro API.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19 or higher
- Housecall Pro API Key

### Installation

```bash
npm ci
```

### Environment Variables

Set the following environment variable:

```bash
HOUSECALLPRO_API_KEY=your_api_key_here
# Optional, comma-separated. Defaults to Google Drive and Dropbox hosts.
ATTACHMENT_HOST_ALLOWLIST=drive.google.com,dropbox.com,www.dropbox.com
```

### Running Locally

```bash
npm start
```

The server will start on port 3001 (or the port specified by the `PORT` environment variable).

Run the full repository gate with:

```bash
npm run check
npm audit --audit-level=low
```

## 🚂 Railway Deployment

This server is configured for Railway deployment.

**Railway Project ID:** `27b386fc-8753-4a4a-a057-80c319cc10d5`

### Setup Steps:

1. **Connect Repository** (if not already connected):
   - Railway Dashboard → Project → Settings → Source
   - Connect to: `https://github.com/CaptainPhantasy/Carl-Server.git`

2. **Set Environment Variable**:
   - Railway Dashboard → Project → Variables
   - Add: `HOUSECALLPRO_API_KEY` = (your Housecall Pro API key)

3. **Deploy**:
   - Railway will automatically deploy on push to `main` branch
   - Or manually trigger deployment from Railway dashboard

4. **Get Your Railway URL**:
   - **Option 1**: Railway Dashboard → Your Project → Look at the top of the service/deployment card - the URL is displayed there
   - **Option 2**: Railway Dashboard → Your Project → Click on the service → The URL is shown in the service details
   - **Option 3**: Railway Dashboard → Your Project → Settings → Domains (if custom domain is set)
   - **Option 4**: Check the deployment logs - Railway shows the URL when deployment completes
   - Your app URL will be: `https://your-service-name.up.railway.app` or similar
   - Use this URL to update ElevenLabs tool configurations

## 📡 API Endpoints

All endpoints are prefixed with `/api/` and return responses in the format:
```json
{
  "response": "JSON.stringify({...})"
}
```

### Available Endpoints

- `GET /api/get-company` - Get company information
- `GET /health` - Check process readiness without calling Housecall Pro
- `POST /api/get-customers` - Get list of customers
- `POST /api/get-customer` - Get customer by ID
- `POST /api/create-customer` - Create new customer
- `POST /api/update-customer` - Update customer
- `POST /api/get-employees` - Get list of employees
- `POST /api/get-employee` - Get employee by ID
- `POST /api/create-job` - Create new job
- `POST /api/get-jobs` - Get list of jobs
- `POST /api/get-job` - Get job by ID
- `POST /api/update-job` - Update job
- `POST /api/create-estimate` - Create new estimate
- `POST /api/create-appointment` - Create appointment
- `POST /api/add-attachment-to-job` - Add file attachment to job
- ... and 30+ more endpoints

See `index.js` for the complete list.

The recovered Housecall Pro reference contract is in `housecall.v1.yaml` and
is checked by Redocly as part of `npm run check`.

## 🔧 Configuration

### Agent Configuration
- Carl's agent configuration: `agent_configs/Carl-317Plumber-CRM-SuperMind.json`

### Tool Format Reference
- See `ELEVENLABS_WORKING_JSON_FORMAT.md` for the definitive tool JSON format

## 📝 Notes

- All endpoints handle camelCase to snake_case conversion automatically
- Logs avoid request bodies, upstream response bodies, and attachment URLs
- The server is configured for Railway's environment (PORT, SIGTERM handling)

## 🔐 Security

- Never commit API keys to the repository
- Use environment variables for all sensitive data
- The `.gitignore` file excludes `.env` files
- Attachment downloads require HTTPS and an exact host match from
  `ATTACHMENT_HOST_ALLOWLIST`; the default does not permit arbitrary URLs
