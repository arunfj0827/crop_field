import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8080/api',
});

export const getPredictions = () => API.get('/predictions');
export const predictYield = (data: any) => API.post('/predictions', data);
