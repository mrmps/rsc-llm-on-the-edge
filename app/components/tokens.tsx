import { Suspense } from "react";

type Props = {
  /**
   * A ReadableStream produced by the AI SDK.
   */
  stream: ReadableStream;
};

export function Tokens({ stream }) {
  return <RecursiveTokens reader={stream.getReader()} accumulated="" />;
}

function RecursiveTokens({ reader, accumulated }) {
  const processStream = async () => {
    const { done, value } = await reader.read();
    if (done) {
      // Render the final accumulated content as a card, if it's non-empty
      return accumulated.trim() ? <Card content={accumulated} /> : null;
    }

    const text = new TextDecoder().decode(value);
    const accumulatedText = accumulated + text;
    const newlineIndex = accumulatedText.indexOf("\n");

    if (newlineIndex !== -1) {
      const sentence = accumulatedText.substring(0, newlineIndex);
      const rest = accumulatedText.substring(newlineIndex + 1);

      return (
        <>
          {sentence.trim() && <Card content={sentence} />}
          {/* Continue processing the rest of the text */}
          {rest && <RecursiveTokens reader={reader} accumulated={rest} />}
        </>
      );
    } else {
      // Continue accumulating text without rendering it yet
      return <RecursiveTokens reader={reader} accumulated={accumulatedText} />;
    }
  };

  return (
    <Suspense fallback={null}>
      <Suspense fallback={<div>{accumulated}</div>}>{processStream()}</Suspense>
    </Suspense>
  );
}

function Card({ content }) {
  // Split the content into a title and description
  const [title, ...descriptionParts] = content.split(": ");
  const description = descriptionParts.join(": ");

  return (
    <div className="border border-gray-300 rounded-lg shadow-sm p-4 bg-white my-4">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <p className="text-gray-600 mt-2">{description}</p>
    </div>
  );
}

// export function Tokens({ stream }) {
//     return (
//       <Suspense fallback={<div>Loading...</div>}>
//         <RecursiveTokens reader={stream.getReader()} accumulated="" />
//       </Suspense>
//     );
//   }

//   async function RecursiveTokens({ reader, accumulated }) {
//     const { done, value } = await reader.read();

//     if (done) {
//       return accumulated ? <Card content={accumulated} /> : null;
//     }

//     const text = new TextDecoder().decode(value);
//     const newlineIndex = text.indexOf("\n");

//     if (newlineIndex !== -1) {
//       // Split at the newline and render a card with the accumulated content
//       const cardContent = accumulated + text.substring(0, newlineIndex);

//       return (
//         <>
//           <Card content={cardContent} />
//           <Suspense fallback={<div>Loading...</div>}>
//             <RecursiveTokens
//               reader={reader}
//               accumulated={text.substring(newlineIndex + 1)}
//             />
//           </Suspense>
//         </>
//       );
//     } else {
//       // Accumulate more tokens
//       return (
//         <Suspense fallback={<div>Loading...</div>}>
//           <RecursiveTokens reader={reader} accumulated={accumulated + text} />
//         </Suspense>
//       );
//     }
//   }

/**
 * A React Server Component that recursively renders a stream of tokens.
 * Can only be used inside of server components.
 */
// export async function Tokens(props: Props) {
//   const { stream } = props;
//   const reader = stream.getReader();

//   return (
//     <Suspense>
//       <RecursiveTokens reader={reader} />
//     </Suspense>
//   );
// }

// type InternalProps = {
//   reader: ReadableStreamDefaultReader;
// };

// async function RecursiveTokens({ reader }: InternalProps) {
//   const { done, value } = await reader.read();

//   if (done) {
//     return null;
//   }

//   const text = new TextDecoder().decode(value);
// //   const formattedText = formatText(text);

//   return (
//     <>
//       {text}
//       <Suspense fallback={null}>
//         <RecursiveTokens reader={reader} />
//       </Suspense>
//     </>
//   );
// }
// function formatText(text: string): string {
//   console.log(text)
//   // Splitting the text into sentences and wrapping each in a card
//   return text
//     .split(/(?<=\.\s)/) // Splitting the text by period and space
//     .map((sentence) => {
//       if (!sentence.trim()) return ""; // Skip empty strings
//       return `<div class="card bg-white shadow-md rounded p-4 m-2">${sentence}</div>`;
//     })
//     .join("");
// }
