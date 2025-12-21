# 💊 Medic Maria Arz - Sistema de Farmacia

Sistema de gestión de inventario para farmacias con lógica FEFO (First Expired, First Out), control de lotes, alertas de vencimiento y punto de venta integrado.

## 🚀 Características

- ✅ **Dashboard** con KPIs y alertas en tiempo real
- ✅ **Inventario** con búsqueda avanzada y gestión de productos
- ✅ **Entrada de Mercancía** con escaneo de códigos de barras
- ✅ **Punto de Venta** con lógica FEFO automática
- ✅ **Alertas de Vencimiento** con semáforo de colores (🔴 🟡 🟢)
- ✅ **Control de Stock** con alertas de stock mínimo
- ✅ **Auditoría Completa** de todos los movimientos

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta en [Supabase](https://supabase.com) (gratis)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
cd farmacia-pc
npm install
```

### 2. Configurar Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Crea un nuevo proyecto
3. Ve a **Settings > API** y copia:
   - Project URL
   - anon/public key

### 3. Crear la base de datos

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Ejecuta el archivo `supabase/schema.sql` (crea las tablas, funciones y vistas)
3. Ejecuta el archivo `supabase/seed.sql` (carga datos de prueba)

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita el archivo `.env` y agrega tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 5. Ejecutar el proyecto

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 📱 Pantallas Principales

### 1. Dashboard
- KPIs: Valor total, productos, stock bajo, por vencer
- Tabla de productos con stock bajo
- Tabla de productos próximos a vencer (< 30 días)
- Auto-refresh cada 30 segundos

### 2. Inventario
- Búsqueda por nombre, principio activo o código de barras
- Filtros por categoría y estado de vencimiento
- Vista expandible de lotes por producto
- Agregar nuevos medicamentos

### 3. Entrada de Mercancía
- Escaneo de código de barras (USB scanner o manual)
- Registro de lotes con:
  - Código de lote
  - Fecha de vencimiento
  - Cantidad
  - Costo de compra (Bs)
  - Precio de venta (Bs)
- **Cálculo automático de margen de ganancia**

### 4. Punto de Venta
- Escaneo rápido de productos
- Carrito de compras interactivo
- **Totales en Bolivianos (Bs)**
- Alertas de productos próximos a vencer
- **Aplicación automática de lógica FEFO**

## 🎯 Lógica FEFO

La lógica **First Expired, First Out** está implementada en PostgreSQL mediante la función `fn_vender_producto()`:

1. Al confirmar una venta, el sistema ordena los lotes por fecha de vencimiento
2. Descuenta primero del lote más próximo a vencer
3. Si un lote no tiene suficiente stock, toma del siguiente
4. Registra todos los movimientos para auditoría

- ✅ Resta 25 del Lote A (se agota)
- ⚠️ Muestra alerta: "Lote A vence en 5 días"
- ✅ Resta 5 del Lote B
- ✅ Registra 2 movimientos de venta

## 🎨 Semáforo de Vencimiento

- 🔴 **Rojo (Crítico)**: Vence en < 30 días
- 🟡 **Amarillo (Advertencia)**: Vence en < 90 días
- 🟢 **Verde (Normal)**: Vence en > 90 días

## 📊 Base de Datos

### Tablas Principales

- **categorias**: Clasificación de medicamentos
- **medicamentos**: Catálogo maestro
- **lotes**: Control de vencimientos (FEFO)
- **movimientos**: Auditoría de entradas/salidas

### Vistas

- **vista_stock_total**: Stock consolidado por medicamento
- **vista_stock_bajo**: Productos bajo stock mínimo
- **vista_proximos_vencer**: Productos próximos a vencer

### Función Principal

- **fn_vender_producto()**: Implementa lógica FEFO automática

## 🚀 Despliegue a Producción

### Opción 1: Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

Configura las variables de entorno en Vercel Dashboard.

### Opción 2: Build Manual

```bash
npm run build
```

Los archivos estarán en `dist/`. Súbelos a cualquier hosting estático.

## 🔧 Tecnologías Utilizadas

- **Frontend**: React 19 + Vite
- **UI**: Ant Design 6
- **Routing**: React Router DOM 6
- **Backend**: Supabase (PostgreSQL)
- **Fechas**: Day.js
- **Iconos**: Ant Design Icons

## 📝 Datos de Prueba

El archivo `seed.sql` incluye:
- 8 categorías de medicamentos
- 17 productos con datos reales
- Múltiples lotes con diferentes fechas de vencimiento
- Escenarios de prueba para FEFO, stock bajo y vencimientos

## ⌨️ Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `F1` | Ir a Dashboard |
| `F2` | Ir a Inventario |
| `F3` | Ir a Entrada de Mercancía |
| `F4` | Ir a Punto de Venta |
| `Ctrl+N` | Nuevo Medicamento |
| `Ctrl+F` | Focus en búsqueda |
| `F9` | Confirmar Venta (en POS) |
| `Esc` | Cancelar acción actual |

## 🐛 Solución de Problemas

### Error: "Faltan las variables de entorno de Supabase"
- Verifica que el archivo `.env` existe
- Asegúrate de que las variables comienzan con `VITE_`
- Reinicia el servidor de desarrollo

### Error: "Cannot read properties of null"
- Ejecuta `schema.sql` en Supabase
- Verifica que las tablas se crearon correctamente
- Ejecuta `seed.sql` para datos de prueba

### Scanner de código de barras no funciona
- Verifica que el scanner está en modo "teclado"
- El scanner debe enviar Enter automáticamente
- Alternativamente, usa búsqueda manual

## 📄 Licencia

MIT

## 👨‍💻 Autor

Sistema desarrollado para gestión de inventario farmacéutico con enfoque en control de vencimientos y lógica FEFO.

---

**¿Necesitas ayuda?** Revisa la documentación en `implementation_plan.md` y `ui_design.md`

