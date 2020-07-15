import * as url from "url";
import { createWorkerAddon, runCli } from "@watchedcom/sdk";
import { getSources, extractUrl } from "./scraper";
import fetch from "node-fetch";
import { from } from "rxjs";
import { flatMap, toArray } from "rxjs/operators";
import { removeQuery } from "./helpers";

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
        /**
         * Memory leak bug, details:
         * https://github.com/node-fetch/node-fetch/issues/83
         */
        const targetUrl = await fetch(source.url, { method: "HEAD" })
          .then(async (resp) => {
            const body = await resp.text();

            return resp.url;
          })
          .then(removeQuery);
        source.url = targetUrl as string;

        const { hostname } = url.parse(targetUrl);
        source.icon = `https://www.google.com/s2/favicons?domain_url=${hostname}`;

        return source;
      }, 4),
      toArray()
    )
    .toPromise();

  return resolvedSources;
});

runCli([werStreamtAddon]);
