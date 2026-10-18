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

If Search Console says "HTML" / wrong content / sitemap is HTML:
- Open the URL in a browser BEFORE clicking Verify.
- Verification file must show ONE plain line, not the Fine Line app.
- sitemap.xml must show XML starting with <?xml, not HTML.
- Fix: redeploy latest main; set EXPO_PUBLIC_SITE_URL to your custom domain; or use meta tag verify instead.
