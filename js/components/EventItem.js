import { ref } from 'vue';
import { Utensils, Car, MapPin, Info, Map as MapIcon, ExternalLink } from './Icons.js';
import CountdownTimer from './CountdownTimer.js';

export default {
  props: {
    event: { type: Object, required: true },
    isNext: { type: Boolean, required: true },
    eventId: { type: String, required: true }
  },
  components: {
    Utensils, Car, MapPin, Info, MapIcon, ExternalLink, CountdownTimer
  },
  setup(props) {
    const isMapVisible = ref(false);

    const queryLocation = props.event.mapLocation || props.event.location;
    const mapQuery = encodeURIComponent(queryLocation);
    const mapUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    const externalMapUrl = props.event.mapLink || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    const getTypeStyle = (type) => {
      switch (type) {
        case "meal": return "bg-sb-yellow border-sb-brown text-sb-brown";
        case "transport": return "bg-gray-100 border-gray-400 text-gray-600";
        default: return "bg-sb-teal border-white text-white";
      }
    };

    const getTypeLabel = (type) => {
      switch (type) {
        case "meal": return "美味蟹堡";
        case "transport": return "移動中";
        default: return "去玩耍";
      }
    };

    const toggleMap = () => {
      isMapVisible.value = !isMapVisible.value;
    };

    return {
      isMapVisible, mapUrl, externalMapUrl, getTypeStyle, getTypeLabel, toggleMap
    };
  },
  template: `
    <div :id="eventId" :class="['relative pl-8 group', isNext ? 'z-10' : '']">
      <div class="absolute left-3 top-0 bottom-0 w-1 bg-white/50 border-x border-white/20 group-last:bottom-auto group-last:h-8"></div>

      <div :class="['absolute left-0 top-6 w-7 h-7 rounded-full border-2 border-white shadow-cartoon flex items-center justify-center z-10 transition-transform', isNext ? 'bg-sb-pink scale-125' : 'bg-sb-yellow']">
        <Utensils v-if="event.type === 'meal'" class="w-3 h-3 text-sb-brown" />
        <Car v-else-if="event.type === 'transport'" class="w-3 h-3 text-sb-brown" />
        <MapPin v-else class="w-3 h-3 text-sb-brown" />
      </div>

      <div :class="['mb-6 p-5 rounded-3xl border-4 transition-all duration-300 relative', isNext ? 'bg-sb-yellow border-sb-brown shadow-cartoon transform scale-[1.02]' : 'bg-white border-white hover:border-sb-yellow hover:shadow-cartoon-hover']">
        <div :class="['absolute -top-2 -right-2 w-4 h-4 bg-sb-blue rounded-full border border-white opacity-50', isNext ? 'block' : 'hidden']"></div>

        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div class="flex-1">
            <div class="flex items-center justify-between sm:justify-start gap-3 mb-2">
              <span :class="['font-mono text-sm font-black px-3 py-1 rounded-full border-2', isNext ? 'bg-white text-sb-brown border-sb-brown' : 'bg-sb-blue/20 text-sb-brown border-transparent']">
                <span>{{ event.time }}</span>
              </span>
              <div v-if="isNext" class="block">
                <CountdownTimer :targetDateStr="event.dateStr" :targetTimeStr="event.time" />
              </div>
            </div>

            <h4 :class="['text-xl font-black mb-2', isNext ? 'text-sb-brown' : 'text-gray-700']">
              <span>{{ event.title }}</span>
            </h4>

            <div class="flex flex-wrap gap-2 text-sm font-bold mb-3">
              <span :class="['inline-flex items-center px-3 py-1 rounded-full border-2 text-xs', getTypeStyle(event.type)]">
                <span>{{ getTypeLabel(event.type) }}</span>
              </span>
              <div class="flex items-center px-3 py-1 rounded-full bg-white/50 border-2 border-white/50 text-gray-500">
                <span class="mr-1.5"><MapPin class="w-5 h-5" /></span>
                <span>{{ event.location }}</span>
              </div>
            </div>

            <div v-if="event.note" :class="['flex items-start text-sm p-3 rounded-2xl border-2', isNext ? 'bg-white/50 border-sb-brown/20 text-sb-brown' : 'bg-sb-sand border-gray-100 text-gray-500']">
              <span class="mr-2 mt-0.5 text-sb-pink"><Info class="w-4 h-4" /></span>
              <span class="font-medium"><span>{{ event.note }}</span></span>
            </div>
          </div>

          <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 min-w-[100px]">
             <div v-if="event.cost > 0" class="text-right bg-white/80 px-3 py-1 rounded-xl border-2 border-white shadow-sm">
                <span class="text-[10px] text-gray-400 uppercase font-black tracking-wider"><span>預估</span></span>
                <div class="font-mono text-lg font-black text-sb-plankton">
                  <span>¥</span><span>{{ event.cost.toLocaleString() }}</span>
                </div>
             </div>
             <button @click="toggleMap" :class="['text-sm font-bold flex items-center px-4 py-2 rounded-full border-2 shadow-cartoon-hover transition-all active:translate-y-1 active:shadow-none', isMapVisible ? 'bg-sb-red text-white border-sb-red' : 'bg-sb-blue text-white border-white hover:bg-teal-400']">
                <span class="mr-1.5"><MapIcon class="w-4 h-4" /></span>
                <span>{{ isMapVisible ? "收起" : "地圖" }}</span>
             </button>
          </div>
        </div>

        <div v-show="isMapVisible" class="mt-4 rounded-2xl overflow-hidden border-4 border-white shadow-cartoon bg-sb-sand animate-fade-in relative block">
          <iframe v-if="isMapVisible" width="100%" height="280" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" :src="mapUrl" :title="'Map of ' + event.location" class="w-full block"></iframe>
          <div class="bg-white py-2 px-3 text-xs flex justify-end border-t-2 border-gray-100 font-bold">
            <a :href="externalMapUrl" target="_blank" rel="noopener noreferrer" class="flex items-center text-sb-blue hover:text-sb-teal transition-colors">
              <span>開啟 Google Maps</span> <span class="ml-1"><ExternalLink class="w-4 h-4" /></span>
            </a>
          </div>
        </div>

      </div>
    </div>
  `
};
