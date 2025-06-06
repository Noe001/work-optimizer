// デバッグユーティリティ
class Debug {
  private static enabled = import.meta.env.DEV;

  static log(label: string, data?: any) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const style = 'color: #2563eb; font-weight: bold;';
    
    if (data !== undefined) {
      console.log(`%c[${timestamp}] ${label}`, style, data);
    } else {
      console.log(`%c[${timestamp}] ${label}`, style);
    }
  }

  static api(method: string, url: string, data?: any, response?: any) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const methodColor = method === 'GET' ? '#10b981' : method === 'POST' ? '#3b82f6' : '#f59e0b';
    
    console.group(`%c[${timestamp}] API ${method} ${url}`, `color: ${methodColor}; font-weight: bold;`);
    if (data) console.log('Request:', data);
    if (response) console.log('Response:', response);
    console.groupEnd();
  }

  static error(label: string, error: any) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toLocaleTimeString();
    console.group(`%c[${timestamp}] ERROR: ${label}`, 'color: #dc2626; font-weight: bold;');
    console.error('Error:', error);
    if (error?.response) console.error('Response:', error.response);
    if (error?.stack) console.error('Stack:', error.stack);
    console.groupEnd();
  }

  static state(component: string, label: string, data: any) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`%c[${timestamp}] ${component} - ${label}`, 'color: #7c3aed; font-weight: bold;', data);
  }
}

export default Debug; 
