import { saveData, getAllData, getDataById, deleteData } from './db.js';

class StoryModel {
  constructor() {
    this.token = localStorage.getItem('authToken') || '';
    this.stories = [];
    this.isOnline = navigator.onLine;
    
    // Event listener untuk perubahan status koneksi
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Anda kembali online');
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Anda sedang offline');
    });
  }

  // Helper function untuk handle fetch dengan fallback offline
  async _fetchWithOfflineFallback(url, options, storageKey) {
    try {
      if (!this.isOnline) throw new Error('offline');

      const response = await fetch(url, options);
      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      if (storageKey && !data.error) {
        await saveData({
          id: storageKey,
          data: {
            listStory: data.listStory || data.data?.listStory || null,
            detailStory: data.story || null,
            timestamp: new Date().toISOString()
          }
        });
      }
      return data;
    } catch (error) {
      if (error.message === 'offline' && storageKey) {
        const cachedData = await getDataById(storageKey);
        if (cachedData) {
          // Cek expired cache (misal 24 jam)
          const cachedTime = new Date(cachedData.timestamp);
          const now = new Date();
          if ((now - cachedTime) / 1000 / 3600 > 24) {
            throw new Error('Cached data expired');
          }

          return {
            ...cachedData.data,
            fromCache: true,
            message: 'Anda sedang offline. Menampilkan data terakhir yang tersimpan.'
          };
        }
        throw new Error('No cached data available');
      }
      throw error;
    }
  }

  async getOfflineStories(page = 1, size = 10, location = 0) {
    const cacheKey = `stories-page${page}-size${size}-loc${location}`;
    const cachedData = await getDataById(cacheKey);
    if (cachedData && cachedData.data.listStory) {
      return cachedData.data.listStory.map(story => ({
        ...story,
        fromCache: true,
        cacheKey
      }));
    }
    return [];
  }

  async register(name, email, password) {
    return this._fetchWithOfflineFallback(
      'https://story-api.dicoding.dev/v1/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      }
    );
  }

  async login(email, password) {
    const result = await this._fetchWithOfflineFallback(
      'https://story-api.dicoding.dev/v1/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }
    );
    
    if (!result.error) {
      this.token = result.loginResult.token;
      // Simpan token untuk penggunaan offline
      localStorage.setItem('authToken', this.token);
    }
    
    return result;
  }

  async addStory(description, photo, lat, lon) {
    if (!this.isOnline) {
      return {
        error: true,
        message: 'Cannot add story while offline. Please connect to the internet.'
      };
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat && lon) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }

    const result = await this._fetchWithOfflineFallback(
      'https://story-api.dicoding.dev/v1/stories',
      {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + this.token },
        body: formData
      },
      'latestStories' // Simpan juga ke cache setelah menambah cerita baru
    );

    return result;
  }

  async getStories(page = 1, size = 10, location = 0) {
    const cacheKey = `stories-page${page}-size${size}-loc${location}`;

    if (!this.isOnline) {
      console.warn('📴 Anda offline. Memuat cerita dari cache melalui getOfflineStories()');

      const cachedList = await this.getOfflineStories();

      this.stories = cachedList;
      return {
        error: false,
        listStory: cachedList,
        fromCache: true,
        message: 'Anda sedang offline. Menampilkan cerita yang disimpan di cache.'
      };
    }

    const result = await this._fetchWithOfflineFallback(
      `https://story-api.dicoding.dev/v1/stories?page=${page}&size=${size}&location=${location}`,
      {
        headers: { 'Authorization': 'Bearer ' + this.token }
      },
      cacheKey
    );

    if (!result.error) {
      this.stories = result.listStory || result.data?.listStory || [];
    }

    return result;
  }

  async getStoryDetail(storyId) {
    return this._fetchWithOfflineFallback(
      `https://story-api.dicoding.dev/v1/stories/${storyId}`,
      {
        headers: { 'Authorization': 'Bearer ' + this.token }
      },
      `story-${storyId}`
    );
  }

  async subscribeToNotification(subscription) {
    return this._fetchWithOfflineFallback(
      'https://story-api.dicoding.dev/v1/notifications/subscribe',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      }
    );
  }

  async unsubscribeFromNotification(subscription) {
    return this._fetchWithOfflineFallback(
      'https://story-api.dicoding.dev/v1/notifications/subscribe',
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }
    );
  }

  // Method untuk sync data ketika kembali online
  async syncLocalData() {
    if (this.isOnline) {
      // Implementasi sync data lokal ke server jika diperlukan
      console.log('Syncing local data...');
      // Contoh: bisa menambahkan antrian cerita yang dibuat offline
    }
  }

  async deleteOneStoryFromCache(cacheKey, storyId) {
    try {
      if (!cacheKey || !storyId) {
        throw new Error("Cache key dan story ID tidak boleh kosong");
      }

      // Ambil data cache dari IndexedDB
      const cachedData = await getDataById(cacheKey);
      if (!cachedData || !cachedData.data || !Array.isArray(cachedData.data.listStory)) {
        throw new Error("Data cache tidak ditemukan atau format tidak valid");
      }

      // Simpan panjang sebelum filter untuk deteksi apakah story ada
      const beforeLength = cachedData.data.listStory.length;

      // Hapus story dari listStory
      cachedData.data.listStory = cachedData.data.listStory.filter(
        story => story.id !== storyId
      );

      // Cek apakah story ditemukan
      if (cachedData.data.listStory.length === beforeLength) {
        throw new Error("Cerita tidak ditemukan dalam cache");
      }

      // Simpan ulang ke IndexedDB
      await saveData({
        id: cacheKey,
        data: cachedData.data
      });

      console.log(`Cerita dengan ID ${storyId} berhasil dihapus dari cache "${cacheKey}".`);

      return {
        success: true,
        message: `Cerita berhasil dihapus dari cache.`
      };
    } catch (error) {
      console.error("Gagal menghapus cerita dari cache:", error);
      return {
        success: false,
        message: error.message || "Gagal menghapus cerita dari cache"
      };
    }
  }

  async deleteOfflineStory(cacheKey) {
    try {
      if (!cacheKey) {
        throw new Error("Cache key tidak valid");
      }

      // Hapus data dari IndexedDB
      await deleteData(cacheKey);
      console.log(`Cerita offline dengan key "${cacheKey}" telah dihapus.`);
      return {
        success: true,
        message: `Cerita offline dengan key "${cacheKey}" berhasil dihapus.`
      };
    } catch (error) {
      console.error('Gagal menghapus data offline:', error);
      return {
        success: false,
        message: error.message || 'Gagal menghapus data offline.'
      };
    }
  }
}

export default StoryModel;