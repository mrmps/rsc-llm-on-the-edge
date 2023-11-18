"use client"

import React, { useEffect, useState } from 'react';

function BoldFirstLetter({ stream }) {
  const [formattedText, setFormattedText] = useState('');

  useEffect(() => {
    // Subscribe to the stream and handle incoming data
    stream.onData((data) => {
      const updatedText = formatText(data);
      setFormattedText(prevText => prevText + updatedText);
    });
  }, [stream]);

  const formatText = (text) => {
    // Regex to find the first letter after a period and a space
    return text.replace(/(?:\. |\n|^)(.)/g, (match, p1) => {
      return `<b>${p1}</b>`;
    });
  };

  return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
}

export default BoldFirstLetter;
