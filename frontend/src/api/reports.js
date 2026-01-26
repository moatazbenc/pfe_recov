const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getHeaders = (isForm) => {
  const token = localStorage.getItem('token');
  const h = {};
  if (token) h.Authorization = 'Bearer ' + token;
  if (!isForm) h['Content-Type'] = 'application/json';
  return h;
};

const handleRes = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const submitReport = async (data) => {
  const res = await fetch(API + '/api/reports', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(res);
};

export const fetchMyReports = async (cycleId) => {
  const res = await fetch(API + '/api/reports/my/' + cycleId, { headers: getHeaders() });
  return handleRes(res);
};

export const fetchReportById = async (id) => {
  const res = await fetch(API + '/api/reports/' + id, { headers: getHeaders() });
  return handleRes(res);
};

export const uploadAttachments = async (reportId, files) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const res = await fetch(API + '/api/reports/' + reportId + '/attachments', {
    method: 'POST',
    headers: getHeaders(true),
    body: formData,
  });
  return handleRes(res);
};

export const deleteAttachment = async (reportId, attachmentId) => {
  const res = await fetch(API + '/api/reports/' + reportId + '/attachments/' + attachmentId, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleRes(res);
};

export const fetchReportsByCycle = async (cycleId) => {
  const res = await fetch(API + '/api/reports/cycle/' + cycleId, { headers: getHeaders() });
  return handleRes(res);
};

export const reviewReport = async (reportId, data) => {
  const res = await fetch(API + '/api/reports/' + reportId + '/review', {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(res);
};