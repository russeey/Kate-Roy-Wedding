// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import WelcomeView from '@/views/WelcomeView.vue'
import UploadView from '@/views/UploadView.vue'
import GalleryView from '@/views/GalleryView.vue'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: WelcomeView
  },
  {
    path: '/upload',
    name: 'Upload',
    component: UploadView
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: GalleryView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
