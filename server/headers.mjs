// Header keamanan untuk respons API. Header untuk file statis diatur di vercel.json (nilai CSP sama).
export const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co; frame-src https://www.youtube-nocookie.com https://docs.google.com https://drive.google.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'";
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': csp
};
export const mimeTypes = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'};
