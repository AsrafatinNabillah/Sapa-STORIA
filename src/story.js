import StoryModel from './models/StoryModel.js';
import StoryView from './views/StoryView.js';
import StoryPresenter from './presenters/StoryPresenter.js';

document.addEventListener('DOMContentLoaded', () => {
  const model = new StoryModel();
  const view = new StoryView();
  const presenter = new StoryPresenter(view, model);
  view.setPresenter(presenter);
  view.showSection('auth');
  window.view = view;
  const params = new URLSearchParams(window.location.search);
  if (params.get('goto') === 'stories') {
    view.showSection('stories');
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Sapa-STORIA/sw.js')
      .then((registration) => {
        console.log('Service Worker berhasil didaftarkan:', registration);
      })
      .catch((error) => {
        console.error('Service Worker gagal didaftarkan:', error);
      });
  }
});