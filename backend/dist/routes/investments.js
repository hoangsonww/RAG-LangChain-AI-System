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
const Investment_1 = __importDefault(require("../models/Investment"));
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/investments:
 *   get:
 *     summary: Returns investment details for a company (excludes insights).
 *     tags:
 *       - Investments
 *     parameters:
 *       - in: query
 *         name: company_name
 *         required: true
 *         schema:
 *           type: string
 *         description: The company name to retrieve.
 *     responses:
 *       200:
 *         description: Investment details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company_name:
 *                   type: string
 *                 location:
 *                   type: string
 *                 website:
 *                   type: string
 *                 sectors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Query parameter "company_name" is missing.
 *       404:
 *         description: Company not found.
 *       500:
 *         description: Server error.
 */
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const companyQuery = req.query.company_name;
        if (!companyQuery) {
            return res
                .status(400)
                .json({ error: "Query parameter 'company_name' is required" });
        }
        // Search case-insensitively using a regular expression.
        const investment = yield Investment_1.default.findOne({
            company_name: { $regex: new RegExp(`^${companyQuery}$`, "i") },
        }).lean();
        if (!investment) {
            return res.status(404).json({ error: "Company not found" });
        }
        const { company_name, location, website, sectors } = investment;
        res.json({ company_name, location, website, sectors });
    }
    catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}));
/**
 * @openapi
 * /api/investments/insights:
 *   get:
 *     summary: Returns only the insights for a company.
 *     tags:
 *       - Investments
 *     parameters:
 *       - in: query
 *         name: company_name
 *         required: true
 *         schema:
 *           type: string
 *         description: The company name to retrieve insights for.
 *     responses:
 *       200:
 *         description: A list of insights.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Query parameter "company_name" is missing.
 *       404:
 *         description: Company not found.
 *       500:
 *         description: Server error.
 */
router.get("/insights", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const companyQuery = req.query.company_name;
        if (!companyQuery) {
            return res
                .status(400)
                .json({ error: "Query parameter 'company_name' is required" });
        }
        const investment = yield Investment_1.default.findOne({
            company_name: { $regex: new RegExp(`^${companyQuery}$`, "i") },
        }).lean();
        if (!investment) {
            return res.status(404).json({ error: "Company not found" });
        }
        res.json(investment.insights);
    }
    catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}));
exports.default = router;
