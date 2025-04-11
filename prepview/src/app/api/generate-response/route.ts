import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";


// Initialize the OpenAI client with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    let systemMessage = `You are helping ${userName || 'a job applicant'} during an interview practice session. 
Your role is to respond AS IF YOU ARE ${userName || 'the job applicant'}, using first-person perspective.

`;
    
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
10. Balance humility with confidence - acknowledge areas for growth while highlighting strengths`;

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

    // Generate a response using GPT-3.5 turbo
    let responseText = "I appreciate that question. Based on my experience, I believe I'm well-qualified to handle this challenge.";
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.8, // Slightly higher temperature for more creativity and confidence
        max_tokens: 350, // Increased token limit for more detailed responses
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