const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: 'Bearer ' + token }),
  };
};

const handleRes = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const fetchCycles = async () => {
  const res = await fetch(API + '/api/cycles', { headers: getHeaders() });
  return handleRes(res);
};

export const fetchCurrentCycles = async () => {
  const res = await fetch(API + '/api/cycles/current', { headers: getHeaders() });
  return handleRes(res);
};

export const fetchCyclesByYear = async (year) => {
  const res = await fetch(API + '/api/cycles/year/' + year, { headers: getHeaders() });
  return handleRes(res);
};

export const fetchCycleById = async (id) => {
  const res = await fetch(API + '/api/cycles/' + id, { headers: getHeaders() });
  return handleRes(res);
};

export const createCycle = async (data) => {
  const res = await fetch(API + '/api/cycles', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(res);
};

export const updateCycle = async (id, data) => {
  const res = await fetch(API + '/api/cycles/' + id, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(res);
};

export const deleteCycle = async (id) => {
  const res = await fetch(API + '/api/cycles/' + id, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleRes(res);
};

export const openCycle = async (id) => {
  const res = await fetch(API + '/api/cycles/' + id + '/open', {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleRes(res);
};

export const closeCycle = async (id) => {
  const res = await fetch(API + '/api/cycles/' + id + '/close', {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleRes(res);
};