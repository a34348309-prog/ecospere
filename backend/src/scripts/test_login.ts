
import axios from 'axios';

const API_URL = 'http://localhost:5000/auth/login';

async function testLogin() {
    try {
        const response = await axios.post(API_URL, {
            email: 'alex.j@example.com',
            password: 'password123'
        });
        console.log('Login successful:', response.data);
    } catch (error: any) {
        console.error('Login failed:', error.response?.data || error.message);
    }
}

testLogin();
