import React, { useEffect, useMemo, useState } from "react";
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Button({ children, className = "", variant = "default", ...props }) {
  const variants = {
    default: "bg-stone-950 text-white hover:bg-stone-800",
    outline: "border border-stone-300 bg-white text-stone-950 hover:bg-stone-100",
    ghost: "bg-transparent text-stone-700 hover:bg-stone-100",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "", ...props }) {
  return (
    <div className={cn("border bg-white", className)} {...props}>
      {children}
    </div>
  );
}

function CardContent({ children, className = "", ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

const QUESTIONS = [
  "Tell me about yourself.",
  "Why this role?",
  "Why this company?",
  "What's your greatest strength?",
  "What's your greatest weakness?",
  "Tell me about a time you led a team.",
  "Tell me about a time you failed.",
  "Tell me about a difficult coworker.",
  "Why are you leaving your current job?",
  "Where do you see yourself in 5 years?",
  "What are your salary expectations?",
  "Do you have any questions for us?",
];

const STORAGE_KEY = "twelve-question-interview-framework-v1";

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function grade(words) {
  if (words >= 50) return { label: "Green", bar: "w-full", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", note: "Strong length" };
  if (words >= 30) return { label: "Yellow", bar: "w-3/5", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", note: "Good minimum" };
  return { label: "Red", bar: "w-1/4", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", note: "Needs 30+ words" };
}

function createBlankAnswers() {
  return QUESTIONS.map(() => ["", "", ""]);
}

function normalizeAnswers(value) {
  const blank = createBlankAnswers();
  if (!Array.isArray(value)) return blank;

  return blank.map((questionAnswers, questionIndex) => {
    const incomingQuestion = Array.isArray(value[questionIndex]) ? value[questionIndex] : [];
    return questionAnswers.map((_, copyIndex) => {
      const incomingAnswer = incomingQuestion[copyIndex];
      return typeof incomingAnswer === "string" ? incomingAnswer : "";
    });
  });
}

export default function TwelveQFramework() {
  const [answers, setAnswers] = useState(() => createBlankAnswers());
  const [openAnswers, setOpenAnswers] = useState(() => ({ "0-0": true }));
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.answers)) setAnswers(normalizeAnswers(parsed.answers));
        if (parsed.savedAt) setSavedAt(parsed.savedAt);
      }
    } catch (error) {
      console.warn("Could not load saved answers", error);
    }
  }, []);

  useEffect(() => {
    const payload = { answers, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSavedAt(payload.savedAt);
  }, [answers]);

  const stats = useMemo(() => {
    const all = answers.flat();
    const complete = all.filter((answer) => wordCount(answer) >= 30).length;
    const totalWords = all.reduce((sum, answer) => sum + wordCount(answer), 0);
    return { complete, total: all.length, totalWords };
  }, [answers]);

  const updateAnswer = (questionIndex, copyIndex, value) => {
    setAnswers((current) =>
      current.map((questionAnswers, qIndex) =>
        qIndex === questionIndex
          ? questionAnswers.map((answer, aIndex) => (aIndex === copyIndex ? value : answer))
          : questionAnswers
      )
    );
  };

  const toggleAnswer = (questionIndex, copyIndex) => {
    const key = `${questionIndex}-${copyIndex}`;
    setOpenAnswers((current) => ({ ...current, [key]: !current[key] }));
  };

  const resetAll = () => {
    if (window.confirm("Clear all saved answers from this browser?")) {
      setAnswers(createBlankAnswers());
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const exportText = () => {
    const content = QUESTIONS.map((question, qIndex) => {
      const copies = answers[qIndex]
        .map((answer, aIndex) => `Copy ${aIndex + 1} (${wordCount(answer)} words):\n${answer || "[Not answered yet]"}`)
        .join("\n\n");
      return `${qIndex + 1}. ${question}\n\n${copies}`;
    }).join("\n\n---\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "12q-interview-framework-answers.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-card { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; border: 1px solid #ddd; }
          textarea { border: none !important; min-height: auto !important; resize: none !important; overflow: visible !important; }
        }
        .print-only { display: none; }
      `}</style>

      <section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
        <div className="grid gap-8 md:grid-cols-[1.1fr_.9fr] md:items-center">
          <div>
            <div>
              <div className="no-print mb-3 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-800">
                12Q Interview Prep Framework
              </div>
              <p className="mb-5 max-w-xl text-sm leading-6 text-stone-500">
                Based on the work and interview insights shared by{" "}
                <a
                  href="https://www.linkedin.com/in/laszlobock/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-stone-800 underline underline-offset-4"
                >
                  Laszlo Bock
                </a>
                .
              </p>
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Prepare three strong versions of every answer.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Write three different copies for each common interview question. Aim for 30–50+ words per answer. Your work autosaves in this browser and can be printed anytime.
            </p>
            <div className="no-print mt-7 flex flex-wrap gap-3">
              <Button onClick={() => window.print()} className="rounded-2xl px-5 py-6 text-base">
                <span className="mr-2">🖨️</span> Print answers
              </Button>
              <Button variant="outline" onClick={exportText} className="rounded-2xl px-5 py-6 text-base">
                <span className="mr-2">⬇️</span> Export text
              </Button>
              <Button variant="ghost" onClick={resetAll} className="rounded-2xl px-5 py-6 text-base">
                <span className="mr-2">↻</span> Reset
              </Button>
            </div>
          </div>

          <Card className="no-print rounded-3xl border-stone-200 bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-500">Progress</p>
                <span className="text-2xl text-emerald-500">✓</span>
              </div>
              <p className="mt-4 text-5xl font-black">{stats.complete}/{stats.total}</p>
              <p className="mt-2 text-stone-600">answers have at least 30 words</p>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-stone-900" style={{ width: `${(stats.complete / stats.total) * 100}%` }} />
              </div>
              <p className="mt-5 text-sm text-stone-500">Total words: {stats.totalWords}</p>
              {savedAt && <p className="mt-1 text-xs text-stone-400">Autosaved locally: {new Date(savedAt).toLocaleString()}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 space-y-8">
          {QUESTIONS.map((question, qIndex) => (
            <Card key={question} className="print-card rounded-3xl border-stone-200 bg-white shadow-sm">
              <CardContent className="p-5 md:p-7">
                <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-black text-rose-700">Question {String(qIndex + 1).padStart(2, "0")}</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">{question}</h2>
                  </div>
                  <p className="no-print rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">3 copies required</p>
                </div>

                <div className="grid gap-4">
                  {(answers[qIndex] || ["", "", ""]).map((answer, aIndex) => {
                    const words = wordCount(answer);
                    const g = grade(words);
                    const key = `${qIndex}-${aIndex}`;
                    const isOpen = Boolean(openAnswers[key]);
                    return (
                      <div key={aIndex} className={`rounded-2xl border border-stone-200 p-4 ${g.bg}`}>
                        <button
                          type="button"
                          onClick={() => toggleAnswer(qIndex, aIndex)}
                          className="no-print flex w-full items-center justify-between gap-3 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${g.dot}`} />
                            <p className="font-bold">Copy {aIndex + 1}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className={`text-sm font-bold ${g.text}`}>{words} words · {g.note}</p>
                            <span className="text-xl font-black text-stone-500">{isOpen ? "−" : "+"}</span>
                          </div>
                        </button>

                        <div className="print-only mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${g.dot}`} />
                            <p className="font-bold">Copy {aIndex + 1}</p>
                          </div>
                          <p className={`text-sm font-bold ${g.text}`}>{words} words · {g.note}</p>
                        </div>

                        {isOpen && (
                          <div className="mt-3">
                            <textarea
                              value={answer}
                              onChange={(event) => updateAnswer(qIndex, aIndex, event.target.value)}
                              placeholder="Write a distinct version of your answer here. Aim for at least 30–50 words."
                              className="min-h-32 w-full rounded-xl border border-stone-200 bg-white p-4 leading-7 outline-none transition focus:border-stone-900"
                            />
                            <div className="no-print mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                              <div className={`h-full rounded-full ${g.dot} ${g.bar}`} />
                            </div>
                          </div>
                        )}

                        <div className="print-only mt-3 whitespace-pre-wrap rounded-xl bg-white p-4 leading-7">
                          {answer || "[Not answered yet]"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
              <footer className="mt-16 border-t border-stone-200 pt-8 text-center text-sm text-stone-500">
          Built with{" "}
          <a
            href="https://axyen.ai"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-stone-900 underline underline-offset-4"
          >
            Axyen.AI
          </a>
        </footer>
      </section>
    </div>
  );
}
