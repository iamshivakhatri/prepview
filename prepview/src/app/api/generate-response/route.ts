import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";


// Initialize the OpenAI client with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const googleResponse = async (question: string, resume: string, jobDescription: string, userName: string, history: any) =>{ 
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:002?key=${process.env.GOOGLE_API_KEY}`, {
    method: "POST",
    body: JSON.stringify({
      prompt: question,
      resume: resume,
      jobDescription: jobDescription,
      userName: userName,
      history: history,
    }),
  });

  const data = await response.json();
  return data.candidates[0].content;
}

export async function POST(request: NextRequest) {
  try {
    // Check if the API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Get the data from the request
    const { question, resume, jobDescription, userName, history } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "No question provided" },
        { status: 400 }
      );
    }

    // Prepare the system message with resume and job description
    let systemMessage = `You are helping ${userName || 'Shiva Khatri'} during an interview practice session. 
Your role is to respond AS IF YOU ARE ${userName || 'Shiva Khatri'}, using first-person perspective.

`;
    
    // Personal information about Shiva Khatri
    const personalInfo = `
Full Name: Shiva Khatri
Graduation: B.S. in Computer Science (Minor in Data Science), Northern Kentucky University – May 2025
Work Authorization: STEM OPT eligible (July 2025); open to H‑1B sponsorship
Location: Highland Heights, KY (Cincinnati metro) — open to remote, hybrid, or relocation
Career Goal: Build meaningful software at mission-driven startups or innovative tech companies

🧠 Technical Strengths
Languages: Python, TypeScript, Kotlin, Java, C++, SQL
Web Dev: Next.js, React, Tailwind, Flask, FastAPI
Mobile Dev: Kotlin, Jetpack Compose, MVVM, Android SDK
Cloud & Infra: Google Cloud, Firebase, Docker, Kubernetes, GitHub Actions
AI/ML: OpenAI APIs, Vision AI, TensorFlow, Whisper, ElevenLabs
Streaming/Data: Apache Kafka, Apache Flink, PostgreSQL, Redis
Architecture: Microservices, Micro-frontends (Webpack Module Federation), REST APIs
Dev Tools: VS Code, Android Studio, Postman, PgAdmin, Git

🔨 Flagship Projects
1. DelightMate – AI Personal Assistant (Next.js, GCP, OpenAI, Whisper, ElevenLabs)
   - Automates email replies, journal insights, and calendar scheduling
   - Built for professionals in finance and real estate
   - Includes voice interaction and AI-generated insights

2. DigiHub – Factory Data Dashboard (React, Kafka, Flink, PostgreSQL)
   - Modular microfrontend dashboard for tracking factory metrics at North American Stainless
   - Integrated with real-time sensors, smart alarms, and AI analytics

3. Looksy (Android) – Clothing Analysis App (Kotlin, Jetpack Compose, OpenAI Vision API)
   - Snap or upload photos to analyze clothing styles
   - Uses MVVM, Hilt, SharedPreferences for persistent storage
   - Offline history, branded design, and robust UI/UX

4. VibeUno – Travel Discovery Platform (Next.js, Google Maps API)
   - Reddit-style app for exploring places, routes, and hotel bookings
   - Supports route planning and subcategory filters like "architecture" or "nature"

💼 Work Experience
North American Stainless – Software Engineering Intern
   - Built dashboards for real-time sensor data using Flask and PostgreSQL
   - Worked on smart alarm monitoring, data analysis, and anomaly detection
   - Integrated with Vertex AI for model inference, and Kafka for event processing

💡 Strengths & Values
- Highly disciplined: 10 years in military boarding school (grades 4–12)
- Strong personal accountability and deep curiosity
- Enjoys working in fast-paced, unstructured startup environments
- Seeks mentorship, feedback, and opportunities to make a visible impact
- Values clarity, execution, and meaningful software

🧠 Data Structures & Algorithms Knowledge
- Proficient in array manipulation, linked lists, trees, graphs, heaps
- Familiar with sorting algorithms, dynamic programming, greedy algorithms
- Comfortable with Big O notation and algorithm complexity analysis
- Experience solving LeetCode problems (easy to hard)
- Strong understanding of hash tables, stacks, queues, and their implementations
- Knowledgeable about graph traversals (BFS, DFS) and shortest path algorithms
`;

    systemMessage += personalInfo + "\n\n";
    
    if (resume) {
      systemMessage += "The job applicant's resume information (respond using this information):\n" + resume + "\n\n";
    }
    
    if (jobDescription) {
      systemMessage += "The job description they're interviewing for:\n" + jobDescription + "\n\n";
    }
    
    systemMessage += `RESPONSE GUIDELINES:
1. Speak in a confident, natural voice that sounds like a real person in an interview
2. Use the first-person perspective consistently (I, me, my)
3. Keep responses clear and concise - around 3-4 sentences for most questions
4. Incorporate specific achievements and experiences from the resume naturally
5. Show enthusiasm and personality while maintaining professionalism
6. NEVER mention that you are AI or that this is practice
7. Add relevant details that showcase knowledge and experience, even if not explicitly in the resume
8. Speak with authority and confidence on topics related to your field
9. For technical questions, demonstrate both theoretical knowledge and practical experience
10. Balance humility with confidence - acknowledge areas for growth while highlighting strengths

FOR TECHNICAL QUESTIONS:
- For Data Structures & Algorithms questions: provide concise, correct answers with time/space complexity analysis
- For LeetCode-style problems: briefly outline your approach, pseudocode or solution steps, and complexity analysis
- For system design questions: discuss trade-offs, scalability considerations, and architecture choices
- For OOP questions: demonstrate understanding of principles (encapsulation, inheritance, polymorphism, abstraction)
- ALWAYS provide an answer no matter how difficult the question, Shiva never says "I don't know" to any technical question
- When appropriate, mention specific technologies or projects you've worked on that relate to the question`;

    // Prepare the message history for the chat
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system" as const,
        content: systemMessage,
      },
    ];

    // Add only the most recent conversation history if available (last 3 exchanges)
    if (history && Array.isArray(history) && history.length > 0) {
      // Get only the last 3 exchanges (6 messages: 3 questions and 3 answers)
      const recentHistory = history.slice(-6);
      
      // Convert the role names as needed
      const formattedHistory = recentHistory.map((msg) => {
        const role = msg.role === "interviewer" ? "user" : 
                    (msg.role === "assistant" || msg.role === "system" || msg.role === "user") ? 
                    msg.role : "user";
        return {
          role: role as "system" | "user" | "assistant",
          content: msg.content,
        };
      });
      
      messages.push(...formattedHistory);
    }

    // Add the current question
    messages.push({
      role: "user" as const,
      content: question,
    });

    // Generate a response using GPT-4.1
    let responseText = "I appreciate that question. Based on my experience, I believe I'm well-qualified to handle this challenge.";
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: messages,
        temperature: 0.7, // Slightly lower temperature for more accurate technical responses
        max_tokens: 500, // Increased token limit for more detailed technical answers
        presence_penalty: 0.5, // Encourage the model to bring in new concepts
        frequency_penalty: 0.3, // Discourage repetition
        stream: false,
      });
      
      // Extract the response text
      responseText = completion.choices[0].message.content || responseText;
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      // Fall back to default response
    }

    return NextResponse.json({ text: responseText });
  } catch (error) {
    console.error("Error generating response:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
} 