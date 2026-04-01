import { ref, onMounted, onUnmounted } from "vue";
import { db, collection, query, orderBy, limit, onSnapshot } from "../firebase.js";

export default {
  props: {
    user: { type: Object, default: null },
  },
  setup(props) {
    const events = ref([]);
    let unsubscribe = null;

    onMounted(() => {
      if (props.user && props.user.email === 'oscar861213@gmail.com' && props.user.uid === 'sMrOq1SWgOhodVYTgweVBRlBSF12') {
        const q = query(
          collection(db, "events"),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
          events.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });
      }
    });

    onUnmounted(() => {
      if (unsubscribe) unsubscribe();
    });

    const formatAction = (action) => {
      const map = {
        login: "登入系統",
        enter_home: "進入首頁",
        switch_tab: "切換 Tab",
      };
      return map[action] || action;
    };

    const formatTabName = (tabId) => {
      const map = {
        itinerary: "行程表",
        logistics: "住宿與航班",
        budget: "預算表",
        shopping: "購物清單",
        todo: "行前準備",
        eventLog: "事件紀錄"
      };
      return map[tabId] || tabId;
    };

    const formatTime = (timestamp) => {
      if (!timestamp) return "剛才";
      // handle serverTimestamp which might be null locally first or a Date/Number
      let date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleString('zh-TW', { hour12: false });
    };

    return { events, formatAction, formatTabName, formatTime };
  },
  template: `
    <div class="px-4 animate-fade-in">
      <div v-if="user && user.email === 'oscar861213@gmail.com' && user.uid === 'sMrOq1SWgOhodVYTgweVBRlBSF12'" class="max-w-4xl mx-auto bg-white rounded-3xl p-6 shadow-cartoon border-4 border-gray-100 mb-8">
        <h2 class="text-xl font-bold text-sb-blue mb-4 flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
          系統事件紀錄 (最近 100 筆)
        </h2>
        
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th class="px-4 py-3 font-bold text-gray-700">時間</th>
                <th class="px-4 py-3 font-bold text-gray-700">使用者</th>
                <th class="px-4 py-3 font-bold text-gray-700">動作</th>
                <th class="px-4 py-3 font-bold text-gray-700">選項 / 標籤頁</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in events" :key="event.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 whitespace-nowrap">{{ formatTime(event.timestamp) }}</td>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-800">{{ event.displayName || 'Unknown' }}</div>
                  <div class="text-xs text-gray-500 break-all">{{ event.email }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="px-2 py-1 bg-sb-yellow/30 text-sb-brown rounded-full text-xs font-bold inline-block">
                    {{ formatAction(event.action) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs break-all">
                  <span v-if="event.details && event.details.tab">前往: {{ formatTabName(event.details.tab) }}</span>
                  <span v-else-if="event.details">{{ JSON.stringify(event.details) }}</span>
                </td>
              </tr>
              <tr v-if="events.length === 0">
                <td colspan="4" class="px-4 py-8 text-center text-gray-400">目前沒有任何紀錄檔 或 資料載入中...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="max-w-4xl mx-auto bg-white rounded-3xl p-6 text-center text-gray-500 shadow-cartoon border-4 border-gray-100 mb-8">
        您沒有權限查看此頁面。
      </div>
    </div>
  `
};
