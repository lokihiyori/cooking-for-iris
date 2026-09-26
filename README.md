# Cooking for Iris

A shared menu hosted on GitHub Pages. Dishes and orders live in Firebase Realtime Database. Ingredients and steps can be transcribed from uploaded images in the browser; the edited text and compressed photos are saved together.

## Shared database

Firebase Authentication has Google sign-in enabled, and `lokihiyori.github.io` is an authorized domain. The published Realtime Database rules match [`database.rules.json`](database.rules.json). Everyone can read dishes and place a new pending order. Only the configured chef account can change dishes or read and manage orders.

On the [live site](https://lokihiyori.github.io/cooking-for-iris/), the status indicator should say **Saved for everyone**. Sign in through **Chef Lucas** to add or edit dishes. Saves finish only after Firebase confirms them. If older dishes exist only in this browser's localStorage, the chef's **All Dishes** tab offers an import button for dishes missing from the shared menu.

## Notes

- Photo OCR uses Tesseract.js in the browser. It downloads English and Chinese recognition data on first use. Check the extracted text before saving.
- Images are compressed and stored as data URLs with the dish in Realtime Database. Keep photo uploads reasonably small; a dedicated image store would be better for a large catalog.
- Local preview: run `python -m http.server 8765` in this directory and open `http://localhost:8765/`.
