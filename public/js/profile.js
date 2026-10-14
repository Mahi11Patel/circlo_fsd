/**
 * Circlo – User Profile Logic (public/js/profile.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    profile: {},
    stats: {
      itemsListed: 0,
      itemsBorrowed: 0,
      requestsReceived: 0
    },
    loading: true,
    error: null,
    currentUser: API.getUser()
  },
  mounted() {
    if (!this.currentUser) {
      window.showToast('Please log in to view your profile.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
      return;
    }

    this.profile = { ...this.currentUser };
    this.fetchProfile();
  },
  methods: {
    async fetchProfile() {
      this.loading = true;
      this.error = null;

      try {
        const res = await API.request('/api/auth/me');
        if (res.user) {
          this.profile = res.user;
          API.setAuth(API.getToken(), res.user);
        }

        // Fetch activity metrics
        await this.loadActivityMetrics();
      } catch (err) {
        console.warn('Using cached user profile data:', err.message);
        this.profile = this.currentUser || {};
      } finally {
        this.loading = false;
      }
    },
    async loadActivityMetrics() {
      try {
        const [itemsRes, inReqRes, outReqRes] = await Promise.allSettled([
          API.request('/api/items'),
          API.request('/api/requests/incoming'),
          API.request('/api/requests/outgoing')
        ]);

        if (itemsRes.status === 'fulfilled' && itemsRes.value.items) {
          this.stats.itemsListed = itemsRes.value.items.filter(it => it.owner_id === this.profile.id).length;
        }

        if (inReqRes.status === 'fulfilled' && inReqRes.value.requests) {
          this.stats.requestsReceived = inReqRes.value.requests.length;
        }

        if (outReqRes.status === 'fulfilled' && outReqRes.value.requests) {
          this.stats.itemsBorrowed = outReqRes.value.requests.filter(r => r.status === 'borrowed' || r.status === 'returned').length;
        }
      } catch (err) {
        console.warn('Could not load activity metrics:', err.message);
      }
    }
  }
});
