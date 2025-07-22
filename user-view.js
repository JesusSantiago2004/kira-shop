// user-view.js
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  const productsGrid = document.getElementById('user-products-grid');
  const carouselInner = document.getElementById('carousel-inner');

  try {
    const querySnapshot = await getDocs(collection(db, 'productos'));
    const products = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name,
        category: data.category,
        price: data.price,
        stock: data.stock,
        description: data.description,
        image: data.image || null, // si tienes la url almacenada en Firestore
      });
    });

    // Mostrar productos en grid
    if (products.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <i class="fas fa-box-open" style="font-size: 3rem; color: var(--primary-color);"></i>
          <p>No hay productos disponibles</p>
        </div>
      `;
    } else {
      products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'user-product-card';
        productCard.innerHTML = `
          ${product.image ? `<img src="${product.image}" alt="${product.name}">` : `
            <div class="no-image-icon" style="height: 200px; display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-image" style="font-size: 3rem;"></i>
            </div>`}
          <h3>${product.name}</h3>
          <div class="category">${product.category}</div>
          <div class="price">$${product.price.toFixed(2)}</div>
          <div class="stock">Disponibles: ${product.stock}</div>
        `;
        productsGrid.appendChild(productCard);
      });
    }

    // Configurar carrusel con imágenes de productos
    const productsWithImages = products.filter(p => p.image);
    if (productsWithImages.length > 0) {
      productsWithImages.slice(0, 5).forEach(product => {
        const carouselItem = document.createElement('div');
        carouselItem.className = 'carousel-item';
        carouselItem.innerHTML = `
          <img src="${product.image}" alt="${product.name}">
          <div class="carousel-caption">
            <h3>${product.name}</h3>
            <p>$${product.price.toFixed(2)}</p>
          </div>
        `;
        carouselInner.appendChild(carouselItem);
      });
    } else {
      carouselInner.innerHTML = `
        <div class="carousel-item">
          <div style="background-color: var(--primary-color); height: 400px; display: flex; align-items: center; justify-content: center;">
            <h3 style="color: white;">Bienvenido a Hello Cutie</h3>
          </div>
        </div>
      `;
    }

    // Carrusel funcionalidad (idéntico a tu código)
    let currentIndex = 0;
    const items = document.querySelectorAll('.carousel-item');
    const totalItems = items.length;

    function updateCarousel() {
      carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    document.querySelector('.carousel-control.next').addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % totalItems;
      updateCarousel();
    });

    document.querySelector('.carousel-control.prev').addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + totalItems) % totalItems;
      updateCarousel();
    });
  } catch (error) {
    console.error('Error cargando productos:', error);
    productsGrid.innerHTML = `<p>Error al cargar productos.</p>`;
  }

  // Tema (copiar tu código de tema aquí si quieres)
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', toggleTheme);

  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = savedTheme;
    updateThemeIcon();
  }

  function toggleTheme() {
    document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', document.body.dataset.theme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon', document.body.dataset.theme === 'light');
    icon.classList.toggle('fa-sun', document.body.dataset.theme === 'dark');
  }

  initTheme();
});
