
# SCEC Frontend

A Next.js 14 application that mimics the Ortelius search interface.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Search results page with grid layout (no landing page)
- Grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile
- Left sidebar with filter options (Image Type, Operating System, Architectures)
- Functional filters that update results in real-time
- Category tabs (All, Images, Plugins)
- Search functionality in header
- Click on any card to view detailed information
- Detail page with full image information, tags, and pull command
- Back navigation from detail page
- Responsive design matching Ortelius's layout
- Mock data for demonstration

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

## Routes

- `/` - Main search page with grid of images and filters
- `/image/[name]` - Detail page for specific image (e.g., `/image/nginx`)

## Filter Options

- **Image Type**: Official Images, Verified Publisher
- **Operating System**: Linux, Windows
- **Architectures**: ARM 64, AMD64, ARM
