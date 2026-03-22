import { ref, onMounted, watch } from 'vue';
import EventItem from '../components/EventItem.js';

export default {
  props: {
    data: { type: Array, required: true }
  },
  components: { EventItem },
  setup(props) {
    const activeDay = ref(props.data[0]?.day || 1);
    const nextEventId = ref(null);

    const checkNextEvent = () => {
      const now = new Date();
      let target = null;
      let minDiff = Infinity;

      for (const day of props.data) {
        for (let idx = 0; idx < day.events.length; idx++) {
          const event = day.events[idx];
          const start = new Date(`${day.dateStr}T${event.time}:00`);
          let end;
          if (event.endTime) {
            const [endH, endM] = event.endTime.split(":").map(Number);
            const [startH, startM] = event.time.split(":").map(Number);
            let endDateStr = day.dateStr;
            if (endH < startH) {
              const d = new Date(day.dateStr);
              d.setDate(d.getDate() + 1);
              endDateStr = d.toISOString().split("T")[0];
            }
            end = new Date(`${endDateStr}T${event.endTime}:00`);
          } else {
            end = new Date(start.getTime() + 60 * 60 * 1000);
          }

          if (now >= start && now <= end) {
            target = { day: day.day, idx, type: "ongoing" };
            break;
          }
        }
        if (target) break;
      }

      if (!target) {
        for (const day of props.data) {
          for (let idx = 0; idx < day.events.length; idx++) {
            const event = day.events[idx];
            const start = new Date(`${day.dateStr}T${event.time}:00`);
            const diff = start - now;
            if (diff > 0 && diff < minDiff) {
              minDiff = diff;
              target = { day: day.day, idx, type: "upcoming" };
            }
          }
        }
      }

      if (target) {
        nextEventId.value = target;
        activeDay.value = target.day;
        setTimeout(() => {
          const element = document.getElementById(`event-${target.day}-${target.idx}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 500);
      }
    };

    onMounted(() => {
      checkNextEvent();
    });

    watch(() => props.data, () => {
      checkNextEvent();
    });

    return { activeDay, nextEventId };
  },
  computed: {
    currentDay() {
      return this.data.find(d => d.day === this.activeDay) || this.data[0];
    }
  },
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="flex overflow-x-auto gap-3 mb-8 pb-4 scrollbar-hide justify-start sm:justify-center px-4">
        <button v-for="day in data" :key="day.day" @click="activeDay = day.day" :class="['flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border-4 relative overflow-hidden group', activeDay === day.day ? 'bg-sb-yellow border-white text-sb-brown shadow-cartoon scale-110 z-10' : 'bg-white/80 border-white/50 text-gray-400 hover:bg-white hover:text-sb-teal hover:border-white hover:-translate-y-1']">
          <span class="block text-xs uppercase opacity-70">
            <span>Day</span> <span>{{ day.day }}</span>
          </span>
          <span class="text-lg">
            <span>{{ day.date.split(" ")[0] }}</span>
          </span>
        </button>
      </div>

      <div class="animate-fade-in px-2" :key="activeDay">
        <div class="mb-8 flex items-center justify-center">
          <div class="bg-white/90 px-8 py-3 rounded-full border-4 border-white shadow-cartoon text-center">
            <h2 class="text-2xl font-black text-sb-teal inline-block mr-3">
               <span>{{ currentDay.date }}</span>
            </h2>
            <span class="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              <span>{{ currentDay.events.length }}</span> <span>個任務</span>
            </span>
          </div>
        </div>

        <div class="relative">
          <EventItem v-for="(event, idx) in currentDay.events" :key="idx" :event="{...event, dateStr: currentDay.dateStr}" :isNext="!!(nextEventId && nextEventId.day === currentDay.day && nextEventId.idx === idx)" :eventId="'event-' + currentDay.day + '-' + idx" />
        </div>
      </div>
    </div>
  `
};
