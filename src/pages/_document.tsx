import Document, { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <body>
          <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
