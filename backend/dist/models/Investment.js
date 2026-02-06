"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const InvestmentInsightSchema = new mongoose_1.Schema({
    date: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
});
const InvestmentSchema = new mongoose_1.Schema({
    company_name: { type: String, required: true },
    location: { type: String, required: true },
    website: { type: String, required: true },
    sectors: { type: [String], default: [] },
    insights: { type: [InvestmentInsightSchema], default: [] },
});
exports.default = (0, mongoose_1.model)("Investment", InvestmentSchema);
