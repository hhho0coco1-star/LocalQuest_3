const trimTrailingSlash = (value) => (value || '').replace(/\/+$/, '');

export const resolveBackendBaseUrl = () => {
  const configured = trimTrailingSlash(process.env.REACT_APP_API_BASE_URL);
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port, origin } = window.location;
    if (port === '3000') {
      return `${protocol}//${hostname}:8080`;
    }
    return origin;
  }

  return 'http://localhost:8080';
};

export const buildBackendUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${resolveBackendBaseUrl()}${normalizedPath}`;
};
