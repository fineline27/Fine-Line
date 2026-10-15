Google Search Console — HTML file verification
==============================================

1. Search Console → Ownership verification → HTML file → Download.
2. Move the downloaded file (e.g. google1234567890abcdef.html) into THIS folder (public/).
3. Do NOT change the file contents. Do NOT rename it.
4. Commit, push, deploy to Vercel.
5. Open https://finelinesports.vercel.app/<exact-filename>.html
   You must see ONE line like:
   google-site-verification: google1234567890abcdef.html
   If you see the Fine Line app instead, redeploy with the latest vercel.json.
6. Click Verify in Search Console.

Alternative: use the HTML meta tag method with EXPO_PUBLIC_GOOGLE_SITE_VERIFICATION on Vercel.
