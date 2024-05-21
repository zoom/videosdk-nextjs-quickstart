# Zoom VideoSDK Next.js Quickstart

This repo contains a quickstart for using the Zoom VideoSDK with Next.js. There's a quickstart for both the Next.js App Router and the Pages Router. You can use either the [`app-router`](https://github.com/zoom/videosdk-nextjs-quickstart/tree/app-router) or the [`pages-router`](https://github.com/zoom/videosdk-nextjs-quickstart/tree/pages-router) branch of this repository.

You can learn more about the differences [here](https://nextjs.org/docs#app-router-vs-pages-router).

## Prerequisites

- Node LTS
- Bun (or NPM)
- Zoom Video SDK Account

## Getting Started

1. Clone the repository

```bash
$ git clone https://github.com/zoom/videosdk-nextjs-quickstart.git
```

2. Install dependencies

```bash
$ bun install # or npm install
```

3. Copy `.env.example` to `.env` and fill in your Zoom Video SDK credentials as:

```bash
ZOOM_SDK_KEY="your-key"
ZOOM_SDK_SECRET="your-secret"
```

4. Start the development server

```bash
$ bun dev # or npm run dev
```

You can open [http://localhost:3000](http://localhost:3000) with your browser to view the project.
