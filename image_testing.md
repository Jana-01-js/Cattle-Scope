## TEST AGENT PROMPT – IMAGE INTEGRATION RULES ##
- Always use base64-encoded images for all tests and requests.
- Accepted formats: JPEG, PNG, WEBP only.
- Do not use SVG, BMP, HEIC, or other formats.
- Do not upload blank, solid-color, or uniform-variance images.
- Every image must contain real visual features — objects, edges, textures, or shadows.
- If image is not PNG/JPEG/WEBP, transcode before upload.
- Re-detect MIME after any transformation.
- For animated formats (GIF, APNG, animated WEBP), extract first frame only.
- Resize large images to reasonable bounds to avoid oversized payloads.
