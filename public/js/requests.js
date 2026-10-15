/**
 * Circlo – Borrow Requests Management Logic (public/js/requests.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    activeTab: 'incoming',
    incomingRequests: [],
    outgoingRequests: [],
    loading: true,
    error: null,
    showApproveModal: false,
    selectedRequest: null,
    ownerNote: '',
    submittingAction: false,
    currentUser: API.getUser()
  },
  computed: {
    pendingIncomingCount() {
      return this.incomingRequests.filter(r => r.status === 'pending').length;
    }
  },
  mounted() {
    if (!this.currentUser) {
      window.showToast('Please log in to view your requests.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
      return;
    }

    this.fetchAll();
  },
  methods: {
    async fetchAll() {
      this.loading = true;
      this.error = null;
      try {
        await Promise.all([
          this.fetchIncoming(),
          this.fetchOutgoing()
        ]);
      } catch (err) {
        this.error = err.message || 'Error loading requests.';
      } finally {
        this.loading = false;
      }
    },
    async fetchIncoming() {
      try {
        const res = await API.request('/api/requests/incoming');
        this.incomingRequests = res.requests || [];
      } catch (err) {
        console.warn('Error fetching incoming requests:', err.message);
        this.incomingRequests = [];
      }
    },
    async fetchOutgoing() {
      try {
        const res = await API.request('/api/requests/outgoing');
        this.outgoingRequests = res.requests || [];
      } catch (err) {
        console.warn('Error fetching outgoing requests:', err.message);
        this.outgoingRequests = [];
      }
    },
    switchTab(tab) {
      this.activeTab = tab;
    },
    openApproveModal(req) {
      this.selectedRequest = req;
      this.ownerNote = '';
      this.showApproveModal = true;
    },
    async confirmApproval() {
      if (!this.selectedRequest) return;
      this.submittingAction = true;

      try {
        await API.request('/api/requests/' + this.selectedRequest.id + '/status', {
          method: 'PUT',
          body: JSON.stringify({
            status: 'approved',
            owner_response_note: this.ownerNote.trim() || 'Approved! Please contact me for handover.'
          })
        });

        window.showToast('Request approved successfully!', 'success');
        this.showApproveModal = false;
        this.selectedRequest = null;
        await this.fetchIncoming();
      } catch (err) {
        window.showToast(err.message || 'Failed to approve request.', 'error');
      } finally {
        this.submittingAction = false;
      }
    },
    async updateStatus(id, newStatus) {
      if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) {
        return;
      }

      try {
        await API.request('/api/requests/' + id + '/status', {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        });

        window.showToast(`Request updated to ${newStatus}.`, 'success');
        if (this.activeTab === 'incoming') {
          await this.fetchIncoming();
        } else {
          await this.fetchOutgoing();
        }
      } catch (err) {
        window.showToast(err.message || 'Failed to update request status.', 'error');
      }
    }
  }
});
