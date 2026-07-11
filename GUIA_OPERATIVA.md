# 🐟 Poisson POS — Guía Operativa

## Flujo operativo paso a paso

---

### 1. Apertura del día

**Quién:** Administrador o Cajero

1. Iniciar sesión
2. Ir a **Caja** → "Abrir Caja"
3. Ingresar el monto inicial de efectivo
4. La caja queda **Abierta** — el sistema está listo para operar

---

### 2. Atender un cliente

**Quién:** Mesero

1. El cliente llega → ir a **Mesas**
2. Click en una mesa **Libre** → se abre un modal para asignar mesero
3. Seleccionar el mesero → la mesa pasa a **Ocupada** (verde → rojo)

---

### 3. Tomar el pedido

**Quién:** Mesero

1. Ir a **Pedidos** → "+ Nuevo Pedido"
2. Seleccionar la mesa (solo aparecen las ocupadas)
3. Buscar y agregar productos (cerveza, shots, comida, etc.)
4. Ajustar cantidades con los botones + y −
5. Click "Crear Pedido"

**Si el cliente pide más después:** se repite el mismo proceso con la misma mesa — los productos se agregan al pedido existente del día (no se crea uno nuevo).

---

### 4. Cobrar la cuenta

**Quién:** Cajero o Administrador

1. Ir a **Ventas** → "+ Nueva Venta"
2. Seleccionar el pedido (solo aparecen los de hoy no cobrados)
3. Ver el total a cobrar
4. Agregar los pagos:
   - Seleccionar método (Efectivo, Nequi, Daviplata, Tarjeta, Transferencia)
   - Ingresar monto
   - Puede ser **pago mixto** (ej: $50.000 en efectivo + $80.000 en Nequi)
   - Botón "Pagar Todo" para cubrir el restante de un clic
5. El sistema muestra si falta, si es exacto, o cuánto devolver
6. Click "Registrar Venta"

**Resultado automático:**
- Se descuenta el inventario
- La mesa se libera (vuelve a verde)
- El pedido pasa a "Entregado"
- La venta se asocia a la caja abierta

---

### 5. Registrar shots (si aplica)

**Quién:** Bartender o Cajero

1. Ir a **Shots del Día**
2. Click "+1 Shot 🥃" en la botella correspondiente
3. El sistema suma el conteo y calcula los ingresos del día

---

### 6. Cierre del día

**Quién:** Administrador o Cajero

1. Ir a **Caja** → "Cerrar Caja"
2. El sistema muestra:
   - Monto de apertura
   - Ventas en efectivo del día
   - **Efectivo esperado** (apertura + ventas efectivo)
3. Contar el efectivo real en la caja
4. Ingresar el monto contado
5. El sistema indica si hay sobrante, faltante, o coincide
6. Click "Cerrar Caja"
7. Se puede **exportar/imprimir** el reporte de cierre

---

### 7. Otras tareas (Administrador)

| Tarea | Sección |
|-------|---------|
| Crear/editar empleados | Empleados |
| Crear/editar productos y precios | Productos |
| Crear categorías | Categorías |
| Agregar mesas | Mesas |
| Registrar movimientos de inventario | Inventario |
| Ver alertas de bajo stock | Dashboard / Inventario |
| Registrar botellas nuevas | Shots/Barriles |

---

## Resumen por rol

| Rol | Qué hace |
|-----|----------|
| **Admin** | Todo: configurar, operar, reportes |
| **Cajero** | Abrir/cerrar caja, cobrar ventas, inventario |
| **Mesero** | Abrir mesas, tomar pedidos |
| **Bartender** | Registrar shots vendidos |

---

## Credenciales de acceso

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@poisson.com | admin123 |
| Cajero | cajero@poisson.com | cajero123 |
| Mesero | mesero@poisson.com | mesero123 |
| Bartender | bartender@poisson.com | bartender123 |

---

## Notas importantes

- Los pedidos son **uno por mesa por día**. Si se agregan más productos a la misma mesa, se suman al pedido existente.
- Los shots se **reinician automáticamente** cada día a medianoche.
- La vista de Pedidos y Ventas muestra por defecto solo los registros de **hoy**. Para ver el historial completo, usar el toggle "Historial".
- El Dashboard se actualiza automáticamente cada pocos segundos.
- El sistema funciona en **modo claro y oscuro** (toggle en la barra superior).
