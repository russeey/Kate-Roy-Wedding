<!-- src/views/GalleryView.vue -->
<template>
  <div class="gallery-page">

    <!-- Nav -->
    <nav class="top-nav">
      <router-link to="/" class="nav-logo">Kate <em>&amp;</em> Roy</router-link>
      <router-link to="/upload" class="btn" style="padding: 10px 22px; font-size:0.7rem;">
        <span>📷 Upload</span>
      </router-link>
    </nav>

    <div class="page-container">

      <!-- Header -->
      <header class="page-header">
        <p class="eyebrow">Wedding Gallery</p>
        <h2 class="page-title">Our Memories Together</h2>
        <div class="ornament"><span>✦</span></div>
        <p class="page-subtitle" v-if="memories.length">
          {{ memories.length }} beautiful moment{{ memories.length !== 1 ? 's' : '' }} captured
        </p>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner" />
        <p>Loading memories…</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!memories.length" class="empty-state">
        <div class="empty-icon">🌸</div>
        <h3>No memories yet</h3>
        <p>Be the first to share a photo from Kate &amp; Roy's special day!</p>
        <router-link to="/upload" class="btn btn-filled"><span>Share a Memory</span></router-link>
      </div>

      <!-- Gallery Grid -->
      <div v-else class="gallery-grid">
        <div
          v-for="(memory, index) in memories"
          :key="memory.id"
          class="gallery-item"
          :style="{ animationDelay: (index * 0.07) + 's' }"
          @click="openLightbox(memory)"
        >
          <div class="gallery-img-wrap">
            <img
              :src="memory.imageUrl"
              :alt="memory.caption || 'Wedding memory'"
              class="gallery-img"
              loading="lazy"
              decoding="async"
            />
            <div class="gallery-overlay">
              <p v-if="memory.caption" class="overlay-caption">{{ memory.caption }}</p>
              <p class="overlay-guest">— {{ memory.guestName }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Lightbox -->
    <transition name="lightbox">
      <div v-if="lightboxMemory" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" @click="closeLightbox">✕</button>

        <!-- Prev / Next -->
        <button
          v-if="lightboxIndex > 0"
          class="lightbox-nav prev"
          @click.stop="navigateLightbox(-1)"
        >‹</button>
        <button
          v-if="lightboxIndex < memories.length - 1"
          class="lightbox-nav next"
          @click.stop="navigateLightbox(1)"
        >›</button>

        <div class="lightbox-inner">
          <img
            :src="lightboxMemory.imageUrl"
            :alt="lightboxMemory.caption"
            class="lightbox-img"
          />
          <div class="lightbox-meta">
            <p v-if="lightboxMemory.caption" class="lightbox-caption">
              "{{ lightboxMemory.caption }}"
            </p>
            <p class="lightbox-guest">— {{ lightboxMemory.guestName }}</p>
            <p class="lightbox-date">{{ formatDate(lightboxMemory.createdAt) }}</p>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

const memories       = ref([])
const loading        = ref(true)
const lightboxMemory = ref(null)
const lightboxIndex  = ref(0)

onMounted(async () => {
  try {
    const q    = query(collection(db, 'memories'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    memories.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.error('Failed to load memories:', err)
  } finally {
    loading.value = false
  }
})

function openLightbox(memory) {
  lightboxIndex.value  = memories.value.findIndex(m => m.id === memory.id)
  lightboxMemory.value = memory
  document.body.style.overflow = 'hidden'
}
function closeLightbox() {
  lightboxMemory.value = null
  document.body.style.overflow = ''
}
function navigateLightbox(dir) {
  const newIdx = lightboxIndex.value + dir
  if (newIdx >= 0 && newIdx < memories.value.length) {
    lightboxIndex.value  = newIdx
    lightboxMemory.value = memories.value[newIdx]
  }
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<style scoped>
.gallery-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 10% 90%, #e3f1ea 0%, transparent 55%),
    var(--cream);
  position: relative;
  z-index: 1;
}

/* Nav */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  border-bottom: 1px solid rgba(47,158,122,0.2);
}
.nav-logo {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  color: var(--ink);
  text-decoration: none;
}
.nav-logo em { font-family: var(--font-body); font-style: italic; color: var(--jade-dark); }

/* Layout */
.page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 48px;
}
.eyebrow {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--jade-dark);
  margin-bottom: 10px;
}
.page-title {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  font-weight: 400;
  letter-spacing: 0.05em;
  margin-bottom: 18px;
}
.page-subtitle {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--ink-soft);
  font-style: italic;
}

/* States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 80px 20px;
  text-align: center;
  color: var(--ink-soft);
  font-family: var(--font-body);
  font-size: 1.1rem;
  font-style: italic;
}
.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(47,158,122,0.25);
  border-top-color: var(--jade);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 3rem; }
.empty-state h3 {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--ink);
  font-style: normal;
}

/* Gallery Grid */
.gallery-grid {
  columns: 3 280px;
  gap: 16px;
}

.gallery-item {
  break-inside: avoid;
  margin-bottom: 16px;
  cursor: pointer;
  animation: fadeUp 0.6s ease both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.gallery-img-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 2px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.gallery-img {
  width: 100%;
  display: block;
  transition: transform 0.5s ease;
}
.gallery-item:hover .gallery-img { transform: scale(1.04); }

.gallery-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(8,30,22,0.85));
  padding: 40px 16px 16px;
  transform: translateY(100%);
  transition: transform 0.4s ease;
}
.gallery-item:hover .gallery-overlay { transform: translateY(0); }

.overlay-caption {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: rgba(255,255,255,0.95);
  font-style: italic;
  margin-bottom: 4px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.overlay-guest {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--jade-light);
}

/* ── Lightbox ── */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(6, 22, 16, 0.93);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  backdrop-filter: blur(8px);
}

.lightbox-close {
  position: fixed;
  top: 24px;
  right: 28px;
  background: none;
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}
.lightbox-close:hover { background: rgba(255,255,255,0.15); }

.lightbox-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
  line-height: 1;
}
.lightbox-nav:hover { background: rgba(255,255,255,0.2); }
.lightbox-nav.prev { left: 20px; }
.lightbox-nav.next { right: 20px; }

.lightbox-inner {
  max-width: 860px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.lightbox-img {
  max-height: 70vh;
  max-width: 100%;
  object-fit: contain;
  border-radius: 2px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.5);
}
.lightbox-meta { text-align: center; }
.lightbox-caption {
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-style: italic;
  color: rgba(255,255,255,0.9);
  line-height: 1.7;
  margin-bottom: 8px;
}
.lightbox-guest {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--jade-light);
  margin-bottom: 6px;
}
.lightbox-date {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  color: rgba(255,255,255,0.4);
}

/* Lightbox transition */
.lightbox-enter-active,
.lightbox-leave-active { transition: opacity 0.35s ease; }
.lightbox-enter-from,
.lightbox-leave-to     { opacity: 0; }
</style>
