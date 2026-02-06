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
const Consultation_1 = __importDefault(require("../models/Consultation")); // Use your Mongoose model
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/consultations:
 *   get:
 *     summary: Returns consultation details for a specific consultant.
 *     tags:
 *       - Consultations
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The consultant's name to search for within consultation details.
 *     responses:
 *       200:
 *         description: A list of consultation details.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Query parameter "name" is missing.
 *       404:
 *         description: No consultations found for the consultant.
 *       500:
 *         description: Server error.
 */
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const nameQuery = req.query.name;
        if (!nameQuery) {
            return res
                .status(400)
                .json({ error: "Query parameter 'name' is required" });
        }
        // Find consultations where the consultant's name is mentioned in the consultation_details field.
        const consultations = yield Consultation_1.default.find({
            consultation_details: { $regex: new RegExp(nameQuery, "i") },
        }).lean();
        if (!consultations || consultations.length === 0) {
            return res
                .status(404)
                .json({ error: "No consultations found for the consultant" });
        }
        res.json(consultations);
    }
    catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}));
exports.default = router;
