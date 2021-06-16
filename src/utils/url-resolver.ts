import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { resolve } from "url";

const followerUrl = process.env.REDIRECT_FOLLOWER_URL;

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

export const followAllRedirectsNew = async (inputUrl: string) => {
  if (!followerUrl) {
    throw new Error("REDIRECT_FOLLOWER_URL not set");
  }

  const resp = await fetch(followerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: `query {
        resolveUrl(url: "${inputUrl}") {
          url
        }
      }`,
    }),
  });

  const { data } = await resp.json();

  return data?.resolveUrl?.url;
};
