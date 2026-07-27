import React, { useState, useEffect } from 'react';

interface RatingWidgetProps {
  productId: string;
  initialRating?: number;
  initialCount?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  lang?: 'es' | 'en';
}

const STORAGE_USER_RATINGS = 'sumak_user_ratings_v1';
const STORAGE_SUMMARY_RATINGS = 'sumak_summary_ratings_v1';

export default function RatingWidget({
  productId,
  initialRating = 5.0,
  initialCount = 18,
  readOnly = false,
  size = 'md',
  lang = 'es',
}: RatingWidgetProps) {
  const [userScore, setUserScore] = useState<number | null>(null);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(initialRating);
  const [count, setCount] = useState<number>(initialCount);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const syncRatings = () => {
      try {
        const userRatingsRaw = localStorage.getItem(STORAGE_USER_RATINGS);
        if (userRatingsRaw) {
          const userRatings = JSON.parse(userRatingsRaw);
          if (userRatings && userRatings[productId] !== undefined) {
            setUserScore(userRatings[productId]);
          }
        }

        const summaryRaw = localStorage.getItem(STORAGE_SUMMARY_RATINGS);
        if (summaryRaw) {
          const summary = JSON.parse(summaryRaw);
          if (summary && summary[productId]) {
            setRating(summary[productId].avg);
            setCount(summary[productId].count);
          }
        }
      } catch (e) {
        console.warn('Storage sync error:', e);
      }
    };

    syncRatings();

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && customEvt.detail.productId === productId) {
        if (customEvt.detail.userScore !== undefined) setUserScore(customEvt.detail.userScore);
        if (customEvt.detail.avg !== undefined) setRating(customEvt.detail.avg);
        if (customEvt.detail.count !== undefined) setCount(customEvt.detail.count);
      } else {
        syncRatings();
      }
    };

    window.addEventListener('sumak-ratings-updated', handleCustomEvent);
    return () => window.removeEventListener('sumak-ratings-updated', handleCustomEvent);
  }, [productId]);

  const handleRate = (score: number) => {
    if (readOnly) return;

    try {
      const userRatingsRaw = localStorage.getItem(STORAGE_USER_RATINGS);
      const parsedUserRatings = userRatingsRaw ? JSON.parse(userRatingsRaw) : {};
      const userRatings = (parsedUserRatings && typeof parsedUserRatings === 'object') ? parsedUserRatings : {};
      const oldUserScore = userRatings[productId] ?? null;

      const summaryRaw = localStorage.getItem(STORAGE_SUMMARY_RATINGS);
      const parsedSummary = summaryRaw ? JSON.parse(summaryRaw) : {};
      const summary = (parsedSummary && typeof parsedSummary === 'object') ? parsedSummary : {};

      let currentSum = summary[productId]?.sum || (initialRating * initialCount);
      let currentCount = summary[productId]?.count || initialCount;

      if (oldUserScore !== null) {
        // Modifying existing rating
        currentSum = currentSum - oldUserScore + score;
      } else {
        // First time rating
        currentSum = currentSum + score;
        currentCount = currentCount + 1;
      }

      const newAvg = Number((currentSum / currentCount).toFixed(1));

      userRatings[productId] = score;
      localStorage.setItem(STORAGE_USER_RATINGS, JSON.stringify(userRatings));

      summary[productId] = {
        sum: currentSum,
        count: currentCount,
        avg: newAvg,
      };
      localStorage.setItem(STORAGE_SUMMARY_RATINGS, JSON.stringify(summary));

      setUserScore(score);
      setRating(newAvg);
      setCount(currentCount);
      setSubmitted(true);

      // Notify all RatingWidget instances and list sorters
      window.dispatchEvent(
        new CustomEvent('sumak-ratings-updated', {
          detail: { productId, userScore: score, avg: newAvg, count: currentCount },
        })
      );
    } catch (e) {
      console.warn('Failed to save rating:', e);
    }
  };

  const starSizes = {
    sm: 'text-sm gap-0.5',
    md: 'text-base gap-1',
    lg: 'text-xl gap-1.5',
  };

  return (
    <div className="inline-flex flex-col gap-0.5">
      <div className={`flex items-center ${starSizes[size]}`}>
        <div className="flex items-center" onMouseLeave={() => setHoverScore(null)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= (hoverScore || userScore || Math.round(rating));

            return (
              <button
                key={star}
                type="button"
                disabled={readOnly}
                onMouseEnter={() => !readOnly && setHoverScore(star)}
                onClick={() => handleRate(star)}
                className={`transition-all duration-150 focus:outline-none ${
                  readOnly ? 'cursor-default' : 'hover:scale-125 cursor-pointer'
                } ${isFilled ? 'text-amber-400' : 'text-charcoal-800/20'}`}
                title={
                  userScore !== null
                    ? lang === 'es'
                      ? `Modificar tu calificación a ${star} estrellas (actual: ${userScore} ★)`
                      : `Change your rating to ${star} stars (current: ${userScore} ★)`
                    : lang === 'es'
                    ? `Calificar con ${star} estrellas`
                    : `Rate ${star} stars`
                }
              >
                ★
              </button>
            );
          })}
        </div>
        <span className="font-bold text-charcoal-950 ml-1.5 text-xs sm:text-sm">
          {rating.toFixed(1)}
        </span>
        <span className="text-xs text-charcoal-800/60 ml-1">
          ({count})
        </span>
      </div>

      {userScore !== null && (
        <span className="text-[0.68rem] font-bold text-emerald-700 animate-fade-in">
          {submitted
            ? (lang === 'es' ? `✓ Tu calificación: ${userScore} ★ (haz clic en cualquier estrella para cambiarla)` : `✓ Your rating: ${userScore} ★ (click any star to edit)`)
            : (lang === 'es' ? `✓ Tu calificación: ${userScore} ★` : `✓ Your rating: ${userScore} ★`)}
        </span>
      )}
    </div>
  );
}
