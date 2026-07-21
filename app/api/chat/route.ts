import { loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { chatTools } from "@/features/ai/tools";
import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, createIdGenerator, createUIMessageStream, createUIMessageStreamResponse, stepCountIs, streamText, toUIMessageStream, type UIMessage } from "ai";
/**
 * Builds the system prompt: the conversation's own prompt plus today's date and
 * instructions telling the model when to reach for the `webSearch` and `weather` tools.
 */
function buildSystemPrompt(systemPrompt: string | null) {
    const base = systemPrompt ?? "You are ChaiGpt, a helpful assistant.";

    return [
        base,
        `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
        "You have tools available. Use them instead of guessing:",
        "- `webSearch`: call it for anything current, recent, or past your training cutoff — news, prices, sports results, releases, or when the user says 'latest'/'today'/'right now'. Never answer such questions from memory.",
        "- `weather`: call it for any weather, temperature, or forecast question.",
        "After a tool returns, answer in your own words and cite source URLs when you used webSearch.",
    ].join("\n");
}

/**
 * POST /api/chat — Streams an AI assistant reply for a conversation.
 *
 * Validates auth and ownership, persists the user message, then streams the
 * assistant response via the AI SDK. Final messages are saved when the stream ends.
 */
export async function POST(req: Request) {
    await auth.protect();

    const { message, id }: { message: UIMessage, id: string } = await req.json();

    if (!message || !id) {
        return new Response("Missing message or conversation id", { status: 400 });
    }

    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            userId: user.id
        }
    });

    if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
    }

    const previousMessages = await loadChatMessages(id);

    const alreadySaved = previousMessages.some(
        (storedMessage)=>storedMessage.id === message.id
    )

    const messages = alreadySaved ? previousMessages : [...previousMessages, message];

    if(!alreadySaved){
        await saveChatMessages(id, [message]);
    }

    const result =  streamText({
        model: getChatModel(conversation.model),
        system: buildSystemPrompt(conversation.systemPrompt),
        messages: await convertToModelMessages(messages),
        tools: chatTools,
        stopWhen: stepCountIs(5),
    });

    result.consumeStream();

    return createUIMessageStreamResponse({
        stream:toUIMessageStream({
           stream:result.stream,
           originalMessages:messages,
           generateMessageId:createIdGenerator({prefix:"msg" , size:16}),
           onEnd:async({messages:finalMessages})=>{
            try {
                await saveChatMessages(id , finalMessages , {updateTitle:false})
            } catch (error) {
                console.error(error);
            }
           }
        })
    })

}