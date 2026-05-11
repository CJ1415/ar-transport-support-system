const API_BASE_URL = import.meta.env.VITE_API_URL
console.log("API Base URL:", API_BASE_URL)

export const apiRequest = async (endpoint, options = {}) => {
    // FIXED: Swapped to sessionStorage to align with new security structure
    const token = sessionStorage.getItem('token');

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
        // FIXED: Clear from sessionStorage and redirect
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        window.location.href = '/login' // forces reauthentication if the token expires
    };

    return response.json()
};