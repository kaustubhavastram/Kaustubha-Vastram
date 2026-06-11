export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner container">
        <div className="hero__text reveal">
          <p className="hero__eyebrow">Spring / Summer '26</p>
          <h1 className="hero__title">
            Dresses for the<br />
            <em>quiet romantics</em>
          </h1>
          <p className="hero__sub">
            Thoughtfully crafted silhouettes in natural fabrics — made to be
            loved, worn, and kept forever.
          </p>
          <a href="#collection" className="btn btn--dark">
            Explore the Collection
          </a>
        </div>
        <div className="hero__image">
          <img
            src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=80&auto=format&fit=crop"
            alt="Woman in an elegant flowing dress"
            onError={(e) => e.target.parentElement.classList.add('img-fallback')}
          />
          <div className="hero__badge">
            New<br />In
          </div>
        </div>
      </div>
    </section>
  );
}
