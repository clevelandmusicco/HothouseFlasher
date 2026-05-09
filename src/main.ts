import './styles.css';
import cleLogo from './assets/cle_.png';
import { initApp } from './app.js';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <div class="site-header__inner">
      <div class="site-header__logo-wrap">
        <img src="${cleLogo}" alt="Cleveland Music Co." class="site-header__logo" />
      </div>
      <div class="site-header__sep"></div>
      <div>
        <div class="site-header__name">Hothouse Flasher</div>
        <div class="site-header__tagline">Flash DSP examples to your Hothouse pedal</div>
      </div>
    </div>
  </header>
  <main class="main-content" id="main-content"></main>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <a href="https://clevelandmusicco.com" target="_blank" rel="noopener noreferrer" class="site-footer__link">clevelandmusicco.com →</a>
      <a href="https://github.com/clevelandmusicco/HothouseExamples" target="_blank" rel="noopener noreferrer" class="site-footer__link">HothouseExamples on GitHub →</a>
    </div>
  </footer>
`;

const mainContent = document.getElementById('main-content')!;
initApp(mainContent);
