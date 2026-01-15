import axios from 'axios';

const baseURL = process.env.API_BASE_URL || 'https://api.demo-ecommerce.com/v1';
const bearerToken = process.env.BEARER_TOKEN;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    ...(bearerToken && { 'Authorization': `Bearer ${bearerToken}` }),
  },
});

// Add interceptors for logging/retries if needed
