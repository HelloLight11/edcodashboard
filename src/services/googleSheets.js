/**
 * Google Sheets API Service
 * Handles all communication with Google Apps Script backend
 */

const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

// Helper function for GET requests
async function fetchGet(params) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_URL}?${queryString}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data;
  } catch (error) {
    console.error('API GET Error:', error);
    throw error;
  }
}

// Helper function for POST requests
async function fetchPost(body) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // Apps Script requires text/plain for CORS
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data || data;
  } catch (error) {
    console.error('API POST Error:', error);
    throw error;
  }
}

// ============ Authentication ============

export async function loginUser(email, password) {
  return fetchGet({
    action: 'login',
    email,
    password,
  });
}

// ============ Customers ============

export async function getCustomers() {
  return fetchGet({
    action: 'getAll',
    sheet: 'Customers',
  });
}

export async function getCustomerById(id) {
  return fetchGet({
    action: 'getById',
    sheet: 'Customers',
    id,
  });
}

export async function addCustomer(customer) {
  return fetchPost({
    action: 'create',
    sheet: 'Customers',
    record: customer,
  });
}

export async function updateCustomer(id, customer) {
  return fetchPost({
    action: 'update',
    sheet: 'Customers',
    id,
    record: customer,
  });
}

export async function deleteCustomer(id) {
  return fetchPost({
    action: 'delete',
    sheet: 'Customers',
    id,
  });
}

// ============ Projects ============

export async function getProjects() {
  return fetchGet({
    action: 'getAll',
    sheet: 'Projects',
  });
}

export async function getProjectById(id) {
  return fetchGet({
    action: 'getById',
    sheet: 'Projects',
    id,
  });
}

export async function addProject(project) {
  return fetchPost({
    action: 'create',
    sheet: 'Projects',
    record: project,
  });
}

export async function updateProject(id, project) {
  return fetchPost({
    action: 'update',
    sheet: 'Projects',
    id,
    record: project,
  });
}

export async function deleteProject(id) {
  return fetchPost({
    action: 'delete',
    sheet: 'Projects',
    id,
  });
}

// ============ Equipment ============

export async function getEquipment(projectId) {
  return fetchGet({
    action: 'getByProject',
    sheet: 'Equipment',
    projectId,
  });
}

export async function getAllEquipment() {
  return fetchGet({
    action: 'getAll',
    sheet: 'Equipment',
  });
}

export async function addEquipment(equipment) {
  return fetchPost({
    action: 'create',
    sheet: 'Equipment',
    record: equipment,
  });
}

export async function deleteEquipment(id) {
  return fetchPost({
    action: 'delete',
    sheet: 'Equipment',
    id,
  });
}

// ============ Work Days ============

export async function getWorkDays(projectId) {
  return fetchGet({
    action: 'getByProject',
    sheet: 'WorkDays',
    projectId,
  });
}

export async function getAllWorkDays() {
  return fetchGet({
    action: 'getAll',
    sheet: 'WorkDays',
  });
}

export async function addWorkDay(workDay) {
  return fetchPost({
    action: 'create',
    sheet: 'WorkDays',
    record: workDay,
  });
}

export async function deleteWorkDay(id) {
  return fetchPost({
    action: 'delete',
    sheet: 'WorkDays',
    id,
  });
}

// ============ Payments ============

export async function getPayments(projectId) {
  return fetchGet({
    action: 'getByProject',
    sheet: 'Payments',
    projectId,
  });
}

export async function getAllPayments() {
  return fetchGet({
    action: 'getAll',
    sheet: 'Payments',
  });
}

export async function addPayment(payment) {
  return fetchPost({
    action: 'create',
    sheet: 'Payments',
    record: payment,
  });
}

export async function deletePayment(id) {
  return fetchPost({
    action: 'delete',
    sheet: 'Payments',
    id,
  });
}

// ============ Photos ============

export async function getPhotos(projectId) {
  return fetchGet({
    action: 'getByProject',
    sheet: 'Photos',
    projectId,
  });
}

export async function getAllPhotos() {
  return fetchGet({
    action: 'getAll',
    sheet: 'Photos',
  });
}

export async function addPhoto(photo) {
  return fetchPost({
    action: 'create',
    sheet: 'Photos',
    record: photo,
  });
}

export async function deletePhoto(id) {
  return fetchPost({
    action: 'delete',
    sheet: 'Photos',
    id,
  });
}

// ============ Users ============

export async function getUsers() {
  return fetchGet({
    action: 'getAll',
    sheet: 'Users',
  });
}

export async function updateUser(id, user) {
  return fetchPost({
    action: 'update',
    sheet: 'Users',
    id,
    record: user,
  });
}

// ============ Utility Functions ============

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
