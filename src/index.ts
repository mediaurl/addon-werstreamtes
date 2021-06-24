import { createAddon, runCli } from "@mediaurl/sdk";
import { from } from "rxjs";
import { flatMap, toArray } from "rxjs/operators";
import * as url from "url";
import { extractUrl, getSources } from "./scraper";
import { followAllRedirectsBrowserless } from "./utils/url-resolver";

const werStreamtAddon = createAddon({
  id: "werstreamtes",
  name: "Wer streamt es?",
  description:
    "Wer streamt es? Prüfe die Verfügbarkeit von Filmen bei Netflix, Amazon, Maxdome u.v.m.",
  version: "0.0.0",
  itemTypes: ["movie", "series"],
  icon: "https://www.werstreamt.es/favicon.ico",
  triggers: [
    "imdb_id",
    // "tmdb_id"
  ],
});

werStreamtAddon.registerActionHandler("source", async (input, ctx) => {
  await ctx.requestCache(input.ids.imdb_id, {
    ttl: Infinity,
    refreshInterval: "1d",
  });

  const queryJson = await ctx
    .fetch(
      `https://www.werstreamt.es/suche/suggestTitle?term=${input.ids.imdb_id}`
    )
    .then((resp) => resp.json());
  const itemUrl = extractUrl(queryJson);

  if (!itemUrl) {
    return null;
  }

  const resp = await ctx.fetch(itemUrl);
  const html = await resp.text();

  const sources = await getSources(html);

  const resolvedSources = await from(sources)
    .pipe(
      flatMap(async (source) => {
        const targetUrl = await followAllRedirectsBrowserless(source.url);

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

runCli([werStreamtAddon], { singleMode: true });
