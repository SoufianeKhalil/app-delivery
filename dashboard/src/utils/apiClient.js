import  api  from './api'

// ============ PRODUCTS API ============
export const productsAPI = {
  // Get all products (with optional filters)
  getAll: (params = {}) =>
    api.get('/products/', { params }),

  // Get product by ID
  getById: (id) =>
    api.get(`/products/${id}`),

  // Get categories
  getCategories: () =>
    api.get('/products/categories/all'),

  // Get products by merchant
  getByMerchant: (merchantId, params = {}) =>
    api.get(`/products/merchant/${merchantId}`, { params })
}

// ============ ORDERS API ============
export const ordersAPI = {
  // Create new order
  create: (data) =>
    api.post('/orders/', data),

  // Get user's orders
  getMyOrders: (params = {}) =>
    api.get('/orders/my-orders', { params }),

  // Get order details
  getById: (id) =>
    api.get(`/orders/${id}`),

  // Cancel order
  cancel: (id) =>
    api.post(`/orders/${id}/cancel`),

  // Update order status (admin)
  updateStatus: (id, statut) =>
    api.put(`/orders/${id}/status`, { statut })
}

// ============ AUTH API ============
export const authAPI = {
  // Register new user
  register: (data) =>
    api.post('/auth/register', data),

  // Login
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  // Get current user
  getMe: () =>
    api.get('/auth/me'),

  // Logout
  logout: () =>
    api.post('/auth/logout')
}

// ============ USERS API ============
export const usersAPI = {
  // Get user profile
  getProfile: () =>
    api.get('/users/profile'),

  // Update user profile
  updateProfile: (data) =>
    api.put('/users/profile', data),

  // Change password
  changePassword: (data) =>
    api.put('/users/change-password', data),

  // Get user addresses
  getAddresses: () =>
    api.get('/users/addresses'),

  // Add user address
  addAddress: (data) =>
    api.post('/users/addresses', data),

  // Update address
  updateAddress: (id, data) =>
    api.put(`/users/addresses/${id}`, data),

  // Delete address
  deleteAddress: (id) =>
    api.delete(`/users/addresses/${id}`)
}
