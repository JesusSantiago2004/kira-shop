import { db, storage } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let products = [];

document.addEventListener("DOMContentLoaded", async function () {
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
  const viewToggle = document.getElementById("view-toggle");

  products = await loadProductsFromFirebase();

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
    window.location.href = "user-view.html";
  });

  // FUNCIONES

  async function loadProductsFromFirebase() {
    const querySnapshot = await getDocs(collection(db, "productos"));
    const loadedProducts = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      loadedProducts.push({
        id: docSnap.id,
        name: data.name,
        category: data.category,
        price: data.price,
        stock: data.stock,
        description: data.description,
        createdAt: data.createdAt,
        image: data.image || null,
      });
    });

    return loadedProducts;
  }

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

  async function handleAddProduct(e) {
    e.preventDefault();

    const isEditingId = addProductForm.dataset.editing;

    const imageInput = document.getElementById("product-image");
    const imageFile = imageInput.files[0];

    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      showNotification("La imagen no debe exceder los 2MB", "danger");
      return;
    }

    const productData = {
      name: document.getElementById("product-name").value,
      category: document.getElementById("product-category").value,
      price: parseFloat(document.getElementById("product-price").value),
      stock: parseInt(document.getElementById("product-stock").value),
      description: document.getElementById("product-description").value,
      createdAt: new Date().toISOString(),
      image: null,
    };

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = async function (event) {
        productData.image = event.target.result;
        await saveProductData(productData, isEditingId);
      };
      reader.readAsDataURL(imageFile);
    } else {
      await saveProductData(productData, isEditingId);
    }
  }

  async function saveProductData(productData, isEditingId) {
    if (isEditingId) {
      try {
        const productRef = doc(db, "productos", isEditingId);
        await updateDoc(productRef, {
          ...productData,
        });

        showNotification("Producto actualizado correctamente", "success");

        // Recargar lista desde Firebase
        products = await loadProductsFromFirebase();
        renderProducts(products);
        updateHomeSummary();
        updateTotalItems();

        addProductForm.reset();
        document.getElementById("image-preview").style.display = "none";
        delete addProductForm.dataset.editing;
        addProductForm.querySelector("button").innerHTML =
          '<i class="fas fa-plus"></i> Agregar Producto';
      } catch (error) {
        console.error("Error actualizando producto:", error);
        showNotification("Error al actualizar producto", "danger");
      }
    } else {
      try {
        await addDoc(collection(db, "productos"), {
          ...productData,
        });

        showNotification("Producto agregado correctamente", "success");

        products = await loadProductsFromFirebase();
        renderProducts(products);
        updateHomeSummary();
        updateTotalItems();

        addProductForm.reset();
        document.getElementById("image-preview").style.display = "none";
      } catch (error) {
        console.error("Error al guardar en Firestore:", error);
        showNotification("Error al guardar en Firestore", "danger");
      }
    }
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
            <button class="action-btn edit-btn" data-id="${product.id}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${product.id}" title="Eliminar">
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

  async function deleteProduct(e) {
    const productId = e.currentTarget.getAttribute("data-id");
    if (!productId) return;

    if (confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await deleteDoc(doc(db, "productos", productId));

        products = products.filter((p) => p.id !== productId);

        renderProducts(products);
        updateHomeSummary();
        updateTotalItems();

        showNotification("Producto eliminado correctamente", "success");
      } catch (error) {
        console.error("Error eliminando producto:", error);
        showNotification("Error al eliminar producto", "danger");
      }
    }
  }

  function editProduct(e) {
    const productId = e.currentTarget.getAttribute("data-id");
    const product = products.find((p) => p.id === productId);

    if (product) {
      document.getElementById("product-name").value = product.name;
      document.getElementById("product-category").value = product.category;
      document.getElementById("product-price").value = product.price;
      document.getElementById("product-stock").value = product.stock;
      document.getElementById("product-description").value = product.description || "";

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

      document.querySelector(".product-form").scrollIntoView({ behavior: "smooth" });
    }
  }

  function updateHomeSummary() {
    document.getElementById("total-products-count").textContent = products.length;

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
      reader.onload = function (event) {
        preview.src = event.target.result;
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
