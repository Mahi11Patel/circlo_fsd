/**
 * Circlo – Items Catalog & Filtering Logic (public/js/items.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    items: [],
    categories: [],
    selectedCategory: '',
    searchQuery: '',
    locationQuery: '',
    availabilityFilter: '',
    loading: true,
    error: null,
    debounceTimer: null,
    currentUser: API.getUser()
  },
  mounted() {
    // Parse query params from URL if navigated from home search
    const params = new URLSearchParams(window.location.search);
    if (params.get('category')) this.selectedCategory = params.get('category');
    if (params.get('search')) this.searchQuery = params.get('search');
    if (params.get('location')) this.locationQuery = params.get('location');

    this.fetchCategories();
    this.fetchItems();
  },
  methods: {
    async fetchCategories() {
      try {
        const res = await API.request('/api/categories');
        this.categories = res.categories || [];
      } catch (err) {
        console.warn('Error fetching categories:', err.message);
        this.categories = [
          { id: 1, name: 'Books & Academics' },
          { id: 2, name: 'Electronics & Gadgets' },
          { id: 3, name: 'Lab & Project Equipment' },
          { id: 4, name: 'Sports & Fitness' },
          { id: 5, name: 'Camping & Outdoors' },
          { id: 6, name: 'Miscellaneous Tools' }
        ];
      }
    },
    async fetchItems() {
      this.loading = true;
      this.error = null;

      try {
        const params = new URLSearchParams();
        if (this.selectedCategory) params.append('category', this.selectedCategory);
        if (this.searchQuery.trim()) params.append('search', this.searchQuery.trim());
        if (this.locationQuery.trim()) params.append('location', this.locationQuery.trim());
        if (this.availabilityFilter) params.append('available', this.availabilityFilter);

        const queryString = params.toString();
        const url = '/api/items' + (queryString ? '?' + queryString : '');

        const res = await API.request(url);
        this.items = res.items || [];
      } catch (err) {
        this.error = err.message || 'Failed to load items catalog.';
      } finally {
        this.loading = false;
      }
    },
    debounceFetch() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.fetchItems();
      }, 300);
    },
    resetFilters() {
      this.selectedCategory = '';
      this.searchQuery = '';
      this.locationQuery = '';
      this.availabilityFilter = '';
      this.fetchItems();
    }
  }
});
