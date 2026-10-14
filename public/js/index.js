/**
 * Circlo – Landing Page Logic (public/js/index.js)
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
    loading: true,
    error: null,
    currentUser: API.getUser(),
    stats: {
      itemsCount: 5,
      categoriesCount: 6
    }
  },
  mounted() {
    this.fetchCategories();
    this.fetchItems();
  },
  methods: {
    async fetchCategories() {
      try {
        const res = await API.request('/api/categories');
        this.categories = res.categories || [];
        this.stats.categoriesCount = this.categories.length;
      } catch (err) {
        console.warn('Could not load categories from API, using defaults:', err.message);
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
        let url = '/api/items';
        if (this.selectedCategory) {
          url += '?category=' + encodeURIComponent(this.selectedCategory);
        }
        const res = await API.request(url);
        this.items = res.items || [];
        this.stats.itemsCount = this.items.length;
      } catch (err) {
        console.warn('Items API not yet connected or empty:', err.message);
        // Fallback demo items for visual preview if backend is starting up
        this.items = [
          {
            id: 1,
            title: 'Data Structures & Algorithms in C++',
            category_name: 'Books & Academics',
            description: 'Required textbook for semester 3. Highlighted key concepts, all pages intact.',
            item_condition: 'good',
            location: 'Hostel Block A',
            deposit_amount: '0.00',
            is_available: 1,
            image_url: '/images/book.png',
            owner_name: 'Rahul Sharma',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Casio FX-991EX ClassWiz Scientific Calculator',
            category_name: 'Electronics & Gadgets',
            description: 'High-resolution display calculator, permitted in university examinations.',
            item_condition: 'like_new',
            location: 'Hostel Block A',
            deposit_amount: '200.00',
            is_available: 1,
            image_url: '/images/calc.png',
            owner_name: 'Rahul Sharma',
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            title: 'Arduino Uno R3 Starter Kit with 30+ Sensors',
            category_name: 'Lab & Project Equipment',
            description: 'Complete maker kit including ultrasonic sensor, servo motors, jumper wires, and breadboard.',
            item_condition: 'new',
            location: 'Engineering Block 3',
            deposit_amount: '500.00',
            is_available: 1,
            image_url: '/images/arduino.png',
            owner_name: 'Priya Patel',
            created_at: new Date().toISOString()
          }
        ];
      } finally {
        this.loading = false;
      }
    },
    filterByCategory(catId) {
      this.selectedCategory = catId;
      this.fetchItems();
    },
    handleSearch() {
      let target = 'pages/items.html?';
      if (this.searchQuery) target += 'search=' + encodeURIComponent(this.searchQuery) + '&';
      if (this.selectedCategory) target += 'category=' + encodeURIComponent(this.selectedCategory);
      window.location.href = target;
    }
  }
});
