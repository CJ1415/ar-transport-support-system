const API_BASE_URL = import.meta.env.VITE_API_URL
console.log(API_BASE_URL)

export const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`,
        {...options, headers}
    );

    if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login' // this forces reauthentication if the token expires
    };

    return response.json()
};