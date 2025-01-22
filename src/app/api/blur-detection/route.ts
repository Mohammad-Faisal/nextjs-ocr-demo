import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

interface BlurError extends Error {
  message: string;
}

interface BlurDetectorOptions {
  blurThreshold?: number;
  minDocumentSize?: {
    width: number;
    height: number;
  };
}

class DocumentBlurDetector {
  private blurThreshold: number;
  private minDocumentSize: { width: number; height: number };

  constructor(options: BlurDetectorOptions = {}) {
    this.blurThreshold = options.blurThreshold || 0.15;
    this.minDocumentSize = options.minDocumentSize || { width: 800, height: 500 };
  }

  private calculateVariance(data: Uint8Array): number {
    const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
    const squareDiffs = Array.from(data).map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, value) => sum + value, 0) / squareDiffs.length;
    return avgSquareDiff;
  }

  async detectBlur(imageBuffer: Buffer) {
    try {
      // Load and process the image
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      console.log(metadata.width, metadata.height);
      
      // Check image dimensions
      if (!metadata.width || !metadata.height || 
          metadata.width < this.minDocumentSize.width || 
          metadata.height < this.minDocumentSize.height) {
        throw new Error(`Image resolution too low. Minimum required: ${this.minDocumentSize.width}x${this.minDocumentSize.height}`);
      }

      // Convert to grayscale and get edge detection data
      const { data } = await image
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Calculate local variances to detect edges
      const pixelArray = new Uint8Array(data);
      const variance = this.calculateVariance(pixelArray);
      
      // Normalize variance to a 0-1 scale
      const normalizedVariance = variance / (255 * 255);
      
      // Calculate additional metrics
      const brightness = pixelArray.reduce((sum, value) => sum + value, 0) / pixelArray.length;
      const contrast = Math.sqrt(
        pixelArray.reduce((sum, value) => sum + Math.pow(value - brightness, 2), 0) 
        / pixelArray.length
      );

      // Determine if image is blurry
      const isBlurry = normalizedVariance < this.blurThreshold;

      return {
        isBlurry,
        blurScore: normalizedVariance,
        quality: {
          brightness: brightness / 255,
          contrast: contrast / 255,
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size
        },
        threshold: this.blurThreshold,
        recommendation: isBlurry 
          ? 'Image is too blurry, please provide a clearer image'
          : 'Image quality is acceptable'
      };
    } catch (error) {
      throw new Error(`Error analyzing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const detector = new DocumentBlurDetector({
      blurThreshold: 0.15,
      minDocumentSize: { width: 400, height: 400 }
    });

    const results = await detector.detectBlur(buffer);
    
    return NextResponse.json(results);

  } catch (error: unknown) {
    const err = error as BlurError;
    console.error('Blur Detection Error:', err.message);
    return NextResponse.json({ 
      error: err.message || 'Failed to analyze image' 
    }, { status: 500 });
  }
} 