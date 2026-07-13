interface StitchDividerProps {
  variant?: 'light' | 'dark';
}

/**
 * A hand-basting stitch line, used as the signature transition between
 * major sections instead of a plain hairline rule.
 */
function StitchDivider({ variant = 'light' }: StitchDividerProps) {
  const stroke = variant === 'dark' ? '#b8923f' : '#2c1832';
  const bg = variant === 'dark' ? 'stitch-divider--dark' : 'stitch-divider--light';

  return (
    <div className={`stitch-divider ${bg}`}>
      <svg width="100%" height="26" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <line
          x1="0"
          y1="13"
          x2="100%"
          y2="13"
          stroke={stroke}
          strokeWidth="1.5"
          strokeDasharray="10 8"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}

export default StitchDivider;
