# PrepView - AI Interview Coach

PrepView is a Next.js 14 application that helps you practice for job interviews using AI assistance. It provides a realistic interview experience by:

1. Listening to interviewer questions via microphone
2. Transcribing audio using OpenAI's Whisper API
3. Generating professional responses as you, informed by your resume and job description
4. Maintaining conversation context for natural interview flow

## Features

- **Audio Recording**: Record interviewer questions using your microphone
- **Real-time Transcription**: Convert speech to text with high accuracy
- **AI-Powered Responses**: Generate professional interview answers based on your resume
- **Context-Aware**: Maintains conversation history for coherent interactions
- **Resume & Job Description Upload**: Upload PDF/Markdown files or paste text directly
- **Dark/Light Theme**: Beautiful UI that adapts to your preferences
- **Mobile Responsive**: Works on all devices
- **Export Transcripts**: Save your interview sessions for later review

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/prepview.git
   cd prepview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to start using PrepView.

## How to Use

1. **Upload Your Resume**: Add your resume via PDF/Markdown upload or paste text directly
2. **Add Job Description (Optional)**: Provide context for the position you're interviewing for
3. **Start the Interview**: Click the microphone button to record an interviewer question
4. **Get AI Responses**: The system will generate professional responses based on your resume
5. **Continue the Conversation**: Ask follow-up questions to practice the entire interview flow
6. **Export Your Session**: Download the transcript for review

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe code
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Beautiful UI components
- **OpenAI**: Whisper API for transcription and GPT-3.5 for responses
- **Framer Motion**: Smooth animations
- **React Media Recorder**: Audio recording
- **PDF.js**: PDF parsing

## License

MIT
