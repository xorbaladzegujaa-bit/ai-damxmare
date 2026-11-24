import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { GoogleGenAI, Type } from '@google/genai';
import type webpushTypes from 'web-push';

const require = createRequire(import.meta.url);
const webpush = require('web-push') as typeof webpushTypes;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const HAS_GEMINI_KEY =
  GEMINI_API_KEY.length > 0 && GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

const ai = HAS_GEMINI_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Web Push VAPID configuration
let vapidPublicKey = (process.env.VAPID_PUBLIC_KEY || '').trim();
let vapidPrivateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
const vapidSubject =
  (process.env.VAPID_SUBJECT || 'mailto:support@smartlearn.example').trim();
const vapidPersistent = Boolean(vapidPublicKey && vapidPrivateKey);

if (!vapidPersistent) {
  const generated = webpush.generateVAPIDKeys();
  vapidPublicKey = generated.publicKey;
  vapidPrivateKey = generated.privateKey;
}

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err) {
  console.warn('Web Push VAPID configuration skipped:', err);
}

interface PushSubscriptionRecord {
  userId: string;
  subscription: webpushTypes.PushSubscription;
  createdAt: string;
}

const pushSubscriptions = new Map<string, PushSubscriptionRecord>();

// Deterministic arithmetic verifier for AI-generated math questions
function safeEvalArithmetic(expr: string): number | null {
  const cleaned = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  if (!/^[0-9+\-*/().]+$/.test(cleaned)) {
    return null;
  }
  try {
    // Tokenized recursive-descent parser (no eval / Function)
    let pos = 0;
    const parseExpr = (): number => {
      let left = parseTerm();
      while (pos < cleaned.length && (cleaned[pos] === '+' || cleaned[pos] === '-')) {
        const op = cleaned[pos++];
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    };
    const parseTerm = (): number => {
      let left = parseFactor();
      while (pos < cleaned.length && (cleaned[pos] === '*' || cleaned[pos] === '/')) {
        const op = cleaned[pos++];
        const right = parseFactor();
        if (op === '/' && right === 0) throw new Error('Division by zero');
        left = op === '*' ? left * right : left / right;
      }
      return left;
    };
    const parseFactor = (): number => {
      if (cleaned[pos] === '(') {
        pos++;
        const val = parseExpr();
        if (cleaned[pos] !== ')') throw new Error('Mismatched parentheses');
        pos++;
        return val;
      }
      let sign = 1;
      if (cleaned[pos] === '-') {
        sign = -1;
        pos++;
      } else if (cleaned[pos] === '+') {
        pos++;
      }
      const start = pos;
      while (pos < cleaned.length && /[0-9.]/.test(cleaned[pos])) pos++;
      if (start === pos) throw new Error('Unexpected token');
      const num = Number(cleaned.slice(start, pos));
      if (!Number.isFinite(num)) throw new Error('Invalid number');
      return sign * num;
    };
    const result = parseExpr();
    if (pos !== cleaned.length || !Number.isFinite(result)) return null;
    return Math.round(result * 10000) / 10000;
  } catch {
    return null;
  }
}

function validateAndCorrectMathPractice(practice: {
  question?: string;
  expression?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}) {
  if (!practice || !practice.question || !practice.correctAnswer) return null;
  if (practice.expression) {
    const computed = safeEvalArithmetic(practice.expression);
    if (computed !== null) {
      const correctStr = String(computed);
      const opts = Array.isArray(practice.options) ? [...practice.options] : [];
      if (!opts.includes(correctStr)) {
        if (opts.length > 0) {
          opts[0] = correctStr;
        } else {
          opts.push(correctStr, String(computed + 1), String(computed + 2), String(Math.max(0, computed - 1)));
        }
      }
      return {
        ...practice,
        correctAnswer: correctStr,
        options: Array.from(new Set(opts)).slice(0, 4),
      };
    }
  }
  return practice;
}

const CRISIS_PATTERNS = [
  /თვითმკვლელ/i,
  /თავის\s*მოკვლ/i,
  /სიცოცხლე\s*აღარ\s*მინდა/i,
  /დავიზიან/i,
  /suicide/i,
  /kill\s*myself/i,
  /end\s*my\s*life/i,
  /self[- ]?harm/i,
];

function hasCrisisSignal(text: string): boolean {
  return CRISIS_PATTERNS.some((rx) => rx.test(text));
}

async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      aiConfigured: HAS_GEMINI_KEY,
      vapidPublicKey: vapidPublicKey || null,
      vapidPersistent,
    });
  });

  app.post('/api/ai/teacher', async (req: Request, res: Response) => {
    if (!ai) {
      res.status(503).json({
        error: 'AI სერვისი ამჟამად მიუწვდომელია (GEMINI_API_KEY არ არის კონფიგურირებული). შეგიძლიათ გააგრძელოთ ოფლაინ გაკვეთილებით.',
        code: 'AI_UNAVAILABLE',
      });
      return;
    }

    const { message, mode = 'explain', subject = 'general', userContext = {}, history = [] } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'შეიყვანეთ შეკითხვა.' });
      return;
    }

    const sanitizedMessage = message.trim().slice(0, 1500);
    const contextSummary = JSON.stringify({
      level: userContext.level || 'beginner',
      completedLessons: Number(userContext.completedLessons || 0),
      weakTopics: Array.isArray(userContext.weakTopics) ? userContext.weakTopics.slice(0, 6) : [],
      recentMistakes: Array.isArray(userContext.recentMistakes) ? userContext.recentMistakes.slice(0, 4) : [],
    });

    const modeInstructions: Record<string, string> = {
      hint: 'მოსწავლე ითხოვს მინიშნებას. არ დაუწერო საბოლოო პასუხი პირდაპირ! მიეცი მკაფიო მინიშნება და პირველი ნაბიჯი, რათა თავად იპოვოს პასუხი.',
      worked_example: 'აჩვენე ეტაპობრივი ამოხსნილი მაგალითი (ნაბიჯი 1, ნაბიჯი 2...) და შემდეგ შესთავაზე მსგავსი სავარჯიშო კითხვა.',
      practice: 'შექმენი 1 პრაქტიკული სავარჯიშო მოსწავლის დონის მიხედვით და მოკლე ახსნა.',
      explain: 'ახსენი მარტივი, გასაგები ქართულით, სრული დამწყებისთვის გასაგები მაგალითებით. თუ კითხვა დავალების პასუხს ეხება, ჯერ მიეცი მინიშნება და ნაბიჯები, ნუ გაუმჟღავნებ პასუხს პირდაპირ.',
    };

    const systemInstruction = `შენ ხარ SmartLearn AI-ს პირადი მასწავლებელი.
წესები:
1. ყველა ახსნა დაწერე ბუნებრივი, მარტივი და მეგობრული ქართული ენით.
2. ინგლისურის სწავლებისას ახალი მასალა ყოველთვის ახსენი ქართულად.
3. ნუ იყენებ ყალბ ქებას; წაახალისე რეალისტურად და კონსტრუქციულად.
4. დავალებების პირდაპირ პასუხს ნუ გასცემ — ჯერ მიეცი მინიშნება და ეტაპობრივი ახსნა.
5. მოსწავლის კონტექსტი: ${contextSummary}. საგანი: ${String(subject)}.
6. რეჟიმის ინსტრუქცია: ${modeInstructions[String(mode)] || modeInstructions.explain}`;

    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: [
            ...(Array.isArray(history)
              ? history.slice(-6).map((h: { role?: string; text?: string }) => ({
                  role: h.role === 'model' ? 'model' : 'user',
                  parts: [{ text: String(h.text || '').slice(0, 600) }],
                }))
              : []),
            { role: 'user', parts: [{ text: sanitizedMessage }] },
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: { type: Type.STRING, description: 'მთავარი ახსნა ან მინიშნება ქართულად.' },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'ეტაპობრივი ნაბიჯები (თუ საჭიროა).',
                },
                hintOnly: { type: Type.BOOLEAN, description: 'true თუ პასუხი შეგნებულად დაფარულია მინიშნებისთვის.' },
                practiceQuestion: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    expression: { type: Type.STRING, description: 'თუ მათემატიკაა, მხოლოდ არითმეტიკული გამოსახულება მაგ. 7+5' },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                },
              },
              required: ['reply', 'steps', 'hintOnly'],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text || '{}').trim());
      if (parsed.practiceQuestion && subject === 'math') {
        const verified = validateAndCorrectMathPractice(parsed.practiceQuestion);
        if (verified) {
          parsed.practiceQuestion = verified;
        } else {
          delete parsed.practiceQuestion;
        }
      }
      res.json(parsed);
    } catch (err) {
      console.error('AI teacher error:', err);
      res.status(502).json({
        error: 'AI მასწავლებელთან დაკავშირება ვერ მოხერხდა. შეგიძლიათ გააგრძელოთ შენახული გაკვეთილებით.',
        code: 'AI_REQUEST_FAILED',
      });
    }
  });

  app.post('/api/ai/english', async (req: Request, res: Response) => {
    if (!ai) {
      res.status(503).json({
        error: 'AI სერვისი მიუწვდომელია. შეგიძლიათ გამოიყენოთ ოფლაინ ლექსიკონი და დიალოგები.',
        code: 'AI_UNAVAILABLE',
      });
      return;
    }

    const { userSentence = '', scenario = 'greeting', level = 'beginner' } = req.body || {};
    if (typeof userSentence !== 'string' || !userSentence.trim()) {
      res.status(400).json({ error: 'გთხოვთ შეიყვანოთ ინგლისური წინადადება.' });
      return;
    }

    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `სცენარი: ${String(scenario)}. დონე: ${String(level)}. მოსწავლის წინადადება: "${userSentence.trim().slice(0, 400)}"`,
          config: {
            systemInstruction:
              'შენ ხარ ინგლისური ენის ქართულენოვანი მასწავლებელი დამწყებისთვის. შეაფასე მოსწავლის ინგლისური წინადადება, ქართულად აუხსენი გრამატიკა/შეცდომები, მიეცი სწორი ინგლისური ვარიანტი და გააგრძელე დიალოგი მარტივი ინგლისური ფრაზით + ქართული თარგმანით.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isCorrect: { type: Type.BOOLEAN },
                correctedEnglish: { type: Type.STRING },
                georgianFeedback: { type: Type.STRING },
                nextEnglishPrompt: { type: Type.STRING },
                nextPromptGeorgian: { type: Type.STRING },
              },
              required: ['isCorrect', 'correctedEnglish', 'georgianFeedback', 'nextEnglishPrompt', 'nextPromptGeorgian'],
            },
          },
        })
      );

      res.json(JSON.parse((response.text || '{}').trim()));
    } catch (err) {
      console.error('AI english error:', err);
      res.status(502).json({
        error: 'ინგლისურის პრაქტიკის სერვისი დროებით მიუწვდომელია.',
        code: 'AI_REQUEST_FAILED',
      });
    }
  });

  app.post('/api/ai/assignment', async (req: Request, res: Response) => {
    if (!ai) {
      res.status(503).json({ error: 'AI მიუწვდომელია', code: 'AI_UNAVAILABLE' });
      return;
    }

    const { level = 'beginner', weakTopics = [], subjects = ['math', 'english'] } = req.body || {};
    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `შექმენი 2 მოკლე სავარჯიშო კითხვა (დონე: ${String(level)}, საგნები: ${JSON.stringify(subjects)}, სუსტი თემები: ${JSON.stringify(weakTopics)}).`,
          config: {
            systemInstruction:
              'შექმენი 2 მკაფიო დავალება: 1 მათემატიკის (მხოლოდ მარტივი არითმეტიკა ველში expression, მაგ: 8+7) და 1 ინგლისურის (ქართული პირობით). ყველა ახსნა დაწერე ქართულად.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  expression: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['subject', 'prompt', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
        })
      );

      const raw = JSON.parse((response.text || '[]').trim());
      const validated = Array.isArray(raw)
        ? raw
            .map((item) => {
              if (item.subject === 'math' && item.expression) {
                const checked = validateAndCorrectMathPractice({
                  question: item.prompt,
                  expression: item.expression,
                  options: item.options,
                  correctAnswer: item.correctAnswer,
                  explanation: item.explanation,
                });
                if (!checked) return null;
                return { ...item, options: checked.options, correctAnswer: checked.correctAnswer };
              }
              if (!Array.isArray(item.options) || !item.options.includes(item.correctAnswer)) {
                return null;
              }
              return item;
            })
            .filter(Boolean)
        : [];
      res.json({ questions: validated });
    } catch {
      res.status(502).json({ error: 'AI დავალების გენერაცია ვერ მოხერხდა', code: 'AI_REQUEST_FAILED' });
    }
  });

  app.post('/api/ai/wellness', async (req: Request, res: Response) => {
    const { message = '', mood = 'calm', history = [] } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'შეიყვანეთ შეტყობინება.' });
      return;
    }

    const sanitized = message.trim().slice(0, 1200);
    if (hasCrisisSignal(sanitized)) {
      res.json({
        reply:
          'ძალიან ვწუხვარ, რომ ასეთ მძიმე მომენტს გადიხარ. თუ ახლა საფრთხეში ხარ ან საკუთარი თავის დაზიანებაზე ფიქრობ, გთხოვ დაუყოვნებლივ დაუკავშირდი გადაუდებელ დახმარებას (112 საქართველოში) ან სანდო ახლობელს/ოჯახის წევრს. შენ მარტო არ ხარ და პროფესიონალური დახმარება ხელმისაწვდომია.',
        safetyAlert: true,
        suggestedExercise: 'breathing',
      });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: 'AI მხარდამჭერი ამჟამად მიუწვდომელია. შეგიძლიათ გამოიყენოთ სუნთქვის სავარჯიშო და პირადი დღიური ოფლაინ რეჟიმში.',
        code: 'AI_UNAVAILABLE',
      });
      return;
    }

    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: [
            ...(Array.isArray(history)
              ? history.slice(-6).map((h: { role?: string; text?: string }) => ({
                  role: h.role === 'model' ? 'model' : 'user',
                  parts: [{ text: String(h.text || '').slice(0, 500) }],
                }))
              : []),
            { role: 'user', parts: [{ text: `მიმდინარე განწყობა: ${String(mood)}. შეტყობინება: ${sanitized}` }] },
          ],
          config: {
            systemInstruction: `შენ ხარ SmartLearn AI-ს თბილი, პატივისცემით სავსე ფსიქოლოგიური კეთილდღეობის დამხმარე.
უსაფრთხოების მკაცრი წესები:
1. არასოდეს დასვა სამედიცინო ან ფსიქიატრიული დიაგნოზი.
2. არასოდეს თქვა, რომ ცვლი ფსიქოლოგს ან ექიმს.
3. არ გასცე სახიფათო სამედიცინო რჩევა.
4. არ წაახალისო AI-ზე ემოციური დამოკიდებულება — წაახალისე რეალური ჩვევები, დასვენება და ადამიანებთან ურთიერთობა.
5. ისაუბრე თბილი, მშვიდი და არაგანმსჯელი ქართულით (მაქს. 4-5 წინადადება).`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: { type: Type.STRING },
                suggestedExercise: {
                  type: Type.STRING,
                  description: 'ერთ-ერთი: breathing | journal | break | none',
                },
              },
              required: ['reply', 'suggestedExercise'],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({ ...parsed, safetyAlert: false });
    } catch (err) {
      console.error('AI wellness error:', err);
      res.status(502).json({
        error: 'კავშირის შეცდომა. გამოიყენეთ სუნთქვის ტაიმერი ან პირადი დღიური.',
        code: 'AI_REQUEST_FAILED',
      });
    }
  });

  app.post('/api/push/subscribe', (req: Request, res: Response) => {
    const { userId, subscription } = req.body || {};
    if (
      typeof userId !== 'string' ||
      !userId ||
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      res.status(400).json({ error: 'არასწორი Push გამოწერის მონაცემები.' });
      return;
    }
    pushSubscriptions.set(userId, {
      userId,
      subscription,
      createdAt: new Date().toISOString(),
    });
    res.json({ ok: true, persistentVapid: vapidPersistent });
  });

  app.post('/api/push/unsubscribe', (req: Request, res: Response) => {
    const { userId } = req.body || {};
    if (typeof userId === 'string' && userId) {
      pushSubscriptions.delete(userId);
    }
    res.json({ ok: true });
  });

  app.post('/api/push/test', async (req: Request, res: Response) => {
    const { userId, title, body } = req.body || {};
    const record = typeof userId === 'string' ? pushSubscriptions.get(userId) : undefined;
    if (!record) {
      res.status(404).json({ error: 'Push გამოწერა ვერ მოიძებნა.' });
      return;
    }
    try {
      await webpush.sendNotification(
        record.subscription,
        JSON.stringify({
          title: typeof title === 'string' ? title : 'SmartLearn AI — ტესტ შეხსენება',
          body: typeof body === 'string' ? body : 'Web Push შეტყობინება წარმატებით მუშაობს!',
          url: '/',
        })
      );
      res.json({ ok: true });
    } catch (err) {
      console.error('Web Push send error:', err);
      res.status(502).json({ error: 'Push შეტყობინების გაგზავნა ვერ მოხერხდა.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartLearn AI server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
