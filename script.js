import { db, storage } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

document.addEventListener("DOMContentLoaded", function () {
  // Variables
  const themeToggle = document.getElementById("theme-toggle");
  const addProductForm = document.getElementById("add-product-form");
  const productsTableBody = document.getElementById("products-table-body");
  const searchProduct = document.getElementById("search-product");
  const filterCategory = document.getElementById("filter-category");
  const navLinks = document.querySelectorAll(".sidebar nav ul li a");
  const contentSections = {
    home: document.getElementById("home-section"),
    products: document.getElementById("products-section"),
  };
  const totalItemsElement = document.getElementById("total-items");
  const viewToggle = document.getElementById("view-toggle"); // ← Añadido aquí
  let products = JSON.parse(localStorage.getItem("products")) || [];

  // Inicialización
  initTheme();
  renderProducts(products);
  setupNavigation();
  updateHomeSummary();
  updateTotalItems();

  // Event Listeners
  themeToggle.addEventListener("click", toggleTheme);
  addProductForm.addEventListener("submit", handleAddProduct);
  searchProduct.addEventListener("input", handleSearch);
  filterCategory.addEventListener("change", handleSearch);
  document
    .getElementById("product-image")
    .addEventListener("change", handleImagePreview);
  viewToggle.addEventListener("click", () => {
    // ← Añadido aquí
    window.location.href = "user-view.html";
  });

  // Funciones principales
  function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.dataset.theme = savedTheme;
    updateThemeIcon();
  }

  function toggleTheme() {
    document.body.dataset.theme =
      document.body.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", document.body.dataset.theme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const icon = themeToggle.querySelector("i");
    icon.classList.toggle("fa-moon", document.body.dataset.theme === "light");
    icon.classList.toggle("fa-sun", document.body.dataset.theme === "dark");
  }

  function setupNavigation() {
    navLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();

        // Actualizar navegación activa
        navLinks.forEach((l) => l.parentElement.classList.remove("active"));
        this.parentElement.classList.add("active");

        // Mostrar la sección correspondiente
        const sectionId = this.getAttribute("data-section");
        Object.values(contentSections).forEach((section) => {
          section.style.display = "none";
        });

        if (contentSections[sectionId]) {
          contentSections[sectionId].style.display = "block";

          // Actualizar el resumen si vamos a Home
          if (sectionId === "home") {
            updateHomeSummary();
          }
        }
      });
    });

    // Activar la sección de productos por defecto
    document.querySelector(".sidebar nav ul li.active a").click();
  }

  function handleAddProduct(e) {
    e.preventDefault();

    const isEditing = addProductForm.dataset.editing;
    const imageInput = document.getElementById("product-image");
    const imageFile = imageInput.files[0];

    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      showNotification("La imagen no debe exceder los 2MB", "danger");
      return;
    }

    const productData = {
      id: isEditing ? parseInt(isEditing) : Date.now(),
      name: document.getElementById("product-name").value,
      category: document.getElementById("product-category").value,
      price: parseFloat(document.getElementById("product-price").value),
      stock: parseInt(document.getElementById("product-stock").value),
      description: document.getElementById("product-description").value,
      createdAt: isEditing
        ? products.find((p) => p.id === parseInt(isEditing))?.createdAt ||
          new Date().toISOString()
        : new Date().toISOString(),
      image: null,
    };

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        productData.image = e.target.result;
        saveProductData(productData, isEditing);
      };
      reader.readAsDataURL(imageFile);
    } else {
      if (isEditing) {
        const existingProduct = products.find(
          (p) => p.id === parseInt(isEditing)
        );
        if (existingProduct) {
          productData.image = existingProduct.image;
        }
      }
      saveProductData(productData, isEditing);
    }
  }

  function saveProductData(productData, isEditing) {
    if (isEditing) {
      delete addProductForm.dataset.editing;
      addProductForm.querySelector("button").innerHTML =
        '<i class="fas fa-save"></i> Guardar Producto';
      showNotification("Producto actualizado correctamente", "success");
    } else {
      showNotification("Producto agregado correctamente", "success");
    }

    products = isEditing
      ? [...products.filter((p) => p.id !== productData.id), productData]
      : [...products, productData];

    saveProducts();
    renderProducts(filterAndSearchProducts());
    updateHomeSummary();
    updateTotalItems();
    addProductForm.reset();
    document.getElementById("image-preview").style.display = "none";
    document.getElementById("product-image").value = "";
  }

  function renderProducts(productsToRender) {
    productsTableBody.innerHTML = "";

    if (productsToRender.length === 0) {
      productsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center no-products">
                        <i class="fas fa-box-open" style="font-size: 2rem;"></i>
                        <p>No se encontraron productos</p>
                    </td>
                </tr>
            `;
      return;
    }

    productsToRender.forEach((product) => {
      const tr = document.createElement("tr");

      let stockClass = "";
      if (product.stock < 5) stockClass = "stock-low";
      else if (product.stock < 15) stockClass = "stock-medium";
      else stockClass = "stock-high";

      tr.innerHTML = `
                <td class="image-col">
                    ${
                      product.image
                        ? `<img src="${product.image}" alt="${product.name}" class="product-row-image">`
                        : `<div class="no-image-icon"><i class="fas fa-image"></i></div>`
                    }
                </td>
                <td class="name-col">${product.name}</td>
                <td class="category-col">
                    <span class="category-badge">${product.category}</span>
                </td>
                <td class="price-col">$${product.price.toFixed(2)}</td>
                <td class="stock-col ${stockClass}">${product.stock}</td>
                <td class="actions-col">
                    <div class="actions">
                        <button class="action-btn edit-btn" data-id="${
                          product.id
                        }" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${
                          product.id
                        }" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
      productsTableBody.appendChild(tr);
    });

    setupProductActions();
  }

  function setupProductActions() {
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", deleteProduct);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", editProduct);
    });
  }

  function updateHomeSummary() {
    document.getElementById("total-products-count").textContent =
      products.length;

    const categoriesList = document.getElementById("categories-list");
    categoriesList.innerHTML = "";

    const categories = {};
    products.forEach((product) => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });

    for (const [category, count] of Object.entries(categories)) {
      const li = document.createElement("li");
      li.innerHTML = `<span>${category}</span> <span>${count}</span>`;
      categoriesList.appendChild(li);
    }

    const recentProductsGrid = document.getElementById("recent-products-grid");
    recentProductsGrid.innerHTML = "";

    const recentProducts = [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    recentProducts.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
                ${
                  product.image
                    ? `<img src="${product.image}" alt="${product.name}">`
                    : '<div class="no-image-preview"><i class="fas fa-image"></i></div>'
                }
                <span class="category">${product.category}</span>
                <h4>${product.name}</h4>
                <div class="price">$${product.price.toFixed(2)}</div>
                <div class="stock">Stock: ${product.stock}</div>
            `;
      recentProductsGrid.appendChild(card);
    });
  }

  function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById("preview-image");
    const previewContainer = document.getElementById("image-preview");

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
        previewContainer.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      previewContainer.style.display = "none";
    }
  }

  function handleSearch() {
    const filteredProducts = filterAndSearchProducts();
    renderProducts(filteredProducts);
    updateTotalItems(filteredProducts.length);
  }

  function filterAndSearchProducts() {
    const searchTerm = searchProduct.value.toLowerCase();
    const categoryFilter = filterCategory.value;

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm));
      const matchesCategory =
        categoryFilter === "" || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }

  function updateTotalItems(count) {
    const total = count !== undefined ? count : products.length;
    totalItemsElement.textContent = `Mostrando ${total} ${
      total === 1 ? "producto" : "productos"
    }`;
  }

  function deleteProduct(e) {
    const productId = parseInt(e.currentTarget.getAttribute("data-id"));
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      products = products.filter((product) => product.id !== productId);
      saveProducts();
      renderProducts(filterAndSearchProducts());
      updateHomeSummary();
      updateTotalItems();
      showNotification("Producto eliminado correctamente", "danger");
    }
  }

  function editProduct(e) {
    const productId = parseInt(e.currentTarget.getAttribute("data-id"));
    const product = products.find((p) => p.id === productId);

    if (product) {
      document.getElementById("product-name").value = product.name;
      document.getElementById("product-category").value = product.category;
      document.getElementById("product-price").value = product.price;
      document.getElementById("product-stock").value = product.stock;
      document.getElementById("product-description").value =
        product.description || "";

      const imagePreview = document.getElementById("image-preview");
      if (product.image) {
        document.getElementById("preview-image").src = product.image;
        imagePreview.style.display = "block";
      } else {
        imagePreview.style.display = "none";
      }

      addProductForm.dataset.editing = productId;
      addProductForm.querySelector("button").innerHTML =
        '<i class="fas fa-save"></i> Actualizar Producto';
      document
        .querySelector(".product-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  }

  function saveProducts() {
    localStorage.setItem("products", JSON.stringify(products));
  }

  function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <span>${message}</span>
            <button class="close-btn">&times;</button>
        `;

    document.body.appendChild(notification);

    notification.querySelector(".close-btn").addEventListener("click", () => {
      notification.remove();
    });

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
});
