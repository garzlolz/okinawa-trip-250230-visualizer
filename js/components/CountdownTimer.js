import { ref, onMounted, onUnmounted } from 'vue';
import { Timer } from './Icons.js';

export default {
  props: {
    targetDateStr: { type: String, required: true },
    targetTimeStr: { type: String, required: true }
  },
  components: { Timer },
  setup(props) {
    const timeLeft = ref("");
    let timer = null;

    const calculateTimeLeft = () => {
      const target = new Date(`${props.targetDateStr}T${props.targetTimeStr}:00`);
      const now = new Date();
      const diff = target - now;

      if (diff <= 0) return "進行中 🔥";

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) return `${days}天 ${hours}時 ${minutes}分`;
      return `${hours}時 ${minutes}分 ${seconds}秒`;
    };

    onMounted(() => {
      timeLeft.value = calculateTimeLeft();
      timer = setInterval(() => {
        timeLeft.value = calculateTimeLeft();
      }, 1000);
    });

    onUnmounted(() => {
      if (timer) clearInterval(timer);
    });

    return { timeLeft };
  },
  template: `
    <div class="flex items-center space-x-2 bg-sb-pink text-white px-3 py-1.5 rounded-full shadow-cartoon border-2 border-white text-sm font-bold animate-pulse">
      <Timer class="w-5 h-5" />
      <span>倒數：<span>{{ timeLeft }}</span></span>
    </div>
  `
};
