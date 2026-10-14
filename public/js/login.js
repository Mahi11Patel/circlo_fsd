/**
 * Circlo – User Login Logic (public/js/login.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    form: {
      username: '',
      password: ''
    },
    errors: {
      username: '',
      password: ''
    },
    loading: false,
    serverError: null,
    successMsg: null,
    currentUser: API.getUser()
  },
  mounted() {
    // If already logged in, notify or redirect
    if (this.currentUser) {
      window.showToast('You are already logged in as ' + (this.currentUser.full_name || this.currentUser.username), 'info');
    }
  },
  methods: {
    validate() {
      let isValid = true;
      this.errors = { username: '', password: '' };
      this.serverError = null;

      if (!this.form.username.trim()) {
        this.errors.username = 'Username or email is required.';
        isValid = false;
      }

      if (!this.form.password) {
        this.errors.password = 'Password is required.';
        isValid = false;
      }

      return isValid;
    },
    async handleLogin() {
      if (!this.validate()) {
        return;
      }

      this.loading = true;
      this.serverError = null;

      try {
        const payload = {
          username: this.form.username.trim(),
          password: this.form.password
        };

        const res = await API.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.token && res.user) {
          API.setAuth(res.token, res.user);
          this.currentUser = res.user;
          this.successMsg = 'Login successful! Redirecting...';
          window.showToast('Welcome back, ' + (res.user.full_name || res.user.username) + '!', 'success');

          setTimeout(() => {
            if (res.user.role === 'admin') {
              window.location.href = 'admin.html';
            } else {
              window.location.href = 'items.html';
            }
          }, 800);
        } else {
          throw new Error('Invalid response from authentication server.');
        }
      } catch (err) {
        this.serverError = err.message || 'Authentication failed. Please verify your credentials.';
      } finally {
        this.loading = false;
      }
    },
    fillDemo(role) {
      this.errors = { username: '', password: '' };
      this.serverError = null;
      this.form.password = '1234';

      switch (role) {
        case 'student':
          this.form.username = 'student';
          break;
        case 'priya':
          this.form.username = 'priya';
          break;
        case 'admin':
          this.form.username = 'admin';
          break;
        case 'spammer':
          this.form.username = 'spammer';
          break;
        default:
          this.form.username = 'student';
      }
      window.showToast(`Pre-filled credentials for ${role}`, 'info', 1500);
    }
  }
});
