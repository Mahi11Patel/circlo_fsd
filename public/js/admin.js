/**
 * Circlo – Admin Moderation & Dashboard Logic (public/js/admin.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    activeTab: 'users',
    stats: {
      totalUsers: 0,
      totalItems: 0,
      activeRequests: 0,
      pendingReports: 0
    },
    users: [],
    reports: [],
    items: [],
    loading: true,
    error: null,
    showReportModal: false,
    selectedReport: null,
    reportForm: {
      status: 'reviewed',
      admin_notes: ''
    },
    submittingReport: false,
    currentUser: API.getUser()
  },
  mounted() {
    if (!this.currentUser) {
      window.showToast('Administrator authentication required.', 'error');
      return;
    }

    if (this.currentUser.role !== 'admin') {
      window.showToast('403 Forbidden: Access denied. Admin only.', 'error');
      return;
    }

    this.loadAdminData();
  },
  methods: {
    async loadAdminData() {
      this.loading = true;
      this.error = null;

      try {
        await Promise.all([
          this.fetchStats(),
          this.fetchUsers(),
          this.fetchReports(),
          this.fetchItems()
        ]);
      } catch (err) {
        this.error = err.message || 'Error loading administrator data.';
      } finally {
        this.loading = false;
      }
    },
    async fetchStats() {
      try {
        const res = await API.request('/api/admin/stats');
        this.stats = res.stats || {
          totalUsers: 0,
          totalItems: 0,
          activeRequests: 0,
          pendingReports: 0
        };
      } catch (err) {
        console.warn('Could not fetch stats directly:', err.message);
      }
    },
    async fetchUsers() {
      try {
        const res = await API.request('/api/admin/users');
        this.users = res.users || [];
        if (!this.stats.totalUsers && this.users.length) {
          this.stats.totalUsers = this.users.length;
        }
      } catch (err) {
        console.warn('Error fetching users:', err.message);
        this.users = [];
      }
    },
    async fetchReports() {
      try {
        const res = await API.request('/api/admin/reports');
        this.reports = res.reports || [];
        const pending = this.reports.filter(r => r.status === 'pending').length;
        this.stats.pendingReports = pending;
      } catch (err) {
        console.warn('Error fetching reports:', err.message);
        this.reports = [];
      }
    },
    async fetchItems() {
      try {
        const res = await API.request('/api/items');
        this.items = res.items || [];
        if (!this.stats.totalItems && this.items.length) {
          this.stats.totalItems = this.items.length;
        }
      } catch (err) {
        console.warn('Error fetching items:', err.message);
        this.items = [];
      }
    },
    async toggleUserStatus(userId, newStatus) {
      const verb = newStatus === 'blocked' ? 'block' : 'unblock';
      if (!confirm(`Are you sure you want to ${verb} user #${userId}?`)) {
        return;
      }

      try {
        await API.request('/api/admin/users/' + userId + '/status', {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        });

        window.showToast(`User status updated to ${newStatus}.`, 'success');
        await this.fetchUsers();
      } catch (err) {
        window.showToast(err.message || 'Failed to update user status.', 'error');
      }
    },
    openReportModal(report) {
      this.selectedReport = report;
      this.reportForm = {
        status: 'reviewed',
        admin_notes: report.admin_notes || ''
      };
      this.showReportModal = true;
    },
    async submitReportReview() {
      if (!this.selectedReport) return;
      this.submittingReport = true;

      try {
        await API.request('/api/admin/reports/' + this.selectedReport.id, {
          method: 'PUT',
          body: JSON.stringify({
            status: this.reportForm.status,
            admin_notes: this.reportForm.admin_notes.trim() || 'Reviewed and addressed by admin.'
          })
        });

        window.showToast('Report status updated.', 'success');
        this.showReportModal = false;
        this.selectedReport = null;
        await this.fetchReports();
      } catch (err) {
        window.showToast(err.message || 'Failed to update report.', 'error');
      } finally {
        this.submittingReport = false;
      }
    },
    async deleteItem(itemId) {
      if (!confirm(`Are you sure you want to remove item #${itemId} as an administrator?`)) {
        return;
      }

      try {
        await API.request('/api/items/' + itemId, {
          method: 'DELETE'
        });

        window.showToast('Item removed by moderator.', 'info');
        await this.fetchItems();
      } catch (err) {
        window.showToast(err.message || 'Failed to remove item.', 'error');
      }
    },
    getReportStatusBadge(status) {
      switch (status) {
        case 'pending':
          return 'badge badge-danger';
        case 'reviewed':
          return 'badge badge-success';
        case 'dismissed':
          return 'badge badge-neutral';
        default:
          return 'badge badge-neutral';
      }
    }
  }
});
