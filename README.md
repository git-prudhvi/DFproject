## Image Steganography – Browser‑only Web App

This project hides and reveals text in images using Least Significant Bit (LSB) steganography – entirely in your browser. No backend. Deploys as a static site (Vercel ready).

### Key files
- `index.html`: App UI (Encode/Decode forms and result modals)
- `static/styles/index.css`: Styling and layout (no external resources)
- `static/steghide.js`: Encode/Decode logic using the Canvas API
- `vercel.json`: Static deployment configuration

## How it works (step by step)

### Big picture
- It’s a static app: the browser loads the HTML/CSS/JS and runs everything locally.
- JavaScript wires up UI events and performs steganography on pixel data via a hidden canvas.

### When you open the app
1. `index.html` loads, CSS styles the page, and JS attaches event handlers.
2. You can switch between Encode and Decode tabs. Results appear in centered modals (no scrolling).

### Encoding flow
1. Select a cover image, enter your message and a short secret code (max 5 chars).
2. The image is drawn to an off‑screen `<canvas>`; raw pixels are read with `getImageData`.
3. Capacity is calculated: each pixel contributes 3 bits (R, G, B LSBs). Capacity (bytes) = floor(width × height × 3 / 8).
4. The payload is `message + secret`. It is converted to a binary string (8 bits/char).
5. Bits are embedded into the image by replacing each color channel’s least significant bit in order.
6. Modified pixels are written back with `putImageData`, and the canvas is exported to PNG (`toDataURL`) to preserve bits.
7. A modal shows the encoded preview with a Download button.

### Decoding flow
1. Select the encoded image and enter the same secret code used during encoding.
2. The image is drawn to a canvas and pixels are read.
3. LSBs of R, G, B are collected into a bit stream and converted back to characters (every 8 bits).
4. Decoding stops when the reconstructed text ends with your secret code; the secret suffix is removed to return the message.
5. A modal displays the decoded message in a read‑only textarea with a Copy button.

### Why the secret code?
The secret acts as a terminator to indicate where the hidden message ends. It is not encryption; anyone with the image and the correct secret can decode. For real secrecy, add encryption before embedding (can be added later if needed).

## How to use

### Local (no build required)
1. Open `index.html` in a modern browser.
2. Encode tab:
   - Choose a cover image.
   - Enter the message and a secret code (≤ 5 chars).
   - Click “Encode Message”. Preview appears in a modal; click “Download”.
3. Decode tab:
   - Choose an encoded image.
   - Enter the same secret code used to encode.
   - Click “Decode Message”. The message appears in a modal; click “Copy” if needed.

### Deploy to Vercel
1. Push this project to a Git repository.
2. Import the repo in Vercel (or use Vercel CLI).
3. `vercel.json` is already configured to serve `index.html` and `static/`.

## Notes, limits, and tips
- Larger images allow larger messages (capacity scales with width × height).
- Output is PNG (lossless). Avoid platforms that recompress images (compression destroys hidden bits).
- The secret code is only an end marker, not encryption.

## Customize
- Change UI/wording: `index.html`
- Tweak styles/theme: `static/styles/index.css`
- Change algorithm/payload handling: `static/steghide.js`
