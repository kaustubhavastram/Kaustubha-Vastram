import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SIZE_DATA = {
  saree: {
    label: "Saree",
    icon: "👘",
    intro:
      "Our sarees come in a standard length and width. The blouse piece included is unstitched — please refer to the measurements below for tailoring.",
    headers: ["Component", "Length", "Width"],
    rows: [
      ["Saree (Standard)", "5.5 meters", "1.15 meters"],
      ["Saree (with Border)", "5.5 meters", "1.2 meters"],
      ["Blouse Piece (Unstitched)", "0.8 meters", "1.0 meter"],
    ],
    note: "All sarees include an unstitched blouse piece. Please consult your tailor for custom blouse fitting.",
  },
  kurtha: {
    label: "Kurtha",
    icon: "👗",
    intro:
      "Find your perfect kurtha fit below. Measure yourself with a soft tape over light clothing for the most accurate results.",
    headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Length (in)", "Shoulder (in)"],
    rows: [
      ["XS", "32", "26", "34", "36", "13.5"],
      ["S", "34", "28", "36", "37", "14"],
      ["M", "36", "30", "38", "38", "14.5"],
      ["L", "38", "32", "40", "39", "15"],
      ["XL", "40", "34", "42", "40", "15.5"],
      ["XXL", "42", "36", "44", "41", "16"],
      ["3XL", "44", "38", "46", "42", "16.5"],
    ],
    note: "Kurtha measurements are approximate and may vary slightly by design. Dupatta, if included, is of standard size (2.25m × 1m).",
  },
  lehenga: {
    label: "Lehenga",
    icon: "💃",
    intro:
      "Our lehengas are designed with a semi-stitched or ready-to-wear approach. Refer to the chart below for the lehenga skirt, blouse, and dupatta measurements.",
    headers: ["Size", "Skirt Waist (in)", "Skirt Length (in)", "Blouse Bust (in)", "Blouse Length (in)"],
    rows: [
      ["S", "28", "40", "34", "14"],
      ["M", "30", "40", "36", "14.5"],
      ["L", "32", "41", "38", "15"],
      ["XL", "34", "41", "40", "15.5"],
      ["XXL", "36", "42", "42", "16"],
      ["3XL", "38", "42", "44", "16.5"],
    ],
    note: "Lehenga skirt has a drawstring/elastic waist with 2″ adjustment range. Dupatta included is 2.5m × 1m.",
  },
};

const CATEGORIES = Object.keys(SIZE_DATA);

export default function SizeGuide() {
  const [active, setActive] = useState("saree");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const data = SIZE_DATA[active];

  return (
    <main className="info-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="info-page__breadcrumb">
          <Link to="/">Home</Link>
          <span className="info-page__breadcrumb-sep">›</span>
          <span>Size Guide</span>
        </nav>

        <header className="info-page__header">
          <p className="section__eyebrow">Fit Reference</p>
          <h1 className="info-page__title">Size Guide</h1>
          <p className="info-page__subtitle">
            Find your perfect fit — measure once, love it forever.
          </p>
        </header>

        {/* Category Tabs */}
        <div className="size-guide__tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`size-guide__tab${active === cat ? " size-guide__tab--active" : ""}`}
              onClick={() => setActive(cat)}
            >
              <span className="size-guide__tab-icon">
                {SIZE_DATA[cat].icon}
              </span>
              {SIZE_DATA[cat].label}
            </button>
          ))}
        </div>

        {/* Active Size Chart */}
        <section className="info-page__section size-guide__content" key={active}>
          <p className="size-guide__intro">{data.intro}</p>

          <div className="size-guide__table-wrap">
            <table className="size-guide__table">
              <thead>
                <tr>
                  {data.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} data-label={data.headers[j]}>
                        {j === 0 ? <strong>{cell}</strong> : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.note && (
            <p className="size-guide__note">
              <span className="size-guide__note-icon">ℹ️</span>
              {data.note}
            </p>
          )}
        </section>

        {/* How to Measure */}
        <section className="info-page__section">
          <div className="info-page__icon-header">
            <span className="info-page__icon">📏</span>
            <h2>How to Measure</h2>
          </div>
          <div className="info-page__card">
            <div className="info-page__grid-two">
              <div>
                <h3>Tips for Accurate Measurements</h3>
                <ul className="info-page__list">
                  <li>Use a soft measuring tape (not a metal one)</li>
                  <li>Measure over light, non-padded clothing</li>
                  <li>Keep the tape snug but not tight</li>
                  <li>Stand naturally and don't hold your breath</li>
                </ul>
              </div>
              <div>
                <h3>Key Measurements</h3>
                <ul className="info-page__list">
                  <li>
                    <strong>Bust:</strong> Around the fullest part of your chest
                  </li>
                  <li>
                    <strong>Waist:</strong> Around your natural waistline
                  </li>
                  <li>
                    <strong>Hip:</strong> Around the widest part of your hips
                  </li>
                  <li>
                    <strong>Length:</strong> From shoulder seam to desired hem
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="info-page__cta">
          <p>Not sure about your size? We're happy to help.</p>
          <Link to="/contact" className="btn btn--dark">
            Contact Us
          </Link>
        </section>
      </div>
    </main>
  );
}
