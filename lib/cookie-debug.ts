export const debugCookies = () => {
  if (typeof window === 'undefined') return {}

  // HttpOnly cookies WON'T appear in document.cookie - this is EXPECTED!
  console.log('[COOKIE DEBUG] Visible cookies only:', document.cookie)
  console.log('[COOKIE DEBUG] Location info:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    origin: window.location.origin
  })
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) acc[name] = value
    return acc
  }, {} as Record<string, string>)
  
  console.log('[COOKIE DEBUG] Parsed cookies:', cookies)
  console.log('[COOKIE DEBUG] NOTE: auth-token is httpOnly and managed by server/middleware')
  
  return cookies
}

export const pollCookieChanges = (callback: (cookies: Record<string, string>) => void) => {
  console.log('[COOKIE DEBUG] HttpOnly cookies are handled by server - not visible in client')
  
  if (typeof window === 'undefined') return

  const cookies = debugCookies()
  callback(cookies)
}
