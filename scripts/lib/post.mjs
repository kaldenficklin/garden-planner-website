/**
 * The page body under the chart.
 *
 * The chart is pixels, so nothing in it is indexable and nothing in it can be
 * read by a screen reader. The body therefore has to cover the same ground in
 * text. The question is only whether it does that by restating the bullets or
 * by actually saying more than they do.
 *
 * It used to restate them: description, then the eight labels and their
 * bullets verbatim, then the pro tip. Every word of that was already baked
 * into the image directly above it, which made the page thin in the way that
 * matters — a reader who had looked at the chart got nothing from scrolling.
 *
 * So a topic can carry an `article`: a lede plus a few sections that explain
 * the reasoning the bullets only have room to assert. Six words on a card can
 * say "water well once flowers open"; the article is where it gets to say why
 * that week and not another. Topics without one fall back to the old dump, so
 * the pool can be migrated a topic at a time rather than all at once.
 *
 * The pro tip stays in both places on purpose. It is one line, it is the most
 * useful line, and the image version of it is invisible to search.
 */
export function body(t, lang) {
  const tip = t.proTip ? `\n\n**${t.proTip.label}.** ${t.proTip.text}\n` : '\n';

  if (t.article?.sections?.length) {
    const sections = t.article.sections
      .map((s) => `## ${s.heading}\n\n${s.body}`)
      .join('\n\n');
    return `${t.article.intro}\n\n${sections}${tip}`;
  }

  const heading = lang === 'es' ? 'Los pasos' : 'The steps';
  const steps = t.steps.map((s, i) => `${i + 1}. **${s.label}.** ${s.bullets.join('. ')}.`).join('\n');
  return `${t.description}\n\n## ${heading}\n\n${steps}\n${tip}`;
}
