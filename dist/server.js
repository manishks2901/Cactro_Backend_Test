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
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 3000;
const GITHUB_API_URL = "https://api.github.com";
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_PERSONAL_TOKEN = process.env.GITHUB_PERSONAL_TOKEN;
const githubHeaders = {
    Authorization: `token ${GITHUB_PERSONAL_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
};
app.use(express_1.default.json());
app.get("/github", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [userRes, reposRes] = yield Promise.all([
            axios_1.default.get(`${GITHUB_API_URL}/users/${GITHUB_USERNAME}`, { headers: githubHeaders }),
            axios_1.default.get(`${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos`, { headers: githubHeaders }),
        ]);
        res.json({
            followers: userRes.data.followers,
            following: userRes.data.following,
            repositories: reposRes.data.map((repo) => ({
                name: repo.name,
                description: repo.description,
                url: repo.html_url,
            })),
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch GitHub data" });
    }
}));
app.get("/github/:repo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { repo } = req.params;
    try {
        const repoRes = yield axios_1.default.get(`${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repo}`, {
            headers: githubHeaders,
        });
        res.json({
            name: repoRes.data.name,
            description: repoRes.data.description,
            url: repoRes.data.html_url,
            stars: repoRes.data.stargazers_count,
            forks: repoRes.data.forks_count,
            issues: repoRes.data.open_issues_count,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch repository data" });
    }
}));
app.post("/github/:repo/issues", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { repo } = req.params;
    const { title, body } = req.body;
    if (!title || !body) {
        res.status(400).json({ error: "Title and body are required" });
        return;
    }
    try {
        const response = yield axios_1.default.post(`${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repo}/issues`, { title, body }, {
            headers: githubHeaders,
        });
        res.json({ issue_url: response.data.html_url });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create issue" });
    }
}));
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
