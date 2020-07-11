import * as cheerio from "cheerio";
import { Source } from "@watchedcom/sdk";
import * as url from "url";

const baseUrl = "https://www.werstreamt.es/";

export const extractUrl = (jsonPayload: any): string | null => {
  const $ = cheerio.load(
    Object.values<{ value: string; label: string }>(jsonPayload)[0].label
  );

  const href = $("a").attr("href");

  return href ? url.resolve(baseUrl, href) : null;
};

export const getSources = (html: string): Source[] => {
  const $ = cheerio.load(html);
  const sources: Source[] = [];

  $("div#avalibility")
    .find("div.provider")
    .each((_, elem) => {
      sources.push({
        type: "externalUrl",
        url: url.resolve(
          baseUrl,
          $(elem).find("form").attr("action") as string
        ),
        name: $(elem).find("h5 a").text(),
      });
    });

  return sources;
};
