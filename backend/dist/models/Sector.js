"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SectorSchema = new mongoose_1.Schema({
    sector: { type: String, required: true },
    description: { type: String, required: true },
    companies: { type: [String], default: [] },
    investment_team: { type: [String], default: [] },
});
exports.default = (0, mongoose_1.model)("Sector", SectorSchema);
