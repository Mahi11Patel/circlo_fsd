/**
 * Circlo – My Listed Items Management Logic (public/js/my-items.js)
 * Author: Archi Gajera (Partner A - Frontend Lead)
 */

new Vue({
  el: '#app',
  mixins: [window.CircloMixins],
  data: {
    myItems: [],
    categories: [],
    loading: true,
    error: null,
    showEditModal: false,
    editForm: {
      id: null,
      title: '',
      category_id: '',
      description: '',
      location: '',
      deposit_amount: 0,
      is_available: 1,
      item_condition: 'good'
    },
    savingEdit: false,
    currentUser: API.getUser()
  },
  mounted() {
    if (!this.currentUser) {
      window.showToast('Please log in to manage your items.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
      return;
    }

    this.fetchCategories();
    this.fetchMyItems();
  },
  methods: {
    async fetchCategories() {
      try {
        const res = await API.request('/api/categories');
        this.categories = res.categories || [];
      } catch (err) {
        console.warn('Error loading categories:', err.message);
      }
    },
    async fetchMyItems() {
      this.loading = true;
      this.error = null;

      try {
        const res = await API.request('/api/items');
        const allItems = res.items || [];
        // Filter items owned by currently logged in user
        this.myItems = allItems.filter(item => item.owner_id === this.currentUser.id);
      } catch (err) {
        this.error = err.message || 'Unable to retrieve your item listings.';
      } finally {
        this.loading = false;
      }
    },
    openEditModal(item) {
      this.editForm = {
        id: item.id,
        title: item.title,
        category_id: item.category_id,
        description: item.description,
        location: item.location,
        deposit_amount: parseFloat(item.deposit_amount || 0),
        is_available: item.is_available ? 1 : 0,
        item_condition: item.item_condition || 'good'
      };
      this.showEditModal = true;
    },
    async saveEdit() {
      if (!this.editForm.title.trim()) {
        window.showToast('Title is required.', 'error');
        return;
      }

      this.savingEdit = true;

      try {
        const payload = {
          title: this.editForm.title.trim(),
          category_id: parseInt(this.editForm.category_id, 10),
          description: this.editForm.description.trim(),
          location: this.editForm.location.trim(),
          deposit_amount: parseFloat(this.editForm.deposit_amount || 0),
          is_available: Boolean(this.editForm.is_available),
          item_condition: this.editForm.item_condition
        };

        await API.request('/api/items/' + this.editForm.id, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        window.showToast('Item updated successfully!', 'success');
        this.showEditModal = false;
        await this.fetchMyItems();
      } catch (err) {
        window.showToast(err.message || 'Failed to update item.', 'error');
      } finally {
        this.savingEdit = false;
      }
    },
    async confirmDelete(item) {
      if (!confirm(`Are you sure you want to remove "${item.title}" from community listings?`)) {
        return;
      }

      try {
        await API.request('/api/items/' + item.id, {
          method: 'DELETE'
        });

        window.showToast('Item removed successfully.', 'info');
        await this.fetchMyItems();
      } catch (err) {
        window.showToast(err.message || 'Failed to delete item.', 'error');
      }
    }
  }
});
