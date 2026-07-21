import { tool } from "ai";
import { z } from "zod";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

type TavilyResponse = {
  answer?: string;
  results?: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    published_date?: string;
  }>;
};

/**
 * Web search tool backed by the Tavily API. Gives the model access to
 * current information that is past its training cutoff.
 */
export const webSearchTool = tool({
  description:
    "Search the web for current, real-time or recent information (news, prices, sports scores, releases, anything after your training cutoff). Returns a short answer plus source URLs.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(10)
      .default(5)
      .describe("How many search results to return"),
    topic: z
      .enum(["general", "news"])
      .default("general")
      .describe('Use "news" for current events, otherwise "general"'),
  }),
  execute: async ({ query, maxResults, topic }) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return { error: "Web search is unavailable: TAVILY_API_KEY is not set." };
    }

    const response = await fetch(TAVILY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        topic,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Tavily search failed with status ${response.status}: ${await response.text()}`
      );
    }

    const data = (await response.json()) as TavilyResponse;

    return {
      query,
      answer: data.answer ?? null,
      results:
        data.results?.map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.content,
          publishedDate: result.published_date,
        })) ?? [],
    };
  },
});
