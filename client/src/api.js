const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || payload.message || 'Something went wrong. Please try again.');
    error.status = response.status;
    throw error;
  }
  return payload;
}
