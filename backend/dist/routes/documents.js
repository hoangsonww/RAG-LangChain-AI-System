"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/documents/download:
 *   get:
 *     summary: Zips and downloads all documents from the documents folder.
 *     tags:
 *       - Documents
 *     responses:
 *       200:
 *         description: A zip file containing the documents.
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Documents directory not found or an error occurred while creating the zip.
 */
router.get("/download", (req, res) => {
    const documentsDir = path_1.default.join(__dirname, "../../documents");
    // Check if directory exists
    if (!fs_1.default.existsSync(documentsDir)) {
        return res.status(500).json({ error: "Documents directory not found." });
    }
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="documents.zip"');
    const archive = (0, archiver_1.default)("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
        res.status(500).send({ error: err.message });
    });
    // Pipe archive data to the response.
    archive.pipe(res);
    // Append all files from the documents folder.
    archive.directory(documentsDir, false);
    archive.finalize();
});
exports.default = router;
