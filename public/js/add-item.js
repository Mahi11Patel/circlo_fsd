/**
 * Circlo – Post Item Listing Logic (public/js/add-item.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    form: {
      title: '',
      category_id: '',
      description: '',
      item_condition: 'good',
      location: '',
      deposit_amount: 0.00,
      image_url: '/images/placeholder.png'
    },
    errors: {
      title: '',
      category_id: '',
      description: '',
      location: '',
      deposit_amount: ''
    },
    categories: [],
    loading: false,
    currentUser: API.getUser()
  },
  mounted() {
    if (!this.currentUser) {
      window.showToast('Please log in to share an item with the community.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
      return;
    }

    if (this.currentUser.location) {
      this.form.location = this.currentUser.location;
    }

    this.fetchCategories();
  },
  methods: {
    async fetchCategories() {
      try {
        const res = await API.request('/api/categories');
        this.categories = res.categories || [];
      } catch (err) {
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
    setImagePreset(path) {
      this.form.image_url = path;
      window.showToast('Selected item preview graphic', 'info', 1200);
    },
    validate() {
      let isValid = true;
      this.errors = {
        title: '',
        category_id: '',
        description: '',
        location: '',
        deposit_amount: ''
      };

      if (!this.form.title.trim()) {
        this.errors.title = 'Item title is required.';
        isValid = false;
      }

      if (!this.form.category_id) {
        this.errors.category_id = 'Please select a category.';
        isValid = false;
      }

      if (!this.form.description.trim()) {
        this.errors.description = 'Item description is required.';
        isValid = false;
      }

      if (!this.form.location.trim()) {
        this.errors.location = 'Pickup location is required.';
        isValid = false;
      }

      if (this.form.deposit_amount < 0 || isNaN(this.form.deposit_amount)) {
        this.errors.deposit_amount = 'Deposit cannot be negative.';
        isValid = false;
      }

      return isValid;
    },
    async handleSubmit() {
      if (!this.validate()) {
        return;
      }

      this.loading = true;

      try {
        const payload = {
          title: this.form.title.trim(),
          category_id: parseInt(this.form.category_id, 10),
          description: this.form.description.trim(),
          item_condition: this.form.item_condition,
          location: this.form.location.trim(),
          deposit_amount: parseFloat(this.form.deposit_amount || 0),
          image_url: this.form.image_url || '/images/placeholder.png'
        };

        const res = await API.request('/api/items', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        window.showToast('Item listed successfully in community catalog!', 'success');
        
        setTimeout(() => {
          if (res.itemId) {
            window.location.href = 'item-details.html?id=' + res.itemId;
          } else {
            window.location.href = 'my-items.html';
          }
        }, 1000);
      } catch (err) {
        window.showToast(err.message || 'Failed to list item.', 'error');
      } finally {
        this.loading = false;
      }
    }
  }
});
