import logo from "../../logo/logo3.png";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner container">
        <div className="hero__text reveal">
          <p className="hero__eyebrow">Spring / Summer '26</p>
          <h1 className="hero__title">
            Tradition and Love
            <br />
            <em>Every pleats holds a story within</em>
          </h1>
          <p className="hero__sub">
            Made for Celebrations, Crafted for Compliments.
          </p>
          <a href="#collection" className="btn btn--dark">
            Explore the Collection
          </a>
        </div>
        <div className="hero__image">
          <img
            src={logo}
            alt="Kaustubha-Vastram-Logo"
            onError={(e) =>
              e.target.parentElement.classList.add("img-fallback")
            }
          />
        </div>
      </div>
    </section>
  );
}
