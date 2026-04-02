import { ref, watch, onMounted, onUnmounted } from "vue";
import { TRIP_DATA } from "../data.js";
import {
  auth,
  db,
  collection,
  doc,
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
    };
  },
  template: `
    <div class="min-h-screen pb-12 relative z-10">
      <!-- 公佈欄 -->
      <div class="bg-sb-yellow text-sb-brown text-center py-2 px-4 font-black shadow-sm relative z-50 text-sm md:text-base border-b-4 border-sb-darkYellow">
        本專案奉獻給摯愛 ㄏㄜˋ 女士，希望哪天能與妳再相見。
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
              給我和她的一封信
            </h2>
            <div class="text-gray-600 leading-relaxed text-sm md:text-base space-y-3 relative z-10">
<p>
  我真的很後悔到今天我才更認識妳、也更認識自己。
</p>
<p>
  失去妳，是我這輩子最大的遺憾。是我親手推開了妳。妳一開始就說過自己很需要安全感，但我忙起來就忽視了。去年9到12月沒怎麼吵架，我以為我們在變好，其實只是還沒面對真正的問題。我的「以為」，是一種逃避。
</p>
<p>
  我的焦慮，來自於想補償的後悔。結束後我才想起，我沒有給妳足夠的安全感。吵架後我選擇打遊戲來逃避，漸漸變成習慣；開學後更沒時間陪妳，關心只剩訊息。我常復盤事件跟衝突，卻很少復盤自己給了多少關心。我總想著未來的美好，卻沒有處理當下的問題。
</p>
<p>
  我終於明白，我們對「安全感」的想法不同。對我來說，安全感是當下的確認；對妳來說，是長期的呵護與包容。我太急了，在最該給你空間和時間的時候，急到用自己的標準去要求妳，反而讓妳壓力更大，甚至回想起來，你也不斷的在提示我，甚至不斷的向我求助。
</p>
<p>
  這半年，我的許多行為並不符合妳的期待，讓妳感到越來越失落，甚至對我失去了信心。過去的經歷讓我習慣有所保留，也常因為想太多而感到焦慮，甚至對妳做出了自以為是的試探與挑戰。現在我才明白，這些擔憂與不安不該由妳來承擔，我的行為傷害了妳對我的信任，甚至強迫妳改變。
</p>
<p>
  對妳，我不該有任何保留。我應該完全地相信妳，也相信我們能一起變得更好，這才是通往幸福的路。如果有一天妳願意再次打開內心的防備，我希望自己已經成為一個站得穩、不再把重量壓在妳身上的人。
</p>
<p>
  我不會再急著說「補償」或「挽回」。我只想讓妳知道：
  我會在妳難過時跳支舞給妳看，在妳不舒服時煮粥給妳喝。妳想吃海鮮，我就去買大螃蟹；冬天最美的季節，我們一起去採最大最甜的草莓。情人節我會送妳一束花，每天睡前給妳一個吻。我畢生的夢想，就是守護好這樣的日常，直到永遠。
</p>
<p>
  我錯過了太多，我唯獨不想錯過的就是妳。無論未來我們是否還有機會再見面，我都希望妳能過得幸福快樂。
</p>
<p>
  我先站穩，先把自己過好，無論妳回不回來。
  這不是放棄，是我終於學會，用妳需要的方式，安靜地愛妳。
</p>
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
