// This is the serverless function that will securely call the Google AI API.
// Location: netlify/functions/analyze.js

exports.handler = async function (event) {
  // We only allow POST requests to this function
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Get the API key from the environment variables
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: 'API key not found.' };
  }

  // Get the image data from the request body
  const { imageData } = JSON.parse(event.body);
  if (!imageData) {
    return { statusCode: 400, body: 'No image data provided.' };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  // The same prompt and schema from the original HTML file
  const prompt = `
      Analyze the provided image of a potato and determine if it is safe to eat.
      Look for these specific signs: greening, sprouting, rot/blight, and major blemishes.
      Based on your findings, provide a clear verdict: "Safe to Eat", "Use with Caution", or "Do Not Eat".
      Provide a concise explanation for your verdict.
      List the specific warning signs you detected. If no signs are found, the list should be empty.
  `;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageData
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          "verdict": { "type": "STRING" },
          "explanation": { "type": "STRING" },
          "signs": {
            "type": "ARRAY",
            "items": { "type": "STRING" }
          }
        },
        required: ["verdict", "explanation", "signs"]
      }
    }
  };

  try {
    // Make the fetch call to the Google AI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Google AI API Error:", errorBody);
        return { statusCode: response.status, body: `Google AI API Error: ${errorBody}` };
    }

    const result = await response.json();
    
    // Send the successful result back to the browser
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
