import { NextRequest, NextResponse } from 'next/server';
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create Textract command
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: buffer
      }
    });

    const startTime = performance.now();
    
    // Call Textract
    const response = await textractClient.send(command);
    
    // Process results
    const extractedText = response.Blocks?.filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .join('\n') || '';

    const processingTime = performance.now() - startTime;

    return NextResponse.json({
      text: extractedText,
      processingTime,
      confidence: response.Blocks?.[0]?.Confidence || 0,
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Textract Error:', err.message);
    return NextResponse.json({ 
      error: err.message || 'Failed to process image with Textract'
    }, { status: 500 });
  }
} 