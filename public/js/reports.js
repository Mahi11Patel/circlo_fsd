/**
 * Circlo – Community Reports Submission Logic (public/js/reports.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    form: {
      reported_user_id: null,
      reported_item_id: null,
      reason: '',
      details: ''
    },
    errors: {
      reason: '',
      details: ''
    },
    loading: false,
    successMsg: null,
    serverError: null,
    currentUser: API.getUser()
  },
  mounted() {
    if (!this.currentUser) {
      window.showToast('Please log in before submitting a report.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('item_id') || params.get('reported_item_id')) {
      this.form.reported_item_id = parseInt(params.get('item_id') || params.get('reported_item_id'), 10);
    }
    if (params.get('user_id') || params.get('reported_user_id')) {
      this.form.reported_user_id = parseInt(params.get('user_id') || params.get('reported_user_id'), 10);
    }
  },
  methods: {
    validate() {
      let isValid = true;
      this.errors = { reason: '', details: '' };
      this.serverError = null;

      if (!this.form.reason) {
        this.errors.reason = 'Please select a reason for your report.';
        isValid = false;
      }

      if (!this.form.details.trim()) {
        this.errors.details = 'Please provide details explaining the issue.';
        isValid = false;
      }

      return isValid;
    },
    async submitReport() {
      if (!this.validate()) {
        return;
      }

      this.loading = true;
      this.serverError = null;
      this.successMsg = null;

      try {
        const payload = {
          reported_user_id: this.form.reported_user_id ? parseInt(this.form.reported_user_id, 10) : null,
          reported_item_id: this.form.reported_item_id ? parseInt(this.form.reported_item_id, 10) : null,
          reason: this.form.reason,
          details: this.form.details.trim()
        };

        await API.request('/api/reports', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        this.successMsg = 'Report submitted successfully. Our admin team will investigate and take appropriate action.';
        window.showToast('Report submitted to moderation queue.', 'success');

        this.form.reason = '';
        this.form.details = '';
      } catch (err) {
        this.serverError = err.message || 'Failed to submit report. Please try again.';
      } finally {
        this.loading = false;
      }
    }
  }
});
