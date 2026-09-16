import {
  StarEmptyIcon,
  StarFilledIcon,
  StarHalfIcon,
} from "@/components/ui/icons";

interface ReviewStarsProps {
  rating: number | null;
  size?: "s" | "m";
}

export function ReviewStars({ rating, size = "s" }: ReviewStarsProps) {
  return (
    <span
      className="inline-flex items-center"
      role="img"
      aria-label={rating === null ? "평점 없음" : `5점 만점에 ${rating}점`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const Star =
          rating !== null && rating >= index + 1
            ? StarFilledIcon
            : rating !== null && rating >= index + 0.5
              ? StarHalfIcon
              : StarEmptyIcon;
        return (
          <Star key={index} className={size === "m" ? "size-6" : "size-4"} />
        );
      })}
    </span>
  );
}
