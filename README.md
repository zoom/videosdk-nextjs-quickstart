# Zoom VideoSDK Next.js Quickstart

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
$ npm install # or bun install
```
3.Install required Radix UI components

```bash
# Using shadcn/ui CLI (Recommended)
npx shadcn-ui@latest add dropdown-menu separator

# Or manually install Radix UI packages
npm install @radix-ui/react-dropdown-menu @radix-ui/react-separator @radix-ui/react-slot

# Or using bun
bun add @radix-ui/react-dropdown-menu @radix-ui/react-separator @radix-ui/react-slot
```

4. Obtain your `SDK Key` and `SDK Secret`

Log in to the [Zoom App Marketplace](https://marketplace.zoom.us/), click Develop in the top right corner, then select Build Video SDK. Scroll down and you'll find your SDK Key and SDK Secret.

5. Copy `.env.example` to `.env` and fill in your Zoom Video SDK credentials as:

```bash
ZOOM_SDK_KEY="your-key"
ZOOM_SDK_SECRET="your-secret"
```

6. Start the development server

```bash
$ npm run dev # or bun dev 
```

You can open [http://localhost:3000](http://localhost:3000) with your browser to view the project.
