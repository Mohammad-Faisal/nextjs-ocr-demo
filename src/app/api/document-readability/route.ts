import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import tesseract from 'node-tesseract-ocr';

const tesseractConfig = {
  lang: "eng",
  oem: 1,
  psm: 3,
};

class DocumentReadabilityChecker {
    private blurThreshold: number;
    private minConfidence: number;
    private minTextLength: number;

    constructor(options: { blurThreshold?: number; minConfidence?: number; minTextLength?: number } = {}) {
        this.blurThreshold = options.blurThreshold || 0.15;
        this.minConfidence = options.minConfidence || 60;
        this.minTextLength = options.minTextLength || 10;
    }

    async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
        return sharp(imageBuffer)
            .grayscale()
            .normalize()
            .modulate({ brightness: 1.1 })
            .sharpen()
            .toBuffer();
    }

    async checkReadability(imageBuffer: Buffer) {
        try {
            const processedImage = await this.preprocessImage(imageBuffer);
            const metadata = await sharp(processedImage).metadata();
            const qualityMetrics = await this.analyzeImageQuality(processedImage);

            const ocrResult = await tesseract.recognize(processedImage, tesseractConfig);
            const words = ocrResult.split(/\s+/).filter(word => word.length > 0);
            const confidenceScore = await this.calculateOCRConfidence(processedImage);
            
            const readabilityScore = this.calculateReadabilityScore({
                confidenceScore,
                blurScore: qualityMetrics.blurScore,
                contrast: qualityMetrics.contrast,
                wordCount: words.length
            });

            return {
                isReadable: readabilityScore >= 70,
                readabilityScore,
                details: {
                    wordCount: words.length,
                    confidenceScore,
                    imageQuality: qualityMetrics,
                    metadata: {
                        width: metadata.width,
                        height: metadata.height,
                        format: metadata.format
                    }
                },
                text: ocrResult,
                suggestions: this.generateSuggestions({
                    readabilityScore,
                    qualityMetrics,
                    confidenceScore
                })
            };
        } catch (error) {
            throw new Error(`Failed to analyze document readability: ${(error as Error).message}`);
        }
    }

    async analyzeImageQuality(imageBuffer: Buffer) {
        const { data, info } = await sharp(imageBuffer)
            .grayscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const pixels = new Uint8Array(data);
        
        const mean = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
        const variance = pixels.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / pixels.length;
        const contrast = Math.sqrt(variance) / 255;
        const blurScore = this.calculateBlurScore(pixels, info.width, info.height);

        return {
            contrast,
            blurScore,
            brightness: mean / 255,
            resolution: info.width * info.height
        };
    }

    calculateBlurScore(pixels: Uint8Array, width: number, height: number): number {
        let laplacianSum = 0;
        let count = 0;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const val = pixels[idx] * 4 
                    - pixels[idx - 1] 
                    - pixels[idx + 1]
                    - pixels[idx - width]
                    - pixels[idx + width];
                laplacianSum += Math.abs(val);
                count++;
            }
        }

        const laplacianVariance = laplacianSum / count;
        return Math.max(0, Math.min(1, 1 - (laplacianVariance / 255)));
    }

    async calculateOCRConfidence(imageBuffer: Buffer): Promise<number> {
        const ocrResult = await tesseract.recognize(imageBuffer, {
            ...tesseractConfig,
            config: '--psm 3'
        });

        const confidenceRegex = /Confidence: (\d+\.?\d*)/;
        const match = ocrResult.match(confidenceRegex);
        return match ? parseFloat(match[1]) : 0;
    }

    calculateReadabilityScore({ 
        confidenceScore, 
        blurScore, 
        contrast, 
        wordCount 
    }: { 
        confidenceScore: number; 
        blurScore: number; 
        contrast: number; 
        wordCount: number 
    }): number {
        const weights = {
            confidence: 0.4,
            blur: 0.3,
            contrast: 0.2,
            wordCount: 0.1
        };

        const scores = {
            confidence: confidenceScore,
            blur: (1 - blurScore) * 100,
            contrast: contrast * 100,
            wordCount: Math.min(wordCount / 10 * 100, 100)
        };

        return Object.keys(weights).reduce((score, factor) => {
            return score + (scores[factor as keyof typeof weights] * weights[factor as keyof typeof weights]);
        }, 0);
    }

    generateSuggestions({ 
        readabilityScore, 
        qualityMetrics, 
        confidenceScore 
    }: { 
        readabilityScore: number; 
        qualityMetrics: { blurScore: number; contrast: number; brightness: number }; 
        confidenceScore: number 
    }): string[] {
        const suggestions: string[] = [];

        if (readabilityScore < 50) {
            suggestions.push('Overall document quality is poor. Consider recapturing with better lighting and focus.');
        } else if (readabilityScore < 70) {
            suggestions.push('Document quality could be improved for better text recognition.');
        }

        if (qualityMetrics.blurScore > this.blurThreshold) {
            suggestions.push('Document appears blurry. Try capturing a clearer image.');
        }

        if (qualityMetrics.contrast < 0.4) {
            suggestions.push('Low contrast detected. Ensure good lighting and clear background.');
        }

        if (qualityMetrics.brightness < 0.3 || qualityMetrics.brightness > 0.8) {
            suggestions.push('Suboptimal brightness. Adjust lighting conditions.');
        }

        if (confidenceScore < this.minConfidence) {
            suggestions.push('Text recognition confidence is low. Ensure text is clear and well-aligned.');
        }

        return suggestions;
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

        const startTime = performance.now();
        
        const checker = new DocumentReadabilityChecker({
            blurThreshold: 0.15,
            minConfidence: 60,
            minTextLength: 10
        });

        const results = await checker.checkReadability(buffer);
        const processingTime = performance.now() - startTime;

        return NextResponse.json({
            ...results,
            processingTime
        });

    } catch (error: unknown) {
        const err = error as Error;
        console.error('Document Readability Error:', err.message);
        return NextResponse.json({ 
            error: err.message || 'Failed to analyze document readability'
        }, { status: 500 });
    }
} 