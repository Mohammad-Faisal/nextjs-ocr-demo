declare module 'scribe.js-ocr' {
  interface Scribe {
    extractText: (images: string[]) => Promise<string>
  }
  const scribe: Scribe
  export default scribe
} 