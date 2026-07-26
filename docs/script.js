(() => {
  const revealScreenshots = () => {
    const figures = document.querySelectorAll(".shot-row figure");
    if (!("IntersectionObserver" in window)) {
      figures.forEach((figure) => figure.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );
    figures.forEach((figure) => observer.observe(figure));
  };

  revealScreenshots();
})();
