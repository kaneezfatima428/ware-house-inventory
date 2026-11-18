# 📦 WareFlow — Inventory & Warehouse Management System

A production-ready, full-stack **MERN (MongoDB, Express.js, React.js, Node.js)** Inventory & Warehouse Management System with **JWT authentication, Role-Based Access Control (RBAC), multi-warehouse stock tracking, supplier requests, sales orders, and secure ImageKit media uploads**.

---

## 🏗️ System Architecture & Technology Stack

- **Backend**: Node.js & Express.js (ES Modules)
- **Database**: MongoDB with Mongoose (with compound unique indexes, references, and population)
- **Authentication & Security**: JSON Web Tokens (JWT) & bcryptjs password hashing
- **Image Uploads**: ImageKit integration (Mandatory; using backend upload signature generation)
- **Frontend**: React.js (Vite), React Router DOM v7, Tailwind CSS, Axios, Lucide React Icons

---

## 📁 Project Architecture & Folder Structure

```
c:\ware house inventory\
├── package.json                          # Root run scripts
├── README.md                             # Comprehensive documentation
├── server/                               # Express REST API Backend
│   ├── .env.example                      # Template environment variables
│   ├── .env                              # Active environment variables
│   ├── package.json                      # Backend dependencies & scripts
│   ├── server.js                         # Server entry point & CORS configuration
│   ├── config/
│   │   └── db.js                         # MongoDB connection with DNS SRV lookup fix
│   ├── models/
│   │   ├── User.js                       # User schema with roles & assignedWarehouses
│   │   ├── Product.js                    # Product catalog schema with SKU & lowStockLimit
│   │   ├── Warehouse.js                  # Warehouse schema with manager ref & capacity
│   │   ├── Stock.js                      # Compound unique index {product: 1, warehouse: 1}
│   │   ├── StockTransaction.js           # Audit log of stock-in and stock-out movements
│   │   ├── Order.js                      # Multi-item sales order with lifecycle statuses
│   │   └── SupplyRequest.js              # Vendor stock replenishment requests
│   ├── middleware/
│   │   ├── authMiddleware.js             # JWT Bearer token verification
│   │   ├── roleMiddleware.js             # authorizeRoles & checkWarehouseAccess
│   │   ├── errorHandler.js               # Centralized error & 404 handler
│   │   └── uploadMiddleware.js           # Multer memory storage (5MB max)
│   ├── controllers/
│   │   ├── authController.js             # register (no admin), login, getMe
│   │   ├── userController.js             # Admin user CRUD & warehouse assignments
│   │   ├── productController.js          # Product CRUD & ImageKit image cleanup
│   │   ├── warehouseController.js        # Warehouse CRUD & manager synchronization
│   │   ├── stockController.js            # stockIn, stockOut, low-stock query, transactions
│   │   ├── orderController.js            # createOrder, updateOrderStatus, cancelOrder
│   │   ├── supplyRequestController.js    # submitRequest, approve/reject with auto stock-in
│   │   ├── uploadController.js           # ImageKit authentication params & file delete
│   │   └── dashboardController.js        # Multi-role KPI statistics
│   ├── routes/
│   │   ├── authRoutes.js                 # /api/auth
│   │   ├── userRoutes.js                 # /api/users (Admin)
│   │   ├── productRoutes.js              # /api/products
│   │   ├── warehouseRoutes.js            # /api/warehouses
│   │   ├── stockRoutes.js                # /api/stock
│   │   ├── orderRoutes.js                # /api/orders
│   │   ├── supplyRequestRoutes.js        # /api/supply-requests
│   │   ├── uploadRoutes.js               # /api/upload
│   │   └── dashboardRoutes.js            # /api/dashboard
│   ├── utils/
│   │   └── imagekit.js                   # ImageKit client & signature generator
│   └── scripts/
│       └── seed.js                       # Database seeder with sample accounts & items
└── client/                               # React.js Frontend
    ├── index.html                        # HTML template with Tailwind CSS & Inter font
    ├── vite.config.js                    # Vite configuration
    ├── package.json                      # Frontend dependencies
    └── src/
        ├── App.jsx                       # Routing setup & role-based route protection
        ├── main.jsx                      # React 19 entry point
        ├── index.css                     # Base styling & custom animations
        ├── services/
        │   └── api.js                    # Axios instance with Bearer interceptor & ImageKit
        ├── context/
        │   └── AuthContext.jsx           # Global user state, token storage, and role tracking
        ├── components/
        │   ├── Navbar.jsx                # Top bar with user profile & logout
        │   ├── Sidebar.jsx               # Role-aware responsive navigation sidebar
        │   ├── ProtectedRoute.jsx        # RBAC route guard & layout wrapper
        │   ├── StatsCard.jsx             # Metric KPI card
        │   ├── StatusBadge.jsx           # Color-coded badges for order & stock statuses
        │   ├── Modal.jsx                 # Reusable animated modal dialog
        │   ├── ImageUpload.jsx           # ImageKit upload component with preview
        │   └── LoadingSpinner.jsx        # Animated loader
        └── pages/
            ├── Unauthorized.jsx          # 403 Forbidden page
            ├── auth/
            │   ├── Login.jsx             # Login with 1-click test credentials
            │   └── Register.jsx          # Public register (Admin role strictly excluded)
            ├── admin/
            │   ├── AdminDashboard.jsx    # System metrics & low-stock alerts
            │   ├── UserManagement.jsx    # User CRUD & warehouse role mapping
            │   ├── ProductManagement.jsx # Catalog CRUD with ImageKit upload
            │   └── WarehouseManagement.jsx # Multi-warehouse facilities & stock view
            ├── warehouseManager/
            │   ├── ManagerDashboard.jsx  # Overview of assigned facilities & stock
            │   ├── InventoryView.jsx     # Facility inventory with low-stock alerts
            │   ├── StockInOut.jsx        # Stock-In (+) & Stock-Out (-) with validation
            │   └── TransactionHistory.jsx# Complete audit log of all stock movements
            ├── supplier/
            │   ├── SupplierDashboard.jsx # Brand profile & ImageKit logo upload
            │   └── SupplyRequests.jsx    # Submit & track restock requests
            └── salesRep/
                ├── SalesDashboard.jsx    # Sales KPIs & recent orders
                ├── ProductCatalog.jsx    # Catalog search & network availability
                ├── CreateOrder.jsx       # Multi-product order with live stock check
                └── MyOrders.jsx          # Order tracking & cancellation (Pending only)
```

---

## 👥 User Roles & Access Rights

| Capability | Administrator | Warehouse Manager | Supplier | Sales Representative |
| :--- | :---: | :---: | :---: | :---: |
| **System Overview & All Stats** | ✅ | ❌ (Own assigned) | ❌ (Own profile) | ❌ (Own orders) |
| **User CRUD & Role Assignment** | ✅ | ❌ | ❌ | ❌ |
| **Warehouse Facilities CRUD** | ✅ | ❌ | ❌ | ❌ |
| **Product Catalog Management** | ✅ | ✅ | ✅ (Own items) | ❌ (Read only) |
| **Stock-In & Stock-Out** | ✅ | ✅ (Assigned only) | ❌ | ❌ |
| **Review Supply Requests** | ✅ | ✅ (Assigned only) | ❌ | ❌ |
| **Submit Supply Requests** | ✅ | ❌ | ✅ | ❌ |
| **Create Sales Orders** | ✅ | ❌ | ❌ | ✅ |
| **Process / Deduct Order Stock** | ✅ | ✅ (Assigned only) | ❌ | ❌ |
| **Cancel Sales Order** | ✅ | ✅ | ❌ | ✅ (Pending only) |

---

## 🔑 Default Seed Credentials for Testing

Run `npm run seed` inside `server/` to populate sample data:

| Role | Email | Password | Assigned Facilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@inventory.com` | `admin123` | Global System Access |
| **Warehouse Manager** | `manager@inventory.com` | `manager123` | Central Hub Alpha, North Depot |
| **Supplier** | `supplier@inventory.com` | `supplier123` | Global Tech Supplies Vendor |
| **Sales Representative** | `sales@inventory.com` | `sales123` | Customer Sales Orders |

*(The login screen also features 1-click quick-fill buttons for instant evaluation).*

---

## ⚡ How to Run the Project Locally

### 1. Start the Backend Server
```powershell
cd "c:\ware house inventory\server"
npm start
```
The REST API will launch at `http://localhost:5000`.

### 2. Start the Frontend React Client
```powershell
cd "c:\ware house inventory\client"
npm run dev
```
The React application will launch at `http://localhost:5173`.

---

## 🔒 Crucial Business Logic Implemented

1. **Controlled Stock Deduction on Order Processing**:
   - Creating a sales order **validates available stock** and saves the order in `Pending` status without deducting stock.
   - When a Warehouse Manager or Admin moves the order from `Pending` to `Processing`, the backend atomically deducts stock (`$inc: { quantity: -item.quantity }`) and creates `stock-out` transaction records.
   - Repeated processing calls are strictly rejected.
   - Orders in `Completed` or `Cancelled` status cannot be processed again.

2. **Order Cancellation Safety**:
   - A Sales Representative can cancel an order **only if it has not been processed** (status must be `Pending`).
   - If an order has already moved to `Processing` or `Completed`, cancellation is blocked.

3. **No Negative Stock Quantities**:
   - Every stock removal is validated against current warehouse inventory. If requested quantity > available quantity, the backend returns `400 Bad Request`.

4. **Public Registration Role Security**:
   - Public registration strictly denies self-assignment of the `admin` role. Attempting `role === 'admin'` returns `403 Forbidden`. Only existing Admins can create Admin accounts.

5. **Assigned Warehouse Scope**:
   - Warehouse Managers are strictly bounded to their `assignedWarehouses` array when adding stock, removing stock, or viewing inventory.

6. **ImageKit Mandatory Integration**:
   - Direct frontend uploads use authenticated tokens generated via `GET /api/upload/auth`.
   - Private keys are never exposed on the client.
   - Replacing or deleting product images cleans up the corresponding file from ImageKit via `imagekit.deleteFile()`.
