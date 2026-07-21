import { tool } from "ai";
import { z } from "zod";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

type GeocodeResponse = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    timezone?: string;
  }>;
};

type ForecastResponse = {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
};

/** WMO weather interpretation codes used by Open-Meteo. */
const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function describeCode(code: number | undefined) {
  return code === undefined ? "Unknown" : WEATHER_CODES[code] ?? "Unknown";
}

/**
 * Weather tool — resolves a place name to coordinates via Open-Meteo geocoding,
 * then returns current conditions plus a short daily forecast. No API key needed.
 */
export const weatherTool = tool({
  description:
    "Get the current weather and a multi-day forecast for a city or place. Use this for any question about temperature, rain, humidity or forecast.",
  inputSchema: z.object({
    location: z
      .string()
      .describe('City or place name, e.g. "Delhi" or "San Francisco, USA"'),
    days: z
      .number()
      .int()
      .min(1)
      .max(7)
      .default(3)
      .describe("Number of forecast days to return (1-7)"),
  }),
  execute: async ({ location, days }) => {
    const geocodeUrl = new URL(GEOCODE_URL);
    geocodeUrl.searchParams.set("name", location);
    geocodeUrl.searchParams.set("count", "1");

    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding failed with status ${geocodeResponse.status}`);
    }

    const geocode = (await geocodeResponse.json()) as GeocodeResponse;
    const place = geocode.results?.[0];

    if (!place) {
      return { error: `No place found matching "${location}".` };
    }

    const forecastUrl = new URL(FORECAST_URL);
    forecastUrl.searchParams.set("latitude", String(place.latitude));
    forecastUrl.searchParams.set("longitude", String(place.longitude));
    forecastUrl.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code"
    );
    forecastUrl.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,weather_code"
    );
    forecastUrl.searchParams.set("forecast_days", String(days));
    forecastUrl.searchParams.set("timezone", "auto");

    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      throw new Error(`Forecast failed with status ${forecastResponse.status}`);
    }

    const forecast = (await forecastResponse.json()) as ForecastResponse;

    return {
      location: [place.name, place.admin1, place.country]
        .filter(Boolean)
        .join(", "),
      timezone: place.timezone,
      current: forecast.current
        ? {
            temperatureC: forecast.current.temperature_2m,
            feelsLikeC: forecast.current.apparent_temperature,
            humidityPercent: forecast.current.relative_humidity_2m,
            windSpeedKmh: forecast.current.wind_speed_10m,
            precipitationMm: forecast.current.precipitation,
            conditions: describeCode(forecast.current.weather_code),
          }
        : null,
      daily:
        forecast.daily?.time.map((date, index) => ({
          date,
          maxTempC: forecast.daily?.temperature_2m_max[index],
          minTempC: forecast.daily?.temperature_2m_min[index],
          conditions: describeCode(forecast.daily?.weather_code[index]),
        })) ?? [],
    };
  },
});
