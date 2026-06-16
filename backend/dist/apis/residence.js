"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const residence_router = express_1.default.Router();
const scrap_residences = async () => { };
residence_router.get("/", (req, res) => {
    try {
        scrap_residences();
    }
    catch (error) {
        console.log(error);
    }
});
exports.default = residence_router;
