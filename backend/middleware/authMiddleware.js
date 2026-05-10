const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * PROTECT: The primary authentication gate.
 * Verifies the JWT and attaches the user payload to the request.
 */
const protect = (req, res, next) => {
    // Express actually normalizes headers to lowercase, but keeping your 
    // flexible check just to be safe across different environments!
    const rawHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!rawHeader) {
        return res.status(401).json({ message: "Access Denied: No Header Found" });
    }

    // Your headache-remedy: Stripping 'Bearer ' if it exists
    const token = rawHeader.startsWith('Bearer ') 
        ? rawHeader.slice(7) 
        : rawHeader;

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        // Attach the full user object (id, username, role) to the request
        req.user = verified; 
        next();
    } catch (err) {
        console.error("JWT Verify Error:", err.message);
        return res.status(401).json({ message: "Invalid or Expired Token" });
    }
};

/**
 * AUTHORIZE ROLES: The RBAC gate.
 * Use this AFTER 'protect' to restrict access to specific roles.
 * Usage: authorizeRoles('Admin', 'Supervisor')
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // If 'protect' didn't run first, req.user won't exist
        if (!req.user) {
            return res.status(500).json({ message: "Internal Auth Error: User data missing" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access Forbidden: Your role (${req.user.role}) does not have permission.` 
            });
        }

        next();
    };
};

module.exports = {
    protect,
    authorizeRoles
};