import path from 'node:path';
import { Eta } from 'eta';
import { projectRoot } from '../util/paths.mjs';

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
  const html = eta.render('./email', data);
  const text = htmlToText(html);
  return { html, text };
}
