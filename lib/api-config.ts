// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-gateway-url.amazonaws.com/prod' // Replace with your actual API Gateway URL
  : 'http://localhost:3000/api'; // For local development

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    products: `${API_BASE_URL}/products`,
    customers: `${API_BASE_URL}/customers`,
    orders: `${API_BASE_URL}/orders`,
    debug: `${API_BASE_URL}/debug`,
  }
};

export default apiConfig;
