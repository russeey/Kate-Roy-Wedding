<!-- src/views/AlbumView.vue -->
<template>
  <div class="album-page">

    <!-- Nav -->
    <nav class="top-nav">
      <router-link to="/" class="nav-logo">Kate <em>&amp;</em> Roy</router-link>
      <router-link to="/upload" class="btn" style="padding: 10px 22px; font-size:0.7rem;">
        <span>📷 Upload</span>
      </router-link>
    </nav>

    <div class="page-container">

      <router-link to="/gallery" class="back-link">‹ Back to Gallery</router-link>

      <!-- Loading -->
      <div v-if="loading" class="state">
        <div class="loading-spinner" />
        <p>Opening album…</p>
      </div>

      <!-- Not found -->
      <div v-else-if="!album" class="state">
        <div class="state-icon">🌿</div>
        <h3>Album not found</h3>
        <p>This album may have been removed.</p>
        <router-link to="/gallery" class="btn btn-filled"><span>Back to Gallery</span></router-link>
      </div>

      <template v-else>
        <!-- Header -->
        <header class="page-header">
          <p class="eyebrow">Album</p>
          <h2 class="page-title">{{ album.title }}</h2>
          <div class="ornament"><span>✦</span></div>
          <p class="page-subtitle">
            {{ photos.length }} photo{{ photos.length !== 1 ? 's' : '' }} shared by {{ album.guestName }}
          </p>
        </header>

        <!-- Photos -->
        <div class="gallery-grid">
          <div
            v-for="(photo, index) in photos"
            :key="photo.id"
            class="gallery-item"
            :style="{ animationDelay: (index * 0.07) + 's' }"
            @click="openLightbox(index)"
          >
            <div class="gallery-img-wrap">
              <img
                :src="photo.imageUrl"
                :alt="photo.caption || 'Album photo'"
                class="gallery-img"
                loading="lazy"
                decoding="async"
              />
              <div v-if="photo.caption" class="gallery-overlay">
                <p class="overlay-caption">{{ photo.caption }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>

    </div>

    <!-- Lightbox -->
    <transition name="lightbox">
      <div v-if="lightboxPhoto" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" @click="closeLightbox">✕</button>

        <button
          v-if="lightboxIndex > 0"
          class="lightbox-nav prev"
          @click.stop="navigateLightbox(-1)"
        >‹</button>
        <button
          v-if="lightboxIndex < photos.length - 1"
          class="lightbox-nav next"
          @click.stop="navigateLightbox(1)"
        >›</button>

        <div class="lightbox-inner">
          <img :src="lightboxPhoto.imageUrl" :alt="lightboxPhoto.caption" class="lightbox-img" />
          <div class="lightbox-meta">
            <p v-if="lightboxPhoto.caption" class="lightbox-caption">
              "{{ lightboxPhoto.caption }}"
            </p>
            <p class="lightbox-guest">— {{ lightboxPhoto.guestName }}</p>
            <p class="lightbox-date">{{ lightboxIndex + 1 }} / {{ photos.length }}</p>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'

const route = useRoute()

const album         = ref(null)
const photos        = ref([])
const loading       = ref(true)
const lightboxIndex = ref(-1)

const lightboxPhoto = computed(() =>
  lightboxIndex.value >= 0 ? photos.value[lightboxIndex.value] : null
)

onMounted(async () => {
  try {
    const albumSnap = await getDoc(doc(db, 'albums', route.params.id))
    if (!albumSnap.exists()) return

    album.value = { id: albumSnap.id, ...albumSnap.data() }

    // Only a "where" filter, so no extra Firestore index is needed.
    // We sort oldest -> newest ourselves.
    const snap = await getDocs(
      query(collection(db, 'memories'), where('albumId', '==', route.params.id))
    )
    const ms = ts => (ts?.toMillis ? ts.toMillis() : 0)
    photos.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => ms(a.createdAt) - ms(b.createdAt))
  } catch (err) {
    console.error('Failed to load album:', err)
  } finally {
    loading.value = false
  }
})

function openLightbox(index) {
  lightboxIndex.value = index
  document.body.style.overflow = 'hidden'
}
function closeLightbox() {
  lightboxIndex.value = -1
  document.body.style.overflow = ''
}
function navigateLightbox(dir) {
  const next = lightboxIndex.value + dir
  if (next >= 0 && next < photos.value.length) lightboxIndex.value = next
}

onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>

<style scoped>
.album-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 10% 90%, #e8eee0 0%, transparent 55%),
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
  border-bottom: 1px solid rgba(127,150,112,0.2);
}
.nav-logo {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  color: var(--ink);
  text-decoration: none;
}
.nav-logo em { font-family: var(--font-body); font-style: italic; color: var(--sage-dark); }

/* Layout */
.page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}
.back-link {
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 0.74rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-soft);
  text-decoration: none;
  margin-bottom: 28px;
  transition: color 0.3s;
}
.back-link:hover { color: var(--sage-dark); }

/* Header */
.page-header { text-align: center; margin-bottom: 48px; }
.eyebrow {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--sage-dark);
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
  font-size: 1.05rem;
  color: var(--ink-soft);
  font-style: italic;
}

/* States */
.state {
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
.state h3 {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--ink);
  font-style: normal;
}
.state-icon { font-size: 3rem; }
.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(127,150,112,0.25);
  border-top-color: var(--sage);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Grid */
.gallery-grid { columns: 3 280px; gap: 16px; }
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
.gallery-img { width: 100%; display: block; transition: transform 0.5s ease; }
.gallery-item:hover .gallery-img { transform: scale(1.04); }
.gallery-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(26,34,22,0.85));
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
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(22,30,18,0.93);
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
  color: var(--sage-light);
  margin-bottom: 6px;
}
.lightbox-date {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  color: rgba(255,255,255,0.45);
}
.lightbox-enter-active,
.lightbox-leave-active { transition: opacity 0.35s ease; }
.lightbox-enter-from,
.lightbox-leave-to     { opacity: 0; }

@media (max-width: 520px) {
  .top-nav { padding: 16px 20px; }
}
</style>