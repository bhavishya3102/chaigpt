import { weatherTool } from "./weather";
import { webSearchTool } from "./web-search";

/** Tools exposed to the chat model. Keys become the tool names the model calls. */
export const chatTools = {
  webSearch: webSearchTool,
  weather: weatherTool,
};
