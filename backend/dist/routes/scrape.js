"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const faker_1 = __importDefault(require("faker"));
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/scrape:
 *   get:
 *     summary: Simulates scraping an insights page and returns fake scraped data.
 *     tags:
 *       - Scrape
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: The URL of the insights page to scrape.
 *     responses:
 *       200:
 *         description: Fake scraped data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: "Fake Title"
 *                 content:
 *                   type: string
 *                   example: "Fake scraped content that simulates real data..."
 *                 date_published:
 *                   type: string
 *                   example: "1/1/2020"
 *       400:
 *         description: Query parameter "url" is missing.
 */
router.get("/", (req, res) => {
    const urlQuery = req.query.url;
    if (!urlQuery) {
        return res.status(400).json({ error: "Query parameter 'url' is required" });
    }
    // In a real implementation, you would fetch and parse the URL.
    // Here, we simulate by returning fake data.
    res.json({
        title: faker_1.default.lorem.sentence(),
        content: faker_1.default.lorem.paragraphs(2),
        date_published: faker_1.default.date.past().toLocaleDateString(),
    });
});
exports.default = router;
