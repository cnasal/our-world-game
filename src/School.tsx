import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { lessons, school } from "./content/school";

export function School({
  initialLessonId,
}: {
  initialLessonId: string | null;
}) {
  const [lessonId, setLessonId] = useState<string | null>(initialLessonId);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const lesson = lessons.find((entry) => entry.id === lessonId);
  const reset = () => {
    setLessonId(null);
    setQuestionIndex(0);
    setChoice(null);
  };
  if (!lesson)
    return (
      <>
        <p className="modal-intro">{school.welcome}</p>
        {lessons.map((entry) => (
          <div className="shop-item" key={entry.id}>
            <span
              className="drink-art"
              style={{ background: entry.color }}
              aria-hidden="true"
            >
              {entry.emoji}
            </span>
            <div>
              <h3>{entry.name}</h3>
              <p>{entry.description}</p>
            </div>
            <button
              className="secondary"
              aria-label={`Try ${entry.name}`}
              onClick={() => {
                setLessonId(entry.id);
                setQuestionIndex(0);
                setChoice(null);
              }}
            >
              Try
            </button>
          </div>
        ))}
      </>
    );
  const question = lesson.questions[questionIndex];
  if (!question)
    return (
      <div className="school-lesson">
        <h3>You finished {lesson.name}!</h3>
        <p className="story-page">
          Thanks for exploring with us. What will you discover next?
        </p>
        <button className="primary" onClick={reset}>
          Choose another lesson
        </button>
      </div>
    );
  const correct = choice === question.answer;
  return (
    <div className="school-lesson">
      <button className="text-button" onClick={reset}>
        <ArrowLeft size={16} /> Back to lessons
      </button>
      <h3>
        {lesson.emoji} {lesson.name}
      </h3>
      <p className="small muted">
        Question {questionIndex + 1} of {lesson.questions.length}
      </p>
      <fieldset className="school-question">
        <legend>{question.prompt}</legend>
        <div className="school-answers">
          {question.choices.map((answer) => (
            <button
              className="secondary"
              key={answer}
              aria-pressed={choice === answer}
              disabled={correct}
              onClick={() => setChoice(answer)}
            >
              {answer}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="school-feedback" role="status">
        {choice !== null
          ? correct
            ? `That's right! ${question.explanation}`
            : `Have another go! ${question.hint}`
          : "Choose an answer. It’s okay to try more than once."}
      </p>
      {correct && (
        <button
          className="primary"
          onClick={() => {
            setQuestionIndex(questionIndex + 1);
            setChoice(null);
          }}
        >
          {questionIndex === lesson.questions.length - 1
            ? "Finish lesson"
            : "Next question"}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
