import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import os from "os";
import path from "path";

// Initialize the Google AI client with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function POST(request: NextRequest) {
  let tempFilePath = '';
  
  try {
    // Check if the API key is configured
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Google AI API key not configured" },
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
      // Create a model instance
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Convert audio to base64 for Google AI
      const audioBytes = fs.readFileSync(tempFilePath);
      const base64Audio = audioBytes.toString('base64');
      
      // Send the audio to Google AI for transcription
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { 
              inlineData: {
                mimeType: "audio/webm",
                data: base64Audio
              } 
            },
            { text: "Transcribe this audio accurately. Return only the transcription text without any additional commentary." }
          ]
        }]
      });
      
      const response = await result.response;
      const transcription = response.text();

      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      tempFilePath = '';

      return NextResponse.json({ text: transcription });
    } catch (error) {
      console.error("Google AI API Error:", error);
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