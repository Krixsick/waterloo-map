"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const library_1 = __importDefault(require("./apis/library"));
const gym_1 = __importDefault(require("./apis/gym"));
const campusFood_1 = __importDefault(require("./apis/food/campusFood"));
require("dotenv/config");
const dotenv_1 = require("dotenv");
const app = (0, express_1.default)();
(0, dotenv_1.configDotenv)();
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
].filter((origin) => Boolean(origin));
app.use((0, cors_1.default)({
    origin: allowedOrigins,
}));
app.use("/library/hours", library_1.default);
app.use("/gym", gym_1.default);
app.use("/food/campus", campusFood_1.default);
app.listen(3001, () => console.log("listening on :3001"));
