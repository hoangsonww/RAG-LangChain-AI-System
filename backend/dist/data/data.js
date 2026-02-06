"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultations = exports.sectors = exports.investments = exports.teamMembers = void 0;
// @ts-nocheck
const faker_1 = __importDefault(require("faker"));
exports.teamMembers = Array.from({ length: 5 }).map(() => ({
    name: faker_1.default.name.findName(),
    role: faker_1.default.name.jobTitle(),
    bio: faker_1.default.lorem.sentences(2),
    personal_quote: faker_1.default.lorem.sentence(),
    related_insights: Array.from({ length: 2 }).map(() => ({
        title: faker_1.default.lorem.sentence(),
        date: faker_1.default.date.past().toLocaleDateString(),
        link: faker_1.default.internet.url(),
    })),
}));
exports.investments = Array.from({ length: 5 }).map(() => ({
    company_name: faker_1.default.company.companyName(),
    location: `${faker_1.default.address.city()}, ${faker_1.default.address.stateAbbr()}`,
    website: faker_1.default.internet.url(),
    sectors: [faker_1.default.commerce.department(), faker_1.default.commerce.department()],
    insights: Array.from({ length: 2 }).map(() => ({
        date: faker_1.default.date.recent().toLocaleDateString(),
        title: faker_1.default.lorem.sentence(),
        url: faker_1.default.internet.url(),
    })),
}));
exports.sectors = Array.from({ length: 3 }).map(() => ({
    sector: faker_1.default.commerce.department(),
    description: faker_1.default.lorem.sentence(),
    companies: [
        faker_1.default.company.companyName(),
        faker_1.default.company.companyName(),
        faker_1.default.company.companyName(),
    ],
    investment_team: [faker_1.default.name.findName(), faker_1.default.name.findName()],
}));
exports.consultations = Array.from({ length: 3 }).map(() => ({
    date: faker_1.default.date.recent().toLocaleDateString(),
    company_name: faker_1.default.company.companyName(),
    consultation_details: faker_1.default.lorem.sentences(2),
    hours: faker_1.default.datatype.number({ min: 1, max: 5 }),
}));
