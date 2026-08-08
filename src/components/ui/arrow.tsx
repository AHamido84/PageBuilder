/** A trailing "forward" arrow that flips for RTL via a CSS mirror, not a swapped character. */
export function Arrow() {
  return (
    <span aria-hidden="true" className="flip-rtl inline-block">
      →
    </span>
  );
}

/** A leading "back" arrow — the mirror image of Arrow, for links that go to the previous view. */
export function BackArrow() {
  return (
    <span aria-hidden="true" className="flip-rtl inline-block">
      ←
    </span>
  );
}
