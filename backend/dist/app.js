"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
// Load environment variables
dotenv_1.default.config();
// Database connection and seeding
const db_1 = require("./db");
const seed_1 = require("./seed");
// Route imports
const auth_1 = __importDefault(require("./routes/auth"));
const ping_1 = __importDefault(require("./routes/ping"));
const documents_1 = __importDefault(require("./routes/documents"));
const team_1 = __importDefault(require("./routes/team"));
const investments_1 = __importDefault(require("./routes/investments"));
const sectors_1 = __importDefault(require("./routes/sectors"));
const consultations_1 = __importDefault(require("./routes/consultations"));
const scrape_1 = __importDefault(require("./routes/scrape"));
// Auth middleware (applied to all routes except /auth/token)
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3456;
app.use((0, body_parser_1.json)());
/**
 * Swagger configuration:
 * This configuration includes comprehensive metadata, tags, and custom options.
 */
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "RAG & LangChain System Backend API",
            version: "1.0.0",
            description: "API Documentation for the RAG System Backend API",
            contact: {
                name: "Son Nguyen",
                url: "https://sonnguyenhoang.com",
                email: "hoangson091104@gmail.com",
            },
            license: {
                name: "MIT License",
                url: "https://opensource.org/licenses/MIT",
            },
        },
        servers: [
            {
                url: "https://rag-langchain-ai-system.onrender.com",
                description: "Production server",
            },
            {
                url: `http://localhost:${PORT}`,
                description: "Local server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: "Auth", description: "Authentication related endpoints" },
            { name: "Ping", description: "Ping endpoint to check API connectivity" },
            { name: "Documents", description: "Document download endpoints" },
            { name: "Team", description: "Team member endpoints" },
            { name: "Investments", description: "Investment endpoints" },
            { name: "Sectors", description: "Sector endpoints" },
            { name: "Consultations", description: "Consultation endpoints" },
            { name: "Scrape", description: "Web scraping endpoints" },
        ],
    },
    // Point to the API docs in your route files (make sure your route files contain proper JSDoc annotations)
    apis: ["./src/routes/*.ts"],
};
const specs = (0, swagger_jsdoc_1.default)(options);
// Swagger UI options – this sets the browser tab title.
const swaggerUiOptions = {
    customSiteTitle: "RAG System Backend API Docs",
};
// Mount Swagger UI on the "/docs" route.
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, swaggerUiOptions));
// Redirect the root ("/") to "/docs"
app.get("/", (req, res) => {
    res.redirect("/docs");
});
// Unprotected route for token retrieval
app.use("/auth", auth_1.default);
// Protect all routes below with Bearer auth middleware.
app.use(auth_2.bearerAuth);
// API endpoints:
app.use("/ping", ping_1.default);
app.use("/api/documents", documents_1.default);
app.use("/api/team", team_1.default);
app.use("/api/investments", investments_1.default);
app.use("/api/sectors", sectors_1.default);
app.use("/api/consultations", consultations_1.default);
app.use("/api/scrape", scrape_1.default);
// Connect to MongoDB and seed data, then start the server.
(0, db_1.connectDB)().then(() => {
    (0, seed_1.seedData)().then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
        });
    });
});
