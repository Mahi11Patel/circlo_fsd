/**
 * Circlo – User Registration Logic (public/js/register.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    form: {
      username: '',
      email: '',
      password: '',
      full_name: '',
      phone: '',
      location: ''
    },
    errors: {
      username: '',
      email: '',
      password: '',
      full_name: '',
      location: ''
    },
    loading: false,
    serverError: null,
    successMsg: null,
    currentUser: API.getUser()
  },
  methods: {
    validate() {
      let isValid = true;
      this.errors = {
        username: '',
        email: '',
        password: '',
        full_name: '',
        location: ''
      };
      this.serverError = null;

      if (!this.form.full_name.trim()) {
        this.errors.full_name = 'Full name is required.';
        isValid = false;
      }

      if (!this.form.username.trim()) {
        this.errors.username = 'Username is required.';
        isValid = false;
      } else if (this.form.username.trim().length < 3) {
        this.errors.username = 'Username must be at least 3 characters.';
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.form.email.trim()) {
        this.errors.email = 'Email address is required.';
        isValid = false;
      } else if (!emailRegex.test(this.form.email.trim())) {
        this.errors.email = 'Please provide a valid email format (e.g. name@domain.com).';
        isValid = false;
      }

      if (!this.form.password) {
        this.errors.password = 'Password is required.';
        isValid = false;
      } else if (this.form.password.length < 4) {
        this.errors.password = 'Password must be at least 4 characters long.';
        isValid = false;
      }

      if (!this.form.location.trim()) {
        this.errors.location = 'Campus location is required.';
        isValid = false;
      }

      return isValid;
    },
    async handleRegister() {
      if (!this.validate()) {
        return;
      }

      this.loading = true;
      this.serverError = null;

      try {
        const payload = {
          username: this.form.username.trim(),
          email: this.form.email.trim(),
          password: this.form.password,
          full_name: this.form.full_name.trim(),
          phone: this.form.phone.trim() || null,
          location: this.form.location.trim()
        };

        const res = await API.request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        this.successMsg = 'Account registered successfully! Redirecting to login...';
        window.showToast('Registration successful! Please sign in.', 'success');

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
      } catch (err) {
        this.serverError = err.message || 'Registration failed. Username or email may already be registered.';
      } finally {
        this.loading = false;
      }
    }
  }
});
