"use client"
import { useState } from 'react';
import Image from 'next/image';

interface ProcessingTime {
  method: string;
  duration: number;
  timestamp: string;
}

export default function OCRUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blurResults, setBlurResults] = useState<{ isBlurry: boolean; recommendation: string; blurScore: number; quality: { brightness: number; contrast: number; width: number; height: number; format: string } } | null>(null);
  const [processingTimes, setProcessingTimes] = useState<ProcessingTime[]>([]);

  const addProcessingTime = (method: string, startTime: number) => {
    const duration = performance.now() - startTime;
    setProcessingTimes(prev => [...prev, {
      method,
      duration,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setExtractedText('');
      setBlurResults(null);
    }
  };

  const handleOCR = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process image');
      }

      setExtractedText(data.text);
      addProcessingTime('Local OCR', startTime);
    } catch (err) {
      setError('Error processing the file. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlurCheck = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/blur-detection', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }
      
      setBlurResults(data);
      addProcessingTime('Blur Detection', startTime);
    } catch (err) {
      setError('Error analyzing the file. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExternalOCR = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);

      const response = await fetch('http://localhost:4000/api/check-document', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process image');
      }
      
      setExtractedText(data.text);
      addProcessingTime('External OCR', startTime);
    } catch (err) {
      setError('Error processing the file with external OCR. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAIOCR = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/openai-ocr', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process image');
      }
      
      setExtractedText(data.text);
      addProcessingTime('OpenAI OCR', startTime);
    } catch (err) {
      setError('Error processing the file with OpenAI. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextractOCR = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/textract', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process image');
      }
      
      setExtractedText(data.text);
      addProcessingTime('AWS Textract', startTime);
    } catch (err) {
      setError('Error processing the file with Textract. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalReadability = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/document-readability', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze document');
      }
      
      setExtractedText(data.text);
      setBlurResults({
        isBlurry: !data.isReadable,
        blurScore: data.details.imageQuality.blurScore,
        recommendation: data.suggestions.join('\n'),
        quality: {
          brightness: data.details.imageQuality.brightness,
          contrast: data.details.imageQuality.contrast,
          width: data.details.metadata.width,
          height: data.details.metadata.height,
          format: data.details.metadata.format
        }
      });
      addProcessingTime('Local Readability', startTime);
    } catch (err) {
      setError('Error analyzing the document. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Upload Section */}
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm text-gray-600">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-gray-500">
                Supports: Images and PDFs
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      {selectedFile && (
        <div className="flex gap-4 justify-center flex-wrap max-w-2xl mx-auto">
          {/* Local Processing */}
          <div className="w-full flex gap-4 justify-center flex-wrap">
            <button
              onClick={handleOCR}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Extract Text (Local)
            </button>
            <button
              onClick={handleLocalReadability}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              Check Readability
            </button>
            <button
              onClick={handleBlurCheck}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Check Image Quality
            </button>
          </div>

          {/* Cloud Services */}
          <div className="w-full flex gap-4 justify-center flex-wrap">
            <button
              onClick={handleTextractOCR}
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              Extract Text (AWS)
            </button>
            <button
              onClick={handleExternalOCR}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              Extract Text (External)
            </button>
          </div>

          {/* AI Processing */}
          <div className="w-full flex gap-4 justify-center flex-wrap">
            <button
              onClick={handleOpenAIOCR}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Extract Text (AI)
            </button>
          </div>
        </div>
      )}

      {/* Preview and Results Section */}
      {selectedFile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Image Preview */}
          <div className="space-y-6">
            {previewUrl && (
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            
            {/* Processing Times */}
            {processingTimes.length > 0 && (
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 text-black">
                <h3 className="text-lg font-semibold mb-2">Processing Times:</h3>
                <div className="space-y-2">
                  {processingTimes.map((time, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{time.method}:</span>{' '}
                      <span className="text-gray-600">{time.duration.toFixed(2)}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Processing...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            {blurResults && !isLoading && (
              <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-2">Image Quality Analysis:</h3>
                <div className="space-y-2">
                  <p className={blurResults.isBlurry ? 'text-red-600' : 'text-green-600'}>
                    {blurResults.recommendation}
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Blur Score: {(blurResults.blurScore * 100).toFixed(2)}%</p>
                    <p>Brightness: {(blurResults.quality.brightness * 100).toFixed(2)}%</p>
                    <p>Contrast: {(blurResults.quality.contrast * 100).toFixed(2)}%</p>
                    <p>Resolution: {blurResults.quality.width}x{blurResults.quality.height}</p>
                    <p>Format: {blurResults.quality.format}</p>
                  </div>
                </div>
              </div>
            )}

            {extractedText && !isLoading && (
              <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 text-black">
                <h3 className="text-lg font-semibold mb-2">Extracted Text:</h3>
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {extractedText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 