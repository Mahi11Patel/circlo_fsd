/**
 * Circlo – The Community Sharing Network
 * Shared Utilities, Directives & API Client (Practical-7)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

// --------------------------------------------------------------------
// 1. Practical-7 Custom Directive: Format Dates into Human-Readable Text
// --------------------------------------------------------------------
Vue.directive('format-date', {
  inserted: function(el, binding) {
    if (!binding.value) {
      el.textContent = 'N/A';
      return;
    }
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    try {
      const d = new Date(binding.value);
      el.textContent = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', options);
    } catch (e) {
      el.textContent = 'N/A';
    }
  },
  update: function(el, binding) {
    if (!binding.value) {
      el.textContent = 'N/A';
      return;
    }
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    try {
      const d = new Date(binding.value);
      el.textContent = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', options);
    } catch (e) {
      el.textContent = 'N/A';
    }
  }
});

// --------------------------------------------------------------------
// 2. Practical-7 Custom Directive: Uppercase badge/status on click or load
// --------------------------------------------------------------------
Vue.directive('uppercase', {
  bind(el) {
    el.style.textTransform = 'uppercase';
    el.style.letterSpacing = '0.5px';
  }
});

// --------------------------------------------------------------------
// 3. Central Auth Token & API Helpers
// --------------------------------------------------------------------
const API = {
  getToken() {
    return localStorage.getItem('circlo_token');
  },
  getUser() {
    try {
      const u = localStorage.getItem('circlo_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },
  setAuth(token, user) {
    localStorage.setItem('circlo_token', token);
    localStorage.setItem('circlo_user', JSON.stringify(user));
  },
  clearAuth() {
    localStorage.removeItem('circlo_token');
    localStorage.removeItem('circlo_user');
  },
  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    try {
      const res = await fetch(endpoint, { credentials: 'omit', ...options, headers });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = { message: res.statusText };
      }

      if (!res.ok) {
        // Handle 401 Unauthorized / Expired Session
        if (res.status === 401) {
          if (endpoint !== '/api/auth/login') {
            window.showToast('Session expired or unauthorized. Please log in again.', 'warning');
            API.clearAuth();
          }
        }
        // Handle 403 Forbidden
        if (res.status === 403) {
          window.showToast('Access denied: ' + (data.message || 'Forbidden'), 'error');
        }
        throw new Error(data.message || 'Request failed with status ' + res.status);
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  // Helper to resolve image paths whether in root or inside /pages/
  resolveImageUrl(url) {
    if (!url) return this.isPagesDir() ? '../images/placeholder.svg' : 'images/placeholder.svg';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    // Clean leading slash
    let clean = url.startsWith('/') ? url.slice(1) : url;
    
    // Fallback to SVG if png requested and not found
    if (clean.endsWith('.png')) {
      const svgAlt = clean.replace('.png', '.svg');
      return this.isPagesDir() ? '../' + svgAlt : svgAlt;
    }
    return this.isPagesDir() ? '../' + clean : clean;
  },

  isPagesDir() {
    return window.location.pathname.includes('/pages/');
  }
};

// --------------------------------------------------------------------
// 4. Global Toast Notification System
// --------------------------------------------------------------------
window.showToast = function(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }, duration);
};

// --------------------------------------------------------------------
// 5. Global Helpers for Vue Instances
// --------------------------------------------------------------------
window.CircloMixins = {
  data() {
    return {
      mobileMenuOpen: false
    };
  },
  computed: {
    userInitial() {
      if (!this.currentUser) return '?';
      const name = this.currentUser.full_name || this.currentUser.username || '';
      return name.charAt(0).toUpperCase();
    },
    isAdmin() {
      return this.currentUser && this.currentUser.role === 'admin';
    }
  },
  methods: {
    logout() {
      API.clearAuth();
      window.showToast('You have been logged out safely.', 'info');
      setTimeout(() => {
        if (API.isPagesDir()) {
          window.location.href = 'login.html';
        } else {
          window.location.href = 'pages/login.html';
        }
      }, 400);
    },
    resolveImage(url) {
      return API.resolveImageUrl(url);
    },
    handleImgFallback(event) {
      const fallback = API.isPagesDir() ? '../images/placeholder.svg' : 'images/placeholder.svg';
      if (event.target.src !== fallback) {
        event.target.src = fallback;
      }
    },
    formatCondition(cond) {
      if (!cond) return 'Good';
      return cond.replace('_', ' ');
    },
    getStatusBadgeClass(status) {
      switch (status) {
        case 'active':
        case 'approved':
        case 'returned':
          return 'badge badge-success';
        case 'pending':
        case 'borrowed':
          return 'badge badge-warning';
        case 'rejected':
        case 'blocked':
        case 'cancelled':
          return 'badge badge-danger';
        default:
          return 'badge badge-neutral';
      }
    }
  }
};
