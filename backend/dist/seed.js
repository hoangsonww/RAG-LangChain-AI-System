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
exports.seedData = void 0;
// @ts-nocheck
const faker_1 = __importDefault(require("faker"));
const TeamMember_1 = __importDefault(require("./models/TeamMember"));
const Investment_1 = __importDefault(require("./models/Investment"));
const Sector_1 = __importDefault(require("./models/Sector"));
const Consultation_1 = __importDefault(require("./models/Consultation"));
const seedData = () => __awaiter(void 0, void 0, void 0, function* () {
    // Seed a large number of TeamMembers if none exist
    const teamCount = yield TeamMember_1.default.countDocuments({});
    if (teamCount === 0) {
        const teamMembers = Array.from({ length: 100 }).map(() => ({
            name: faker_1.default.name.findName(),
            role: faker_1.default.name.jobTitle(),
            bio: faker_1.default.lorem.sentences(2),
            personal_quote: faker_1.default.lorem.sentence(),
            related_insights: Array.from({ length: 5 }).map(() => ({
                title: faker_1.default.lorem.sentence(),
                date: faker_1.default.date.past().toLocaleDateString(),
                link: faker_1.default.internet.url(),
            })),
        }));
        yield TeamMember_1.default.insertMany(teamMembers);
        console.log("Seeded 100 TeamMembers");
    }
    // Seed a large number of Investments if none exist
    const investmentCount = yield Investment_1.default.countDocuments({});
    if (investmentCount === 0) {
        const investments = Array.from({ length: 200 }).map(() => ({
            company_name: faker_1.default.company.companyName(),
            location: `${faker_1.default.address.city()}, ${faker_1.default.address.stateAbbr()}`,
            website: faker_1.default.internet.url(),
            sectors: [
                faker_1.default.commerce.department(),
                faker_1.default.commerce.department(),
                faker_1.default.commerce.department(),
            ],
            insights: Array.from({ length: 5 }).map(() => ({
                date: faker_1.default.date.recent().toLocaleDateString(),
                title: faker_1.default.lorem.sentence(),
                url: faker_1.default.internet.url(),
            })),
        }));
        yield Investment_1.default.insertMany(investments);
        console.log("Seeded 200 Investments");
    }
    // Seed a large number of Sectors if none exist
    const sectorCount = yield Sector_1.default.countDocuments({});
    if (sectorCount === 0) {
        const sectors = Array.from({ length: 50 }).map(() => ({
            sector: faker_1.default.commerce.department(),
            description: faker_1.default.lorem.sentence(),
            companies: [
                faker_1.default.company.companyName(),
                faker_1.default.company.companyName(),
                faker_1.default.company.companyName(),
                faker_1.default.company.companyName(),
            ],
            investment_team: [
                faker_1.default.name.findName(),
                faker_1.default.name.findName(),
                faker_1.default.name.findName(),
            ],
        }));
        yield Sector_1.default.insertMany(sectors);
        console.log("Seeded 50 Sectors");
    }
    // Seed a large number of Consultations if none exist
    const consultationCount = yield Consultation_1.default.countDocuments({});
    if (consultationCount === 0) {
        const consultations = Array.from({ length: 300 }).map(() => ({
            date: faker_1.default.date.recent().toLocaleDateString(),
            company_name: faker_1.default.company.companyName(),
            consultation_details: faker_1.default.lorem.sentences(3),
            hours: faker_1.default.datatype.number({ min: 1, max: 10 }),
        }));
        yield Consultation_1.default.insertMany(consultations);
        console.log("Seeded 300 Consultations");
    }
});
exports.seedData = seedData;
