<!-- src/App.vue -->
<template>
  <div id="wrapper">
    <!-- Floating petals background -->
    <div class="petals" aria-hidden="true">
      <span v-for="n in 12" :key="n" class="petal" :style="petalStyle(n)" />
    </div>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
function petalStyle(n) {
  const sizes  = [8, 10, 6, 12, 9, 7, 11, 8, 10, 6, 9, 12]
  const lefts  = [5, 15, 25, 35, 45, 55, 65, 72, 80, 88, 92, 96]
  const delays = [0, 2, 4, 6, 1, 3, 5, 7, 2.5, 4.5, 1.5, 6.5]
  const durs   = [12, 15, 10, 18, 13, 11, 16, 14, 17, 12, 15, 10]
  return {
    width:  sizes[n - 1] + 'px',
    height: sizes[n - 1] + 'px',
    left:   lefts[n - 1] + '%',
    animationDelay:    delays[n - 1] + 's',
    animationDuration: durs[n - 1] + 's'
  }
}
</script>

<style>
#wrapper {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.fade-enter-from   { opacity: 0; transform: translateY(16px); }
.fade-leave-to     { opacity: 0; transform: translateY(-16px); }

/* Floating petals */
.petals {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.petal {
  position: absolute;
  top: -20px;
  border-radius: 50% 0 50% 0;
  background: var(--blush);
  opacity: 0.35;
  animation: fall linear infinite;
}
@keyframes fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
  10%  { opacity: 0.35; }
  90%  { opacity: 0.2; }
  100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
}
</style>
