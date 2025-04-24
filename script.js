document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los botones con la clase js-comprar
    const buyButtons = document.querySelectorAll('.js-comprar');

    // Define los umbrales y porcentajes de descuento
    const discountThreshold30 = 6; // Umbral para el 30%
    const discountRate30 = 0.20;   // 20%

    const discountThreshold70 = 12; // Umbral para el 70% (nueva regla)
    const discountRate70 = 0.50;   // 70%

    // Agrega un 'listener' a cada botón
    buyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Previene el comportamiento predeterminado
            event.preventDefault();

            // Encuentra el elemento padre 'producto' del botón clickeado
            const productElement = button.closest('.producto');

            // Extrae la información del producto
            const productName = productElement.querySelector('h2').innerText;
            const priceElement = productElement.querySelector('.precio');
            const basePrice = parseFloat(priceElement.dataset.precio); // Precio base desde data-precio
            const quantityInput = productElement.querySelector('.cantidad-producto');
            const quantity = parseInt(quantityInput.value, 10); // Cantidad como número entero

            // Validación básica de cantidad
            if (isNaN(quantity) || quantity < 1) {
                alert('Por favor, ingresa una cantidad válida (mínimo 1).');
                quantityInput.value = 1; // Restablece a 1 si es inválido
                return; // Detiene la ejecución
            }

            // Calcula el subtotal sin descuento
            const subtotal = basePrice * quantity;

            // --- Lógica para aplicar los descuentos ---
            let total = subtotal;
            let discountAmount = 0;
            let discountApplied = false;
            let appliedDiscountRate = 0; // Para mostrar qué descuento se aplicó

            if (quantity >= discountThreshold70) {
                // Si es 15 o más, aplica el 70% (esta condición va primero)
                appliedDiscountRate = discountRate70;
                discountAmount = subtotal * appliedDiscountRate;
                total = subtotal - discountAmount;
                discountApplied = true;
            } else if (quantity >= discountThreshold30) {
                // Si no es 15+ pero es 12 o más, aplica el 30%
                appliedDiscountRate = discountRate30;
                discountAmount = subtotal * appliedDiscountRate;
                total = subtotal - discountAmount;
                discountApplied = true;
            }
            // Si la cantidad es menor a 12, no hay descuento (discountApplied sigue siendo false, total es subtotal)
            // --- Fin lógica de descuentos ---


            // Formatea los valores para mostrarlos (usando toFixed para 2 decimales)
            const formattedBasePrice = basePrice.toFixed(2);
            const formattedSubtotal = subtotal.toFixed(2);
            const formattedDiscountAmount = discountAmount.toFixed(2);
            const formattedTotal = total.toFixed(2);

            // Prepara el contenido HTML para la nueva ventana
            let summaryHTML = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Resumen de tu Pedido</title>
                    <style>
                        body { font-family: sans-serif; line-height: 1.6; margin: 20px; background-color: #f4f4f4; color: #333; }
                        .container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 500px; margin: 20px auto; }
                        h1, h2 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
                        p { margin-bottom: 10px; }
                        strong { color: #007BFF; }
                        .total { font-size: 1.3em; font-weight: bold; color: #28a745; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px; }
                        .discount { color: #dc3545; font-weight: bold; }
                         .whatsapp-button {
                            display: inline-block;
                            background-color: #25D366;
                            color: white;
                            padding: 12px 25px;
                            text-decoration: none;
                            border-radius: 5px;
                            font-size: 1em;
                            font-weight: bold;
                            margin-top: 20px;
                            text-align: center;
                        }
                        .whatsapp-button:hover { background-color: #1DA851; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Resumen de tu Pedido</h1>
                        <h2>${productName}</h2>
                        <p>Precio unitario: <strong>C$${formattedBasePrice}</strong></p>
                        <p>Cantidad seleccionada: <strong>${quantity}</strong></p>
                        <p>Subtotal: <strong>C$${formattedSubtotal}</strong></p>
            `;

            if (discountApplied) {
                // Muestra el porcentaje aplicado dinámicamente
                summaryHTML += `
                    <p class="discount">¡Descuento del ${appliedDiscountRate * 100}% aplicado por ${quantity} unidades!</p>
                    <p>Ahorraste: <strong class="discount">C$${formattedDiscountAmount}</strong></p>
                `;
            }

            summaryHTML += `
                        <p class="total">Total a pagar: <strong>C$${formattedTotal}</strong></p>

                        <a href="${generateWhatsAppLink(productName, quantity, formattedTotal, discountApplied, formattedDiscountAmount, appliedDiscountRate)}" class="whatsapp-button" target="_blank">
                            Confirmar Pedido por WhatsApp
                        </a>

                    </div>
                </body>
                </html>
            `;

            // Abre una nueva ventana y escribe el HTML generado
            const orderSummaryWindow = window.open('', '_blank');
            if (orderSummaryWindow) {
                orderSummaryWindow.document.open();
                orderSummaryWindow.document.write(summaryHTML);
                orderSummaryWindow.document.close();
            } else {
                alert('No se pudo abrir la ventana de resumen. Por favor, permite ventanas emergentes para este sitio.');
            }
        });
    });

    // Función auxiliar para generar el enlace de WhatsApp
    function generateWhatsAppLink(name, quantity, total, discountApplied, discountAmount, appliedDiscountRate) {
        let text = `¡Hola! Quiero hacer un pedido:%0A`; // %0A es salto de línea en URL
        text += `- Producto: ${name}%0A`;
        text += `- Cantidad: ${quantity}%0A`;
        text += `- Total: C$${total}%0A`;
        if (discountApplied) {
             // Incluye el porcentaje aplicado en el mensaje
             text += `(Incluye descuento del ${appliedDiscountRate * 100}% de C$${discountAmount})%0A`;
        }
        text += `%0A¿Podrían confirmar mi pedido?`; // Añade un mensaje final

        // Número de teléfono al que enviar el mensaje
        const phoneNumber = '50558081576'; // Asegúrate que este sea el número correcto

        // URL de WhatsApp con el texto predefinido
        return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`; // Usamos encodeURIComponent para asegurar que el texto se formatea correctamente
    }

});
