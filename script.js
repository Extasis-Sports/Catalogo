document.addEventListener('DOMContentLoaded', () => { // <-- document en minúsculas
    // Selecciona todos los botones con la clase js-comprar
    const buyButtons = document.querySelectorAll('.js-comprar');

    // Selecciona todas las galerías de productos
    const productGalleries = document.querySelectorAll('.product-image-gallery');

    // Selecciona todos los campos de cantidad
    const quantityInputs = document.querySelectorAll('.cantidad-producto');

    // *** ELEMENTOS DEL MODAL ***
    const modalOverlay = document.getElementById('orderModalOverlay');
    const modalSummaryContent = document.getElementById('modalSummaryContent');
    const closeModalButton = document.getElementById('closeModalButton');

    // Define los umbrales y porcentajes de descuento
    const discountThreshold30 = 4; // Umbral para el 25%
    const discountRate30 = 0.25;   // 25%

    const discountThreshold70 = 10; // Umbral para el 43%
    const discountRate70 = 0.43;   // 43%

    // Función para mostrar el modal
    function showModal(productData, summaryHTML) {
        modalSummaryContent.innerHTML = summaryHTML; // Inserta el contenido HTML del resumen + campos
        modalOverlay.style.display = 'flex'; // Muestra el overlay

        // *** Añadir listeners a los campos, selector y botón de WhatsApp DESPUÉS de mostrar el modal ***
        const whatsappButton = modalSummaryContent.querySelector('.whatsapp-button');
        const nameInput = modalSummaryContent.querySelector('#customerName');
        const addressInput = modalSummaryContent.querySelector('#customerAddress');
        const shippingMethodSelect = modalSummaryContent.querySelector('#shippingMethod');

        if (whatsappButton && nameInput && addressInput && shippingMethodSelect) {
            whatsappButton.addEventListener('click', (event) => {
                event.preventDefault(); // Previene la navegación inmediata

                const customerName = nameInput.value.trim();
                const customerAddress = addressInput.value.trim();
                const selectedShippingMethod = shippingMethodSelect.value;

                // Validación simple
                if (customerName === '' || customerAddress === '') {
                    alert('Por favor, completa tu Nombre Completo y Dirección.');
                    return;
                }

                // Genera el enlace de WhatsApp con los datos adicionales
                const whatsappUrl = generateWhatsAppLink(
                    productData.name,
                    productData.quantity,
                    productData.total,
                    productData.discountApplied,
                    productData.discountAmount,
                    productData.appliedDiscountRate,
                    customerName,
                    customerAddress,
                    selectedShippingMethod
                );

                // Navega a la URL de WhatsApp
                window.location.href = whatsappUrl;
            });
        }
         // Opcional: Enfocar automáticamente el primer campo de datos personales
         // Hemos eliminado la línea nameInput.focus() aquí para evitar que aparezca el teclado al abrir el modal.
         /*
         if (nameInput) {
             setTimeout(() => {
                 nameInput.focus();
             }, 100); // Pequeño retraso para asegurar que el modal esté completamente visible
         }
         */
    }

    // Función para ocultar el modal
    function hideModal() {
        modalOverlay.style.display = 'none';
        modalSummaryContent.innerHTML = '';
    }

    // Agrega listeners para cerrar el modal
    closeModalButton.addEventListener('click', hideModal);

    // Opcional: Cierra el modal si se hace clic fuera del contenido
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            hideModal();
        }
    });

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
            images[currentImageIndex].classList.remove('active');
            currentImageIndex = (index + images.length) % images.length;
             if (currentImageIndex < 0) {
                currentImageIndex = images.length - 1;
            }
            images[currentImageIndex].classList.add('active');
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

    // --- Lógica para limitar la cantidad de dígitos en el input ---
    quantityInputs.forEach(input => {
        input.addEventListener('input', (event) => {
            let value = input.value;
            value = value.replace(/\D/g, '');

            if (value.length > 3) {
                value = value.slice(0, 3);
            }

            input.value = value;

            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue > 999) {
                 input.value = '999';
            }
             if (numValue === 0 && value.length > 1) {
                 input.value = '0';
             }
             if (numValue < 1 && value !== '' && value !== '0') {
                  input.value = '1';
             }
        });

        input.addEventListener('change', (event) => {
             if (input.value === '' || parseInt(input.value, 10) < 1) {
                 input.value = '1';
             }
             input.value = parseInt(input.value, 10);
             if (isNaN(input.value)) {
                 input.value = '1';
             }
        });
    });
    // --- Fin Lógica limitar cantidad ---


    // Agrega un 'listener' a cada botón de compra
    buyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();

            const productElement = button.closest('.producto');
            const productName = productElement.querySelector('h2').innerText;
            const priceElement = productElement.querySelector('.precio');
            const basePrice = parseFloat(priceElement.dataset.precio);
            const quantityInput = productElement.querySelector('.cantidad-producto');
            const quantity = parseInt(quantityInput.value, 10);

            if (isNaN(quantity) || quantity < 1) {
                alert('Por favor, ingresa una cantidad válida (mínimo 1).');
                quantityInput.value = 1;
                return;
            }

            const subtotal = basePrice * quantity;

            let total = subtotal;
            let discountAmount = 0;
            let discountApplied = false;
            let appliedDiscountRate = 0;

            if (quantity >= discountThreshold70) {
                appliedDiscountRate = discountRate70;
                discountAmount = subtotal * appliedDiscountRate;
                total = subtotal - discountAmount;
                discountApplied = true;
            } else if (quantity >= discountThreshold30) {
                appliedDiscountRate = discountRate30;
                discountAmount = subtotal * appliedDiscountRate;
                total = subtotal - discountAmount;
                discountApplied = true;
            }

            const formattedBasePrice = basePrice.toFixed(2);
            const formattedSubtotal = subtotal.toFixed(2);
            const formattedDiscountAmount = discountAmount.toFixed(2);
            const formattedTotal = total.toFixed(2);

            // Almacenar datos del producto para pasarlos a showModal
            const currentProductData = {
                name: productName,
                quantity: quantity,
                total: formattedTotal,
                discountApplied: discountApplied,
                discountAmount: formattedDiscountAmount,
                appliedDiscountRate: appliedDiscountRate
            };


            // *** Prepara el contenido HTML para el MODAL (incluyendo campos de datos personales y selector de envío) ***
            let modalContentInnerHtml = `
                <h1>Resumen de tu Pedido</h1>
                <h2>${productName}</h2>
                <p>Precio unitario: <strong>C$${formattedBasePrice}</strong></p>
                <p>Cantidad seleccionada: <strong>${quantity}</strong></p>
                <p>Subtotal: <strong>C$${formattedSubtotal}</strong></p>
            `;

            if (discountApplied) {
                modalContentInnerHtml += `
                    <p class="discount">¡Descuento del ${appliedDiscountRate * 100}% aplicado por ${quantity} unidades!</p>
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
            // *** FIN Preparación HTML para el MODAL ***


            // *** Mostrar el modal con el contenido generado y añadir listeners ***
            showModal(currentProductData, modalContentInnerHtml);
        });
    });

    // Función auxiliar para generar el enlace de WhatsApp
    function generateWhatsAppLink(name, quantity, total, discountApplied, discountAmount, appliedDiscountRate, customerName, customerAddress, shippingMethod) {
        let text = `¡Hola! Quiero hacer un pedido:\n`;
        text += `- Producto: ${name}\n`;
        text += `- Cantidad: ${quantity}\n`;
        text += `- Total: C$${total}\n`;
        if (discountApplied) {
             text += `(Incluye descuento del ${appliedDiscountRate * 100}% de C$${discountAmount})\n`;
        }
        // Añadir los datos del cliente y el método de envío al mensaje
        text += `\n--- Datos del Cliente ---\n`;
        text += `Nombre: ${customerName}\n`;
        text += `Dirección: ${customerAddress}\n`;
        text += `Método de Envío: ${shippingMethod}\n`;
        text += `------------------------\n`;

        text += `\n¿Podrían confirmar mi pedido?`;

        const phoneNumber = '50558081576';

        return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    }

});
