"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /auth/token:
 *   get:
 *     summary: Returns a dummy bearer token.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: A dummy bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "psJN7z3J9q"
 */
router.get("/token", (req, res) => {
    res.json({ token: "psJN7z3J9q" });
});
exports.default = router;
