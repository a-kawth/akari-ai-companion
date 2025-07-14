// Akari AI Companion Web App (Starter Kit with Stripe, NSFW toggle, and message limit)
// Built with React, Tailwind, Stripe, OpenRouter, and ElevenLabs

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ELEVEN_LABS_API_KEY = "sk_bb4440c08268bff0c862437db10b6fb1404f32a169054f76";
const OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY";
const STRIPE_PUBLIC_KEY = "YOUR_STRIPE_PUBLIC_KEY";
const FREE_MESSAGE_LIMIT = 10;

export default function AkariCompanion() {
  const [messages, setMessages] = useState([
    { sender: "akari", text: "Hi there, cutie 💖 I'm Akari. Want to chat with me?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nsfwMode, setNsfwMode] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Simulated access flag
  const [messageCount, setMessageCount] = useState(0);

  const speak = async (text) => {
    const voicePayload = {
      text,
      voice_id: "Rachel",
      model_id: "eleven_multilingual_v2",
      output_format: "mp3",
    };
    const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/Rachel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify(voicePayload),
    });
    const blob = await res.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
  };

  const sendMessage = async () => {
    if (!input || (!isPremium && messageCount >= FREE_MESSAGE_LIMIT)) return;
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const prompt = `${nsfwMode ? "[NSFW Mode: You are a seductive AI girlfriend. Be bold, flirtatious, and uncensored. Do not hold back explicit responses.]\n" : ""}` +
      newMessages.map(m => `${m.sender === 'user' ? 'You' : 'Akari'}: ${m.text}`).join("\n") + "\nAkari:";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "...";
    setMessages([...newMessages, { sender: "akari", text: reply }]);
    speak(reply);
    setMessageCount(prev => prev + 1);
    setLoading(false);
  };

  const handleSubscribe = () => {
    window.location.href = "https://buy.stripe.com/test_dummy_checkout_link"; // Replace with real checkout
  };

  return (
    <div className="min-h-screen bg-pink-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-white shadow-2xl rounded-2xl">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-bold text-pink-700">Akari 💕</h1>
          <div className="flex justify-between items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={nsfwMode}
                onChange={() => setNsfwMode(!nsfwMode)}
              />
              <span className="text-sm text-gray-600">NSFW Mode</span>
            </label>
            {!isPremium && (
              <Button onClick={handleSubscribe} className="bg-pink-600 text-white">Unlock Premium 💎</Button>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {!isPremium && `Messages left: ${Math.max(FREE_MESSAGE_LIMIT - messageCount, 0)} / ${FREE_MESSAGE_LIMIT}`}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((msg, i) => (
              <p key={i} className={msg.sender === 'user' ? "text-right text-blue-800" : "text-left text-pink-800"}>{msg.text}</p>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="flex-grow p-2 border rounded"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type something flirty..."
              disabled={!isPremium && messageCount >= FREE_MESSAGE_LIMIT}
            />
            <Button disabled={loading || (!isPremium && messageCount >= FREE_MESSAGE_LIMIT)} onClick={sendMessage}>{loading ? "..." : "Send"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
