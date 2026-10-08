# POS — Inventario y Ventas

Sistema de punto de venta genérico (comida, servicios, varios, etc.) con inventario, caja, reportes, usuarios e impresión de tickets.  
Stack: React + Vite (frontend), Express + SQLite (backend), opcional Electron.

Moneda: **EUR (€)**. IVA por defecto: **21 %** (configurable en Ajustes).

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- Windows (recomendado; hay integración de impresoras vía PowerShell)

## Instalación

Abre dos terminales (o usa las rutas absolutas).

### 1. Backend (API + base de datos)

```bash
cd pos-mockup/backend
npm install
npm start
```

El servidor queda en `http://localhost:3001`.  
La primera vez crea la base SQLite (`pos.db`) y un usuario admin por defecto.

### 2. Frontend

```bash
cd pos-mockup
npm install
npm run dev
```

Abre la URL que muestre Vite (normalmente `http://localhost:5173`).

### Login por defecto

| Usuario | Contraseña |
|---------|------------|
| `admin` | `admin123` |

### App de escritorio (opcional)

Con el backend ya corriendo:

```bash
cd pos-mockup
npm run electron:dev
```

Para generar instalador Windows:

```bash
cd pos-mockup
npm run electron:build
```

## Módulos principales

- **POS**: buscar productos, carrito, pagos, ticket
- **Inventario**: alta/edición de productos y variantes
- **Reportes**: ventas del día/mes, turnos de caja
- **Ajustes**: empresa, ticket, usuarios, backup SQLite, impresora

## Notas

- El IVA se configura en Ajustes (por defecto 21 %). Los precios pueden ir con impuesto incluido.
- Los backups se guardan/restauran desde Ajustes → Mantenimiento.
- Los productos de ejemplo (bebidas, comida, servicios) solo se cargan en una base nueva. Si ya tenías datos antiguos, bórralos o limpia la BD desde Ajustes.
- Hay otra carpeta `pos-tienda-accesorios` en el repo: es solo una maqueta visual antigua, no el sistema completo.
