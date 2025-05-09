document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los botones con la clase js-comprar
    const buyButtons = document.querySelectorAll('.js-comprar');
    // Selecciona todos los botones con la clase js-add-to-cart
    const addToCartButtons = document.querySelectorAll('.js-add-to-cart'); // Nuevo selector

    // Selecciona todas las galerías de productos
    const productGalleries = document.querySelectorAll('.product-image-gallery');

    // ELIMINADO: Selecciona todos los campos de cantidad (quantityInputs)
    // ELIMINADO: Lógica de listener para quantityInputs

    // *** ELEMENTOS DEL MODAL DE COMPRA DIRECTA ***
    const orderModalOverlay = document.getElementById('orderModalOverlay'); // Renombrado para claridad
    const modalSummaryContent = document.getElementById('modalSummaryContent');
    const closeModalButton = document.getElementById('closeModalButton');

    // *** ELEMENTOS DEL NUEVO MODAL DEL CARRITO ***
    const cartModalOverlay = document.getElementById('cartModalOverlay');
    const cartModalContent = document.getElementById('cartModalContent');
    const closeCartModalButton = document.getElementById('closeCartModalButton');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSummary = document.getElementById('cartSummary');
    const viewCartButton = document.querySelector('.js-view-cart'); // Selector para el icono del carrito
    const cartCountSpan = viewCartButton ? viewCartButton.querySelector('.cart-count') : null; // Para actualizar el contador

    // Define los umbrales y porcentajes de descuento
    const discountThreshold30 = 4; // Umbral para el 25% (Basado en CANTIDAD TOTAL por producto)
    const discountRate30 = 0.25;   // 25%

    const discountThreshold70 = 10; // Umbral para el 43% (Basado en CANTIDAD TOTAL por producto)
    const discountRate70 = 0.43;   // 43%

    const whatsappPhoneNumber = '50558081576'; // Tu número de WhatsApp

    // --- Funciones de Ayuda ---

    // Función para obtener las tallas y cantidades seleccionadas para un producto dado
    function getSelectedSizesAndQuantities(productElement) {
        const sizeInputs = productElement.querySelectorAll('.quantity-by-size');
        const selectedSizes = [];
        let totalQuantity = 0;

        sizeInputs.forEach(input => {
            const quantity = parseInt(input.value, 10);
            const size = input.dataset.size;

            if (!isNaN(quantity) && quantity > 0) {
                selectedSizes.push({ size: size, quantity: quantity });
                totalQuantity += quantity;
            }
             // Reset input value to 0 after reading it (Consider if you want to keep the values after adding to cart)
            input.value = 0;
        });

         // Ensure selectedSizes is always an array, even if empty
        return {
            sizes: selectedSizes,
            totalQuantity: totalQuantity
        };
    }

     // Función para obtener el total de cantidad de un item en el carrito (suma de todas las tallas)
    function getItemTotalQuantity(item) {
        return item.sizes ? item.sizes.reduce((sum, sizeOption) => sum + sizeOption.quantity, 0) : 0;
    }


    // --- Funciones para el Carrito (localStorage) ---
    function getCart() {
        const cart = localStorage.getItem('shoppingCart');
        return cart ? JSON.parse(cart) : [];
    }

    function saveCart(cart) {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        updateCartIcon(); // Actualiza el contador del carrito cada vez que se guarda
    }

    function addItemToCart(product) { // product ahora incluye product.sizes
        const cart = getCart();
        const existingItemIndex = cart.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            // Si el producto ya existe, vamos a intentar fusionar las tallas
            const existingItem = cart[existingItemIndex];

            // Initialize existingItem.sizes if it somehow doesn't exist
            if (!existingItem.sizes) {
                existingItem.sizes = [];
            }

            product.sizes.forEach(newSizeOption => {
                const existingSizeIndex = existingItem.sizes.findIndex(s => s.size === newSizeOption.size);

                if (existingSizeIndex > -1) {
                    // Si la talla ya existe para este producto, sumamos la cantidad
                    existingItem.sizes[existingSizeIndex].quantity += newSizeOption.quantity;
                } else {
                    // Si la talla es nueva para este producto, la agregamos
                    existingItem.sizes.push(newSizeOption);
                }
            });

            // Opcional: Ordenar las tallas si quieres que se muestren en un orden específico
            // existingItem.sizes.sort((a, b) => a.size.localeCompare(b.size)); // Orden alfabético
             // Considera un orden personalizado si usas S, M, L, XL, etc.

            cart[existingItemIndex] = existingItem; // Actualiza el item en el carrito

        } else {
            // Si es un producto nuevo (o primera vez con estas tallas), agrégalo al carrito
            // Aseguramos que 'sizes' sea un array, incluso si está vacío al agregarlo inicialmente (aunque no debería pasar con la lógica actual)
             if (!product.sizes) product.sizes = [];
             // Opcional: Ordenar las tallas del nuevo item
             // product.sizes.sort((a, b) => a.size.localeCompare(b.size));

            cart.push(product);
        }
        saveCart(cart);
        // Opcional: Mostrar una notificación simple "Producto añadido al carrito"
        // alert(`${product.name} (${getItemTotalQuantity(product)} unidades) añadido al carrito.`);
    }

    function removeItemFromCart(productId) {
        let cart = getCart();
        cart = cart.filter(item => item.id !== productId); // Elimina el item completo por ID
        saveCart(cart);
        renderCart(); // Vuelve a renderizar el carrito después de eliminar
    }

    function updateCartIcon() {
        const cart = getCart();
        // Suma la cantidad total de unidades de TODOS los items y sus tallas
        const totalItems = cart.reduce((sum, item) => sum + getItemTotalQuantity(item), 0);
        if (cartCountSpan) {
            cartCountSpan.innerText = totalItems;
            // Opcional: Ocultar el contador si no hay items
            cartCountSpan.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    }

    // --- Funciones para el Modal de Compra Directa (existente) ---
    function showOrderModal(productData, summaryHTML) { // productData ahora incluye sizes y totalQuantity
        modalSummaryContent.innerHTML = summaryHTML;
        orderModalOverlay.style.display = 'flex';

        const whatsappButton = modalSummaryContent.querySelector('.whatsapp-button');
        const nameInput = modalSummaryContent.querySelector('#customerName');
        const addressInput = modalSummaryContent.querySelector('#customerAddress');
        const shippingMethodSelect = modalSummaryContent.querySelector('#shippingMethod');

        if (whatsappButton && nameInput && addressInput && shippingMethodSelect) {
            // Eliminar listener existente si lo hubiera para evitar duplicados
            const oldButton = whatsappButton.cloneNode(true);
            whatsappButton.parentNode.replaceChild(oldButton, whatsappButton);
            const newWhatsappButton = modalSummaryContent.querySelector('.whatsapp-button');

            newWhatsappButton.addEventListener('click', (event) => {
                event.preventDefault();

                const customerName = nameInput.value.trim();
                const customerAddress = addressInput.value.trim();
                const selectedShippingMethod = shippingMethodSelect.value;

                if (customerName === '' || customerAddress === '') {
                    alert('Por favor, completa tu Nombre Completo y Dirección.');
                    return;
                }

                 if (productData.totalQuantity === 0) {
                     alert('No has seleccionado ninguna cantidad para comprar.');
                     return;
                 }

                const whatsappUrl = generateWhatsAppLinkForSingleItem(
                    productData, // productData ahora incluye sizes, total, totalDiscount, etc.
                    customerName,
                    customerAddress,
                    selectedShippingMethod
                );

                window.location.href = whatsappUrl;
            });
        }
    }

    function hideOrderModal() {
        orderModalOverlay.style.display = 'none';
        modalSummaryContent.innerHTML = '';
    }

    // Agrega listeners para cerrar el modal de compra directa
    closeModalButton.addEventListener('click', hideOrderModal);
    orderModalOverlay.addEventListener('click', (event) => {
        if (event.target === orderModalOverlay) {
            hideOrderModal();
        }
    });


    // --- Funciones para el Nuevo Modal del Carrito ---
    function showCartModal() {
        renderCart(); // Renderiza el contenido del carrito antes de mostrar
        cartModalOverlay.style.display = 'flex';
    }

    function hideCartModal() {
        cartModalOverlay.style.display = 'none';
        cartItemsContainer.innerHTML = ''; // Limpiar contenido al cerrar
        cartSummary.innerHTML = ''; // Limpiar resumen al cerrar
    }

    // Agrega listeners para abrir y cerrar el modal del carrito
    if (viewCartButton) {
        viewCartButton.addEventListener('click', showCartModal);
    }
    closeCartModalButton.addEventListener('click', hideCartModal);
    cartModalOverlay.addEventListener('click', (event) => {
        if (event.target === cartModalOverlay) {
            hideCartModal();
        }
    });


    function renderCart() {
        const cart = getCart();
        cartItemsContainer.innerHTML = ''; // Limpiar contenido actual
        cartSummary.innerHTML = ''; // Limpiar resumen actual

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
            // También limpiar el resumen si estaba visible
             cartSummary.innerHTML = '';
            return; // Salir si no hay items
        }

        let totalCartAmount = 0; // Total final a pagar por todo el carrito
        let totalCartDiscountAmount = 0; // Descuento total acumulado de todos los items

        cart.forEach(item => {
            const basePrice = item.price;
            const totalQuantity = getItemTotalQuantity(item); // Suma las cantidades de todas las tallas
            const itemSubtotal = basePrice * totalQuantity;

            let itemTotal = itemSubtotal; // Inicialmente el total del item es su subtotal
            let itemDiscountAmount = 0;
            let itemDiscountApplied = false;
            let appliedItemDiscountRate = 0;

             // Aplicar descuento basado en la cantidad total de UNIDADES de este producto (suma de tallas)
             if (totalQuantity >= discountThreshold70) {
                appliedItemDiscountRate = discountRate70;
                itemDiscountAmount = itemSubtotal * appliedItemDiscountRate;
                itemTotal = itemSubtotal - itemDiscountAmount;
                itemDiscountApplied = true;
            } else if (totalQuantity >= discountThreshold30) {
                appliedItemDiscountRate = discountRate30;
                itemDiscountAmount = itemSubtotal * appliedItemDiscountRate;
                itemTotal = itemSubtotal - itemDiscountAmount;
                itemDiscountApplied = true;
            }

            totalCartAmount += itemTotal; // Suma el total del item (con descuento si aplicó) al total general del carrito
            totalCartDiscountAmount += itemDiscountAmount; // Suma el descuento aplicado a este item al descuento total del carrito


            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');

            // Generar lista de tallas y cantidades para mostrar
            const sizesListHTML = (item.sizes && item.sizes.length > 0)
                 ? item.sizes.map(sizeOption =>
                     `Talla ${sizeOption.size}: ${sizeOption.quantity}`
                 ).join(', ') // Une las tallas con coma y espacio
                 : 'Cantidad: (No especificado)'; // Mensaje si no hay tallas (no debería pasar con la lógica actual)


            itemElement.innerHTML = `
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p>Precio unitario: C$${item.price.toFixed(2)}</p> <p class="item-sizes">${sizesListHTML}</p>
                    <p>Cantidad total: ${totalQuantity}</p>
                    <p>Subtotal producto: C$${itemSubtotal.toFixed(2)}</p>
                    ${itemDiscountApplied ? `<p class="discount">Descuento (${appliedItemDiscountRate * 100}%): -C$${itemDiscountAmount.toFixed(2)}</p>` : ''}
                </div>
                <div class="cart-item-actions">
                     <button class="remove-item-button" data-id="${item.id}">Eliminar</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // *** Lógica para añadir campos de datos personales y selector de envío al modal del carrito ***
         const customerInfoHTML = `
            <div class="customer-info-fields" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                <h3>Tus Datos para el Envío</h3>
                <div style="margin-bottom: 10px;">
                    <label for="cartCustomerName" style="display: block; margin-bottom: 5px; font-weight: bold;">Nombre Completo:</label>
                    <input type="text" id="cartCustomerName" name="cartCustomerName" required maxlength="30" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="cartCustomerAddress" style="display: block; margin-bottom: 5px; font-weight: bold;">Dirección:</label>
                    <textarea id="cartCustomerAddress" name="cartCustomerAddress" rows="3" required maxlength="110" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"></textarea>
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="cartShippingMethod" style="display: block; margin-bottom: 5px; font-weight: bold;">Método de Envío:</label>
                    <select id="cartShippingMethod" name="cartShippingMethod" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        <option value="Envio por Bus">Envío por Bus</option>
                        <option value="Envio por Cargotrans">Envío por Cargotrans</option>
                    </select>
                </div>
            </div>
         `;
         cartItemsContainer.innerHTML += customerInfoHTML; // Añadir los campos debajo de los items

        // *** Fin Lógica campos de datos personales ***


        // Resumen total del carrito
        const summaryHTML = `
            ${totalCartDiscountAmount > 0 ? `<p class="discount">Descuento total aplicado: -C$${totalCartDiscountAmount.toFixed(2)}</p>` : ''}
            <p class="total">Total del Carrito: <strong>C$${totalCartAmount.toFixed(2)}</strong></p>
            <a href="#" class="whatsapp-button js-order-cart">
                Confirmar Pedido por WhatsApp
            </a>
        `;
        cartSummary.innerHTML = summaryHTML;

        // Añadir listeners a los botones de eliminar
        cartModalContent.querySelectorAll('.remove-item-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.id;
                removeItemFromCart(productId);
            });
        });

        // Añadir listener al botón de confirmar pedido del carrito
        const orderCartButton = cartSummary.querySelector('.js-order-cart');
        if (orderCartButton) {
             // Eliminar listener existente si lo hubiera para evitar duplicados
            const oldOrderButton = orderCartButton.cloneNode(true);
            orderCartButton.parentNode.replaceChild(oldOrderButton, orderCartButton);
            const newOrderCartButton = cartSummary.querySelector('.js-order-cart');


            newOrderCartButton.addEventListener('click', (event) => {
                event.preventDefault();

                const customerNameInput = cartItemsContainer.querySelector('#cartCustomerName');
                const customerAddressInput = cartItemsContainer.querySelector('#cartCustomerAddress');
                const shippingMethodSelect = cartItemsContainer.querySelector('#cartShippingMethod');

                 const customerName = customerNameInput.value.trim();
                 const customerAddress = customerAddressInput.value.trim();
                 const selectedShippingMethod = shippingMethodSelect.value;

                 if (customerName === '' || customerAddress === '') {
                    alert('Por favor, completa tu Nombre Completo y Dirección.');
                    return;
                }

                // Verificar si hay items en el carrito antes de generar el enlace
                if (cart.length === 0) {
                    alert('Tu carrito está vacío.');
                    return;
                }

                const whatsappUrl = generateWhatsAppLinkForCart(
                    cart, // Pasar el array del carrito
                    totalCartAmount.toFixed(2), // Pasar el total calculado
                    totalCartDiscountAmount.toFixed(2), // Pasar el descuento total
                    customerName,
                    customerAddress,
                    selectedShippingMethod
                );
                window.location.href = whatsappUrl;

                // Opcional: Limpiar el carrito después de enviar el pedido
                // saveCart([]); // Descomentar para vaciar el carrito
                // hideCartModal(); // Descomentar para cerrar el modal
            });
        }
    }

    // --- Generación de Enlaces de WhatsApp ---

    // Función auxiliar para generar el enlace de WhatsApp para UN SOLO item (compra directa)
    // productData ahora incluye sizes, totalQuantity, total, discountAmount, appliedDiscountRate
    function generateWhatsAppLinkForSingleItem(productData, customerName, customerAddress, shippingMethod) {
        let text = `¡Hola! Quiero hacer un pedido directo:\n`;
        text += `- Producto: ${productData.name}\n`;
        // ELIMINADO: text += `- Precio unitario: C$${productData.price.toFixed(2)}\n`;

        // Listar tallas y cantidades
        if (productData.sizes && productData.sizes.length > 0) {
             text += `  Tallas: ${productData.sizes.map(s => ` ${s.size}: ${s.quantity}`).join(', ')}\n`;
             text += `  Cantidad total: ${productData.totalQuantity}\n`;
        } else {
             text += `  Cantidad total: ${productData.totalQuantity}\n`;
        }

        text += `- Total: C$${productData.total}\n`;
        if (productData.discountApplied) {
             text += `(Incluye descuento del ${productData.appliedDiscountRate * 100}% de C$${productData.discountAmount})\n`;
        }
        text += `\n--- Datos del Cliente ---\n`;
        text += `Nombre: ${customerName}\n`;
        text += `Dirección: ${customerAddress}\n`;
        text += `Método de Envío: ${shippingMethod}\n`;
        text += `\nPor favor, confirma mi pedido.`;

        return `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(text)}`;
    }

    // Función auxiliar para generar el enlace de WhatsApp para MÚLTIPLES items (desde el carrito)
    // cart es el array completo, total y totalDiscount son los totales calculados del carrito
    function generateWhatsAppLinkForCart(cart, total, totalDiscount, customerName, customerAddress, shippingMethod) {
        let text = `¡Hola! Quiero hacer un pedido con los siguientes productos:\n\n`;

        cart.forEach(item => {
            // Modificado: Ya no se incluye el precio unitario aquí
            text += `- ${item.name}\n`; // Solo nombre del producto
             // Listar tallas y cantidades por item
             if (item.sizes && item.sizes.length > 0) {
                 text += `  Tallas: ${item.sizes.map(s => ` ${s.size}: ${s.quantity}`).join(', ')}\n`;
                 text += `  Cantidad total de este producto: ${getItemTotalQuantity(item)}\n`;
             } else {
                  text += `  Cantidad total de este producto: ${getItemTotalQuantity(item)}\n`;
             }
             // Opcional: Podrías añadir el subtotal por item aquí si lo deseas
            text += `\n`; // Espacio entre items
        });

        text += `--- Resumen del Pedido ---\n`;
        // Puedes añadir un subtotal general antes del descuento si quieres
        // const overallSubtotal = cart.reduce((sum, item) => sum + (item.price * getItemTotalQuantity(item)), 0);
        // text += `Subtotal de productos: C$${overallSubtotal.toFixed(2)}\n`;
        if (parseFloat(totalDiscount) > 0) {
             text += `Descuento total aplicado: -C$${totalDiscount}\n`;
        }
        text += `Total a pagar: C$${total}\n`;
         text += `\n--- Datos del Cliente ---\n`;
        text += `Nombre: ${customerName}\n`;
        text += `Dirección: ${customerAddress}\n`;
        text += `Método de Envío: ${shippingMethod}\n`;
        text += `\nPor favor, confirma mi pedido.`;

        return `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(text)}`;
    }


    // --- Lógica para la Galería de Imágenes ---
    productGalleries.forEach(gallery => {
        const images = gallery.querySelectorAll('.gallery-image');
        const leftArrow = gallery.querySelector('.gallery-arrow.left');
        const rightArrow = gallery.querySelector('.gallery-arrow.right');
        let currentImageIndex = 0;

        if (images.length > 0) {
             images[0].classList.add('active');
        }

        if (images.length <= 1) {
            if (leftArrow) leftArrow.style.display = 'none';
            if (rightArrow) rightArrow.style.display = 'none';
        }


        function showImage(index) {
             if (images[currentImageIndex]) {
                images[currentImageIndex].classList.remove('active');
             }
            currentImageIndex = (index + images.length) % images.length;
             if (currentImageIndex < 0) {
                currentImageIndex = images.length - 1;
            }
            if (images[currentImageIndex]) {
                images[currentImageIndex].classList.add('active');
            }
        }

        if (images.length > 1) {
            if (leftArrow) {
                leftArrow.addEventListener('click', () => {
                    showImage(currentImageIndex - 1);
                });
            }
            if (rightArrow) {
                rightArrow.addEventListener('click', () => {
                    showImage(currentImageIndex + 1);
                });
            }
        }
    });
    // --- Fin Lógica Galería ---

    // --- Lógica para asegurar que las cajas de cantidad por talla tengan valor mínimo 0 y máximo 99 ---
     document.querySelectorAll('.quantity-by-size').forEach(input => {
         input.addEventListener('input', (event) => {
            let value = input.value;
            value = value.replace(/\D/g, ''); // Solo dígitos

            if (value === '') {
                input.value = 0; // Si se vacía, poner 0
                return;
            }

            let numValue = parseInt(value, 10);

            if (isNaN(numValue)) {
                 input.value = 0; // Si no es un número, poner 0
                 return;
            }

             // Limitar a 3 dígitos, máximo 99
             if (value.length > 3) {
                 value = value.slice(0, 3);
                 numValue = parseInt(value, 10);
             }

            if (numValue > 99) {
                numValue = 99;
            }

            input.value = numValue; // Asegura que el valor mostrado es el numérico (quita ceros iniciales, etc.)
         });

         input.addEventListener('change', (event) => {
             // Asegura que al perder el foco, el valor sea al menos 0 y no más de 99
             let numValue = parseInt(input.value, 10);
             if (isNaN(numValue) || numValue < 0) {
                 input.value = 0;
             } else if (numValue > 99) {
                 input.value = 99;
             } else {
                  input.value = numValue; // Limpia ceros iniciales como 05 -> 5
             }
         });
     });
    // --- Fin Lógica limitar cantidad por talla ---


    // Agrega un 'listener' a cada botón de compra directa (js-comprar)
    buyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();

            const productElement = button.closest('.producto');
            const productId = productElement.dataset.id;
            const productName = productElement.querySelector('h2').innerText;
            const priceElement = productElement.querySelector('.precio');
            const basePrice = parseFloat(priceElement.dataset.precio);

            // Obtener tallas y cantidades seleccionadas
            const { sizes: selectedSizes, totalQuantity: totalSelectedQuantity } = getSelectedSizesAndQuantities(productElement);

            if (totalSelectedQuantity === 0) {
                alert('Por favor, selecciona al menos una cantidad para alguna talla.');
                return;
            }

            const subtotal = basePrice * totalSelectedQuantity;

            let total = subtotal;
            let discountAmount = 0;
            let discountApplied = false;
            let appliedDiscountRate = 0;

            // Aplicar descuento basado en la cantidad total de UNIDADES
            if (totalSelectedQuantity >= discountThreshold70) {
                appliedDiscountRate = discountRate70;
                discountAmount = subtotal * appliedDiscountRate;
                total = subtotal - discountAmount;
                discountApplied = true;
            } else if (totalSelectedQuantity >= discountThreshold30) {
                appliedDiscountRate = discountRate30;
                discountAmount = subtotal * appliedDiscountRate;
                total = subtotal - discountAmount;
                discountApplied = true;
            }

            const formattedBasePrice = basePrice.toFixed(2);
            const formattedSubtotal = subtotal.toFixed(2);
            const formattedDiscountAmount = discountAmount.toFixed(2);
            const formattedTotal = total.toFixed(2);

            const currentProductData = {
                id: productId, // Incluir ID por consistencia
                name: productName,
                sizes: selectedSizes, // Guardar el array de tallas/cantidades
                totalQuantity: totalSelectedQuantity, // Guardar la cantidad total
                price: basePrice, // Guardar el precio unitario (útil para cálculos internos)
                total: formattedTotal, // Total del item CON descuento
                discountApplied: discountApplied,
                discountAmount: formattedDiscountAmount,
                appliedDiscountRate: appliedDiscountRate
            };

             // Generar lista de tallas y cantidades para el modal de compra directa
             const sizesListHTML = (selectedSizes && selectedSizes.length > 0)
                ? selectedSizes.map(sizeOption =>
                    `<p>Talla ${sizeOption.size}: <strong>${sizeOption.quantity}</strong></p>`
                ).join('') // Une las tallas sin separador extra para que se apilen en párrafos
                : '<p>No se especificaron tallas.</p>'; // Mensaje si no se seleccionaron tallas (no debería pasar con la validación)


            let modalContentInnerHtml = `
                <h1>Resumen de tu Pedido Directo</h1> <h2>${productName}</h2>
                <p>Precio unitario: <strong>C$${formattedBasePrice}</strong></p> <h3>Cantidades seleccionadas:</h3>
                ${sizesListHTML}
                <p>Cantidad total de unidades: <strong>${totalSelectedQuantity}</strong></p>
                <p>Subtotal: <strong>C$${formattedSubtotal}</strong></p>
            `;

            if (discountApplied) {
                modalContentInnerHtml += `
                    <p class="discount">¡Descuento del ${appliedDiscountRate * 100}% aplicado por ${totalSelectedQuantity} unidades!</p>
                    <p>Ahorraste: <strong class="discount">C$${formattedDiscountAmount}</strong></p>
                `;
            }

            modalContentInnerHtml += `
                <p class="total">Total a pagar: <strong>C$${formattedTotal}</strong></p>

                <div class="customer-info-fields" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                    <h3>Tus Datos para el Envío</h3>
                    <div style="margin-bottom: 10px;">
                        <label for="customerName" style="display: block; margin-bottom: 5px; font-weight: bold;">Nombre Completo:</label>
                        <input type="text" id="customerName" name="customerName" required maxlength="30" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="customerAddress" style="display: block; margin-bottom: 5px; font-weight: bold;">Dirección:</label>
                        <textarea id="customerAddress" name="customerAddress" rows="3" required maxlength="110" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"></textarea>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="shippingMethod" style="display: block; margin-bottom: 5px; font-weight: bold;">Método de Envío:</label>
                        <select id="shippingMethod" name="shippingMethod" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                            <option value="Envio por Bus">Envío por Bus</option>
                            <option value="Envio por Cargotrans">Envío por Cargotrans</option>
                        </select>
                    </div>
                </div>

                <a href="#" class="whatsapp-button">
                    Confirmar Pedido por WhatsApp
                </a>
            `;

            showOrderModal(currentProductData, modalContentInnerHtml); // Usa la nueva función showOrderModal
        });
    });

     // Agrega un 'listener' a cada botón de agregar al carrito (js-add-to-cart)
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();

            const productElement = button.closest('.producto');
            const productId = productElement.dataset.id; // Obtiene el ID del producto
            const productName = productElement.querySelector('h2').innerText;
            const priceElement = productElement.querySelector('.precio');
            const basePrice = parseFloat(priceElement.dataset.precio);

            // Obtener tallas y cantidades seleccionadas
            const { sizes: selectedSizes, totalQuantity: totalSelectedQuantity } = getSelectedSizesAndQuantities(productElement);

             if (totalSelectedQuantity === 0) {
                 alert('Por favor, selecciona al menos una cantidad para alguna talla para agregar al carrito.');
                 return;
            }

            const productToAdd = {
                id: productId,
                name: productName,
                price: basePrice, // Precio unitario
                sizes: selectedSizes // Array de tallas y cantidades
            };

            addItemToCart(productToAdd);
            // Opcional: Mostrar una notificación simple "Producto añadido al carrito"
            // alert(`${productName} (${totalSelectedQuantity} unidades) añadido al carrito.`);
        });
    });


    // Inicializar el contador del carrito al cargar la página
    updateCartIcon();

});
