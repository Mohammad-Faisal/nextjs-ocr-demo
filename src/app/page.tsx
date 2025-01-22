import OCRUploader from "@/components/OCRUploader";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center">
        <h1 className="text-3xl font-bold text-center">
          OCR Text Extraction Demo
        </h1>
        <p className="text-center text-gray-600 max-w-xl">
          Upload an image or PDF file to extract text using Scribe.js OCR technology.
          Supported formats include PNG, JPEG, and PDF files.
        </p>
        <OCRUploader />
      </main>
    </div>
  );
}
