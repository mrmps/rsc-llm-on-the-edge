import React from 'react';

export function FormattedTokensWrapper({ tokens }) {
  const formattedText = formatText(tokens);

  return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
}

function formatText(text) {
  // Splitting the text into sentences and bolding the first word of each
  return text
    .split(/(?<=\.\s)/)
    .map(sentence => {
      if (!sentence.trim()) return '';
      // Bold the first word of the sentence
      return sentence.replace(/^(\w+)/, '<b>$1</b>');
    })
    .join('');
}
