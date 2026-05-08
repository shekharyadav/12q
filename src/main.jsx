import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import "./styles.css";

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
  if (words >= 50) return { label: "Green", bar: "100%", dot: "green", note: "Strong length" };
  if (words >= 30) return { label: "Yellow", bar: "60%", dot: "yellow", note: "Good minimum" };
  return { label: "Red", bar: "25%", dot: "red", note: "Needs 30+ words" };
}

function createBlankAnswers() {
  return QUESTIONS.map(() => ["", "", ""]);
}

function TwelveQFramework() {
  const [answers, setAnswers] = useState(() => createBlankAnswers());
  const [openAnswers, setOpenAnswers] = useState(() => ({ "0-0": true }));
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.answers)) setAnswers(parsed.answers);
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
    <div className="app">
      <section className="container">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="hero">
          <div>
            <div className="pill no-print">12Q Interview Prep Framework</div>
            <h1>Prepare three strong versions of every answer.</h1>
            <p className="subtitle">Write three different copies for each common interview question. Aim for 30–50+ words per answer. Your work autosaves in this browser and can be printed anytime.</p>
            <p className="subttitle">Based on the post from Laszlo - https://www.linkedin.com/in/laszlobock/</p>
            <div className="actions no-print">
              <button onClick={() => window.print()}><span>🖨️</span> Print answers</button>
              <button onClick={exportText} className="secondary"><span>⬇️</span> Export text</button>
              <button onClick={resetAll} className="ghost"><span>↻</span> Reset</button>
            </div>
          </div>

          <div className="progress-card no-print">
            <div className="progress-title"><span>Progress</span><span className="check">✓</span></div>
            <div className="progress-count">{stats.complete}/{stats.total}</div>
            <p>answers have at least 30 words</p>
            <div className="progress-track"><div style={{ width: `${(stats.complete / stats.total) * 100}%` }} /></div>
            <p className="small">Total words: {stats.totalWords}</p>
            {savedAt && <p className="tiny">Autosaved locally: {new Date(savedAt).toLocaleString()}</p>}
          </div>
        </motion.div>

        <div className="questions">
          {QUESTIONS.map((question, qIndex) => (
            <article key={question} className="question-card print-card">
              <div className="question-header">
                <div>
                  <p className="question-number">Question {String(qIndex + 1).padStart(2, "0")}</p>
                  <h2>{question}</h2>
                </div>
                <p className="required no-print">3 copies required</p>
              </div>

              <div className="answer-grid">
                {answers[qIndex].map((answer, aIndex) => {
                  const words = wordCount(answer);
                  const g = grade(words);
                  const key = `${qIndex}-${aIndex}`;
                  const isOpen = Boolean(openAnswers[key]);
                  return (
                    <div key={aIndex} className={`answer-card ${g.dot}`}>
                      <button type="button" onClick={() => toggleAnswer(qIndex, aIndex)} className="answer-toggle no-print">
                        <div className="answer-left"><span className="status-dot" /><strong>Copy {aIndex + 1}</strong></div>
                        <div className="answer-right"><span>{words} words · {g.note}</span><b>{isOpen ? "−" : "+"}</b></div>
                      </button>

                      <div className="print-only answer-print-heading">
                        <div className="answer-left"><span className="status-dot" /><strong>Copy {aIndex + 1}</strong></div>
                        <span>{words} words · {g.note}</span>
                      </div>

                      {isOpen && (
                        <div className="answer-body">
                          <textarea
                            value={answer}
                            onChange={(event) => updateAnswer(qIndex, aIndex, event.target.value)}
                            placeholder="Write a distinct version of your answer here. Aim for at least 30–50 words."
                          />
                          <div className="mini-track no-print"><div style={{ width: g.bar }} /></div>
                        </div>
                      )}

                      <div className="print-only printed-answer">{answer || "[Not answered yet]"}</div>
                    </div>
                  );
                })}
              </div>
            </article>
                  <p className="subttitle">Built with <a href="https://axyen.ai">Axyen.AI</a>/</p>

          ))}
        </div>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<TwelveQFramework />);
