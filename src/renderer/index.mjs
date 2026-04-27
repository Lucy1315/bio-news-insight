import path from 'node:path';
import { Eta } from 'eta';
import { projectRoot } from '../util/paths.mjs';
import { cleanTitle, formatKST, nl2br } from './format.mjs';

const eta = new Eta({ views: path.join(projectRoot, 'templates'), cache: true });

function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * @param {{ dateKST: string, articles: any[], insights: any }} data
 * @returns {{ html: string, text: string }}
 */
export function renderEmail(data) {
  const now = new Date();
  const articles = data.articles.map((a) => ({
    ...a,
    titleClean: cleanTitle(a.title),
    publishedDisplay: formatKST(a.publishedAt, now),
  }));
  const themes = (data.insights.themes ?? []).map((t) => ({
    ...t,
    refsHtml: (t.articleIndices ?? [])
      .map((idx) => `<a href="#article-${idx}">[${idx + 1}]</a>`)
      .join(' '),
  }));
  const insights = {
    ...data.insights,
    themes,
    executiveLines: nl2br(data.insights.executiveSummary),
  };
  const html = eta.render('./email', { ...data, articles, insights });
  const text = htmlToText(html);
  return { html, text };
}
