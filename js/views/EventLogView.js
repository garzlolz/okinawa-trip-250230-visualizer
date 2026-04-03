import { ref, onMounted, watch } from "vue";
import {
  db,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  startAfter,
} from "../firebase.js";

export default {
  props: {
    user: { type: Object, default: null },
    isUnlocked: { type: Boolean, default: false },
  },
  setup(props) {
    const events = ref([]);
    const loading = ref(false);

    const startDate = ref("");
    const endDate = ref("");
    const selectedEmail = ref("");
    const userOptions = ref([]);

    const PAGE_SIZE = 20;
    const currentPage = ref(1);
    const hasMore = ref(false);
    const lastDocCursors = ref([]);

    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const options = [];
        snap.forEach((doc) => {
          const data = doc.data();
          if (!data.email) return;
          const label = data.displayName
            ? `${data.displayName} (${data.email})`
            : data.email;
          options.push({
            email: data.email,
            label,
            lastLoginTime: data.lastLoginTime || 0,
          });
        });
        userOptions.value = options.sort(
          (a, b) => b.lastLoginTime - a.lastLoginTime,
        );
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };

    const fetchEvents = async (page = 1) => {
      if (
        !props.user ||
        props.user.email !== "oscar861213@gmail.com" ||
        props.user.uid !== "sMrOq1SWgOhodVYTgweVBRlBSF12" ||
        !props.isUnlocked
      ) {
        return;
      }

      loading.value = true;
      try {
        let constraints = [];

        if (startDate.value) {
          const startMs = new Date(`${startDate.value}T00:00:00`).getTime();
          constraints.push(where("timestamp", ">=", startMs));
        }

        if (endDate.value) {
          const endMs = new Date(`${endDate.value}T23:59:59.999`).getTime();
          constraints.push(where("timestamp", "<=", endMs));
        }

        if (selectedEmail.value) {
          constraints.push(where("email", "==", selectedEmail.value));
        }

        constraints.push(orderBy("timestamp", "desc"));
        constraints.push(limit(PAGE_SIZE));

        if (page > 1 && lastDocCursors.value[page - 2]) {
          constraints.push(startAfter(lastDocCursors.value[page - 2]));
        }

        const q = query(collection(db, "events"), ...constraints);
        const snapshot = await getDocs(q);

        events.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (snapshot.docs.length > 0) {
          lastDocCursors.value[page - 1] =
            snapshot.docs[snapshot.docs.length - 1];
        }

        hasMore.value = snapshot.docs.length === PAGE_SIZE;
        currentPage.value = page;
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        loading.value = false;
      }
    };

    const handleSearch = () => {
      lastDocCursors.value = [];
      fetchEvents(1);
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        fetchEvents(currentPage.value - 1);
      }
    };

    const nextPage = () => {
      if (hasMore.value) {
        fetchEvents(currentPage.value + 1);
      }
    };

    onMounted(() => {
      fetchUsers();
      fetchEvents(1);
    });

    watch(() => props.user, () => { fetchEvents(1); });
    watch(() => props.isUnlocked, () => { fetchEvents(1); });

    const formatAction = (action) => {
      const map = {
        login: "登入系統",
        enter_home: "進入首頁",
        switch_tab: "切換 Tab",
        add_shopping_item: "新增購物項目",
        edit_shopping_item: "編輯購物項目",
        delete_shopping_item: "刪除購物項目",
        toggle_shopping_item: "切換商品狀態",
        add_shopping_location: "新增購買地點",
        delete_shopping_location: "刪除購買地點",
        add_todo: "新增待辦事項",
        toggle_todo: "切換待辦狀態",
        delete_todo: "刪除待辦事項",
        unlock_success: "解鎖成功",
        unlock_fail: "解鎖失敗",
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
        eventLog: "事件紀錄",
      };
      return map[tabId] || tabId;
    };

    const formatTime = (timestamp) => {
      if (!timestamp) return "剛才";
      let date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleString("zh-TW", { hour12: false });
    };

    return {
      events,
      loading,
      startDate,
      endDate,
      selectedEmail,
      userOptions,
      currentPage,
      hasMore,
      handleSearch,
      prevPage,
      nextPage,
      formatAction,
      formatTabName,
      formatTime,
    };
  },
  template: `
    <div class="px-4 animate-fade-in">
      <div v-if="user && user.email === 'oscar861213@gmail.com' && user.uid === 'sMrOq1SWgOhodVYTgweVBRlBSF12' && isUnlocked" class="max-w-4xl mx-auto bg-white rounded-3xl p-6 shadow-cartoon border-4 border-gray-100 mb-8">
        <h2 class="text-xl font-bold text-sb-blue mb-4 flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
          系統事件紀錄
        </h2>

        <div class="flex flex-wrap items-end gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">開始日期</label>
            <input type="date" v-model="startDate" class="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-sb-blue transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">結束日期</label>
            <input type="date" v-model="endDate" class="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-sb-blue transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">使用者</label>
            <select v-model="selectedEmail" class="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-sb-blue transition-colors" :disabled="loading">
              <option value="">全部使用者</option>
              <option v-for="option in userOptions" :key="option.email" :value="option.email">
                {{ option.label }}
              </option>
            </select>
          </div>
          <button @click="handleSearch" class="bg-sb-blue text-white px-5 py-2 rounded-lg font-bold text-sm shadow-cartoon-hover hover:bg-blue-400 transition-all border-2 border-white" :disabled="loading">
            {{ loading ? '載入中...' : '搜尋 / 重整' }}
          </button>
        </div>
        
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
                  <span v-else-if="event.details && event.details.info">
                    <span class="font-bold text-gray-700">{{ event.details.info }}</span>
                    <span v-if="event.details.status" class="ml-1 text-gray-400">({{ event.details.status }})</span>
                  </span>
                  <span v-else-if="event.details">{{ JSON.stringify(event.details) }}</span>
                </td>
              </tr>
              <tr v-if="events.length === 0">
                <td colspan="4" class="px-4 py-8 text-center text-gray-400">
                  {{ loading ? '載入中...' : '沒有找到任何紀錄檔' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <button @click="prevPage" :disabled="currentPage === 1 || loading" :class="['px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all', currentPage === 1 || loading ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-600 hover:border-sb-blue shadow-cartoon-hover']">
            上一頁
          </button>
          <div class="text-sm font-bold text-gray-500">
            第 {{ currentPage }} 頁
          </div>
          <button @click="nextPage" :disabled="!hasMore || loading" :class="['px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all', !hasMore || loading ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-600 hover:border-sb-blue shadow-cartoon-hover']">
            下一頁
          </button>
        </div>

      </div>
      <div v-else class="max-w-4xl mx-auto bg-white rounded-3xl p-6 text-center text-gray-500 shadow-cartoon border-4 border-gray-100 mb-8">
        {{ !user ? '請先登入以查看此頁面。' : !isUnlocked ? '請先於上方公佈欄輸入密碼解鎖，以查看事件紀錄。' : '您沒有權限查看此頁面。' }}
      </div>
    </div>
  `,
};
