// src/api/axios.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Rails API サーバーの URL

export const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
