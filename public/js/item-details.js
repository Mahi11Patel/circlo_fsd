/**
 * Circlo – Single Item Details & Request Submission (public/js/item-details.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    itemId: null,
    item: null,
    loading: true,
    error: null,
    currentUser: API.getUser(),
    requestForm: {
      start_date: '',
      end_date: '',
      message: ''
    },
    errors: {
      start_date: '',
      end_date: '',
      message: ''
    },
    submittingRequest: false
  },
  computed: {
    isOwner() {
      if (!this.currentUser || !this.item) return false;
      const ownerId = this.item.owner_id || (this.item.owner && this.item.owner.id);
      return this.currentUser.id === ownerId;
    },
    ownerInitial() {
      if (!this.item || !this.item.owner) return 'C';
      const name = this.item.owner.full_name || this.item.owner.username || 'C';
      return name.charAt(0).toUpperCase();
    },
    minDate() {
      return new Date().toISOString().split('T')[0];
    }
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    this.itemId = params.get('id');

    if (!this.itemId) {
      this.error = 'No item specified. Please return to the catalog.';
      this.loading = false;
      return;
    }

    this.fetchItem();
  },
  methods: {
    async fetchItem() {
      this.loading = true;
      this.error = null;

      try {
        const res = await API.request('/api/items/' + this.itemId);
        this.item = res.item || res;
      } catch (err) {
        this.error = err.message || 'Unable to retrieve item details.';
      } finally {
        this.loading = false;
      }
    },
    validateRequest() {
      let isValid = true;
      this.errors = { start_date: '', end_date: '', message: '' };

      if (!this.requestForm.start_date) {
        this.errors.start_date = 'Borrow start date is required.';
        isValid = false;
      }

      if (!this.requestForm.end_date) {
        this.errors.end_date = 'Return date is required.';
        isValid = false;
      } else if (this.requestForm.start_date && this.requestForm.end_date < this.requestForm.start_date) {
        this.errors.end_date = 'Return date must be on or after start date.';
        isValid = false;
      }

      if (!this.requestForm.message.trim()) {
        this.errors.message = 'Please provide a short message explaining your intended use.';
        isValid = false;
      }

      return isValid;
    },
    async submitBorrowRequest() {
      if (!this.validateRequest()) {
        return;
      }

      this.submittingRequest = true;

      try {
        const payload = {
          item_id: parseInt(this.itemId, 10),
          start_date: this.requestForm.start_date,
          end_date: this.requestForm.end_date,
          message: this.requestForm.message.trim()
        };

        const res = await API.request('/api/requests', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        window.showToast('Borrow request submitted successfully!', 'success');
        this.requestForm = { start_date: '', end_date: '', message: '' };

        setTimeout(() => {
          window.location.href = 'requests.html';
        }, 1200);
      } catch (err) {
        window.showToast(err.message || 'Failed to submit borrow request.', 'error');
      } finally {
        this.submittingRequest = false;
      }
    }
  }
});
