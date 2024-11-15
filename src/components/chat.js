"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const Button = React.forwardRef(({ className, ...props }, ref) => (
  <button
    className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-11 px-4 py-2 ${className}`}
    ref={ref}
    {...props}
  />
));
Button.displayName = "Button";

const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    className={`flex h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${className}`}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

// Icons remain the same...
const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const LoaderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-spin"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// Function definitions for the model to use
const availableFunctions = {
  executeCode: {
    name: "executeCode",
    description: "Execute JavaScript code and return the result",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The JavaScript code to execute",
        },
      },
      required: ["code"],
    },
  },
};

// Safe code execution function
const executeCode = async (code) => {
  try {
    // Create a new function in an isolated scope
    const asyncFunction = new Function(`
      return (async () => {
        try {
          ${code}
        } catch (error) {
          return { error: error.message };
        }
      })();
    `);

    const result = await asyncFunction();
    return { result };
  } catch (error) {
    return { error: error.message };
  }
};

const CodePreview = ({ html, css, js }) => {
  const combinedCode = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `;

  // Create a data URL from the combined code
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(
    combinedCode
  )}`;

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
        <span className="text-sm font-medium">Preview</span>
        <button
          onClick={() => window.open(dataUrl, "_blank")}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Open in New Window
        </button>
      </div>
      <iframe
        src={dataUrl}
        className="w-full h-96 border-none"
        title="Code Preview"
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
      />
    </div>
  );
};

const FormattedMessage = ({ content, role }) => {
  const [codeFiles, setCodeFiles] = useState({ html: "", css: "", js: "" });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Parse code blocks from the message
    const parseCode = (content) => {
      const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/);
      const cssMatch = content.match(/```css\n([\s\S]*?)\n```/);
      const jsMatch = content.match(/```(javascript|js)\n([\s\S]*?)\n```/);

      if (htmlMatch || cssMatch || jsMatch) {
        setCodeFiles({
          html: htmlMatch ? htmlMatch[1].trim() : "",
          css: cssMatch ? cssMatch[1].trim() : "",
          js: jsMatch ? jsMatch[2].trim() : "",
        });
        setShowPreview(true);
      }
    };

    parseCode(content);
  }, [content]);

  const getLanguageFromClassName = (className) => {
    if (className && className.startsWith("language-")) {
      return className.slice(9);
    }
    return "";
  };

  return (
    <div
      className={`prose prose-invert max-w-none ${
        role === "user" ? "text-right" : "text-left"
      }`}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 text-zinc-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-3 text-zinc-100">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mb-2 text-zinc-100">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4 text-zinc-100">{children}</p>,
          code: ({ node, inline, className, children, ...props }) => {
            const language = getLanguageFromClassName(className);

            if (inline) {
              return (
                <code
                  className="bg-zinc-800 rounded px-1.5 py-0.5 text-zinc-100"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative group">
                {language && (
                  <div className="absolute top-2 right-2 text-xs text-zinc-400 px-2 py-1 rounded bg-zinc-800/50">
                    {language}
                  </div>
                )}
                <pre className="bg-zinc-800 p-4 rounded-lg overflow-x-auto mb-4 text-sm">
                  <code
                    className={`language-${language} text-zinc-100`}
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </code>
                </pre>
              </div>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc ml-6 mb-4 text-zinc-100">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-6 mb-4 text-zinc-100">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-zinc-700 pl-4 italic text-zinc-300">
              {children}
            </blockquote>
          ),
          li: ({ children }) => (
            <li className="text-zinc-100 mb-1">{children}</li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      {showPreview && (
        <div className="mt-4">
          <CodePreview
            html={codeFiles.html}
            css={codeFiles.css}
            js={codeFiles.js}
          />
        </div>
      )}
    </div>
  );
};

export default function Chat() {
  const [apiKey, setApiKey] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeFiles, setCodeFiles] = useState({ html: "", css: "", js: "" });
  const [showPreview, setShowPreview] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFunctionCall = async (functionCall) => {
    if (functionCall.name === "executeCode") {
      const result = await executeCode(functionCall.arguments.code);
      return JSON.stringify(result);
    }
    return null;
  };

  const handleSubmit = useCallback(async () => {
    if (!apiKey || !inputMessage.trim()) return;

    const userMessage = { role: "user", content: inputMessage };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Grok, a chatbot inspired by the Hitchhikers Guide to the Galaxy. You can execute JavaScript code when needed.",
            },
            ...messages,
            userMessage,
          ],
          model: "grok-beta",
          stream: true,
          temperature: 0,
          functions: [availableFunctions.executeCode],
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";
      let functionCallInProgress = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            // Handle function calls
            if (data.choices[0].delta?.function_call) {
              if (!functionCallInProgress) {
                functionCallInProgress = {
                  name: data.choices[0].delta.function_call.name,
                  arguments: "",
                };
              }
              if (data.choices[0].delta.function_call.arguments) {
                functionCallInProgress.arguments +=
                  data.choices[0].delta.function_call.arguments;
              }

              if (data.choices[0].finish_reason === "function_call") {
                // Execute the function
                const functionResult = await handleFunctionCall({
                  name: functionCallInProgress.name,
                  arguments: JSON.parse(functionCallInProgress.arguments),
                });

                // Add the function result to messages
                setMessages((prevMessages) => [
                  ...prevMessages,
                  {
                    role: "function",
                    name: functionCallInProgress.name,
                    content: functionResult,
                  },
                ]);

                functionCallInProgress = null;
              }
            } else if (data.choices[0].delta?.content) {
              accumulatedResponse += data.choices[0].delta.content;
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === "assistant") {
                  newMessages[newMessages.length - 1] = {
                    ...lastMessage,
                    content: accumulatedResponse,
                  };
                } else {
                  newMessages.push({
                    role: "assistant",
                    content: accumulatedResponse,
                  });
                }
                return newMessages;
              });
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prevMessages) => [...prevMessages]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, inputMessage, messages]);

  const handleCodePreview = (content) => {
    // Extract HTML, CSS, and JS blocks from the content
    const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/);
    const cssMatch = content.match(/```css\n([\s\S]*?)\n```/);
    const jsMatch = content.match(/```(javascript|js)\n([\s\S]*?)\n```/);

    setCodeFiles({
      html: htmlMatch ? htmlMatch[1].trim() : "",
      css: cssMatch ? cssMatch[1].trim() : "",
      js: jsMatch ? jsMatch[2].trim() : "",
    });

    setShowPreview(!!htmlMatch || !!cssMatch || !!jsMatch);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chatMessages");
  };

  return (
    <div className="flex h-screen">
      {/* Left Side: Chat */}
      <div className="flex flex-col flex-1 bg-zinc-950">
        <div className="flex-1 overflow-auto p-4 space-y-4 mx-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                <FormattedMessage
                  content={message.content}
                  role={message.role}
                />
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900">
          <div className="max-w-3xl mx-auto space-y-4">
            <Input
              type="password"
              placeholder="Enter your API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              aria-label="API Key"
            />
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSubmit()
                }
                aria-label="Message input"
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                aria-label="Send message"
                className="w-14"
              >
                {isLoading ? <LoaderIcon /> : <SendIcon />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Preview */}
      {showPreview && (
        <div className="w-1/3 bg-zinc-800 border-l border-zinc-700 p-4 overflow-y-auto">
          <CodePreview
            html={codeFiles.html}
            css={codeFiles.css}
            js={codeFiles.js}
          />
        </div>
      )}
    </div>
  );
}
