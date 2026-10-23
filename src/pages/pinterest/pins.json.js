/**
 * The day's pins as JSON, for the `blogPublishDaily` Cloud Function.
 *
 * Built at the same moment as the pages, so an entry here is an entry that is
 * live. Only the last fortnight is listed: the function pins what is dated
 * today, and the slack covers a morning it couldn't run.
 */
import { publishedPosts, todayEastern } from '../../lib/posts';
import { autoPins } from '../../lib/pinQueue';

const WINDOW_DAYS = 14;

export async function GET(context) {
  const today = todayEastern();
  const since = new Date(`${today}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() - WINDOW_DAYS);
  const from = since.toISOString().slice(0, 10);

  const pins = autoPins(await publishedPosts(), context.site).filter((p) => p.date >= from);
  return new Response(JSON.stringify({ builtFor: today, pins }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
