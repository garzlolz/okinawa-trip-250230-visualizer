import { SkyFlower, Jellyfish, Pineapple } from './Illustrations.js';
import { CUSTOM_IMAGE_SRC, CUSTOM_IMAGE_SRC_2 } from '../data.js';

export default {
  components: { SkyFlower, Jellyfish, Pineapple },
  data() {
    return {
      CUSTOM_IMAGE_SRC,
      CUSTOM_IMAGE_SRC_2
    }
  },
  methods: {
    handleImageError(e) {
      e.target.style.display = 'none';
    }
  },
  template: `
    <div>
      <SkyFlower class="bg-illustration w-32 h-32 top-10 left-5 animate-spin-slow text-sb-teal" color="#20B2AA" />
      <SkyFlower class="bg-illustration w-48 h-48 bottom-20 right-10 animate-spin-reverse text-sb-purple" color="#B19CD9" />
      <SkyFlower class="bg-illustration w-24 h-24 top-1/3 right-1/4 animate-spin-slow text-sb-green" color="#A0D6B4" />
      <SkyFlower class="bg-illustration w-16 h-16 bottom-1/3 left-10 animate-spin-slow text-sb-pink" color="#FF959D" />

      <Jellyfish class="bg-illustration w-20 h-24 top-20 right-20 animate-float-slow opacity-80" />
      <Jellyfish class="bg-illustration w-16 h-20 bottom-40 left-1/3 animate-float-medium opacity-70" />
      <Jellyfish class="bg-illustration w-12 h-16 top-1/2 left-10 animate-float-fast opacity-60" />

      <Pineapple class="bg-illustration w-24 h-32 top-32 left-1/4 opacity-40 rotate-12" />

      <div class="bg-illustration top-0 left-0 animate-float-everywhere-1">
        <img :src="CUSTOM_IMAGE_SRC" class="w-24 h-auto sticker-img opacity-90 animate-spin-fast" alt="Floating decoration 1" @error="handleImageError" />
      </div>

      <div class="bg-illustration top-0 left-0 animate-float-everywhere-2">
        <img :src="CUSTOM_IMAGE_SRC" class="w-32 h-auto sticker-img opacity-80 animate-spin-reverse-fast" alt="Floating decoration 2" @error="handleImageError" />
      </div>

      <div class="bg-illustration top-0 left-0 animate-float-everywhere-3">
        <img :src="CUSTOM_IMAGE_SRC" class="w-16 h-auto sticker-img opacity-70 animate-spin-super-fast" alt="Floating decoration 3" @error="handleImageError" />
      </div>

      <div class="bg-illustration top-0 left-0 animate-float-everywhere-1" style="animation-delay: -12s;">
        <img :src="CUSTOM_IMAGE_SRC_2" class="w-20 h-auto sticker-img opacity-85 animate-spin-reverse-fast" alt="Floating decoration 4" @error="handleImageError" />
      </div>

      <div class="bg-illustration top-0 left-0 animate-float-everywhere-3" style="animation-delay: -7s;">
        <img :src="CUSTOM_IMAGE_SRC_2" class="w-28 h-auto sticker-img opacity-80 animate-spin-fast" alt="Floating decoration 5" @error="handleImageError" />
      </div>
    </div>
  `
};
