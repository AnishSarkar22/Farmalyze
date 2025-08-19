/**
 * Helper functions for managing user activities with Turso backend
 */

/**
 * Creates a new activity record
 * @param {Object} activityData - The activity data
 * @param {string} activityData.activity_type - Type: 'crop', 'fertilizer', 'disease'
 * @param {string} activityData.title - Activity title
 * @param {string} activityData.result - HTML formatted result
 * @param {Object} activityData.details - Additional details object
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Object>} Response from the API
 */
export const createActivity = async (activityData, token) => {
  try {
    console.log('Creating activity with data:', activityData);
    console.log('Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      throw new Error('Authentication token is required');
    }
    
    if (!activityData.activity_type || !activityData.title) {
      throw new Error('activity_type and title are required');
    }
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        activity_type: activityData.activity_type,
        title: activityData.title,
        result: activityData.result || '',
        details: activityData.details || {},
        status: activityData.status || 'completed'
      }),
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: Failed to create activity`);
    }

    return data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

/**
 * Fetches user activities with pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.type - Filter by activity type (optional)
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Object>} Activities data with pagination info
 */
export const fetchActivities = async (options = {}, token) => {
  try {
    const { page = 1, limit = 10, type } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (type) {
      params.append('type', type);
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/activities?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch activities');
    }

    return data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

/**
 * Formats activity data for consistent structure
 * @param {Object} rawActivity - Raw activity data from API
 * @returns {Object} Formatted activity object
 */
export const formatActivity = (rawActivity) => {
  return {
    id: rawActivity.id,
    type: rawActivity.activity_type,
    title: rawActivity.title,
    date: rawActivity.created_at,
    status: rawActivity.status,
    result: rawActivity.result,
    details: typeof rawActivity.details === 'string' 
      ? JSON.parse(rawActivity.details) 
      : rawActivity.details,
  };
};

/**
 * Creates activity data for crop recommendation
 * @param {Object} formData - Form input data
 * @param {Object} apiResponse - API response data
 * @returns {Object} Formatted activity data
 */
export const createCropActivityData = (formData, apiResponse) => {
  try {
    console.log('Creating crop activity data with:', { formData, apiResponse });
    
    const recommendedCrop = apiResponse.recommendedCrop?.name || 
                          apiResponse.primary_recommendation || 
                          apiResponse.prediction || 
                          'Unknown';
    
    const recommendationsToStore = Array.isArray(apiResponse.recommendations)
      ? apiResponse.recommendations
      : Array.isArray(apiResponse.alternatives)
      ? apiResponse.alternatives.map((alt) => ({
          crop: alt.name,
          confidence: alt.confidence,
        }))
      : [{ crop: recommendedCrop, confidence: apiResponse.recommendedCrop?.confidence || 0 }];

    const activityData = {
      activity_type: "crop",
      title: `Crop Recommendation for ${formData.city || 'Unknown Location'}`,
      result: `Recommended crop: ${recommendedCrop}`,
      details: {
        nitrogen: parseFloat(formData.nitrogen) || 0,
        phosphorus: parseFloat(formData.phosphorus) || 0,
        potassium: parseFloat(formData.potassium) || 0,
        ph: parseFloat(formData.ph) || 0,
        rainfall: parseFloat(formData.rainfall) || 0,
        city: formData.city || '',
        recommended_crop: {
          name: recommendedCrop,
          confidence: apiResponse.recommendedCrop?.confidence || 0,
          description: apiResponse.recommendedCrop?.description || `${recommendedCrop} is suitable for your conditions.`
        },
        recommendations: recommendationsToStore,
        alternatives: apiResponse.alternatives || [],
        soil_health: apiResponse.soilHealth || "Good",
        soil_health_description: apiResponse.soilHealthDescription || "Soil conditions are suitable for farming.",
        conditions: {
          temperature: apiResponse.conditions?.temperature || apiResponse.soil_data?.temperature || "N/A",
          humidity: apiResponse.conditions?.humidity || apiResponse.soil_data?.humidity || "N/A",
          soil_health: apiResponse.conditions?.soil_health || apiResponse.soilHealth || "Good"
        }
      }
    };

    console.log('Generated activity data:', activityData);
    return activityData;
  } catch (error) {
    console.error('Error creating crop activity data:', error);
    throw error;
  }
};

/**
 * Creates activity data for fertilizer recommendation
 * @param {Object} formData - Form input data
 * @param {string} recommendation - Fertilizer recommendation result
 * @returns {Object} Formatted activity data
 */
export const createFertilizerActivityData = (formData, recommendation) => {
  return {
    activity_type: "fertilizer",
    title: `Fertilizer Analysis for ${formData.cropname || 'Unknown Crop'}`,
    result: recommendation || 'No recommendation available',
    details: {
      nitrogen: parseFloat(formData.nitrogen) || 0,
      phosphorus: parseFloat(formData.phosphorus) || 0,
      potassium: parseFloat(formData.potassium) || 0,
      soil_type: formData.soiltype || '',
      crop_name: formData.cropname || '',
    }
  };
};

/**
 * Creates activity data for disease detection
 * @param {Object} apiResponse - API response data
 * @returns {Object} Formatted activity data
 */
export const createDiseaseActivityData = (apiResponse) => {
  return {
    activity_type: "disease",
    title: "Disease Detection Analysis",
    result: apiResponse.prediction || 'No prediction available',
    details: {
      disease_name: apiResponse.disease_info?.name || apiResponse.prediction || 'Unknown',
      confidence: apiResponse.disease_info?.confidence || apiResponse.confidence || 0,
      disease_info: apiResponse.disease_info || {},
    }
  };
};