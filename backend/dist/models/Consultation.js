"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ConsultationSchema = new mongoose_1.Schema({
    date: { type: String, required: true },
    company_name: { type: String, required: true },
    consultation_details: { type: String, required: true },
    hours: { type: Number, required: true },
});
exports.default = (0, mongoose_1.model)("Consultation", ConsultationSchema);
