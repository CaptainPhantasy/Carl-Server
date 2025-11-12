# Carl Server - 317 Plumber CRM SuperMind Agent

Backend API server for the Carl - 317 Plumber CRM SuperMind Agent, providing webhook endpoints for ElevenLabs agent tools to interact with the Housecall Pro API.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- Housecall Pro API Key

### Installation

```bash
npm install
```

### Environment Variables

Set the following environment variable:

```bash
HOUSECALLPRO_API_KEY=your_api_key_here
```

### Running Locally

```bash
npm start
```

The server will start on port 3001 (or the port specified by the `PORT` environment variable).

## 🚂 Railway Deployment

This server is configured for Railway deployment:

1. Connect your GitHub repository to Railway
2. Set the `HOUSECALLPRO_API_KEY` environment variable in Railway
3. Railway will automatically deploy on push to main branch

## 📡 API Endpoints

All endpoints are prefixed with `/api/` and return responses in the format:
```json
{
  "response": "JSON.stringify({...})"
}
```

### Available Endpoints

- `GET /api/get-company` - Get company information
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

## 🔧 Configuration

### Agent Configuration
- Carl's agent configuration: `agent_configs/Carl-317Plumber-CRM-SuperMind.json`

### Tool Format Reference
- See `ELEVENLABS_WORKING_JSON_FORMAT.md` for the definitive tool JSON format

## 📝 Notes

- All endpoints handle camelCase to snake_case conversion automatically
- Error responses include detailed logging for debugging
- The server is configured for Railway's environment (PORT, SIGTERM handling)

## 🔐 Security

- Never commit API keys to the repository
- Use environment variables for all sensitive data
- The `.gitignore` file excludes `.env` files

