import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* SVG favicon for modern browsers */}
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        {/* ICO favicon as fallback for older browsers */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        
        {/* SEO Meta Tags */}
        <meta name="description" content="YAMA - Yet Another Map App. Find the best transit routes and directions with real-time public transportation information." />
        <meta name="keywords" content="yama, yet another map app, map app, transit routes, public transportation, directions, route planner, transit directions" />
        <meta name="author" content="YAMA" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="YAMA - Yet Another Map App" />
        <meta property="og:description" content="Find the best transit routes and directions with real-time public transportation information." />
        <meta property="og:image" content="/logo.svg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YAMA - Yet Another Map App" />
        <meta name="twitter:description" content="Find the best transit routes and directions with real-time public transportation information." />
        <meta name="twitter:image" content="/logo.svg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://your-domain.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
