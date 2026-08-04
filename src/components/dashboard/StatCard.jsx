/* One tile in the two-row stat grid.

   `accent` is the colour behind the icon and comes from the card's own data —
   the row is a deliberate sequence of hues, not a single themed colour.
   `muted` dims the label for the second row, which is context rather than
   today's work. */
export function StatCard({ icon, accent, value, title, muted }) {
  return (
    <button className="stat-card" type="button">
      <span className="stat-card__icon" style={{ backgroundColor: accent }}>
        <img src={icon} alt="" width="18.749" height="18.749" />
      </span>
      <span className="stat-card__value">{value}</span>
      <span className={muted ? 'stat-card__label stat-card__label--muted' : 'stat-card__label'}>
        {title}
      </span>
    </button>
  );
}

export default StatCard;
