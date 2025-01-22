import { NextRequest, NextResponse } from 'next/server';
// import { createWorker } from 'tesseract.js';
import scribe from 'scribe.js-ocr';

interface OCRError extends Error {
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    console.log(formData);

    // const startTime = performance.now();
    
    // const worker = await createWorker("eng" , undefined, {
    //     workerPath: '../../../../node_modules/tesseract.js/dist/worker.min.js',
    //     langPath: '../../../../node_modules/tesseract.js/lang-data'
    // });
    // // await worker.recognize('https://s3.ap-south-1.amazonaws.com/invygo-new/production/user/original_SyCoG1OdT1704616613840.png');
        
    // const ret = await worker.recognize('https://s3.ap-south-1.amazonaws.com/invygo-new/production/user/original_SyCoG1OdT1704616613840.png');
    // const { data: { text } } = ret;
    // await worker.terminate();

    // const endTime = performance.now();

    const startTime2 = performance.now();
    scribe.extractText(['https://s3.ap-south-1.amazonaws.com/invygo-new/production/user/original_SyCoG1OdT1704616613840.png'])
	.then((res) => console.log(res))
    const processingTime2 = performance.now() - startTime2;
    
    return NextResponse.json({ processingTime2 });
  } catch (error: unknown) {
    const err = error as OCRError;
    console.error('OCR Error:', err.message);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}