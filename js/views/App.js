import { ref, watch, onMounted, onUnmounted } from "vue";
import { TRIP_DATA } from "../data.js";
import {
  auth,
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  googleProvider,
  recordEvent,
} from "../firebase.js";

import { Anchor, Calendar } from "../components/Icons.js";
import BackgroundEffects from "../components/BackgroundEffects.js";
import Tabs from "../components/Tabs.js";

import ItineraryView from "./ItineraryView.js";
import LogisticsView from "./LogisticsView.js";
import BudgetView from "./BudgetView.js";
import ShoppingView from "./ShoppingView.js";
import TodoView from "./TodoView.js";
import EventLogView from "./EventLogView.js";

export default {
  components: {
    Anchor,
    Calendar,
    BackgroundEffects,
    Tabs,
    ItineraryView,
    LogisticsView,
    BudgetView,
    ShoppingView,
    TodoView,
    EventLogView,
  },
  setup() {
    const activeTab = ref("itinerary");
    const user = ref(null);
    let unsubscribe = null;

    const isLetterUnlocked = ref(false);
    const passwordInput = ref("");
    const letterError = ref(false);
    const letterContent = ref("");

    // hash function for password check
    const sha256 = async (message) => {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleLetterUnlock = async () => {
      const hashedInput = await sha256(passwordInput.value);

      try {
        const docRef = doc(db, "secrets", hashedInput);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          letterContent.value = docSnap.data().content;
          isLetterUnlocked.value = true;
          letterError.value = false;
          passwordInput.value = "";
        } else {
          letterError.value = true;
          setTimeout(() => { letterError.value = false; }, 2000);
        }
      } catch (error) {
        console.error("Error fetching secure content", error);
        letterError.value = true;
        setTimeout(() => { letterError.value = false; }, 2000);
      }
    };

    watch(user, async (newUser, oldUser) => {
      // 記錄登入或重整網頁後已登入狀態
      if (newUser && !oldUser) {
        recordEvent(user.value, "login", { info: "使用者登入或進入系統" });
        try {
          await setDoc(
            doc(db, "users", user.value.uid),
            {
              uid: user.value.uid,
              email: user.value.email,
              displayName: user.value.displayName,
              photoURL: user.value.photoURL,
              lastLoginTime: Date.now(),
            },
            { merge: true },
          );
        } catch (e) {
          console.error("Failed to save user info:", e);
        }
      }
    });

    watch(activeTab, (newTab) => {
      if (user.value) {
        recordEvent(user.value, "switch_tab", { tab: newTab });
      }
    });

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
      activeTab,
      user,
      TRIP_DATA,
      handleLogin,
      handleLogout,
      isLetterUnlocked,
      passwordInput,
      letterError,
      letterContent,
      handleLetterUnlock,
    };
  },
  template: `
    <div class="min-h-screen pb-12 relative z-10">
      <!-- 公佈欄 -->
      <div class="bg-sb-yellow text-sb-brown text-center py-2 px-4 font-black shadow-sm relative z-50 text-sm md:text-base border-b-4 border-sb-darkYellow">
        嘿 小朋友，今天過的如何呀？
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
        <!-- 行前須知與介紹卡片 -->
        <div class="px-4">
          <div class="max-w-4xl mx-auto bg-white rounded-3xl p-6 md:p-8 mb-8 shadow-cartoon border-4 border-gray-100 relative overflow-hidden">
            <h2 class="text-xl font-bold text-sb-blue mb-4 flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              公佈欄
            </h2>
            <div v-if="!isLetterUnlocked" class="flex flex-col items-center justify-center py-6 space-y-4">
              <p class="text-gray-500 font-medium">請輸入密碼以解鎖此區域</p>
              <div class="flex gap-2 w-full max-w-xs">
                <input 
                  type="password" 
                  v-model="passwordInput" 
                  @keyup.enter="handleLetterUnlock"
                  class="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-sb-blue"
                  placeholder="輸入密碼..."
                />
                <button 
                  @click="handleLetterUnlock"
                  class="bg-sb-blue text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-400 transition-colors"
                >
                  解鎖
                </button>
              </div>
              <p v-if="letterError" class="text-red-500 text-sm font-bold animate-bounce">密碼錯誤，請再試一次</p>
            </div>

            <div v-else class="text-gray-600 leading-relaxed text-sm md:text-base space-y-3 relative z-10 animate-fade-in" v-html="letterContent">
            </div>
          </div>
        </div>

        <Tabs :activeTab="activeTab" :user="user" @tab-change="activeTab = $event" />
        <div class="animate-fade-in">
          <ItineraryView v-show="activeTab === 'itinerary'" :data="TRIP_DATA.itinerary" />
          <LogisticsView v-if="activeTab === 'logistics'" :flights="TRIP_DATA.flights" :hotels="TRIP_DATA.hotels" />
          <BudgetView v-if="activeTab === 'budget'" :budget="TRIP_DATA.budget" />
          <ShoppingView v-if="activeTab === 'shopping'" :user="user" />
          <TodoView v-if="activeTab === 'todo'" :user="user" />
          <EventLogView v-if="activeTab === 'eventLog'" :user="user" />
        </div>
      </div>

      <div class="text-center py-12 text-white font-bold opacity-80 text-sm">
        <span>準備好去抓水母了嗎？ 🪼</span>
      </div>

      <BackgroundEffects />
    </div>
  `,
};
