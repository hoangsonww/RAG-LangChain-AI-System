"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Sector_1 = __importDefault(require("../models/Sector")); // Use your Mongoose model
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/sectors:
 *   get:
 *     summary: Returns details for a specific sector.
 *     tags:
 *       - Sectors
 *     parameters:
 *       - in: query
 *         name: sector
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the sector.
 *     responses:
 *       200:
 *         description: Sector details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sector:
 *                   type: string
 *                   example: "Clothing"
 *                 description:
 *                   type: string
 *                   example: "Description of the clothing sector."
 *                 companies:
 *                   type: array
 *                   items:
 *                     type: string
 *                 investment_team:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Query parameter "sector" is missing.
 *       404:
 *         description: Sector not found.
 *       500:
 *         description: Server error.
 */
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sectorQuery = req.query.sector;
        if (!sectorQuery) {
            return res
                .status(400)
                .json({ error: "Query parameter 'sector' is required" });
        }
        // Perform a case-insensitive search
        const sectorData = yield Sector_1.default.findOne({
            sector: { $regex: new RegExp(`^${sectorQuery}$`, "i") },
        }).lean();
        if (!sectorData) {
            return res.status(404).json({ error: "Sector not found" });
        }
        res.json(sectorData);
    }
    catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}));
exports.default = router;
