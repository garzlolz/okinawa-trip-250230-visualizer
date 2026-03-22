import { ref, onMounted, onUnmounted } from 'vue';
import { TRIP_DATA } from '../data.js';
import { auth, onAuthStateChanged, signInWithPopup, signOut, googleProvider } from '../firebase.js';

import { Anchor, Calendar } from '../components/Icons.js';
import BackgroundEffects from '../components/BackgroundEffects.js';
import Tabs from '../components/Tabs.js';

import ItineraryView from './ItineraryView.js';
import LogisticsView from './LogisticsView.js';
import BudgetView from './BudgetView.js';
import ShoppingView from './ShoppingView.js';
import TodoView from './TodoView.js';

export default {
  components: {
    Anchor, Calendar, BackgroundEffects, Tabs,
    ItineraryView, LogisticsView, BudgetView, ShoppingView, TodoView
  },
  setup() {
    const activeTab = ref("itinerary");
    const user = ref(null);
    let unsubscribe = null;

    onMounted(() => {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
      });
    });

    onUnmounted(() => {
      if (unsubscribe) unsubscribe();
    });

    const handleLogin = async () => {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (error) {
        console.error("Login failed:", error);
      }
    };

    const handleLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };

    return {
      activeTab, user, TRIP_DATA, handleLogin, handleLogout
    };
  },
  template: `
    <div class="min-h-screen pb-12 relative z-10">
      <!-- 公佈欄 -->
      <div class="bg-sb-yellow text-sb-brown text-center py-2 px-4 font-black shadow-sm relative z-50 text-sm md:text-base border-b-4 border-sb-darkYellow">
        本專案奉獻給我的摯愛 ㄏㄜˋ 女士，雖然我們在 2026 的沖繩行後分開了，但希望緣分會再讓我們相遇，我愛她
      </div>

      <div class="sticky top-0 z-50 mb-8 pt-4 px-4">
        <div class="max-w-4xl mx-auto bg-white/90 backdrop-blur-md rounded-full shadow-cartoon border-4 border-white px-6 py-3 flex items-center justify-between">
          <h1 class="text-xl font-black text-sb-blue flex items-center tracking-tight">
            <span class="bg-sb-yellow text-sb-brown w-10 h-10 rounded-full flex items-center justify-center mr-3 text-lg shadow-sm border-2 border-white">
              <Anchor class="w-6 h-6" />
            </span>
            <span>{{ TRIP_DATA.meta.title }}</span>
          </h1>

          <div class="flex items-center gap-3">
            <!-- 日期 - 手機版隱藏 -->
            <div class="hidden sm:flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-full border-2 border-white shadow-inner">
              <span class="mr-2">
                <Calendar class="w-3 h-3" />
              </span>
              <span>{{ TRIP_DATA.meta.dates }}</span>
            </div>

            <!-- 全域登入按鈕 - 右上角 -->
            <div class="flex items-center">
              <div v-if="user" class="flex items-center gap-2 bg-white px-2 py-1 rounded-full border-2 border-gray-100 shadow-sm">
                <template v-if="user.photoURL">
                  <img :src="user.photoURL" class="w-8 h-8 rounded-full border border-gray-200" alt="avatar" />
                </template>
                <template v-else>
                  <div class="w-8 h-8 rounded-full bg-sb-blue text-white flex items-center justify-center font-bold text-xs">
                    {{ user.displayName?.charAt(0) || "U" }}
                  </div>
                </template>
                <button @click="handleLogout" class="text-xs font-bold text-gray-500 hover:text-sb-red px-2">登出</button>
              </div>
              <button v-else @click="handleLogin" class="bg-sb-blue text-white px-4 py-2 rounded-full font-bold text-sm shadow-cartoon-hover hover:bg-blue-400 transition-all border-2 border-white">
                Google 登入
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-5xl mx-auto">
        <Tabs :activeTab="activeTab" @tab-change="activeTab = $event" />
        <div class="animate-fade-in">
          <ItineraryView v-show="activeTab === 'itinerary'" :data="TRIP_DATA.itinerary" />
          <LogisticsView v-if="activeTab === 'logistics'" :flights="TRIP_DATA.flights" :hotels="TRIP_DATA.hotels" />
          <BudgetView v-if="activeTab === 'budget'" :budget="TRIP_DATA.budget" />
          <ShoppingView v-if="activeTab === 'shopping'" :user="user" />
          <TodoView v-if="activeTab === 'todo'" :user="user" />
        </div>
      </div>

      <div class="text-center py-12 text-white font-bold opacity-80 text-sm">
        <span>準備好去抓水母了嗎？ 🪼</span>
      </div>

      <BackgroundEffects />
    </div>
  `
};
