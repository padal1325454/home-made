/**
 * Admin Dashboard - Shopify-style Business
 * Handles navigation, search, and interactive elements
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearch();
  initAddProductButton();
});

/**
 * Set active state on nav items based on current page/section
 */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      // Prevent default for demo (would navigate in real app)
      const href = item.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
      }
      navItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

/**
 * Handle search bar functionality
 */
function initSearch() {
  const searchBar = document.querySelector('.search-bar');
  if (!searchBar) return;

  searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchBar.value.trim();
      if (query) {
        console.log('Search:', query);
        // In a real app: navigate to search results or filter content
      }
    }
  });
}

/**
 * Handle "Add product" button click
 */
function initAddProductButton() {
  const addProductBtn = document.querySelector('.banner .btn-primary');
  if (!addProductBtn) return;

  addProductBtn.addEventListener('click', () => {
    // In a real app: open modal or navigate to add product page
    console.log('Add product clicked');
    addProductBtn.textContent = 'Add product';
  });
}
