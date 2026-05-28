import { useState, useEffect, useRef } from 'react';

interface TypeWriterProps {
  text: string;
  speed?: number;
  delay?: number;
  onDone?: () => void;
  className?: string;
  showCursor?: boolean;
}

export default function TypeWriter({ text, speed = 35, delay = 0, onDone, className = '', showCursor = true }: TypeWriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const t = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(t);
    } else if (!done) {
      setDone(true);
      onDoneRef.current?.();
    }
  }, [displayed, started, text, speed, done]);

  return (
    <span className={className}>
      {displayed}
      {showCursor && !done && <span className="typewriter-cursor" />}
    </span>
  );
}
