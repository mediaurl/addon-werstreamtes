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
        const targetUrl = await fetch(source.url)
          .then((resp) => resp.url)
          .then(removeQuery);
        source.url = targetUrl as string;

        return source;
      }, 4),
      toArray()
    )
    .toPromise();

  return resolvedSources;
});

runCli([werStreamtAddon]);