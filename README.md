# Cooking for Iris

A shared menu hosted on GitHub Pages. Dishes and orders live in Firebase Realtime Database. Ingredients and steps can be transcribed from uploaded images in the browser; the edited text and compressed photos are saved together.

## Finish Firebase setup

The currently configured database returns `permission_denied` for public reads. Until its rules are updated, the site displays the built-in dishes as a preview and **does not claim that edits were saved**.

1. Open [Firebase Console](https://console.firebase.google.com/project/cooking-for-iris/overview) with the Google account that owns the `cooking-for-iris` project.
2. Under **Authentication → Sign-in method**, enable **Google**. Under **Authentication → Settings → Authorized domains**, add `lokihiyori.github.io` if it is not already present.
3. Visit the site, click **Chef Lucas**, and sign in with the Google account that should manage dishes and orders. Under **Authentication → Users**, copy that account's **User UID**.
4. Open **Realtime Database → Rules**. Copy [`database.rules.json`](database.rules.json), replacing **both** `REPLACE_WITH_CHEF_FIREBASE_UID` values with that UID. Publish the rules. This grants everyone read access to dishes; only that Google account can change dishes or read/manage orders. Visitors may create new pending orders.
5. Reload the website. The status indicator must say **Saved for everyone**. Add a test dish, then open the website in another browser or private window to verify it appears there too. Delete the test dish from the chef view.

Do not use Firebase's expiring test mode or public write access for the dishes path. Database rules are enforced on the Firebase server, so changing only the website code cannot repair a `permission_denied` response.

If earlier dishes exist only in this browser's localStorage, the chef's **All Dishes** tab offers an import button for dishes that are missing from the shared menu.

## Notes

- Photo OCR uses Tesseract.js in the browser. It downloads English and Chinese recognition data on first use. Check the extracted text before saving.
- Images are compressed and stored as data URLs with the dish in Realtime Database. Keep photo uploads reasonably small; a dedicated image store would be better for a large catalog.
- Local preview: run `python -m http.server 8765` in this directory and open `http://localhost:8765/`.
