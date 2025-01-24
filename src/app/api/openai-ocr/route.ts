import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    // Create proper data URL based on file type
    const mimeType = file.type || 'image/jpeg'; // fallback to jpeg if type is not available
    const base64Url = `data:${mimeType};base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract text from the image/document with high precision. Return a JSON object with the following strictly-defined fields:

              {
                "idNumber": "",
                "name": "",
                "firstName": "",
                "lastName": "",
                "dateOfBirth": "",
                "issueDate": "",
                "expiryDate": "",
                "nationality": "",
                "sex": "",
                "confidenceScores": {
                  "overall": 0-100,
                  "idNumber": 0-100,
                  "name": 0-100,
                  "dateOfBirth": 0-100,
                  "issueDate": 0-100,
                  "expiryDate": 0-100
                }
              }

              Rules:
              - Populate all fields with extracted data
              - Leave empty string if field cannot be confidently extracted
              - Confidence scores represent percentage likelihood of accuracy
              - Provide an overall confidence score and field-specific scores
              - Dates should be in ISO 8601 format (YYYY-MM-DD)
              - Return ONLY the JSON object, no additional text`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Url
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0, // More deterministic output
      response_format: { type: "json_object" }
    });

    // Extract text from response
    const extractedText = response.choices[0]?.message?.content?.trim() || '';
    
    // Log for debugging
    console.log('OpenAI Response:', {
      status: 'success',
      textLength: extractedText.length,
      firstFewChars: extractedText.substring(0, 100) + '...'
    });

    return NextResponse.json({ 
      text: extractedText,
      processingTime: new Date().toISOString()
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('OpenAI OCR Error:', err.message);
    return NextResponse.json({ 
      error: err.message || 'Failed to process image with OpenAI',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 