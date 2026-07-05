import image5 from '../../logo/image5.jpeg';

export default function Story() {
  return (
    <section className="section story" id="story">
      <div className="container story__inner">
        <div className="story__image reveal">
          <img
            src={image5}
            alt="Atelier detail"
            onError={(e) => e.target.parentElement.classList.add('img-fallback')}
          />
        </div>
        <div className="story__text reveal">
          <p className="section__eyebrow">Our Story</p>
          <h2 className="section__title">
            Slow fashion,<br />
            <em>made with intention</em>
          </h2>
          <p>
            Every Kaustubha Vastram dress begins as a sketch in our sunlit
            atelier. We work in small batches with family-run mills, choosing
            linen, silk, and organic cotton that soften beautifully with every
            wear.
          </p>
          <p>
            No seasons rushed. No corners cut. Just dresses designed to live in
            your wardrobe — and your memories — for years.
          </p>
          <a href="#collection" className="btn btn--outline">
            Shop Consciously
          </a>
        </div>
      </div>
    </section>
  );
}
