import { headers } from "next/headers";
import { Footer } from "./components/footer";
import { Region } from "./components/region";
import { parseVercelId } from "./parse-vercel-id";
import { OpenAIStream } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";
import { Suspense } from "react";
import { Tokens } from "./components/tokens";
import { kv } from "@vercel/kv";
import BoldFirstLetter from "./components/bold-first";
import { FormattedTokensWrapper } from "./components/formatted";

export const runtime = "edge";

const apiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY!,
});

const openai = new OpenAIApi(apiConfig);

export default async function Page() {
  const headersList = headers();
  const city = decodeURIComponent(
    headersList.get("X-Vercel-IP-City") || "San%20Francisco"
  );

  const timezone =
    headersList.get("X-Vercel-IP-Timezone") || "America/Los_Angeles";

  const { proxyRegion, computeRegion } = parseVercelId(
    headersList.get("X-Vercel-Id")!
  );

  if (headersList.get("user-agent")?.includes("Twitterbot")) {
    return <></>;
  }

  return (
    <>
      <main>
        <h1 className="title">
          <span>What to do in </span>
          {city}?
        </h1>
        <pre className="tokens">
          <Suspense fallback={null}>
            <Wrapper city={city} timezone={timezone} />
          </Suspense>
        </pre>
      </main>
      <div className="meta">
        <div className="info">
          <span>Proxy Region</span>
          <Region region={proxyRegion} />
        </div>
        <div className="info">
          <span>Compute Region</span>
          <Region region={computeRegion} />
        </div>
      </div>
      <Footer />
    </>
  );
}

// We add a wrapper component to avoid suspending the entire page while the OpenAI request is being made
async function Wrapper({ city, timezone }: { city: string; timezone: string }) {
  const prompt = `
  "As a recommendation expert, I'm asked to list the top 10 Nike shoes specifically designed for walking long distances. Each recommendation should include:

  1. Product Name — Alongside a brief description of where I found the information and reasons for its suitability.
  2. Product Name — With details on the source of my information and why I believe it's a great choice.
  3. Product Name — Including information about the source and its benefits for long-distance walking.

  ... and so on up to 10.

  Note: Only include shoes with outstanding reviews. "
`;

  // See https://sdk.vercel.ai/docs/concepts/caching
  const cached = (await kv.get(prompt)) as string | undefined;

  if (cached) {
    const chunks = cached.split(" ");
    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          const bytes = new TextEncoder().encode(chunk + " ");
          controller.enqueue(bytes);
          await new Promise((r) =>
            setTimeout(
              r,
              // get a random number between 10ms and 50ms to simulate a random delay
              Math.floor(Math.random() * 2) + 20
            )
          );
        }
        controller.close();
      },
    });

    return <Tokens stream={stream} />;
  }

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await kv.set(prompt, completion);
      await kv.expire(prompt, 60 * 10);
    },
  });

  return <Tokens stream={stream} />;
}