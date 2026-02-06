"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bearerAuth = void 0;
function bearerAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    // For demo purposes, accept only "valid-token"
    if (token !== "psJN7z3J9q") {
        return res.status(401).json({ error: "Unauthorized" });
    }
    // Attach dummy user data (could be replaced with real user lookup)
    req.user = { name: "John Doe", email: "john.doe@example.com" };
    next();
}
exports.bearerAuth = bearerAuth;
