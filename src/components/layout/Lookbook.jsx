const lookbookImages = [
  {
    src: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=700&q=80&auto=format&fit=crop',
    alt: 'Lookbook 1',
  },
  {
    src: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=700&q=80&auto=format&fit=crop',
    alt: 'Lookbook 2',
  },
  {
    src: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=700&q=80&auto=format&fit=crop',
    alt: 'Lookbook 3',
  },
  {
    src: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&q=80&auto=format&fit=crop',
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
