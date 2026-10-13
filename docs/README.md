# Project website

Static site for the monograph *On the Impact of Graph Neural Networks in Recommender Systems: A Topological Perspective*.
No build step: plain HTML/CSS/JS, served by GitHub Pages from this `docs/` folder.

- `index.html` – the page. The BibTeX lives in the `<pre id="bibtex">` block (marked with a `CITATION` comment).
- `assets/css/style.css`, `assets/js/main.js` – styles and interactions (KaTeX, animated graph, tabs, lightbox, copy button).
- `assets/img/` – figures exported from the LaTeX sources at 200 dpi.
- `assets/pdf/` – per-chapter PDFs, split from the compiled camera-ready (pdflatex + biber, then `gs -dFirstPage/-dLastPage`).

Local preview: `python3 -m http.server -d docs 8000` and open http://localhost:8000.
