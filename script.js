document.addEventListener('DOMContentLoaded', function() {
    // Variables
    const themeToggle = document.getElementById('theme-toggle');
    const addProductForm = document.getElementById('add-product-form');
    const productsTableBody = document.getElementById('products-table-body');
    const searchProduct = document.getElementById('search-product');
    const filterCategory = document.getElementById('filter-category');
    let products = JSON.parse(localStorage.getItem('products')) || [];

    // Cargar productos al iniciar
    renderProducts(products);

    // Tema oscuro/claro
    themeToggle.addEventListener('click', function() {
        document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', document.body.dataset.theme);
        updateThemeIcon();
    });

    // Verificar tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.dataset.theme = savedTheme;
    } else {
        document.body.dataset.theme = 'light';
    }
    updateThemeIcon();

    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        if (document.body.dataset.theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Agregar producto
    addProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const product = {
            id: Date.now(),
            name: document.getElementById('product-name').value,
            category: document.getElementById('product-category').value,
            price: parseFloat(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value),
            description: document.getElementById('product-description').value,
            createdAt: new Date().toISOString()
        };
        
        products.push(product);
        saveProducts();
        renderProducts(products);
        addProductForm.reset();
        
        // Mostrar notificación
        showNotification('Producto agregado correctamente', 'success');
    });

    // Renderizar productos
    function renderProducts(productsToRender) {
        productsTableBody.innerHTML = '';
        
        if (productsToRender.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay productos registrados</td></tr>';
            return;
        }
        
        productsToRender.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td class="actions">
                    <button class="action-btn edit-btn" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            productsTableBody.appendChild(tr);
        });
        
        // Agregar eventos a los botones
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteProduct);
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', editProduct);
        });
    }

    // Eliminar producto
    function deleteProduct(e) {
        const productId = parseInt(e.currentTarget.getAttribute('data-id'));
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            products = products.filter(product => product.id !== productId);
            saveProducts();
            renderProducts(filterAndSearchProducts());
            showNotification('Producto eliminado correctamente', 'danger');
        }
    }

    // Editar producto (solo carga los datos en el formulario)
    function editProduct(e) {
        const productId = parseInt(e.currentTarget.getAttribute('data-id'));
        const product = products.find(p => p.id === productId);
        
        if (product) {
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stock;
            document.getElementById('product-description').value = product.description;
            
            // Cambiar el formulario a modo edición
            addProductForm.dataset.editing = productId;
            addProductForm.querySelector('button').innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';
            
            // Eliminar el producto de la lista (será reemplazado al guardar)
            products = products.filter(p => p.id !== productId);
            
            // Desplazarse al formulario
            document.querySelector('.product-form').scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Buscar y filtrar productos
    searchProduct.addEventListener('input', function() {
        renderProducts(filterAndSearchProducts());
    });
    
    filterCategory.addEventListener('change', function() {
        renderProducts(filterAndSearchProducts());
    });
    
    function filterAndSearchProducts() {
        const searchTerm = searchProduct.value.toLowerCase();
        const categoryFilter = filterCategory.value;
        
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                product.description.toLowerCase().includes(searchTerm);
            const matchesCategory = categoryFilter === '' || product.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });
    }

    // Guardar productos en localStorage
    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    // Mostrar notificación
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-btn">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Cerrar notificación
        notification.querySelector('.close-btn').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto cerrar después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Estilos para la notificación
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 4px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-width: 250px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }
        
        .notification.success {
            background-color: var(--success-color);
        }
        
        .notification.danger {
            background-color: var(--danger-color);
        }
        
        .notification.warning {
            background-color: var(--warning-color);
            color: var(--dark-color);
        }
        
        .notification.info {
            background-color: var(--info-color);
        }
        
        .close-btn {
            background: none;
            border: none;
            color: inherit;
            font-size: 1.2rem;
            cursor: pointer;
            margin-left: 1rem;
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});