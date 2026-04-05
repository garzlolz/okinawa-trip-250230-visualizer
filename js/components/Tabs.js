import { computed } from "vue";
import { Calendar, Hotel, Wallet, ShoppingBag, CheckSquare, ListIcon } from "./Icons.js";

export default {
  props: {
    activeTab: { type: String, required: true },
    user: { type: Object, default: null },
  },
  emits: ["tab-change"],
  components: {
    Calendar,
    Hotel,
    Wallet,
    ShoppingBag,
    CheckSquare,
    ListIcon,
  },
  setup(props, { emit }) {
    const tabs = [
      { id: "itinerary", label: "行程表", icon: "Calendar" },
      { id: "logistics", label: "住宿與航班", icon: "Hotel" },
      { id: "budget", label: "預算表", icon: "Wallet" },
      { id: "shopping", label: "購物清單", icon: "ShoppingBag" },
      { id: "todo", label: "行前準備", icon: "CheckSquare" },
    ];

    const visibleTabs = computed(() => {
      const isEventAdmin = props.user && props.user.email === 'oscar861213@gmail.com' && props.user.uid === 'sMrOq1SWgOhodVYTgweVBRlBSF12';
      if (isEventAdmin) {
        return [...tabs, { id: "eventLog", label: "事件紀錄", icon: "ListIcon" }];
      }
      return tabs;
    });

    return { visibleTabs };
  },
  template: `
    <div class="flex sm:justify-center mb-8 px-4 overflow-x-auto scrollbar-hide">
      <div class="flex space-x-2 sm:space-x-4 bg-white/30 p-2 rounded-full backdrop-blur-sm border-2 border-white/40 mx-auto sm:mx-0 w-max">
        <button
          v-for="tab in visibleTabs" :key="tab.id"
          @click="$emit('tab-change', tab.id)"
          :class="['flex items-center px-4 sm:px-6 py-3 rounded-full text-sm sm:text-base font-bold transition-all border-2 shadow-cartoon-hover whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-sb-pink text-white border-white transform -translate-y-1'
              : 'bg-white text-gray-400 border-transparent hover:bg-sb-yellow hover:text-sb-brown hover:border-white'
          ]"
        >
          <span class="mr-2 hidden sm:inline">
            <component :is="tab.icon" class="w-6 h-6" />
          </span>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>
  `,
};
