import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_PERSONAL_TOKEN = process.env.GITHUB_PERSONAL_TOKEN;

const githubHeaders = {
    Authorization: `token ${GITHUB_PERSONAL_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
};

type IssueResType = {
    html_url: string;
};

type UserResType = {
    followers: number;
    following: number;
};

type ReposResType = {
    name: string;
    description: string;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
};

app.use(express.json());

app.get("/github", async (req: Request, res: Response): Promise<void> => {
    try {
        const [userRes, reposRes] = await Promise.all([
            axios.get<UserResType>(`${GITHUB_API_URL}/users/${GITHUB_USERNAME}`, { headers: githubHeaders }),
            axios.get<Array<ReposResType>>(`${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos`, { headers: githubHeaders }),
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
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch GitHub data" });
    }
});

app.get("/github/:repo", async (req: Request, res: Response): Promise<void> => {
    const { repo } = req.params;

    try {
        const repoRes = await axios.get<ReposResType>(`${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repo}`, {
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
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch repository data" });
    }
});

app.post("/github/:repo/issues", async (req: Request, res: Response): Promise<void> => {
    const { repo } = req.params;
    const { title, body } = req.body;

    if (!title || !body) {
        res.status(400).json({ error: "Title and body are required" });
        return;
    }

    try {
        const response = await axios.post<IssueResType>(
            `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repo}/issues`,
            { title, body },
            {
                headers: githubHeaders,
            }
        );

        res.json({ issue_url: response.data.html_url });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to create issue" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
