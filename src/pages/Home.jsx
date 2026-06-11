import { useEffect } from 'react';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import Hero from '../components/layout/Hero';
import Marquee from '../components/layout/Marquee';
import ProductGrid from '../components/product/ProductGrid';
import Story from '../components/layout/Story';
import Lookbook from '../components/layout/Lookbook';
import Newsletter from '../components/layout/Newsletter';

export default function Home() {
  // Scroll reveal observer
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <AnnouncementBar />
      <Hero />
      <Marquee />
      <ProductGrid />
      <Story />
      <Lookbook />
      <Newsletter />
    </>
  );
}
