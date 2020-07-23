import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { resolve } from "url";

export const followAllRedirects = async (
  inputUrl: string,
  {
    includingMeta = false,
  }: {
    includingMeta: boolean;
  }
) => {
  const resp = await fetch(inputUrl, {
    method: includingMeta ? "GET" : "HEAD",
    follow: 10,
  });
  const body = await resp.text();
  const targetUrl = resp.url;

  if (includingMeta) {
    const $ = cheerio.load(body, { xmlMode: true });
    const match = $(`meta[http-equiv='refresh' i]`).first().attr("content");

    if (match) {
      const nextUrl = resolve(targetUrl, match.split("url=").pop() || "");
      return followAllRedirects(nextUrl, { includingMeta });
    }
  }

  return targetUrl;
};
