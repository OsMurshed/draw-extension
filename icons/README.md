# Icons

Generate PNG icons from icon.svg at the following sizes:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

You can use tools like:
- Inkscape: `inkscape icon.svg -w 16 -h 16 -o icon16.png`
- ImageMagick: `convert -background none icon.svg -resize 16x16 icon16.png`
- Online tools: https://svgtopng.com/

For development, you can temporarily use the SVG directly by updating manifest.json.
