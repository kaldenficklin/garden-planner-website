#!/usr/bin/env bash
# One-off backfill: generate hero + pin images for the posts that predate
# scripts/gen-post-image.mjs. New posts get their images from the daily routine.
# Runs 3 at a time so we don't sit through 11 sequential generations.
set -uo pipefail
cd "$(dirname "$0")/.."

# run <slug> <pin title> <subject> [crop]
run() {
  node scripts/gen-post-image.mjs --slug "$1" --title "$2" --subject "$3" ${4:+--crop "$4"} \
    > "/tmp/gpp-gen-$1.log" 2>&1 && echo "ok   $1" || echo "FAIL $1 (see /tmp/gpp-gen-$1.log)"
}

run "how-to-find-your-frost-dates" \
    "How to Find Your First and Last Frost Dates" \
    "Early morning frost on a backyard vegetable garden bed, white rime crystals edging kale and chard leaves, low golden sunrise light behind" &

run "vegetables-that-are-secretly-fruits" \
    "The Vegetables That Are Secretly Fruits" \
    "A rustic weathered wooden table holding ripe red tomatoes, a cucumber, a zucchini, bell peppers and an eggplant, several sliced open to reveal the seeds inside" &

run "how-to-get-rid-of-aphids-naturally" \
    "How to Get Rid of Aphids Naturally" \
    "Extreme macro of a dense cluster of tiny green aphids packed along a curled young plant stem, a few small black ants moving among them, glossy honeydew droplets" &
wait

run "how-to-get-rid-of-squash-bugs-naturally" \
    "How to Get Rid of Squash Bugs Naturally" \
    "Macro of the underside of a large squash leaf turned over by hand, showing a tight cluster of small bronze copper oval eggs laid in the V where two leaf veins meet" &

run "why-zucchini-flowers-but-no-fruit" \
    "Why Your Zucchini Flowers But Never Makes Squash" \
    "A healthy zucchini plant with one large open golden-yellow female flower, a small swollen immature zucchini fruit clearly visible directly behind the petals, broad green leaves around it" &

run "black-walnut-tree-toxic-to-vegetable-gardens" \
    "The Tree That's Quietly Poisoning Your Garden" \
    "A large mature black walnut tree at the edge of a backyard vegetable garden, wilting yellowing tomato plants collapsing in the bed in the foreground beneath its spreading canopy" \
    "south" &
wait

run "companion-planting-for-tomatoes" \
    "Companion Planting for Tomatoes" \
    "A raised vegetable bed with staked tomato plants interplanted with bushy green basil, and a border of bright orange and yellow French marigolds along the front edge" &

run "container-vegetable-gardening-what-actually-grows-well-in-pots" \
    "What Actually Grows Well in Pots" \
    "A sunny patio corner with an assortment of terracotta and glazed ceramic pots growing leaf lettuce, a pepper plant carrying fruit, basil, and a compact patio tomato" \
    "south" &

run "how-often-to-water-a-vegetable-garden" \
    "How Often to Water a Vegetable Garden" \
    "Water pouring from a metal watering can soaking into dark rich soil at the base of leafy vegetable plants, straw mulch spread around the stems, droplets beading on the leaves" \
    "south" &
wait

run "succession-planting-guide" \
    "Keep Your Garden Producing All Summer" \
    "A raised garden bed half cleared of a finished spring crop, bare dark soil on one side and a neat row of small fresh seedlings just transplanted on the other, a trowel resting on the wooden edge" &

run "when-to-start-tomato-seeds-indoors" \
    "When to Start Tomato Seeds Indoors" \
    "A seed starting tray of young stocky tomato seedlings with their first true leaves growing under a grow light indoors, soft condensation on a window nearby" &
wait

echo "backfill done"
