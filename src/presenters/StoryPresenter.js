import StoryModel from '../models/StoryModel.js';
import StoryView from '../views/StoryView.js';
import { setupNotificationButtons } from './NotificationManager.js';

class StoryPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
    
    this.view.bindRegister(this.handleRegister.bind(this));
    this.view.bindLogin(this.handleLogin.bind(this));
    this.view.bindAddStory(this.handleAddStory.bind(this));
    this.view.bindLoadStories(this.handleLoadStories.bind(this));
    this.view.bindTakePhoto();
    this.view.bindHashChange(this.handleRoute.bind(this));
    this.view.bindFetchStoryDetail(this.handleFetchStoryDetail.bind(this));
    this.view.bindDeleteOfflineStory(this.handleDeleteOfflineStory.bind(this));
    this.view.bindLogout(this.handleLogout.bind(this));
    this.view.initMap();
    this.setupOfflineHandling();
  }

  setupOfflineHandling() {
    // Handler untuk perubahan status koneksi
    window.addEventListener('online', () => {
      this.view.showFeedback('Koneksi internet kembali pulih', 'success');
      // Coba sync data ketika kembali online
      this.handleLoadStories();
    });

    window.addEventListener('offline', () => {
      this.view.showFeedback('Anda sedang offline. Menampilkan data terakhir yang tersimpan.', 'warning');
      this.loadOfflineStories();
    });
  }

  async handleRegister(name, email, password) {
    if (name.trim() === '' || email.trim() === '' || password.length < 8) {
      this.view.showFeedback('Pastikan semua field diisi dengan benar dan password minimal 8 karakter.', 'error');
      return;
    }

    try {
      this.view.showLoading(true);
      const result = await this.model.register(name, email, password);
      this.view.showFeedback(result.message, !result.error ? 'success' : 'error');
    } catch (error) {
      this.view.showFeedback(this.getErrorMessage(error, 'registrasi'), 'error');
    } finally {
      this.view.showLoading(false);
    }
  }

  async handleLogin(email, password) {
    if (email.trim() === '' || password.trim() === '') {
      this.view.showFeedback('Email dan password tidak boleh kosong.', 'error');
      return;
    }

    try {
      this.view.showLoading(true);
      const result = await this.model.login(email, password);
      
      if (!result.error) {
        this.view.showFeedback(`Login berhasil! Selamat datang, ${result.loginResult.name}`, 'success');
        setupNotificationButtons(result.loginResult.token);
        window.location.hash = '#stories';
      } else {
        this.view.showFeedback('Login gagal: ' + result.message, 'error');
      }
    } catch (error) {
      this.view.showFeedback(this.getErrorMessage(error, 'login'), 'error');
    } finally {
      this.view.showLoading(false);
    }
  }

  async handleAddStory(description, photo, lat, lon) {
    if (!lat || !lon) {
      this.view.showFeedback('Silakan pilih lokasi di peta.', 'error');
      return;
    }

    try {
      this.view.showLoading(true);
      const result = await this.model.addStory(description, photo, lat, lon);
      
      if (result.error) {
        this.view.showFeedback(result.message, 'error');
      } else {
        this.view.showFeedback(result.message, 'success');
        this.view.resetAddStoryForm();
        this.handleLoadStories(1, 10, 0);
      }
    } catch (error) {
      this.view.showFeedback(this.getErrorMessage(error, 'menambahkan cerita'), 'error');
    } finally {
      this.view.showLoading(false);
    }
  }

  async handleLoadStories(page = 1, size = 10, location = 0) {
    try {
      this.view.showLoading(true);
      const result = await this.model.getStories(page, size, location);
      
      if (!result.error) {
        this.view.displayStories(this.model.stories);
        
        // Tampilkan pesan khusus jika data dari cache
        if (result.fromCache) {
          this.view.showFeedback(result.message, 'warning');
        }
      } else {
        this.view.showFeedback('Gagal memuat cerita: ' + result.message, 'error');
      }
    } catch (error) {
      this.view.showFeedback(this.getErrorMessage(error, 'memuat cerita'), 'error');
      this.view.displayStories([]); // Kosongkan tampilan jika error
    } finally {
      this.view.showLoading(false);
    }
  }

  async handleRoute() {
    const hash = window.location.hash;
    try {
      const transition = document.startViewTransition(async () => {
        if (hash === '#stories' || hash === '#storySection') {
          await this.view.fadeOut(this.view.authSection);
          this.view.authSection.style.display = 'none';
          this.view.storySection.style.display = 'block';
          await this.view.fadeIn(this.view.storySection);
          await this.handleLoadStories();
        } else if (hash === '#logout') {
          this.logout(); // logout user
          window.location.hash = '#login';
        } else {
          await this.view.fadeOut(this.view.storySection);
          this.view.storySection.style.display = 'none';
          this.view.authSection.style.display = 'block';
          await this.view.fadeIn(this.view.authSection);
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  async handleFetchStoryDetail(storyId) {
    try {
      this.view.showLoading(true);
      const result = await this.model.getStoryDetail(storyId);
      
      if (!result.error) {
        this.view.showStoryDetail(result.story);
        // Tampilkan pesan jika data dari cache
        if (result.fromCache) {
          this.view.showFeedback(result.message, 'warning');
        }
      } else {
        this.view.showFeedback('Gagal memuat detail cerita: ' + result.message, 'error');
      }
    } catch (error) {
      this.view.showFeedback(this.getErrorMessage(error, 'memuat detail cerita'), 'error');
    } finally {
      this.view.showLoading(false);
    }
  }

  async loadOfflineStories() {
    try {
      const offlineStories = await this.model.getOfflineStories();
      this.view.displayStories(offlineStories);
      this.view.showFeedback('Menampilkan cerita dari cache offline.', 'info');
    } catch (error) {
      this.view.showFeedback('Gagal memuat cerita offline: ' + error.message, 'error');
    }
  }

  async handleDeleteOfflineStory(cacheKey, storyId) {
    try {
      const result = await this.model.deleteOneStoryFromCache(cacheKey, storyId);
      if (result.success) {
        this.view.showFeedback(result.message, 'success');
        this.view.removeStoryFromDisplay(storyId);
        const updatedStories = await this.model.getOfflineStories();
        this.view.displayStories(updatedStories);
      } else {
        this.view.showFeedback(result.message, 'error');
      }
    } catch (error) {
      this.view.showErrorMessage(`Gagal menghapus cerita offline: ${error.message}`);
    }
  }

  getErrorMessage(error, action) {
    if (error.message.includes('offline')) {
      return `Tidak dapat ${action} saat offline. Silakan coba lagi ketika terhubung ke internet.`;
    }
    return `Terjadi kesalahan saat ${action}: ${error.message}`;
  }

  logout() {
    localStorage.removeItem('token');
    this.view.showFeedback('Berhasil logout.', 'success');
    this.view.showAuthSection();
  }

  handleLogout() {
    this.logout();
    window.location.hash = '#login'; // atau hash kosong: ''
  }
}

export default StoryPresenter;