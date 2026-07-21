"use client";

import { isStaticToolUIPart, isTextUIPart, type UIMessage } from "ai";
import type { ChatStatus } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Loader } from "@/components/ai-elements/loader";

/** Extracts plain text from a `UIMessage` by joining all text parts. */
function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

type ChatMessagesProps = {
  messages: UIMessage[];
  status: ChatStatus;
};

/**
 * Renders the conversation message list with markdown responses, tool calls,
 * and a loading indicator.
 */
export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => {
          const toolParts = message.parts.filter(isStaticToolUIPart);
          const text = getMessageText(message);

          return (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {toolParts.map((part) => (
                  <Tool key={part.toolCallId}>
                    <ToolHeader type={part.type} state={part.state} />
                    <ToolContent>
                      <ToolInput input={part.input} />
                      <ToolOutput output={part.output} errorText={part.errorText} />
                    </ToolContent>
                  </Tool>
                ))}

                {text ? <MessageResponse>{text}</MessageResponse> : null}
              </MessageContent>
            </Message>
          );
        })}

        {isWaiting ? (
          <Message from="assistant">
            <MessageContent>
              <Loader />
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
   
    </Conversation>
  );
}