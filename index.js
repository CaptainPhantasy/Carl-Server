// Import required modules
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

// Create an Express application
const app = express();
const port = process.env.PORT || 3001; // Railway sets PORT automatically

// This line is still good practice, though not strictly needed for this GET request
app.use(express.json());

// --- Store Your Secret API Key Securely ---
// NEVER hardcode your API key. Use environment variables.
// Run your server like this: HOUSECALLPRO_API_KEY="your_key_here" node index.js
const HOUSECALLPRO_API_KEY = process.env.HOUSECALLPRO_API_KEY;
const HOUSECALLPRO_BASE_URL = "https://api.housecallpro.com";

if (!HOUSECALLPRO_API_KEY) {
  console.error("FATAL ERROR: HOUSECALLPRO_API_KEY environment variable is not set.");
  process.exit(1); // Stop the server if the key is missing
}

// THIS IS THE CRITICAL CHANGE:
// We are now using app.get() to match the tool's "method": "GET"
app.get('/api/get-company-info', async (req, res) => {
  
  console.log("Tool call received from ElevenLabs agent!");
  // NOTE: With a GET request, there is no req.body. 
  // We don't need it for this call anyway.

  // --- 1. Your server logic goes here ---
  // In this case, we call the HousecallPro API
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/company`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    // Log the successful data fetch
    console.log("Data received from HousecallPro:", response.data);

    // --- 2. Send a SINGLE JSON response back to the ElevenLabs Agent ---
    // The agent's LLM will read the content of the "response" key.
    // We must stringify the JSON data from HousecallPro so it can be
    // sent as a single string within the "response" field.
    const responseToAgent = {
      response: JSON.stringify(response.data)
    };

    res.json(responseToAgent);

  } catch (error) {
    console.error("Error calling HousecallPro API:", error.message);
    
    // Send a structured error message back to the agent
    const errorResponse = {
      response: JSON.stringify({
        status: "error",
        message: "I was unable to retrieve the company information from HousecallPro."
      })
    };
    res.status(500).json(errorResponse);
  }
});

// Employee info endpoint
app.post('/api/get-employee-info', async (req, res) => {
  console.log("Employee info tool call received from ElevenLabs agent!");
  console.log("Request body:", req.body);

  const { employee_id, name } = req.body;

  try {
    let employee = null;

    if (employee_id) {
      // Get employee by ID - need to fetch list and filter
      const employeesResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/employees`, {
        headers: {
          'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
          'Accept': 'application/json'
        },
        params: {
          page: 1,
          page_size: 100
        }
      });

      const employees = employeesResponse.data.employees || employeesResponse.data.data || [];
      employee = employees.find(e => e.id === employee_id || e.uuid === employee_id);
    } else if (name) {
      // Search employees by name
      const employeesResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/employees`, {
        headers: {
          'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
          'Accept': 'application/json'
        },
        params: {
          page: 1,
          page_size: 100
        }
      });

      const employees = employeesResponse.data.employees || employeesResponse.data.data || [];
      const nameLower = name.toLowerCase();
      employee = employees.find(e => {
        const fullName = `${e.first_name || ''} ${e.last_name || ''}`.toLowerCase().trim();
        return fullName.includes(nameLower);
      });
    } else {
      return res.status(400).json({
        response: JSON.stringify({
          status: 'error',
          message: 'employee_id or name required'
        })
      });
    }

    if (employee) {
      const responseToAgent = {
        response: JSON.stringify({
          status: 'success',
          employee: {
            id: employee.id || employee.uuid,
            name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
            email: employee.email,
            phone: employee.mobile_number,
            role: employee.role,
            admin: employee.permissions?.is_admin || false,
            can_book_online: employee.permissions?.can_be_booked_online || false,
            can_take_payments: employee.permissions?.can_take_payment_see_prices || false,
            permissions: employee.permissions || {}
          }
        })
      };
      res.json(responseToAgent);
    } else {
      res.status(404).json({
        response: JSON.stringify({
          status: 'not_found',
          message: 'Employee not found'
        })
      });
    }
  } catch (error) {
    console.error("Error calling HousecallPro API:", error.message);
    console.error("Error details:", error.response?.data);
    
    const errorResponse = {
      response: JSON.stringify({
        status: "error",
        message: `Failed to get employee: ${error.message}`
      })
    };
    res.status(500).json(errorResponse);
  }
});

// Create customer endpoint
app.post('/api/create-customer', async (req, res) => {
  console.log("Create customer tool call received from ElevenLabs agent!");
  console.log("Request body:", req.body);

  // Convert camelCase from tool JSON to snake_case for Housecall Pro API
  const {
    firstName,
    lastName,
    email,
    company,
    mobileNumber,
    homeNumber,
    workNumber,
    notificationsEnabled,
    leadSource,
    notes,
    tags,
    street,
    streetLine2,
    city,
    state,
    zip,
    country
  } = req.body;

  // Validate: At least one contact field is required
  if (!firstName && !lastName && !email && !mobileNumber && !homeNumber && !workNumber) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'At least one contact field (firstName, lastName, email, mobileNumber, homeNumber, or workNumber) is required'
      })
    });
  }

  try {
    // Build the customer data object for Housecall Pro API
    const customerData = {
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      company: company || null,
      mobile_number: mobileNumber || null,
      home_number: homeNumber || null,
      work_number: workNumber || null,
      notifications_enabled: notificationsEnabled !== undefined ? notificationsEnabled : true,
      lead_source: leadSource || null,
      notes: notes || null
    };

    // Handle tags - convert comma-separated string to array
    if (tags) {
      customerData.tags = typeof tags === 'string' 
        ? tags.split(',').map(t => t.trim()).filter(t => t)
        : Array.isArray(tags) ? tags : [];
    }

    // Handle address - if any address fields are provided, create addresses array
    if (street || city || state || zip) {
      customerData.addresses = [{
        street: street || null,
        street_line_2: streetLine2 || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        country: country || 'US'
      }];
    }

    // Remove null values to clean up the payload
    Object.keys(customerData).forEach(key => {
      if (customerData[key] === null || customerData[key] === undefined) {
        delete customerData[key];
      }
    });

    console.log("Calling Housecall Pro API with data:", customerData);

    // Call Housecall Pro API to create customer
    const response = await axios.post(`${HOUSECALLPRO_BASE_URL}/customers`, customerData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log("Customer created successfully:", response.data);

    // Return success response to agent
    const responseToAgent = {
      response: JSON.stringify({
        status: 'success',
        message: 'Customer created successfully',
        customer: {
          id: response.data.id || response.data.uuid,
          name: `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim(),
          email: response.data.email,
          phone: response.data.mobile_number || response.data.home_number || response.data.work_number,
          company: response.data.company
        }
      })
    };

    res.json(responseToAgent);

  } catch (error) {
    console.error("Error calling Housecall Pro API:", error.message);
    console.error("Error details:", error.response?.data);
    
    const errorResponse = {
      response: JSON.stringify({
        status: "error",
        message: `Failed to create customer: ${error.response?.data?.message || error.message}`
      })
    };
    res.status(error.response?.status || 500).json(errorResponse);
  }
});

// Add attachment to job endpoint
app.post('/api/add-attachment-to-job', async (req, res) => {
  console.log("Add attachment to job tool call received from ElevenLabs agent!");
  console.log("Request body:", req.body);

  // Extract camelCase fields from req.body
  const { jobId, fileUrl } = req.body;

  // Validate required fields
  if (!jobId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'jobId is required'
      })
    });
  }

  if (!fileUrl) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'fileUrl is required'
      })
    });
  }

  try {
    // Helper function to convert Google Drive share links to direct download links
    const convertGoogleDriveLink = (url) => {
      try {
        const urlObj = new URL(url);
        // Check if it's a Google Drive link
        if (urlObj.hostname.includes('drive.google.com')) {
          // Extract file ID from various Google Drive URL formats
          let fileId = null;
          
          // Format 1: /file/d/FILE_ID/view
          const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (fileMatch) {
            fileId = fileMatch[1];
          }
          
          // Format 2: ?id=FILE_ID
          if (!fileId) {
            const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch) {
              fileId = idMatch[1];
            }
          }
          
          if (fileId) {
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
          }
        }
        
        // Convert Dropbox links to direct download
        if (urlObj.hostname.includes('dropbox.com')) {
          if (url.includes('?dl=0')) {
            return url.replace('?dl=0', '?dl=1');
          }
          if (!url.includes('?dl=')) {
            return url + (url.includes('?') ? '&dl=1' : '?dl=1');
          }
        }
        
        return url; // Return original URL if no conversion needed
      } catch (e) {
        return url; // Return original URL if parsing fails
      }
    };

    // Convert the URL if needed (Google Drive, Dropbox, etc.)
    const directDownloadUrl = convertGoogleDriveLink(fileUrl);
    if (directDownloadUrl !== fileUrl) {
      console.log(`Converted file URL: ${fileUrl} → ${directDownloadUrl}`);
    }

    // Download the file from the URL
    console.log(`Downloading file from URL: ${directDownloadUrl}`);
    const fileResponse = await axios.get(directDownloadUrl, {
      responseType: 'stream',
      timeout: 30000 // 30 second timeout for file download
    });

    // Extract filename from URL or use a default
    const urlPath = new URL(fileUrl).pathname;
    const filename = urlPath.split('/').pop() || 'attachment';

    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append('file', fileResponse.data, {
      filename: filename,
      contentType: fileResponse.headers['content-type'] || 'application/octet-stream'
    });

    // Upload to Housecall Pro API
    console.log(`Uploading file to job ${jobId}`);
    const response = await axios.post(
      `${HOUSECALLPRO_BASE_URL}/jobs/${jobId}/attachments`,
      formData,
      {
        headers: {
          'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
          'Accept': 'application/json',
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log("Attachment added successfully:", response.data);

    // Return success response to agent
    const responseToAgent = {
      response: JSON.stringify({
        status: 'success',
        message: 'Attachment added to job successfully',
        jobUrl: response.data.job_url || null,
        data: response.data
      })
    };

    res.json(responseToAgent);

  } catch (error) {
    console.error("Error adding attachment to job:", error.message);
    console.error("Error details:", error.response?.data);
    
    const errorResponse = {
      response: JSON.stringify({
        status: "error",
        message: `Failed to add attachment: ${error.response?.data?.message || error.message}`
      })
    };
    res.status(error.response?.status || 500).json(errorResponse);
  }
});

// ============================================================================
// ALL NEW ENDPOINTS FROM SWARM TOOLS
// ============================================================================

// GET Company (update existing endpoint name to match tool)
app.get('/api/get-company', async (req, res) => {
  console.log("Get company tool call received from ElevenLabs agent!");
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/company`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    const responseToAgent = {
      response: JSON.stringify(response.data)
    };
    res.json(responseToAgent);
  } catch (error) {
    console.error("Error calling HousecallPro API:", error.message);
    const errorResponse = {
      response: JSON.stringify({
        status: "error",
        message: "I was unable to retrieve the company information from HousecallPro."
      })
    };
    res.status(500).json(errorResponse);
  }
});

// GET Checklists
app.post('/api/get-checklists', async (req, res) => {
  console.log("Get checklists tool call received!");
  const { jobUuids, estimateUuids, page, pageSize } = req.body;
  
  try {
    const params = {};
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    if (jobUuids) params.job_uuids = jobUuids.split(',').map(u => u.trim());
    if (estimateUuids) params.estimate_uuids = estimateUuids.split(',').map(u => u.trim());
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/checklists`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get checklists: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Customers
app.post('/api/get-customers', async (req, res) => {
  console.log("Get customers tool call received!");
  const { q, page, pageSize, sortBy, sortDirection, locationIds } = req.body;
  
  try {
    const params = {};
    if (q) params.q = q;
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    if (sortBy) params.sort_by = sortBy;
    if (sortDirection) params.sort_direction = sortDirection;
    if (locationIds) params.location_ids = locationIds.split(',').map(id => id.trim());
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/customers`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get customers: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Customer
app.post('/api/get-customer', async (req, res) => {
  console.log("Get customer tool call received!");
  const { customerId, expand } = req.body;
  
  if (!customerId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'customerId is required'
      })
    });
  }
  
  try {
    const params = {};
    if (expand) params.expand = expand.split(',').map(e => e.trim());
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/customers/${customerId}`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get customer: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Customer Details (alias for backward compatibility with existing agent config)
app.post('/api/get-customer-details', async (req, res) => {
  console.log("Get customer details tool call received!");
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'name is required'
      })
    });
  }
  
  try {
    // Search for customer by name
    const searchResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/customers`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params: {
        q: name,
        page: 1,
        page_size: 10
      }
    });
    
    const customers = searchResponse.data.customers || [];
    if (customers.length > 0) {
      // Get full details of first match
      const customerId = customers[0].id || customers[0].uuid;
      const customerResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/customers/${customerId}`, {
        headers: {
          'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      
      res.json({ response: JSON.stringify(customerResponse.data) });
    } else {
      res.status(404).json({
        response: JSON.stringify({
          status: 'not_found',
          message: `No customer found with name: ${name}`
        })
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get customer details: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Employees
app.post('/api/get-employees', async (req, res) => {
  console.log("Get employees tool call received!");
  const { page, pageSize, sortBy, sortDirection, locationIds } = req.body;
  
  try {
    const params = {};
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    if (sortBy) params.sort_by = sortBy;
    if (sortDirection) params.sort_direction = sortDirection;
    if (locationIds) params.location_ids = locationIds.split(',').map(id => id.trim());
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/employees`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get employees: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Employee
app.post('/api/get-employee', async (req, res) => {
  console.log("Get employee tool call received!");
  const { employeeId } = req.body;
  
  if (!employeeId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'employeeId is required'
      })
    });
  }
  
  try {
    const employeesResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/employees`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params: { page: 1, page_size: 100 }
    });
    
    const employees = employeesResponse.data.employees || employeesResponse.data.data || [];
    const employee = employees.find(e => e.id === employeeId || e.uuid === employeeId);
    
    if (employee) {
      res.json({ response: JSON.stringify(employee) });
    } else {
      res.status(404).json({
        response: JSON.stringify({
          status: 'not_found',
          message: 'Employee not found'
        })
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get employee: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Estimates
app.post('/api/get-estimates', async (req, res) => {
  console.log("Get estimates tool call received!");
  const { customerId, page, pageSize } = req.body;
  
  try {
    const params = {};
    if (customerId) params.customer_id = customerId;
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/estimates`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get estimates: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Estimate
app.post('/api/get-estimate', async (req, res) => {
  console.log("Get estimate tool call received!");
  const { estimateId } = req.body;
  
  if (!estimateId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'estimateId is required'
      })
    });
  }
  
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/estimates/${estimateId}`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get estimate: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Jobs
app.post('/api/get-jobs', async (req, res) => {
  console.log("Get jobs tool call received!");
  const { customerId, employeeIds, workStatus, scheduledStartMin, scheduledStartMax, page, pageSize, sortBy, sortDirection } = req.body;
  
  try {
    const params = {};
    if (customerId) params.customer_id = customerId;
    if (employeeIds) params.employee_ids = employeeIds.split(',').map(id => id.trim());
    if (workStatus) params.work_status = workStatus.split(',').map(s => s.trim());
    if (scheduledStartMin) params.scheduled_start_min = scheduledStartMin;
    if (scheduledStartMax) params.scheduled_start_max = scheduledStartMax;
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    if (sortBy) params.sort_by = sortBy;
    if (sortDirection) params.sort_direction = sortDirection;
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get jobs: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Job
app.post('/api/get-job', async (req, res) => {
  console.log("Get job tool call received!");
  const { jobId, expand } = req.body;
  
  if (!jobId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'jobId is required'
      })
    });
  }
  
  try {
    const params = {};
    if (expand) params.expand = expand.split(',').map(e => e.trim());
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get job: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Job Appointments
app.post('/api/get-job-appointments', async (req, res) => {
  console.log("Get job appointments tool call received!");
  const { jobId } = req.body;
  
  if (!jobId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'jobId is required'
      })
    });
  }
  
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs/${jobId}/appointments`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get job appointments: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Appointment
app.post('/api/get-appointment', async (req, res) => {
  console.log("Get appointment tool call received!");
  const { appointmentId } = req.body;
  
  if (!appointmentId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'appointmentId is required'
      })
    });
  }
  
  try {
    // Need to find which job this appointment belongs to - search through jobs
    const jobsResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params: { page: 1, page_size: 100, expand: ['appointments'] }
    });
    
    let appointment = null;
    const jobs = jobsResponse.data.jobs || [];
    for (const job of jobs) {
      if (job.appointments) {
        appointment = job.appointments.find(a => a.id === appointmentId || a.uuid === appointmentId);
        if (appointment) break;
      }
    }
    
    if (appointment) {
      res.json({ response: JSON.stringify(appointment) });
    } else {
      res.status(404).json({
        response: JSON.stringify({
          status: 'not_found',
          message: 'Appointment not found'
        })
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get appointment: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Invoices
app.post('/api/get-invoices', async (req, res) => {
  console.log("Get invoices tool call received!");
  const { jobId, page, pageSize } = req.body;
  
  try {
    const params = {};
    if (jobId) {
      // Get invoices for specific job
      const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs/${jobId}/invoices`, {
        headers: {
          'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      return res.json({ response: JSON.stringify(response.data) });
    }
    
    // Otherwise get all invoices (if API supports it)
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    
    // Note: This endpoint may not exist in the API, adjust as needed
    res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'jobId is required to get invoices'
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get invoices: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Invoice
app.post('/api/get-invoice', async (req, res) => {
  console.log("Get invoice tool call received!");
  const { invoiceId } = req.body;
  
  if (!invoiceId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'invoiceId is required'
      })
    });
  }
  
  try {
    // Need to search through jobs to find the invoice
    const jobsResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params: { page: 1, page_size: 100 }
    });
    
    let invoice = null;
    const jobs = jobsResponse.data.jobs || [];
    for (const job of jobs) {
      const invoicesResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs/${job.id}/invoices`, {
        headers: {
          'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      const invoices = invoicesResponse.data.invoices || [];
      invoice = invoices.find(i => i.id === invoiceId || i.uuid === invoiceId);
      if (invoice) break;
    }
    
    if (invoice) {
      res.json({ response: JSON.stringify(invoice) });
    } else {
      res.status(404).json({
        response: JSON.stringify({
          status: 'not_found',
          message: 'Invoice not found'
        })
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get invoice: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Job Types
app.get('/api/get-job-types', async (req, res) => {
  console.log("Get job types tool call received!");
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/job_fields/job_types`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get job types: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Leads
app.post('/api/get-leads', async (req, res) => {
  console.log("Get leads tool call received!");
  const { page, pageSize } = req.body;
  
  try {
    const params = {};
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/leads`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get leads: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Lead
app.post('/api/get-lead', async (req, res) => {
  console.log("Get lead tool call received!");
  const { leadId } = req.body;
  
  if (!leadId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'leadId is required'
      })
    });
  }
  
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/leads/${leadId}`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get lead: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Lead Sources
app.get('/api/get-lead-sources', async (req, res) => {
  console.log("Get lead sources tool call received!");
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/lead_sources`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get lead sources: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Application
app.get('/api/get-application', async (req, res) => {
  console.log("Get application tool call received!");
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/application`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get application: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// List Webhooks
app.get('/api/list-webhooks', async (req, res) => {
  console.log("List webhooks tool call received!");
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/webhooks`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to list webhooks: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Materials
app.post('/api/get-materials', async (req, res) => {
  console.log("Get materials tool call received!");
  const { page, pageSize } = req.body;
  
  try {
    const params = {};
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/materials`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get materials: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Material Categories
app.get('/api/get-material-categories', async (req, res) => {
  console.log("Get material categories tool call received!");
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/material_categories`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get material categories: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Price Forms
app.get('/api/get-price-forms', async (req, res) => {
  console.log("Get price forms tool call received!");
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/price_forms`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get price forms: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Schedule
app.post('/api/get-schedule', async (req, res) => {
  console.log("Get schedule tool call received!");
  const { startDate, showForDays } = req.body;
  
  try {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (showForDays) params.show_for_days = showForDays;
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/schedule`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get schedule: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Events
app.post('/api/get-events', async (req, res) => {
  console.log("Get events tool call received!");
  const { startDate, endDate, page, pageSize } = req.body;
  
  try {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/events`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params
    });
    
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get events: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// GET Tags
app.get('/api/get-tags', async (req, res) => {
  console.log("Get tags tool call received!");
  try {
    const response = await axios.get(`${HOUSECALLPRO_BASE_URL}/tags`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    res.json({ response: JSON.stringify(response.data) });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to get tags: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// CREATE Job
app.post('/api/create-job', async (req, res) => {
  console.log("Create job tool call received!");
  const { customerId, addressId, jobTypeId, scheduledStart, scheduledEnd, arrivalWindow, assignedEmployeeIds, notes, leadSource, invoiceNumber } = req.body;
  
  if (!customerId || !addressId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'customerId and addressId are required'
      })
    });
  }
  
  let jobData = {
    customer_id: customerId,
    address_id: addressId
  };
  try {
    
    if (jobTypeId) {
      jobData.job_fields = { job_type_id: jobTypeId };
    }
    
    if (scheduledStart || scheduledEnd || arrivalWindow) {
      jobData.schedule = {};
      if (scheduledStart) jobData.schedule.scheduled_start = scheduledStart;
      if (scheduledEnd) jobData.schedule.scheduled_end = scheduledEnd;
      if (arrivalWindow) jobData.schedule.arrival_window = arrivalWindow;
    }
    
    if (assignedEmployeeIds) {
      jobData.assigned_employee_ids = assignedEmployeeIds.split(',').map(id => id.trim());
    }
    
    if (notes) jobData.notes = notes;
    if (leadSource) jobData.lead_source = leadSource;
    if (invoiceNumber) jobData.invoice_number = invoiceNumber;
    
    const response = await axios.post(`${HOUSECALLPRO_BASE_URL}/jobs`, jobData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Job created successfully',
        job: response.data
      })
    });
  } catch (error) {
    console.error("Error creating job:", error.message);
    console.error("Request data sent:", JSON.stringify(jobData || {}, null, 2));
    console.error("API Error response:", error.response?.data);
    
    // Provide helpful error message for invalid job types
    let errorMessage = `Failed to create job: ${error.response?.data?.message || error.message}`;
    if (error.response?.data?.error?.message?.includes('No such job type')) {
      errorMessage = `Failed to create job: The job type ID "${jobData.job_fields?.job_type_id}" does not exist. Please use a valid job type ID from your Housecall Pro account.`;
    }
    
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: errorMessage,
        details: error.response?.data || null
      })
    });
  }
});

// CREATE Estimate
app.post('/api/create-estimate', async (req, res) => {
  console.log("Create estimate tool call received!");
  const { customerId, addressId, estimateNumber, note, message, leadSource, assignedEmployeeIds, jobTypeId, scheduledStart, scheduledEnd, arrivalWindowMinutes, notifyCustomer } = req.body;
  
  // At least customer_id or address_id is typically required
  if (!customerId && !addressId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'At least customerId or addressId is required'
      })
    });
  }
  
  let estimateData = {};
  try {
    if (customerId) estimateData.customer_id = customerId;
    if (addressId) estimateData.address_id = addressId;
    if (estimateNumber) estimateData.estimate_number = estimateNumber;
    if (note) estimateData.note = note;
    if (message) estimateData.message = message;
    if (leadSource) estimateData.lead_source = leadSource;
    if (assignedEmployeeIds) {
      estimateData.assigned_employee_ids = assignedEmployeeIds.split(',').map(id => id.trim());
    }
    if (jobTypeId) {
      estimateData.estimate_fields = { job_type_id: jobTypeId };
    }
    
    if (scheduledStart || scheduledEnd || arrivalWindowMinutes !== undefined || notifyCustomer !== undefined) {
      estimateData.schedule = {};
      if (scheduledStart) estimateData.schedule.start_time = scheduledStart;
      if (scheduledEnd) estimateData.schedule.end_time = scheduledEnd;
      if (arrivalWindowMinutes !== undefined) estimateData.schedule.arrival_window_in_minutes = arrivalWindowMinutes;
      if (notifyCustomer !== undefined) estimateData.schedule.notify_customer = notifyCustomer;
    }
    
    // API requires options array - send empty array if not provided
    if (!estimateData.options) {
      estimateData.options = [];
    }
    
    const response = await axios.post(`${HOUSECALLPRO_BASE_URL}/estimates`, estimateData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Estimate created successfully',
        estimate: response.data
      })
    });
  } catch (error) {
    console.error("Error creating estimate:", error.message);
    console.error("Request data sent:", JSON.stringify(estimateData || {}, null, 2));
    console.error("API Error response:", error.response?.data);
    
    // Provide helpful error message for missing options
    let errorMessage = `Failed to create estimate: ${error.response?.data?.message || error.message}`;
    if (error.response?.data?.errors?.options) {
      errorMessage = `Failed to create estimate: The API requires an options array. An empty array has been added automatically.`;
    }
    
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: errorMessage,
        details: error.response?.data || null
      })
    });
  }
});

// CREATE Appointment
app.post('/api/create-appointment', async (req, res) => {
  console.log("Create appointment tool call received!");
  const { jobId, startTime, endTime, dispatchedEmployeeIds, arrivalWindowMinutes } = req.body;
  
  if (!jobId || !startTime || !endTime || !dispatchedEmployeeIds) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'jobId, startTime, endTime, and dispatchedEmployeeIds are required'
      })
    });
  }
  
  try {
    const appointmentData = {
      start_time: startTime,
      end_time: endTime,
      dispatched_employees_ids: dispatchedEmployeeIds.split(',').map(id => id.trim())
    };
    
    if (arrivalWindowMinutes !== undefined) {
      appointmentData.arrival_window_minutes = arrivalWindowMinutes;
    }
    
    const response = await axios.post(`${HOUSECALLPRO_BASE_URL}/jobs/${jobId}/appointments`, appointmentData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Appointment created successfully',
        appointment: response.data
      })
    });
  } catch (error) {
    console.error("Error creating appointment:", error.message);
    console.error("Request data sent:", JSON.stringify(appointmentData, null, 2));
    console.error("API Error response:", error.response?.data);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to create appointment: ${error.response?.data?.message || error.message}`,
        details: error.response?.data || null
      })
    });
  }
});

// CREATE Invoice
app.post('/api/create-invoice', async (req, res) => {
  console.log("Create invoice tool call received!");
  const { jobId, invoiceNumber, invoiceDate, serviceDate, dueDate } = req.body;
  
  if (!jobId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'jobId is required'
      })
    });
  }
  
  try {
    const invoiceData = {};
    if (invoiceNumber) invoiceData.invoice_number = invoiceNumber;
    if (invoiceDate) invoiceData.invoice_date = invoiceDate;
    if (serviceDate) invoiceData.service_date = serviceDate;
    if (dueDate) invoiceData.due_at = dueDate;
    
    const response = await axios.post(`${HOUSECALLPRO_BASE_URL}/jobs/${jobId}/invoices`, invoiceData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Invoice created successfully',
        invoice: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to create invoice: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// CREATE Lead
app.post('/api/create-lead', async (req, res) => {
  console.log("Create lead tool call received!");
  const { customerId, firstName, lastName, email, mobileNumber, addressId, street, city, state, zip, leadSource, assignedEmployeeId, note, tags } = req.body;
  
  if (!customerId && !firstName && !lastName && !email && !mobileNumber) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'Either customerId or customer information (firstName, lastName, email, or mobileNumber) is required'
      })
    });
  }
  
  try {
    const leadData = {};
    
    if (customerId) {
      leadData.customer_id = customerId;
    } else {
      leadData.customer = {};
      if (firstName) leadData.customer.first_name = firstName;
      if (lastName) leadData.customer.last_name = lastName;
      if (email) leadData.customer.email = email;
      if (mobileNumber) leadData.customer.mobile_number = mobileNumber;
    }
    
    if (addressId) {
      leadData.address_id = addressId;
    } else if (street || city || state || zip) {
      leadData.address = {};
      if (street) leadData.address.street = street;
      if (city) leadData.address.city = city;
      if (state) leadData.address.state = state;
      if (zip) leadData.address.zip = zip;
    }
    
    if (leadSource) leadData.lead_source = leadSource;
    if (assignedEmployeeId) leadData.assigned_employee_id = assignedEmployeeId;
    if (note) leadData.note = note;
    if (tags) {
      leadData.tags = tags.split(',').map(t => t.trim()).filter(t => t);
    }
    
    const response = await axios.post(`${HOUSECALLPRO_BASE_URL}/leads`, leadData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Lead created successfully',
        lead: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to create lead: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// CREATE Tag
app.post('/api/create-tag', async (req, res) => {
  console.log("Create tag tool call received!");
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'name is required'
      })
    });
  }
  
  try {
    const response = await axios.post(`${HOUSECALLPRO_BASE_URL}/tags`, { name }, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Tag created successfully',
        tag: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to create tag: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// REGISTER Webhook
app.post('/api/register-webhook', async (req, res) => {
  console.log("Register webhook tool call received!");
  const { webhookUrl } = req.body;
  
  if (!webhookUrl) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'webhookUrl is required'
      })
    });
  }
  
  try {
    const response = await axios.post(`${HOUSECALLPRO_BASE_URL}/webhooks/subscription`, { url: webhookUrl }, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Webhook registered successfully',
        webhook: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to register webhook: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// UPDATE Customer
app.post('/api/update-customer', async (req, res) => {
  console.log("Update customer tool call received!");
  const { customerId, firstName, lastName, email, company, mobileNumber, homeNumber, workNumber, notificationsEnabled, leadSource, notes, tags } = req.body;
  
  if (!customerId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'customerId is required'
      })
    });
  }
  
  try {
    const customerData = {};
    if (firstName !== undefined) customerData.first_name = firstName;
    if (lastName !== undefined) customerData.last_name = lastName;
    if (email !== undefined) customerData.email = email;
    if (company !== undefined) customerData.company = company;
    if (mobileNumber !== undefined) customerData.mobile_number = mobileNumber;
    if (homeNumber !== undefined) customerData.home_number = homeNumber;
    if (workNumber !== undefined) customerData.work_number = workNumber;
    if (notificationsEnabled !== undefined) customerData.notifications_enabled = notificationsEnabled;
    if (leadSource !== undefined) customerData.lead_source = leadSource;
    if (notes !== undefined) customerData.notes = notes;
    if (tags) {
      customerData.tags = tags.split(',').map(t => t.trim()).filter(t => t);
    }
    
    const response = await axios.put(`${HOUSECALLPRO_BASE_URL}/customers/${customerId}`, customerData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Customer updated successfully',
        customer: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to update customer: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// UPDATE Estimate
app.post('/api/update-estimate', async (req, res) => {
  console.log("Update estimate tool call received!");
  const { estimateId, note, message, leadSource, assignedEmployeeIds } = req.body;
  
  if (!estimateId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'estimateId is required'
      })
    });
  }
  
  try {
    const estimateData = {};
    if (note !== undefined) estimateData.note = note;
    if (message !== undefined) estimateData.message = message;
    if (leadSource !== undefined) estimateData.lead_source = leadSource;
    if (assignedEmployeeIds) {
      estimateData.assigned_employee_ids = assignedEmployeeIds.split(',').map(id => id.trim());
    }
    
    const response = await axios.put(`${HOUSECALLPRO_BASE_URL}/estimates/${estimateId}`, estimateData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Estimate updated successfully',
        estimate: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to update estimate: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// UPDATE Job
app.post('/api/update-job', async (req, res) => {
  console.log("Update job tool call received!");
  const { jobId, notes, leadSource, scheduledStart, scheduledEnd, arrivalWindow, assignedEmployeeIds, tags, jobTypeId } = req.body;
  
  if (!jobId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'jobId is required'
      })
    });
  }
  
  try {
    const jobData = {};
    if (notes !== undefined) jobData.notes = notes;
    if (leadSource !== undefined) jobData.lead_source = leadSource;
    if (tags) {
      jobData.tags = tags.split(',').map(t => t.trim()).filter(t => t);
    }
    if (jobTypeId) {
      jobData.job_fields = { job_type_id: jobTypeId };
    }
    
    if (scheduledStart || scheduledEnd || arrivalWindow !== undefined) {
      jobData.schedule = {};
      if (scheduledStart) jobData.schedule.scheduled_start = scheduledStart;
      if (scheduledEnd) jobData.schedule.scheduled_end = scheduledEnd;
      if (arrivalWindow !== undefined) jobData.schedule.arrival_window = arrivalWindow;
    }
    
    if (assignedEmployeeIds) {
      jobData.assigned_employee_ids = assignedEmployeeIds.split(',').map(id => id.trim());
    }
    
    const response = await axios.put(`${HOUSECALLPRO_BASE_URL}/jobs/${jobId}`, jobData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Job updated successfully',
        job: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to update job: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// UPDATE Appointment
app.post('/api/update-appointment', async (req, res) => {
  console.log("Update appointment tool call received!");
  const { appointmentId, startTime, endTime, dispatchedEmployeeIds, arrivalWindowMinutes } = req.body;
  
  if (!appointmentId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'appointmentId is required'
      })
    });
  }
  
  try {
    // Need to find which job this appointment belongs to
    const jobsResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params: { page: 1, page_size: 100, expand: ['appointments'] }
    });
    
    let jobId = null;
    const jobs = jobsResponse.data.jobs || [];
    for (const job of jobs) {
      if (job.appointments) {
        const appointment = job.appointments.find(a => a.id === appointmentId || a.uuid === appointmentId);
        if (appointment) {
          jobId = job.id;
          break;
        }
      }
    }
    
    if (!jobId) {
      return res.status(404).json({
        response: JSON.stringify({
          status: 'not_found',
          message: 'Appointment not found'
        })
      });
    }
    
    const appointmentData = {};
    if (startTime) appointmentData.start_time = startTime;
    if (endTime) appointmentData.end_time = endTime;
    if (dispatchedEmployeeIds) {
      appointmentData.dispatched_employees_ids = dispatchedEmployeeIds.split(',').map(id => id.trim());
    }
    if (arrivalWindowMinutes !== undefined) appointmentData.arrival_window_minutes = arrivalWindowMinutes;
    
    const response = await axios.put(`${HOUSECALLPRO_BASE_URL}/jobs/${jobId}/appointments/${appointmentId}`, appointmentData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Appointment updated successfully',
        appointment: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to update appointment: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// UPDATE Invoice
app.post('/api/update-invoice', async (req, res) => {
  console.log("Update invoice tool call received!");
  const { invoiceId, invoiceDate, serviceDate, dueDate } = req.body;
  
  if (!invoiceId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'invoiceId is required'
      })
    });
  }
  
  try {
    // Need to find which job this invoice belongs to
    const jobsResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs`, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json'
      },
      params: { page: 1, page_size: 100 }
    });
    
    let jobId = null;
    const jobs = jobsResponse.data.jobs || [];
    for (const job of jobs) {
      const invoicesResponse = await axios.get(`${HOUSECALLPRO_BASE_URL}/jobs/${job.id}/invoices`, {
        headers: {
          'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      const invoices = invoicesResponse.data.invoices || [];
      const invoice = invoices.find(i => i.id === invoiceId || i.uuid === invoiceId);
      if (invoice) {
        jobId = job.id;
        break;
      }
    }
    
    if (!jobId) {
      return res.status(404).json({
        response: JSON.stringify({
          status: 'not_found',
          message: 'Invoice not found'
        })
      });
    }
    
    const invoiceData = {};
    if (invoiceDate) invoiceData.invoice_date = invoiceDate;
    if (serviceDate) invoiceData.service_date = serviceDate;
    if (dueDate) invoiceData.due_at = dueDate;
    
    const response = await axios.put(`${HOUSECALLPRO_BASE_URL}/jobs/${jobId}/invoices/${invoiceId}`, invoiceData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Invoice updated successfully',
        invoice: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to update invoice: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// UPDATE Lead
app.post('/api/update-lead', async (req, res) => {
  console.log("Update lead tool call received!");
  const { leadId, leadSource, assignedEmployeeId, note, tags } = req.body;
  
  if (!leadId) {
    return res.status(400).json({
      response: JSON.stringify({
        status: 'error',
        message: 'leadId is required'
      })
    });
  }
  
  try {
    const leadData = {};
    if (leadSource !== undefined) leadData.lead_source = leadSource;
    if (assignedEmployeeId !== undefined) leadData.assigned_employee_id = assignedEmployeeId;
    if (note !== undefined) leadData.note = note;
    if (tags) {
      leadData.tags = tags.split(',').map(t => t.trim()).filter(t => t);
    }
    
    const response = await axios.put(`${HOUSECALLPRO_BASE_URL}/leads/${leadId}`, leadData, {
      headers: {
        'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Lead updated successfully',
        lead: response.data
      })
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to update lead: ${error.response?.data?.message || error.message}`
      })
    });
  }
});

// DELETE Webhook
app.post('/api/delete-webhook', async (req, res) => {
  console.log("Delete webhook tool call received!");
  const { webhookId } = req.body;
  
  try {
    if (webhookId) {
      // Delete specific webhook (if API supports it)
      await axios.delete(`${HOUSECALLPRO_BASE_URL}/webhooks/${webhookId}`, {
        headers: {
          'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
          'Accept': 'application/json'
        }
      });
    } else {
      // Delete webhook subscription
      await axios.delete(`${HOUSECALLPRO_BASE_URL}/webhooks/subscription`, {
        headers: {
          'Authorization': `Token ${HOUSECALLPRO_API_KEY}`,
          'Accept': 'application/json'
        }
      });
    }
    
    res.json({
      response: JSON.stringify({
        status: 'success',
        message: 'Webhook deleted successfully'
      })
    });
  } catch (error) {
    console.error("Error deleting webhook:", error.message);
    console.error("Request body:", req.body);
    console.error("API Error response:", error.response?.data);
    res.status(error.response?.status || 500).json({
      response: JSON.stringify({
        status: "error",
        message: `Failed to delete webhook: ${error.response?.data?.message || error.message}`,
        details: error.response?.data || null
      })
    });
  }
});

// Start the server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server listening on port ${port}`);
  console.log("Ready to receive ElevenLabs Tool Calls.");
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown for Railway
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});