# ElevenLabs Webhook Tool JSON - WORKING FORMAT (UI)

**⚠️ CRITICAL: This is the ACTUAL working format from ElevenLabs UI**

**✅ SINGLE SOURCE OF TRUTH** - This is the **DEFINITIVE** reference document for creating ElevenLabs webhook tools for Housecall Pro API integration. All tools must follow this format exactly.

This document contains the **verified, working** JSON format for ElevenLabs webhook tools when pasted directly into the UI. This format is DIFFERENT from the CLI format used in `agent_configs/*.json` files.

**📌 For all future tool development, use this document as your reference.**

**📍 Standard Endpoint Base URL**: `https://carl-server-production.up.railway.app`  
All tools in this project use this base URL unless otherwise specified. Append the API endpoint path to this base URL (e.g., `/api/create-job`, `/api/get-employee-info`).

---

## ✅ Verified Working Structure

### Complete Template (POST Request with Body):

```json
{
  "type": "webhook",
  "name": "tool_name_here",
  "description": "Tool description for the AI agent",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "immediate",
  "api_schema": {
    "url": "https://YOUR_BACKEND_SERVER_URL.com/api/endpoint",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Description of the request body",
      "properties": [
        {
          "id": "property_name",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Property description",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        }
      ],
      "required": false,
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "content_type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

### Complete Template (GET Request - No Body):

```json
{
  "type": "webhook",
  "name": "tool_name_here",
  "description": "Tool description for the AI agent",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "immediate",
  "api_schema": {
    "url": "https://YOUR_BACKEND_SERVER_URL.com/api/endpoint",
    "method": "GET",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": null,
    "request_headers": [
      {
        "type": "value",
        "name": "content_type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## 🔑 Key Format Rules

### 1. `request_body_schema.properties` MUST be an ARRAY

**✅ CORRECT:**
```json
"properties": [
  {
    "id": "employeeId",
    "type": "string",
    ...
  }
]
```

**❌ WRONG:**
```json
"properties": {
  "employeeId": {
    "type": "string",
    ...
  }
}
```

### 2. `request_body_schema` Required Fields

- `id`: Always `"body"` for request body
- `type`: Always `"object"`
- `description`: String description
- `properties`: **ARRAY** of property objects
- `required`: Boolean (`false` or `true`)
- `value_type`: Always `"llm_prompt"` for request body

### 3. Each Property in `properties` Array Must Have:

- `id`: Property identifier (camelCase, e.g., `employeeId`)
- `type`: Property type (`"string"`, `"number"`, `"boolean"`, etc.)
- `value_type`: Always `"llm_prompt"` for user-provided values
- `description`: Property description
- `dynamic_variable`: Empty string `""`
- `constant_value`: Empty string `""`
- `enum`: `null` (unless using enum values)
- `is_system_provided`: Boolean (`false` for user input)
- `required`: Boolean (`false` or `true`)

### 4. `request_headers` is an ARRAY

**✅ CORRECT:**
```json
"request_headers": [
  {
    "type": "value",
    "name": "content_type",
    "value": "application/json"
  }
]
```

**❌ WRONG:**
```json
"request_headers": {
  "content_type": "application/json"
}
```

### 5. Schema Arrays

- `path_params_schema`: Always array `[]` (usually empty)
- `query_params_schema`: Always array `[]` (usually empty)
- `assignments`: Always array `[]` (usually empty)

---

## 📋 Field-by-Field Breakdown

### Top-Level Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✅ | Always `"webhook"` |
| `name` | string | ✅ | Tool identifier (snake_case) |
| `description` | string | ✅ | What the tool does |
| `disable_interruptions` | boolean | ✅ | Usually `false` |
| `force_pre_tool_speech` | string | ✅ | `"auto"` or `false` |
| `assignments` | array | ✅ | Usually `[]` |
| `tool_call_sound` | null | ✅ | Usually `null` |
| `tool_call_sound_behavior` | string | ✅ | `"auto"` |
| `execution_mode` | string | ✅ | `"immediate"` |
| `api_schema` | object | ✅ | API configuration |
| `response_timeout_secs` | number | ✅ | Usually `20` |
| `dynamic_variables` | object | ✅ | `{"dynamic_variable_placeholders": {}}` |

### `api_schema` Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ | Backend endpoint URL |
| `method` | string | ✅ | `"GET"` or `"POST"` |
| `path_params_schema` | array | ✅ | Usually `[]` |
| `query_params_schema` | array | ✅ | Usually `[]` |
| `request_body_schema` | object/null | ✅ | `null` for GET, object for POST |
| `request_headers` | array | ✅ | Array of header objects |
| `auth_connection` | null | ✅ | Usually `null` |

### `request_body_schema` Fields (for POST):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Always `"body"` |
| `type` | string | ✅ | Always `"object"` |
| `description` | string | ✅ | Description of request body |
| `properties` | **array** | ✅ | Array of property objects |
| `required` | boolean | ✅ | `false` or `true` |
| `value_type` | string | ✅ | Always `"llm_prompt"` |

### Property Object Fields (in `properties` array):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Property identifier (camelCase) |
| `type` | string | ✅ | `"string"`, `"number"`, `"boolean"`, etc. |
| `value_type` | string | ✅ | Always `"llm_prompt"` |
| `description` | string | ✅ | Property description |
| `dynamic_variable` | string | ✅ | Empty string `""` |
| `constant_value` | string | ✅ | Empty string `""` |
| `enum` | null | ✅ | `null` unless using enum |
| `is_system_provided` | boolean | ✅ | `false` for user input |
| `required` | boolean | ✅ | `false` or `true` |

### `request_headers` Array Item Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | ✅ | Always `"value"` |
| `name` | string | ✅ | Header name (e.g., `"content_type"`) |
| `value` | string | ✅ | Header value (e.g., `"application/json"`) |

---

## 🛠️ Methodology: Building Webhook Tools from API Documentation

### ⚠️ Complete Workflow Reminder

**After creating a tool JSON, you MUST:**
1. ✅ Create the tool JSON file (following format below)
2. ✅ **Add the corresponding endpoint to `index.js`** (convert camelCase → snake_case, handle API calls)
3. ✅ **Restart your Node.js server** for changes to take effect
4. ✅ Test the tool in ElevenLabs UI

**Without step 2 and 3, the tool will return 404 errors!**

---

### Step-by-Step Process

1. **Identify the API Endpoint**
   - Review the API documentation URL (e.g., `https://docs.housecallpro.com/docs/housecall-public-api/...`)
   - Find the corresponding schema in `housecall.v1.yaml`:
     - Search for the endpoint path (e.g., `/customers` for POST to create customer)
     - Look for the schema reference in `requestBody.content.application/json.schema.$ref`
     - Find the schema definition (e.g., `CustomerCreate`, `JobCreate`) in the `components/schemas` section
   - Note the endpoint URL, HTTP method (GET/POST), and required/optional parameters
   - Understand the request body structure from the API schema
   - Check the `required` array in the schema to identify mandatory fields

2. **Map API Fields to Tool Properties**
   - Convert API field names from snake_case to camelCase for property `id` fields
   - Identify required vs optional fields from the API schema
   - Map data types (string, number, boolean, array, object)

3. **Build the JSON Structure**
   - Start with the base template from this document
   - Set `type: "webhook"` and choose a descriptive `name` in snake_case
   - Write a clear `description` that tells the AI agent when to use this tool
   - Set the `api_schema.url` to your backend endpoint (use standard base URL: `https://carl-server-production.up.railway.app` + endpoint path)
   - Set `api_schema.method` to match the API (GET or POST)

4. **Configure Request Body Schema** (for POST requests)
   - Set `id: "body"`, `type: "object"`, `value_type: "llm_prompt"`
   - Create `properties` as an **ARRAY** (not an object)
   - For each property, include ALL required fields:
     - `id`: camelCase property name
     - `type`: data type (string, number, boolean, etc.)
     - `value_type`: `"llm_prompt"` for user-provided values
     - `description`: Clear description for the AI agent
     - `dynamic_variable`: `""` (empty string)
     - `constant_value`: `""` (empty string)
     - `enum`: `null` (unless using enum values)
     - `is_system_provided`: `false` for user input
     - `required`: `true` or `false` based on API requirements

5. **Set Request Headers**
   - Always include `content_type: "application/json"` in the `request_headers` array
   - Format as array of objects with `type: "value"`, `name`, and `value`

6. **Validate Against Checklist**
   - Run through the validation checklist below
   - Ensure all arrays are arrays, not objects
   - Verify camelCase for property IDs
   - Confirm all required fields are present

7. **Update Backend Server** ⚠️ **CRITICAL STEP**
   - After creating the tool JSON, you MUST add the corresponding endpoint to your backend server (`index.js`)
   - **Endpoint Naming**: Use `/api/{kebab-case-tool-name}` (e.g., `/api/create-customer`, `/api/get-employee-info`)
   - The endpoint should follow this pattern:
     ```javascript
     app.post('/api/your-endpoint-name', async (req, res) => {
       console.log("Tool call received from ElevenLabs agent!");
       console.log("Request body:", req.body);
     
       // 1. Extract camelCase fields from req.body
       const { fieldName1, fieldName2 } = req.body;
     
       // 2. Validate required fields (if needed)
       if (!fieldName1) {
         return res.status(400).json({
           response: JSON.stringify({
             status: 'error',
             message: 'fieldName1 is required'
           })
         });
       }
     
       try {
         // 3. Convert camelCase to snake_case for Housecall Pro API
         const apiData = {
           field_name_1: fieldName1,
           field_name_2: fieldName2
         };
     
         // 4. Call Housecall Pro API
         const response = await axios.post(`${HOUSECALLPRO_BASE_URL}/endpoint`, apiData, {
           headers: {
             'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
             'Accept': 'application/json',
             'Content-Type': 'application/json'
           }
         });
     
         // 5. Return success response
         const responseToAgent = {
           response: JSON.stringify({
             status: 'success',
             message: 'Operation completed successfully',
             data: response.data
           })
         };
         res.json(responseToAgent);
     
       } catch (error) {
         // 6. Handle errors
         console.error("Error calling Housecall Pro API:", error.message);
         const errorResponse = {
           response: JSON.stringify({
             status: "error",
             message: `Failed: ${error.response?.data?.message || error.message}`
           })
         };
         res.status(error.response?.status || 500).json(errorResponse);
       }
     });
     ```
   - **Key Backend Requirements**:
     - Always return responses in format: `{ response: JSON.stringify({...}) }`
     - Convert camelCase (from tool) → snake_case (for Housecall Pro API)
     - Handle arrays: If tool sends comma-separated string, convert to array for API
     - Handle nested objects: Reconstruct from flattened fields if needed
     - Validate required fields before calling API
     - Use proper error handling with try/catch
   - **IMPORTANT**: Restart your Node.js server after adding the endpoint for changes to take effect
   - **Testing**: After restarting, test the endpoint using the tool in ElevenLabs UI or with a tool like Postman

### Key Conversion Rules

- **API snake_case → Tool camelCase**: 
  - `customer_id` → `customerId`
  - `job_type_id` → `jobTypeId`
  - `mobile_number` → `mobileNumber`
  - `street_line_2` → `streetLine2`
  - `notifications_enabled` → `notificationsEnabled`
- **API required fields**: Mark `required: true` in the property object
- **API optional fields**: Mark `required: false` in the property object
- **Conditional requirements**: If API says "at least one of X, Y, Z is required", mark all as `required: false` but document in descriptions
- **Nested objects**: 
  - Option 1: Flatten into individual properties (e.g., `address.street` → `street` property)
  - Option 2: Keep as nested object (more complex for AI agent)
  - Backend will reconstruct nested structure if flattened
- **Arrays**: 
  - Can be passed as comma-separated strings (e.g., `"tag1,tag2,tag3"`)
  - Backend converts to array: `tags.split(',').map(t => t.trim())`
  - Or pass as array if tool supports it
- **Data type mapping**:
  - API `string` → Tool `"string"`
  - API `number` → Tool `"number"`
  - API `boolean` → Tool `"boolean"`
  - API `array` → Tool `"string"` (comma-separated) or handle in backend

---

## ✅ Working Example 1: Get Employee Info

Simple lookup tool with two optional search parameters:

```json
{
  "type": "webhook",
  "name": "get_housecallpro_employee_info",
  "description": "Get employee information from Housecall Pro by employee ID or name. Use this when the user asks about employees, staff members, or team members.",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "immediate",
  "api_schema": {
    "url": "https://carl-server-production.up.railway.app/api/get-employee-info",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Request body for looking up employee information by ID or name",
      "properties": [
        {
          "id": "employeeId",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Housecall Pro employee ID (e.g., pro_4c92348ae804476fb99fcd487351481c)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "name",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Employee name to search for (e.g., 'Austin Fox')",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        }
      ],
      "required": false,
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "content_type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## ✅ Working Example 2: Create Housecall Pro Job

Complex creation tool with multiple required and optional fields, built from Housecall Pro API documentation:

**Source**: Housecall Pro API `/jobs` POST endpoint (https://docs.housecallpro.com/docs/housecall-public-api/2dcf481ed7d69-create-a-job)

**Methodology Applied**:
- Reviewed `JobCreate` schema from API documentation
- Identified required fields: `customer_id`, `address_id`
- Mapped optional fields: `job_type_id`, schedule fields, `notes`, `lead_source`, etc.
- Converted snake_case API fields to camelCase property IDs
- Set appropriate `required` flags based on API schema

```json
{
  "type": "webhook",
  "name": "create_housecallpro_job",
  "description": "Create a new job in Housecall Pro. Use this when a customer requests service or needs work scheduled. Requires customer ID and address ID.",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "immediate",
  "api_schema": {
    "url": "https://carl-server-production.up.railway.app/api/create-job",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Request body for creating a new job in Housecall Pro",
      "properties": [
        {
          "id": "customerId",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "The Housecall Pro customer ID (required)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "addressId",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "The Housecall Pro address ID for the service location (required)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "jobTypeId",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Job type ID from Housecall Pro (e.g., Diagnostic, Repair, Install, Maintenance). Found in job_fields.job_type_id",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "scheduledStart",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Scheduled start time in ISO-8601 format YYYY-MM-DD (e.g., 2023-03-23). Part of schedule object.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "scheduledEnd",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Scheduled end time in ISO-8601 format YYYY-MM-DD (e.g., 2023-03-23). Part of schedule object.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "arrivalWindow",
          "type": "number",
          "value_type": "llm_prompt",
          "description": "Arrival window in minutes. Part of schedule object.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "assignedEmployeeIds",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Comma-separated list of employee IDs to assign to the job (e.g., 'pro_123,pro_456')",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "notes",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Notes or description about the job",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "leadSource",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Source of the lead (e.g., 'Phone', 'Website', 'Referral')",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "invoiceNumber",
          "type": "number",
          "value_type": "llm_prompt",
          "description": "Invoice number (must be unique across all company jobs. If left blank, one will be auto-generated)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        }
      ],
      "required": true,
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "content_type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

**Key Features of This Example**:
- ✅ Multiple required fields (`customerId`, `addressId`) with `required: true`
- ✅ Multiple optional fields with `required: false`
- ✅ Mixed data types: `string`, `number`
- ✅ Clear descriptions for each field
- ✅ Proper camelCase property IDs converted from API snake_case
- ✅ All required format fields present and correct

---

## ✅ Working Example 3: Create Housecall Pro Customer

Complex creation tool with many optional fields and conditional requirements, built from Housecall Pro API documentation:

**Source**: Housecall Pro API `/customers` POST endpoint (https://docs.housecallpro.com/docs/housecall-public-api/4e0bf8c4d65d7-create-customer)

**Methodology Applied**:
- Reviewed `CustomerCreate` schema from API documentation
- Identified conditional requirement: At least one of `first_name`, `last_name`, `email`, `mobile_number`, `home_number`, or `work_number` is required
- Mapped all optional fields: contact info, company, notifications, lead source, notes, tags, and address fields
- Converted snake_case API fields to camelCase property IDs
- Flattened nested `addresses` array into individual address fields for easier AI agent use
- Set all fields as `required: false` but documented the conditional requirement in descriptions

```json
{
  "type": "webhook",
  "name": "create_housecallpro_customer",
  "description": "Create a new customer in Housecall Pro. Use this when you need to add a new customer to the system. At least one contact method (name, email, or phone) is required.",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "immediate",
  "api_schema": {
    "url": "https://carl-server-production.up.railway.app/api/create-customer",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Request body for creating a new customer in Housecall Pro",
      "properties": [
        {
          "id": "firstName",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Customer's first name. At least one contact field (first_name, last_name, email, mobile_number, home_number, or work_number) is required.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "lastName",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Customer's last name. At least one contact field (first_name, last_name, email, mobile_number, home_number, or work_number) is required.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "email",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Customer's email address. At least one contact field (first_name, last_name, email, mobile_number, home_number, or work_number) is required.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "company",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Customer's company name",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "mobileNumber",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Customer's mobile phone number (e.g., 3175551234). At least one contact field (first_name, last_name, email, mobile_number, home_number, or work_number) is required.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "homeNumber",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Customer's home phone number (e.g., 3175551234). At least one contact field (first_name, last_name, email, mobile_number, home_number, or work_number) is required.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "workNumber",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Customer's work phone number (e.g., 3175551234). At least one contact field (first_name, last_name, email, mobile_number, home_number, or work_number) is required.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "notificationsEnabled",
          "type": "boolean",
          "value_type": "llm_prompt",
          "description": "Whether the customer will receive notifications (default: true)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "leadSource",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Source of the lead (e.g., 'Phone', 'Website', 'Referral', 'Voice Agent')",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "notes",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Notes about the customer",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "tags",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Comma-separated list of tags to assign to the customer (e.g., 'VIP,Preferred')",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "street",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Street address for the customer's primary address",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "streetLine2",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Street address line 2 (apartment, suite, etc.)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "city",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "City for the customer's primary address",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "state",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "State code for the customer's primary address (e.g., IN, CA, NY)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "zip",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "ZIP code for the customer's primary address",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "country",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Country for the customer's primary address (default: US)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        }
      ],
      "required": false,
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "content_type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

**Key Features of This Example**:
- ✅ Conditional requirements (at least one contact field required, but none individually required)
- ✅ Many optional fields (17 total properties)
- ✅ Mixed data types: `string`, `boolean`
- ✅ Flattened nested structure (address fields as individual properties instead of nested object)
- ✅ Special handling for arrays (tags as comma-separated string, addresses reconstructed in backend)
- ✅ Clear descriptions explaining conditional requirements
- ✅ Proper camelCase property IDs converted from API snake_case
- ✅ All required format fields present and correct

**Backend Implementation Note**: The backend endpoint (`/api/create-customer` in `index.js`) handles:
- Converting camelCase to snake_case for Housecall Pro API
- Validating that at least one contact field is provided
- Reconstructing the `addresses` array from flattened address fields
- Converting comma-separated tags string to array
- Proper error handling and response formatting

---

## 📚 Catalog of Working Tool Examples

All tools listed below are **100% functional** and ready to paste into ElevenLabs UI. Each has been validated and tested.

| # | Tool Name | Endpoint | Method | Description | File |
|---|----------|----------|--------|-------------|------|
| 1 | `get_housecallpro_employee_info` | `/api/get-employee-info` | POST | Get employee information by ID or name | See Example 1 above |
| 2 | `create_housecallpro_job` | `/api/create-job` | POST | Create a new job in Housecall Pro | See Example 2 above |
| 3 | `create_housecallpro_customer` | `/api/create-customer` | POST | Create a new customer in Housecall Pro | See Example 3 above |

**Note**: All tools use the standard endpoint base URL: `https://carl-server-production.up.railway.app`

**Backend Status**: All corresponding endpoints are implemented in `index.js`:
- ✅ `/api/get-employee-info` - Implemented
- ✅ `/api/create-job` - Implemented (if using Node.js backend)
- ✅ `/api/create-customer` - Implemented

---

## 🚨 Critical Differences from CLI Format

| Aspect | UI Format (This Doc) | CLI Format (agent_configs/*.json) |
|--------|---------------------|-----------------------------------|
| `properties` | **Array** `[]` | Object `{}` |
| Property `id` | camelCase (e.g., `employeeId`) | snake_case (e.g., `employee_id`) |
| `request_headers` | Array of objects | Object with keys |
| `request_body_schema.id` | `"body"` | Custom ID string |
| `value_type` | `"llm_prompt"` | Not present |
| `dynamic_variable` | Empty string `""` | `null` |
| `constant_value` | Empty string `""` | Not present or different |
| `is_system_provided` | Present | Not always present |

---

## ✅ Validation Checklist

Before pasting into ElevenLabs UI, verify:

- [ ] `type` is `"webhook"`
- [ ] `name` is in snake_case
- [ ] `description` is clear
- [ ] `api_schema.url` has your actual backend URL
- [ ] `api_schema.method` is `"GET"` or `"POST"`
- [ ] `path_params_schema` is array `[]`
- [ ] `query_params_schema` is array `[]`
- [ ] `assignments` is array `[]`
- [ ] If `method` is `"GET"`: `request_body_schema` is `null`
- [ ] If `method` is `"POST"`: `request_body_schema` has:
  - [ ] `id` is `"body"`
  - [ ] `type` is `"object"`
  - [ ] `description` is present
  - [ ] `properties` is an **ARRAY** `[]`
  - [ ] `required` is boolean
  - [ ] `value_type` is `"llm_prompt"`
- [ ] Each property in `properties` array has:
  - [ ] `id` (camelCase)
  - [ ] `type` (string, number, boolean, etc.)
  - [ ] `value_type` is `"llm_prompt"`
  - [ ] `description`
  - [ ] `dynamic_variable` is `""`
  - [ ] `constant_value` is `""`
  - [ ] `enum` is `null`
  - [ ] `is_system_provided` is boolean
  - [ ] `required` is boolean
- [ ] `request_headers` is an **ARRAY** with objects containing:
  - [ ] `type` is `"value"`
  - [ ] `name` (e.g., `"content_type"`)
  - [ ] `value` (e.g., `"application/json"`)

---

## 📝 Quick Reference: Property Naming

- **Property `id` in JSON**: Use **camelCase** (e.g., `employeeId`, `customerName`)
- **Backend expects**: Usually **snake_case** (e.g., `employee_id`, `customer_name`)
- **Solution**: Your backend should handle both or convert camelCase to snake_case

---

---

## 🧪 Testing Your Tool

After creating a tool JSON and backend endpoint:

1. **Restart Node.js Server**
   ```bash
   # Stop current server (Ctrl+C), then:
   HOUSECALLPRO_API_KEY="your_key" node index.js
   ```

2. **Verify Endpoint is Running**
   - Check server logs for "Backend server listening on http://localhost:3001"
   - Verify ngrok is forwarding to localhost:3001

3. **Test in ElevenLabs UI**
   - Paste the tool JSON into ElevenLabs UI
   - Save the tool
   - Try using the tool in a conversation
   - Check server logs for incoming requests
   - Verify responses are returned correctly

4. **Common Issues**
   - **404 Error**: Endpoint not added to `index.js` or server not restarted
   - **500 Error**: Check server logs for API call errors
   - **Field Mismatch**: Verify camelCase → snake_case conversion in backend
   - **Validation Error**: Check that required fields are being sent

---

**Last Updated:** Based on working employee tool, create job tool, and create customer tool JSON from ElevenLabs UI  
**Status:** ✅ This format has been validated and confirmed working in UI  
**Working Examples:** 3 verified examples included (Get Employee Info, Create Job, Create Customer)  
**Backend:** All tools have corresponding endpoints implemented in `index.js`  
**Completeness:** ✅ This document contains all information needed for a new agent to create working tools independently

---

## 🎯 SINGLE SOURCE OF TRUTH

**This document is the ONLY authoritative reference for ElevenLabs webhook tool JSON format.**

- ✅ All 41+ tools in `/new tools from swarm/` follow this format
- ✅ All working examples use this format
- ✅ All future tools must follow this format
- ✅ If you see conflicting documentation, this document takes precedence

**Note:** `ELEVENLABS_JSON_FORMAT_REFERENCE.md` is outdated and should not be used.

