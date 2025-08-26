import { useState, useRef, useEffect } from 'react';
import { Bot, Upload, Mic, StopCircle, Loader2, Save, Copy, Check, MessageSquare, FileText, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import toast from 'react-hot-toast';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | 'aborted' | 'service-not-allowed';
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Initialize Gemini AI
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Missing API key - ensure environment variables are properly configured');
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Type definitions
interface MessageContent {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: MessageContent[];
}

type Mode = 'chat' | 'document' | 'transcribe';

// Input sanitization function
const sanitizeInput = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s.,!?-]/g, '') // Only allow safe characters
    .trim();
};

// File type validation
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const validateFile = (file: File): boolean => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    toast.error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.');
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    toast.error('File too large. Maximum size is 10MB.');
    return false;
  }
  return true;
};

const SpeechFeedback = ({ confidence, isRecording }: { confidence: number; isRecording: boolean }) => {
  const confidencePercentage = Math.round(confidence * 100);
  const barColor = confidence > 0.8 ? 'bg-green-500' : confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="flex flex-col space-y-2 mb-4">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {isRecording ? 'Recording...' : 'Not Recording'}
        </span>
      </div>
      {isRecording && (
        <div className="flex items-center space-x-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${barColor} transition-all duration-300`}
              style={{ width: `${confidencePercentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {confidencePercentage}%
          </span>
        </div>
      )}
    </div>
  );
};

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [transcriptionConfidence, setTranscriptionConfidence] = useState<number>(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speech Recognition setup with proper error handling
  const recognition = useRef<SpeechRecognition | null>(null);
  useEffect(() => {
    if ('webkitSpeechRecognition' in window && !recognition.current) {
      try {
        recognition.current = new window.webkitSpeechRecognition();
        // Configure for better accuracy
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        recognition.current.maxAlternatives = 3; // Get multiple alternatives
        recognition.current.lang = 'en-US'; // Set language explicitly
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        toast.error('Speech recognition initialization failed');
      }
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const sanitizedInput = sanitizeInput(input.trim());
    if (!sanitizedInput) return;
    
    if (!GEMINI_API_KEY) {
      toast.error('API key not configured - contact administrator');
      return;
    }

    const userMessage: Message = { 
      role: 'user', 
      content: [{ type: 'text', content: sanitizedInput }] 
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(sanitizedInput);
      const response = await result.response;
      const text = response.text();

      // Sanitize AI response
      const sanitizedResponse = sanitizeInput(text);
      
      const parsedResponse: Message = { 
        role: 'assistant', 
        content: parseAIResponse(addEmojisToText(sanitizedResponse))
      };
      setMessages([...newMessages, parsedResponse]);
    } catch (error) {
      console.error('Secure AI response error:', error);
      toast.error('Failed to get AI response - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const processPdfDocument = async (pdfData: ArrayBuffer): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const numPages = pdf.numPages;
    const textContent: string[] = [];
    let processedPages = 0;

    // Process PDF in chunks
    const CHUNK_SIZE = 5;
    for (let i = 0; i < numPages; i += CHUNK_SIZE) {
      const pagePromises = [];
      for (let j = i; j < Math.min(i + CHUNK_SIZE, numPages); j++) {
        pagePromises.push(processPage(pdf, j + 1));
      }
      
      const chunkResults = await Promise.all(pagePromises);
      textContent.push(...chunkResults);
      processedPages += pagePromises.length;
      
      // Update progress
      const progress = Math.round((processedPages / numPages) * 100);
      toast.success(`Processing PDF: ${progress}% complete`);
    }

    return textContent.join('\n');
  };

  const processPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> => {
    try {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      // Enhanced text extraction with layout preservation
      const textItems = content.items.map((item: any) => ({
        text: item.str,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        fontSize: Math.round(item.transform[0])
      }));

      // Sort by position to maintain reading order
      textItems.sort((a, b) => {
        const yDiff = b.y - a.y;
        return yDiff !== 0 ? yDiff : a.x - b.x;
      });

      // Group text by lines
      let currentY = textItems[0]?.y;
      let currentLine: string[] = [];
      const lines: string[] = [];

      textItems.forEach(item => {
        if (Math.abs(item.y - currentY) > item.fontSize / 2) {
          if (currentLine.length > 0) {
            lines.push(currentLine.join(' '));
            currentLine = [];
          }
          currentY = item.y;
        }
        currentLine.push(item.text);
      });

      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }

      return lines.join('\n');
    } catch (error) {
      console.error(`Error processing page ${pageNum}:`, error);
      throw new Error(`Failed to process page ${pageNum}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !validateFile(file)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsProcessingFile(true);
    try {
      let text = '';
      const fileType = file.name.toLowerCase().split('.').pop();

      switch (fileType) {
        case 'pdf':
          const pdfData = await file.arrayBuffer();
          text = await processPdfDocument(pdfData);
          break;

        case 'docx':
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
          break;

        case 'txt':
          text = await file.text();
          break;

        default:
          throw new Error('Unsupported file type');
      }

      // Sanitize extracted text
      text = sanitizeInput(text.trim().replace(/\s+/g, ' '));
      
      // Limit text length for security
      const maxLength = 4000;
      const truncatedText = text.length > maxLength 
        ? text.slice(0, maxLength) + '... (text truncated for security)'
        : text;
      
      setInput(`Please analyze this text: ${truncatedText}`);
      toast.success('Document processed securely');
    } catch (error) {
      console.error('Secure file processing error:', error);
      toast.error(`Failed to process ${file.name} securely. Please try another file.`);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const QUESTION_WORDS = ['what', 'why', 'when', 'where', 'who', 'which', 'how', 'whose', 'whom'];
  const EXCLAMATION_INDICATORS = ['wow', 'amazing', 'great', 'awesome', 'excellent', 'fantastic', 'incredible', 'unbelievable'];

  const EMOJI_MAP: Record<string, string> = {
    'hello': '👋',
    'hi': '👋',
    'thanks': '🙏',
    'thank you': '🙏',
    'great': '🎉',
    'good': '👍',
    'awesome': '🌟',
    'perfect': '✨',
    'study': '📚',
    'learn': '🎓',
    'test': '📝',
    'exam': '✍️',
    'homework': '📓',
    'assignment': '📝',
    'question': '❓',
    'help': '💡',
    'time': '⏰',
    'schedule': '📅',
    'task': '✅',
    'note': '📝',
    'important': '⚠️',
    'warning': '⚠️',
    'error': '❌',
    'success': '✅',
    'music': '🎵',
    'break': '☕',
    'focus': '🎯',
    'goal': '🎯',
    'progress': '📈',
    'achievement': '🏆',
    'brain': '🧠',
    'idea': '💡',
    'write': '✍️',
    'read': '📖',
    'book': '📚',
    'computer': '💻',
    'phone': '📱',
    'sleep': '😴',
    'tired': '😫',
    'happy': '😊',
    'sad': '😢',
    'love': '❤️',
    'like': '👍',
    'dislike': '👎',
    'ok': '👌',
    'yes': '✅',
    'no': '❌'
  };

  const addEmojisToText = (text: string): string => {
    let result = text;
    
    // Add emojis based on keywords
    Object.entries(EMOJI_MAP).forEach(([keyword, emoji]) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      result = result.replace(regex, `${emoji} $&`);
    });

    // Add emojis based on sentence context
    result = result
      .replace(/(?<=^|\.\s+)how can i help/gi, '💁 How can I help')
      .replace(/(?<=^|\.\s+)here(?:'|is|'s| are)/gi, '👉 Here$1')
      .replace(/(?<=\b)(step \d+)(?=[\.:]\s+)/gi, '✨ $1')
      .replace(/(?<=^|\.\s+)remember/gi, '🧠 Remember')
      .replace(/(?<=^|\.\s+)note:/gi, '📝 Note:')
      .replace(/(?<=^|\.\s+)tip:/gi, '💡 Tip:')
      .replace(/(?<=^|\.\s+)warning:/gi, '⚠️ Warning:')
      .replace(/(?<=^|\.\s+)error:/gi, '❌ Error:')
      .replace(/(?<=^|\.\s+)success:/gi, '✅ Success:');

    return result;
  };

  const processSpeechText = (text: string): string => {
    // Sanitize input first
    const sanitizedText = sanitizeInput(text);
    
    // Split into sentences (keeping existing punctuation)
    const sentences = sanitizedText.split(/(?<=[.!?])\s+|\s+(?=[A-Z])/).filter(Boolean);
    
    const processedSentences = sentences.map(sentence => {
      let processed = sentence.trim();
      
      // Add appropriate punctuation
      if (!processed.match(/[.!?]$/)) {
        if (QUESTION_WORDS.some(word => processed.toLowerCase().startsWith(word))) {
          processed += '?';
        } else if (EXCLAMATION_INDICATORS.some(word => processed.toLowerCase().includes(word))) {
          processed += '!';
        } else {
          processed += '.';
        }
      }

      // Process text safely
      processed = processed
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?-]/g, '')
        .trim();
      
      return processed;
    });
    
    return processedSentences.join(' ').trim();
  };

  const CodeBlock = ({ content, language }: { content: string; language?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="relative group">
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 p-2 rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <SyntaxHighlighter
          language={language || 'typescript'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            padding: '1rem',
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    );
  };

  const MessageContent = ({ content }: { content: MessageContent[] }) => {
    return (
      <div className="space-y-4">
        {content.map((block, index) => (
          <div key={index}>
            {block.type === 'code' ? (
              <CodeBlock content={block.content} language={block.language} />
            ) : (
              <div className="text-current whitespace-pre-wrap leading-relaxed">
                {block.content
                  .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold syntax
                  .replace(/\*(.*?)\*/g, '$1')      // Remove italic syntax
                  .replace(/^#+ (.*)$/gm, '$1')     // Remove heading syntax
                  .replace(/`(.*?)`/g, '$1')        // Remove inline code syntax
                  .trim()}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const parseAIResponse = (text: string): MessageContent[] => {
    const parts: MessageContent[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textContent = text
          .slice(lastIndex, match.index)
          .trim()
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold syntax
          .replace(/\*(.*?)\*/g, '$1')      // Remove italic syntax
          .replace(/^#+ (.*)$/gm, '$1')     // Remove heading syntax
          .replace(/`(.*?)`/g, '$1');       // Remove inline code syntax

        if (textContent) {
          parts.push({
            type: 'text',
            content: textContent,
          });
        }
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'typescript',
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text
        .slice(lastIndex)
        .trim()
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold syntax
        .replace(/\*(.*?)\*/g, '$1')      // Remove italic syntax
        .replace(/^#+ (.*)$/gm, '$1')     // Remove heading syntax
        .replace(/`(.*?)`/g, '$1');       // Remove inline code syntax

      if (remainingText) {
        parts.push({
          type: 'text',
          content: remainingText,
        });
      }
    }

    return parts;
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window && !recognition.current) {
      try {
        recognition.current = new window.webkitSpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        recognition.current.maxAlternatives = 3;
        recognition.current.lang = 'en-US';

        recognition.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error, event.message);
          
          const errorMessages: Record<SpeechRecognitionErrorEvent['error'], string> = {
            'no-speech': 'No speech detected. Please try speaking again.',
            'audio-capture': 'No microphone detected. Please check your microphone.',
            'not-allowed': 'Microphone access denied. Please allow microphone access.',
            'network': 'Network error occurred. Please check your connection.',
            'aborted': 'Recording was aborted.',
            'service-not-allowed': 'Speech recognition service is not allowed.'
          };

          const message = errorMessages[event.error] || 'Speech recognition error occurred';
          toast.error(message);
          
          setIsRecording(false);
          recognition.current?.abort();
        };
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        toast.error('Speech recognition initialization failed');
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isRecording) {
      recognition.current.stop();
      setIsRecording(false);
      setTranscribedText(prev => {
        const newText = (prev + ' ' + finalTranscript).trim();
        return processSpeechText(newText);
      });
      toast.success('Recording stopped');
    } else {
      setInterimTranscript('');
      
      recognition.current.onstart = () => {
        setIsRecording(true);
        toast.success('Recording started');
      };

      recognition.current.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';
        let maxConfidence = 0;

        try {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            maxConfidence = Math.max(maxConfidence, confidence);

            if (event.results[i].isFinal) {
              const processedTranscript = processSpeechText(transcript);
              final += processedTranscript + ' ';
              
              // Check alternatives for better accuracy
              let bestTranscript = processedTranscript;
              let bestConfidence = confidence;
              
              for (let j = 1; j < event.results[i].length; j++) {
                const alternative = event.results[i][j];
                if (alternative.confidence > bestConfidence) {
                  bestTranscript = processSpeechText(alternative.transcript);
                  bestConfidence = alternative.confidence;
                }
              }
              
              final = final.replace(processedTranscript, bestTranscript);
            } else {
              const cleanTranscript = transcript
                .trim()
                .replace(/\s+/g, ' ')
                .replace(/^\w/, c => c.toUpperCase());
              interim += cleanTranscript + ' ';
            }
          }

          setTranscriptionConfidence(maxConfidence);
          setInterimTranscript(interim.trim());
          
          // Accumulate final transcript
          setFinalTranscript(prev => {
            const newText = (prev + ' ' + final).trim();
            return processSpeechText(newText);
          });
        } catch (error) {
          console.error('Error processing speech recognition result:', error);
          toast.error('Error processing speech. Please try again.');
        }
      };

      recognition.current.onend = () => {
        if (isRecording) {
          // Only attempt to restart if recording was not intentionally stopped
          try {
            recognition.current?.start();
            console.log('Restarting speech recognition...');
          } catch (error) {
            console.error('Failed to restart recording:', error);
            setIsRecording(false);
            toast.error('Speech recognition stopped unexpectedly');
          }
        } else {
          console.log('Speech recognition ended');
        }
      };

      try {
        recognition.current.start();
      } catch (error) {
        console.error('Failed to start recording:', error);
        toast.error('Failed to start recording');
        setIsRecording(false);
      }
    }
  };

  const saveTranscription = () => {
    const completeText = [transcribedText, finalTranscript, interimTranscript]
      .filter(Boolean)
      .map(text => sanitizeInput(text))
      .join(' ')
      .trim();
      
    if (!completeText) {
      toast.error('No text to save');
      return;
    }
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeFileName = `studymate-notes-${timestamp}.txt`.replace(/[^\w.-]/g, '');
      
      const formattedText = `StudyMate Lecture Notes\nRecorded: ${new Date().toLocaleString()}\n\n${completeText}`;
      
      // Create and download file securely
      const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFileName;
      
      // Append to body temporarily and trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Clear sensitive data
      setTranscribedText('');
      setFinalTranscript('');
      setInterimTranscript('');
      toast.success('Notes saved securely');
    } catch (error) {
      console.error('Secure save error:', error);
      toast.error('Failed to save notes securely');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Bot className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mulu-AI Study Assistant</h1>
              <p className="text-gray-600">Get help with your studies using AI</p>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setMode('chat')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                mode === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageSquare size={20} />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setMode('document')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                mode === 'document'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText size={20} />
              <span>Document</span>
            </button>
            <button
              onClick={() => setMode('transcribe')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                mode === 'transcribe'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Mic size={20} />
              <span>Transcribe</span>
            </button>
          </div>
        </div>

        {/* Mode Content */}
        {mode === 'transcribe' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mic size={24} />
              Voice Transcription
            </h2>
            
            <SpeechFeedback confidence={transcriptionConfidence} isRecording={isRecording} />
            
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  } shadow-md hover:shadow-lg`}
                  disabled={isProcessingFile}
                >
                  {isRecording ? (
                    <>
                      <StopCircle size={20} />
                      <span>Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic size={20} />
                      <span>Start Recording</span>
                    </>
                  )}
                </button>
                
                {(transcribedText || finalTranscript) && !isRecording && (
                  <button
                    onClick={saveTranscription}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all shadow-md hover:shadow-lg"
                    disabled={isProcessingFile || !(transcribedText || finalTranscript)}
                  >
                    <Save size={20} />
                    <span>Save Notes</span>
                  </button>
                )}
              </div>
              
              {(transcribedText || finalTranscript) && (
                <div className="relative p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Transcription</h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {finalTranscript || transcribedText}
                    {interimTranscript && (
                      <span className="text-gray-400">{interimTranscript}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'document' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload size={24} />
              Document Analysis
            </h2>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              {isProcessingFile ? (
                <div className="text-center">
                  <Loader2 className="animate-spin mx-auto mb-3 text-indigo-600" size={32} />
                  <p className="text-gray-600">Processing your document...</p>
                </div>
              ) : (
                <>
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center gap-3 cursor-pointer"
                  >
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <Upload className="text-indigo-600" size={24} />
                    </div>
                    <span className="text-indigo-600 font-medium">Upload Document</span>
                    <p className="text-sm text-gray-500 text-center">
                      Supported formats: PDF, DOCX, TXT
                      <br />
                      Maximum size: 10MB
                    </p>
                  </label>
                </>
              )}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="h-96 overflow-y-auto p-6 space-y-6 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="text-indigo-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How can I help you study today?</h3>
                <p className="text-gray-500">
                  Ask me anything about your studies, upload documents, or use voice transcription.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <MessageContent content={message.content} />
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl p-4 flex items-center gap-3">
                  <Loader2 className="animate-spin text-indigo-600" size={20} />
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything about your studies..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Send size={20} />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add missing Send icon component
const Send = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
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