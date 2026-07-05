import image1 from '../../logo/image1.jpeg';
import image2 from '../../logo/image2.jpeg';
import image3 from '../../logo/image3.jpeg';
import image4 from '../../logo/image4.jpeg';

const lookbookImages = [
  {
    src: image1,
    alt: 'Lookbook 1',
  },
  {
    src: image2,
    alt: 'Lookbook 2',
  },
  {
    src: image3,
    alt: 'Lookbook 3',
  },
  {
    src: image4,
    alt: 'Lookbook 4',
  },
];

export default function Lookbook() {
  return (
    <section className="lookbook" id="lookbook">
      {lookbookImages.map((img, i) => (
        <div className="lookbook__item" key={i}>
          <img
            src={img.src}
            alt={img.alt}
            onError={(e) => e.target.parentElement.classList.add('img-fallback')}
          />
        </div>
      ))}
    </section>
  );
}
