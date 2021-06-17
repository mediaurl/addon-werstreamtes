import fetch from "node-fetch";
import { resolve } from "url";

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import BlockerPlugin from "puppeteer-extra-plugin-block-resources";

puppeteer.use(
  BlockerPlugin({
    blockedTypes: new Set(["image", "stylesheet", "media", "font"]),
  })
);
puppeteer.use(StealthPlugin());

const followerUrl = process.env.REDIRECT_FOLLOWER_URL;
const browserlessUrl = process.env.BROWSERLESS_URL;

export const followAllHttpRedirects = async (inputUrl: string) => {
  const resp = await fetch(inputUrl, {
    method: "HEAD",
    follow: 10,
  });
  const body = await resp.text();
  const targetUrl = resp.url;

  return targetUrl;
};

export const followAllRedirectsGraphQL = async (inputUrl: string) => {
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

export const followAllRedirectsBrowserless = async (inputUrl: string) => {
  if (!browserlessUrl) {
    throw new Error("BROWSERLESS_URL not set");
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: process.env.BROWSERLESS_URL,
  });

  try {
    const page = await browser.newPage();

    await page.goto(inputUrl);

    const url = page.url();

    return url;
  } finally {
    browser.close();
  }
};
