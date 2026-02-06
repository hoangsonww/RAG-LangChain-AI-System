"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /ping:
 *   get:
 *     summary: Returns the authenticated user details.
 *     tags:
 *       - Ping
 *     responses:
 *       200:
 *         description: The authenticated user's details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *       401:
 *         description: Unauthorized.
 */
router.get("/", (req, res) => {
    // req.user was attached by the bearerAuth middleware.
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({
        name: req.user.name,
        email: req.user.email,
    });
});
exports.default = router;
