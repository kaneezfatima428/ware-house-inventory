/**
 * Restrict access to specified roles
 * @param  {...string} roles - e.g. 'admin', 'warehouseManager', 'supplier', 'salesRepresentative'
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking authorization.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

/**
 * Validates that if the current user is a warehouseManager, they are assigned to the specified warehouse.
 * Admins bypass this check.
 * @param {Function|string} warehouseIdResolver - either a resolver fn (req) => id or a property path like 'body.warehouse' or 'params.id'
 */
export const checkWarehouseAccess = (warehouseIdResolver = 'body.warehouse') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admins have global access
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role === 'warehouseManager') {
      let warehouseId;
      if (typeof warehouseIdResolver === 'function') {
        warehouseId = warehouseIdResolver(req);
      } else {
        const parts = warehouseIdResolver.split('.');
        warehouseId = parts.reduce((acc, part) => acc && acc[part], req);
      }

      if (!warehouseId) {
        return res.status(400).json({
          success: false,
          message: 'Warehouse ID is required for access verification.'
        });
      }

      const assignedIds = (req.user.assignedWarehouses || []).map((w) =>
        (w._id || w).toString()
      );

      if (!assignedIds.includes(warehouseId.toString())) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied. Warehouse Managers are only permitted to access or modify their assigned warehouses.'
        });
      }

      return next();
    }

    // If another role tries to access warehouse management endpoints
    return res.status(403).json({
      success: false,
      message: 'Access denied for your role.'
    });
  };
};
