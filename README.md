# Jordan Ferrary — Portfolio V2

React 19 + TypeScript strict + Vite + Tailwind CSS v4 + Base UI + Lucide.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Pages

Home, Portfolio, About, Contact and project case-study routes use hash navigation to work under GitHub Pages.

## Local Studio

Press **Ctrl + \\** to toggle Local Studio. Edit featured work, add projects, create content layouts using headings/text/images, and manage category filters without editing source code. Changes are saved in **localStorage only** in that browser. Use Export JSON to back up and Import JSON to restore. This mode **is not authenticated** and is **not a production CMS**. It neither publishes to GitHub nor syncs between devices.

**Security:** Do not embed the proposed numeric PIN or a GitHub write token in browser code. For a real private administrator panel, integrate server-side authentication, authorized storage, an upload service and protected publish operations. A hosting platform with server functions / database is required.

Images are carried over from the existing repository as original binary Git blobs.

## GitHub Pages

The Actions workflow builds with `GITHUB_PAGES=true` so Vite uses `/reactteste/` as its base. GitHub Pages must be enabled with GitHub Actions as source in repository settings. Other hosts build with `npm run build` and serve `dist/`.

## Design fidelity

The gallery follows the provided Figma screenshot. The linked Figma file could be inspected at the layer-navigation level, but precise asset exports and frame measurements were not available. Review spacing against the original in Figma before claiming pixel-perfect fidelity.

## Known gaps

Real production CMS/authentication, cloud image upload, and contact form back end remain unconfigured. The contact page links to the public Instagram profile.
