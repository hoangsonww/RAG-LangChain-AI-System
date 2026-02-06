"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const InsightSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    date: { type: String, required: true },
    link: { type: String, required: true },
});
const TeamMemberSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    bio: { type: String, required: true },
    personal_quote: { type: String, required: true },
    related_insights: { type: [InsightSchema], default: [] },
});
exports.default = (0, mongoose_1.model)("TeamMember", TeamMemberSchema);
