## Instrucciones de Ejecución

Para ejecutar la aplicación, sigue estos pasos en tu terminal (CMD):

1.  Clona el repositorio desde GitHub:

    ```bash
    git clone https://github.com/mandelbaummatias/tp-integrador-fullstack-up.git
    ```

2.  Navega al directorio del proyecto:

    ```bash
    cd tp-integrador-fullstack-up
    ```

3.  Crea un archivo `.env` en esta carpeta y agrega la variable de entorno proporcionada. Por ejemplo, si tu URL de la base de datos es `miurlremota`, puedes hacerlo con el siguiente comando:

    ```bash
    echo DATABASE_URL=miurlremota > .env
    ```

    **Importante:** Asegúrate de reemplazar `miurlremota` con la URL de tu base de datos.

4.  Instala las dependencias del proyecto:

    ```bash
    npm i
    ```

5.  Genera el cliente de Prisma:

    ```bash
    npx prisma generate
    ```

6.  Ejecuta el servidor de desarrollo:

    ```bash
    npm run dev
    ```

    Este comando iniciará el servidor y podrás acceder a la documentación de los endpoints de la API.

7.  Correr colección "tp-integrador-parador-CU's" en Postman

---

# API Endpoints Documentation

Este documento describe los endpoints disponibles en la API del sistema de reservas.

## Índice de Endpoints

1. [POST /api/reservar](#post-apireservar)
2. [PUT /api/aplicarSeguroTormenta/{id}](#put-apiaplicarSeguroTormentaid)
3. [PUT /api/cancelarTurno/{id}](#put-apicancelarTurnoid)
4. [DELETE /api/deleteAll](#delete-apideleteAll)
5. [GET /api/getTotalAPagar/{id}](#get-apigetTotalAPagarid)
6. [GET /api/healthcheck](#get-apihealthcheck)
7. [POST /api/liberarTurnosNoPagados](#post-apiliberarTurnosNoPagados)
8. [POST /api/pagarReserva](#post-apipagarReserva)
9. [POST /api/pagarReservas](#post-apipagarReservas)

---

## POST /api/reservar

Crea una nueva reserva en el sistema.

### Payload

```json
{
  "clienteId": "string",
  "productoId": "string",
  "turnoId": "string",
  "cantidadPersonas": number,
  "medioPago": "string",
  "tipoMoneda": "string",
  "incluyeSeguro": boolean
}
```

### Proceso

1. Valida los datos de entrada (medio de pago, tipo de moneda, opciones de pago)
2. Realiza validaciones básicas de los IDs proporcionados
3. Verifica la existencia de las entidades (cliente, producto, turno)
4. Valida reglas de negocio específicas
5. Obtiene los dispositivos de seguridad necesarios según el producto y cantidad de personas
6. Crea la reserva en una transacción:
   - Registra la reserva con estado `PENDIENTE_PAGO`
   - Actualiza el estado del turno a `RESERVADO`
   - Asocia los dispositivos de seguridad necesarios

### Respuestas

- **201**: Reserva creada exitosamente
- **400**: Error de validación
- **500**: Error del servidor

---

## PUT /api/aplicarSeguroTormenta/{id}

Aplica el seguro por tormenta a las reservas de un cliente para el día actual.

### Parámetros URL

- **id**: ID del cliente

### Proceso

1. Valida la existencia del cliente
2. Obtiene todas las reservas activas del cliente para el día actual
3. Filtra las reservas pagadas que incluyen seguro
4. Procesa la cancelación de reservas por tormenta y calcula las compensaciones
5. Actualiza el saldo del cliente

### Respuestas

- **200**: Operación exitosa con detalles de compensación
- **400**: Error de validación
- **404**: Cliente no encontrado
- **500**: Error del servidor

---

## PUT /api/cancelarTurno/{id}

Cancela un turno y su reserva asociada, reintegrando el pago al saldo del cliente si corresponde.

### Parámetros URL

- **id**: ID del turno a cancelar

### Proceso

1. Valida la existencia del turno y su reserva asociada
2. Verifica que la cancelación cumpla con la regla de antelación (mínimo 2 horas antes)
3. En una transacción:
   - Actualiza el estado de la reserva a `CANCELADA`
   - Cambia el estado del turno a `DISPONIBLE`
   - Si la reserva estaba pagada, reintegra el monto al saldo del cliente

### Respuestas

- **200**: Turno cancelado exitosamente
- **400**: Error de validación o turno no encontrado
- **500**: Error del servidor

---

## DELETE /api/deleteAll

Elimina todos los registros de la base de datos (para uso en entornos de desarrollo/testing).

### Proceso

Elimina en cascada todos los registros de las siguientes tablas:

- Pagos
- TipoMonedaConfig
- ReservaDispositivoSeguridad
- Reservas
- Turnos
- Productos
- SaldoCliente
- Clientes
- DispositivoSeguridad

### Respuestas

- **200**: Datos eliminados exitosamente
- **400/500**: Error al eliminar datos

---

## GET /api/getTotalAPagar/{id}

Calcula el total a pagar por un cliente para sus reservas pendientes.

### Parámetros URL

- **id**: ID del cliente

### Proceso

1. Valida la existencia del cliente
2. Obtiene todas las reservas pendientes del cliente
3. Calcula los totales a pagar, considerando:
   - Moneda local y extranjera
   - Descuentos aplicables
   - Conversiones de moneda

### Respuestas

- **200**: Detalles de los totales a pagar
- **400**: Error de validación
- **404**: Cliente no encontrado
- **500**: Error del servidor

---

## GET /api/healthcheck

Verifica que la aplicación esté funcionando correctamente.

### Respuestas

- **200**: `{ "message": "App ok!" }`

---

## POST /api/liberarTurnosNoPagados

Libera automáticamente los turnos reservados con pago en efectivo que no han sido pagados dentro del tiempo límite.

### Proceso

1. Obtiene la hora actual
2. Busca todas las reservas pendientes de pago con medio de pago en efectivo
3. Identifica las reservas que deben ser liberadas según reglas de tiempo
4. En una transacción por cada reserva:
   - Actualiza el estado de la reserva a `CANCELADA`
   - Libera el turno, cambiando su estado a `DISPONIBLE`

### Respuestas

- **200**: Información sobre turnos liberados
- **500**: Error del servidor

---

## POST /api/pagarReserva

Procesa el pago de una reserva individual.

### Payload

```json
{
  "reservaId": "string",
  "medioPago": "string", // opcional, debe coincidir con la reserva
  "tipoMoneda": "string" // opcional, debe coincidir con la reserva
}
```

### Proceso

1. Valida la existencia de la reserva y sus entidades asociadas
2. Verifica que la reserva esté en estado pendiente de pago
3. Valida que el turno no haya expirado
4. Verifica que el medio de pago y tipo de moneda coincidan con los de la reserva
5. Determina si aplica descuento (cliente con múltiples reservas)
6. Calcula el monto final considerando descuentos y seguros
7. Procesa el pago y actualiza el estado de la reserva a `PAGADA`
8. Crea un registro de pago

### Respuestas

- **200**: Pago procesado exitosamente con detalles
- **400**: Error de validación
- **500**: Error del servidor

---

## POST /api/pagarReservas

Procesa el pago de múltiples reservas simultáneamente.

### Payload

```json
{
  "reservasIds": ["string", "string", ...]
}
```

### Proceso

1. Valida que todas las reservas pertenezcan al mismo cliente
2. Verifica cada reserva individualmente:
   - Existencia
   - Estado
   - Turno no expirado
3. Determina si aplica descuento (automático para múltiples reservas)
4. Calcula el monto total con descuentos y seguros
5. Procesa cada pago individualmente usando el medio de pago y moneda configurados en cada reserva
6. Distribuye proporcionalmente el monto entre las reservas
7. Crea registros de pago para cada reserva

### Respuestas

- **200**: Pagos procesados exitosamente con detalles
- **400**: Error de validación
- **500**: Error del servidor
