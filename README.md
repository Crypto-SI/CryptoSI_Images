# CryptoSI Image Generator

A React-based image generation application using the Hyperbolic API.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Hyperbolic API key:
   ```
   VITE_HYPERBOLIC_API_KEY=your_api_key_here
   ```
   You can get an API key from [Hyperbolic](https://hyperbolic.xyz)

4. Add your logo:
   - Place your logo file as `logo.png` in the `public` directory
   - Recommended specifications:
     - Format: PNG with transparency
     - Size: 120x120px (2x resolution for retina displays)
     - Display size: 60px height in the app

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_HYPERBOLIC_API_KEY`: Your Hyperbolic API key (required)

## Security Note

Never commit your `.env` file or expose your API key. The `.env` file is already included in `.gitignore` to prevent accidental commits.

## Features

- Multiple model support (SDXL, SD1.5, SD2, Flux, etc.)
- ControlNet integration for image-to-image generation
- Negative prompt support
- Adjustable parameters (width, height, steps, CFG scale)
- Modern, responsive UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Hyperbolic API key

## Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. Enter your prompt in the text input field
2. Click the "Generate Image" button
3. Wait for the image to be generated
4. The generated image will be displayed below the input field

## Environment Variables

- `VITE_HYPERBOLIC_API_KEY`: Your Hyperbolic API key
- `VITE_HYPERBOLIC_API_ENDPOINT`: The endpoint URL for the Hyperbolic API 