import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import os from "os";
import path from "path";

// Initialize the OpenAI client with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  let tempFilePath = '';
  
  try {
    // Check if the API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Get the JSON data from the request
    const { audio } = await request.json();

    if (!audio) {
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 }
      );
    }

    // Decode base64 audio data
    const binaryAudio = Buffer.from(audio, 'base64');

    // Create a temporary file to save the audio
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
    
    // Write the binary audio data to the temporary file
    fs.writeFileSync(tempFilePath, binaryAudio);

    try {
      // Send the audio to Whisper API for transcription using the file path
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
        language: "en",
      });

      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      tempFilePath = '';

      return NextResponse.json({ text: transcription.text });
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw error;
    }
  } catch (error) {
    // Clean up the temporary file if there was an error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
      }
    }
    
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}

// Increase response limit for handling larger audio files
export const config = {
  api: {
    responseLimit: '10mb',
  },
}; 