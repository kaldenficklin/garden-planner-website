# thegardenplanner.app

Marketing website for **Garden Pro Planner** ([App Store](https://apps.apple.com/app/id1539031278)).

Static site — no build step. Deployed on Netlify from this repo; every push to `main` auto-publishes to <https://thegardenplanner.app>.

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Landing page |
| `privacy.html` | Privacy policy (`/privacy`) |
| `support.html` | Support / FAQ (`/support`) |
| `404.html` | Not-found page |
| `assets/style.css` | All styles |
| `assets/screens/` | App Store screenshots |
| `netlify.toml` | Publish config, pretty URLs, headers |
| `app-ads.txt` | Authorized ad sellers |

## Local preview

```sh
python3 -m http.server 8099
# open http://localhost:8099
```

Screenshots are sourced from the app repo's `store-assets/screenshots/iphone-6.9/`.
