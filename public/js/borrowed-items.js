/**
 * Circlo – Borrowed Items & Review Logic (public/js/borrowed-items.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    items: [],
    filterStatus: '',
    loading: true,
    error: null,
    showReviewModal: false,
    selectedBorrow: null,
    reviewForm: {
      rating: 5,
      comment: ''
    },
    reviewError: null,
    submittingReview: false,
    currentUser: API.getUser()
  },
  computed: {
    filteredItems() {
      if (!this.filterStatus) {
        return this.items;
      }
      return this.items.filter(item => item.status === this.filterStatus);
    }
  },
  mounted() {
    if (!this.currentUser) {
      window.showToast('Please log in to track your borrowed items.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
      return;
    }

    this.fetchBorrowedItems();
  },
  methods: {
    async fetchBorrowedItems() {
      this.loading = true;
      this.error = null;

      try {
        const res = await API.request('/api/requests/outgoing');
        this.items = res.requests || [];
      } catch (err) {
        this.error = err.message || 'Unable to load your borrowed items.';
      } finally {
        this.loading = false;
      }
    },
    openReviewModal(borrow) {
      this.selectedBorrow = borrow;
      this.reviewForm = {
        rating: 5,
        comment: ''
      };
      this.reviewError = null;
      this.showReviewModal = true;
    },
    async submitReview() {
      if (!this.selectedBorrow) return;

      if (!this.reviewForm.comment.trim()) {
        this.reviewError = 'Please share a brief comment about your borrowing experience.';
        return;
      }

      this.submittingReview = true;
      this.reviewError = null;

      try {
        const payload = {
          request_id: this.selectedBorrow.id,
          reviewee_id: this.selectedBorrow.owner_id || 2,
          rating: parseInt(this.reviewForm.rating, 10),
          comment: this.reviewForm.comment.trim()
        };

        await API.request('/api/reviews', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        window.showToast('Thank you! Review posted successfully.', 'success');
        this.showReviewModal = false;
        this.selectedBorrow = null;
        await this.fetchBorrowedItems();
      } catch (err) {
        this.reviewError = err.message || 'Failed to submit review.';
      } finally {
        this.submittingReview = false;
      }
    }
  }
});
