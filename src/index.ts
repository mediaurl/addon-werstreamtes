import * as url from "url";
import { createWorkerAddon, runCli } from "@watchedcom/sdk";
import fetch from "node-fetch";
import { from } from "rxjs";
import { flatMap, toArray } from "rxjs/operators";
import { getSources, extractUrl } from "./scraper";
import { removeQuery } from "./helpers";
import { followAllRedirects } from "./utils/url-resolver";

const werStreamtAddon = createWorkerAddon({
  id: "wer-streamt-es",
  name: "Wer streamt es?",
  description:
    "Wer streamt es? Prüfe die Verfügbarkeit von Filmen bei Netflix, Amazon, Maxdome u.v.m.",
  version: "0.0.0",
  itemTypes: ["movie", "series"],
  icon: "https://www.werstreamt.es/favicon.ico",
  requestArgs: [
    "imdb_id",
    // "tmdb_id"
  ],
});

werStreamtAddon.registerActionHandler("source", async (input, ctx) => {
  console.log("source", input);

  await ctx.requestCache(input.ids.imdb_id);

  const queryJson = await fetch(
    `https://www.werstreamt.es/suche/suggestTitle?term=${input.ids.imdb_id}`
  ).then((resp) => resp.json());
  const itemUrl = extractUrl(queryJson);

  if (!itemUrl) {
    return null;
  }

  const resp = await fetch(itemUrl);
  const html = await resp.text();

  const sources = await getSources(html);

  const resolvedSources = await from(sources)
    .pipe(
      flatMap(async (source) => {
        const targetUrl = await followAllRedirects(source.url, {
          includingMeta: true,
        });

        source.url = targetUrl as string;

        const { hostname } = url.parse(targetUrl);
        source.icon = `https://www.google.com/s2/favicons?sz=128&domain_url=${hostname}`;

        return source;
      }, 4),
      toArray()
    )
    .toPromise();

  return resolvedSources;
});

runCli([werStreamtAddon]);
