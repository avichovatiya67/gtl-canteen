import { useState, useEffect } from 'react';

function useTimer(duration) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const storedStartTime = localStorage.getItem('startTime');
    const currentTime = new Date().getTime();

    if (storedStartTime) {
      const elapsed = Math.floor((currentTime - storedStartTime) / 1000);
      setTimeLeft(Math.max(duration - elapsed, 0));
    } else {
      localStorage.setItem('startTime', currentTime);
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        const newTimeLeft = Math.max(prevTimeLeft - 1, 0);
        if (newTimeLeft === 0) {
          clearInterval(intervalId);
          localStorage.removeItem('startTime');
        }
        return newTimeLeft;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [duration]);

  return timeLeft;
}

export default useTimer;
