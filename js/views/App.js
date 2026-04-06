import { ref, watch, onMounted, onUnmounted } from "vue";
import { TRIP_DATA } from "../data.js";
import {
  auth,
  db,
  appId,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
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
    let unsubscribeUser = null;
    let unsubscribeMessages = null;

    const isLetterUnlocked = ref(false);
    const passwordInput = ref("");
    const letterError = ref(false);
    const letterContent = ref("");

    // Message Board refs & functions
    const messages = ref([]);
    const newMessage = ref("");
    const editingMessageId = ref(null);
    const editMessageText = ref("");
    const messageAccessDenied = ref(false);

    const setupMessageListener = () => {
      if (!user.value || !isLetterUnlocked.value) {
        if (unsubscribeMessages) {
          unsubscribeMessages();
          unsubscribeMessages = null;
        }
        messages.value = [];
        return;
      }
      const messagesCol = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "messages",
      );
      unsubscribeMessages = onSnapshot(
        messagesCol,
        (snapshot) => {
          messageAccessDenied.value = false;
          const loaded = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          loaded.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          messages.value = loaded;
        },
        (err) => {
          console.error("Fetch messages error:", err);
          if (err.code === "permission-denied") {
            messageAccessDenied.value = true;
          }
        },
      );
    };

    watch([user, isLetterUnlocked], () => {
      setupMessageListener();
    });

    const addMessage = async () => {
      if (!newMessage.value.trim()) return;
      if (!user.value) return;
      try {
        const messagesCol = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "messages",
        );
        await addDoc(messagesCol, {
          text: newMessage.value,
          createdAt: Date.now(),
          author: user.value.displayName || "Unknown",
          uid: user.value.uid,
          photoURL: user.value.photoURL || "",
        });
        recordEvent(user.value, "add_message", { info: newMessage.value });
        newMessage.value = "";
      } catch (e) {
        console.error("Add message failed", e);
      }
    };

    const startEditMessage = (msg) => {
      editingMessageId.value = msg.id;
      editMessageText.value = msg.text;
    };

    const saveEditMessage = async (id) => {
      if (!editMessageText.value.trim()) return;
      try {
        const msgRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "messages",
          id,
        );
        await updateDoc(msgRef, {
          text: editMessageText.value,
          updatedAt: Date.now(),
        });
        recordEvent(user.value, "edit_message", {
          info: editMessageText.value,
        });
        editingMessageId.value = null;
        editMessageText.value = "";
      } catch (e) {
        console.error("Update message failed", e);
      }
    };

    const cancelEditMessage = () => {
      editingMessageId.value = null;
      editMessageText.value = "";
    };

    const deleteMessage = async (id) => {
      if (!confirm("確定要刪除這則留言嗎？")) return;
      try {
        const msgRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "messages",
          id,
        );
        await deleteDoc(msgRef);
        recordEvent(user.value, "delete_message", { info: id });
      } catch (e) {
        console.error("Delete message failed", e);
      }
    };

    const formatTime = (ts) => {
      if (!ts) return "";
      const d = new Date(ts);
      return d.toLocaleString("zh-TW", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // hash function for password check
    const sha256 = async (message) => {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
          if (user.value)
            recordEvent(user.value, "unlock_success", {
              info: "成功解鎖留言板與事件紀錄",
            });
        } else {
          letterError.value = true;
          setTimeout(() => {
            letterError.value = false;
          }, 2000);
          if (user.value)
            recordEvent(user.value, "unlock_fail", {
              info: `解鎖失敗（嘗試密碼：${passwordInput.value}）`,
            });
        }
      } catch (error) {
        console.error("Error fetching secure content", error);
        letterError.value = true;
        setTimeout(() => {
          letterError.value = false;
        }, 2000);
        if (user.value)
          recordEvent(user.value, "unlock_fail", { info: "解鎖過程發生錯誤" });
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
      unsubscribeUser = onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
      });
    });

    onUnmounted(() => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeMessages) unsubscribeMessages();
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
      messages,
      newMessage,
      editingMessageId,
      editMessageText,
      messageAccessDenied,
      addMessage,
      startEditMessage,
      saveEditMessage,
      cancelEditMessage,
      deleteMessage,
      formatTime,
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
        <!-- 留言板卡片 -->
        <div class="px-4">
          <div class="max-w-4xl mx-auto bg-white rounded-3xl p-6 md:p-8 mb-8 shadow-cartoon border-4 border-gray-100 relative overflow-hidden">
            <h2 class="text-xl font-bold text-sb-blue mb-4 flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              留言板
            </h2>

            <div class="py-12 text-center">
              <p class="text-gray-500 font-bold text-lg">此區域暫不開放</p>
            </div>

            <div v-if="false">
              <div v-if="!user" class="flex flex-col items-center justify-center py-6 space-y-4">
                <p class="text-gray-500 font-medium">請先登入以解鎖留言板與事件紀錄</p>
              <button @click="handleLogin" class="bg-sb-blue text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-400 transition-colors">
                Google 登入
              </button>
            </div>
            <div v-else-if="!isLetterUnlocked" class="flex flex-col items-center justify-center py-6 space-y-4">
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

            <div v-else class="relative z-10 animate-fade-in space-y-6">
              <div v-if="letterContent" class="text-gray-600 leading-relaxed text-sm md:text-base space-y-3 bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 shadow-inner" v-html="letterContent">
              </div>

              <!-- 動態留言板區塊 -->
              <div class="space-y-4 pt-4 border-t-2 border-gray-100">
                <h3 class="font-bold text-sb-blue flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
                  大家來留言
                </h3>
                
                <div v-if="messageAccessDenied" class="p-4 bg-red-50 text-red-500 rounded-xl font-bold text-center">
                  權限不足，無法讀取留言。
                </div>

                <div v-else class="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  <div v-if="messages.length === 0" class="text-center text-gray-400 py-6 font-bold text-sm bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    目前還沒有人留言喔！來當第一個吧 ✨
                  </div>
                  
                  <div v-for="msg in messages" :key="msg.id" class="p-4 rounded-2xl bg-white border-2 border-gray-100 shadow-sm flex flex-col gap-2 relative transition-all hover:border-sb-blue/30 group">
                    <div class="flex items-center gap-2">
                      <img v-if="msg.photoURL" :src="msg.photoURL" class="w-6 h-6 rounded-full border border-gray-200" alt="avatar" />
                      <div v-else class="w-6 h-6 rounded-full bg-sb-blue text-white flex items-center justify-center font-bold text-[10px]">
                        {{ msg.author?.charAt(0) || "U" }}
                      </div>
                      <span class="font-bold text-sm text-sb-brown">{{ msg.author }}</span>
                      <span class="text-[10px] text-gray-400 font-bold ml-auto">{{ formatTime(msg.createdAt) }}</span>
                      <span v-if="msg.updatedAt" class="text-[10px] text-gray-400" title="已編輯">(已編輯)</span>
                    </div>
                    
                    <div v-if="editingMessageId === msg.id" class="mt-2 flex flex-col gap-2 z-10">
                      <textarea v-model="editMessageText" class="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sb-blue resize-none h-24 font-medium text-gray-700"></textarea>
                      <div class="flex justify-end gap-2 mt-1">
                        <button @click="cancelEditMessage" class="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
                        <button @click="saveEditMessage(msg.id)" class="px-4 py-1.5 bg-sb-blue text-white rounded-lg text-xs font-bold hover:bg-blue-400 shadow-sm transition-colors">儲存</button>
                      </div>
                    </div>
                    <div v-else class="text-gray-700 text-sm whitespace-pre-wrap pl-8 font-medium">{{ msg.text }}</div>
                    
                    <!-- 編輯刪除按鈕，僅本人可見 -->
                    <div v-if="user && user.uid === msg.uid && editingMessageId !== msg.id" class="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button @click="startEditMessage(msg)" class="text-xs text-gray-400 hover:text-sb-blue font-bold px-2 py-1 rounded hover:bg-blue-50 transition-colors">編輯</button>
                      <button @click="deleteMessage(msg.id)" class="text-xs text-gray-400 hover:text-sb-red font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors">刪除</button>
                    </div>
                  </div>
                </div>

                <!-- 留言輸入區 -->
                <div class="mt-4 flex items-end gap-2 bg-white p-2 rounded-2xl border-2 border-gray-200 shadow-inner focus-within:border-sb-blue focus-within:ring-2 focus-within:ring-sb-blue/20 transition-all">
                  <textarea 
                    v-model="newMessage" 
                    placeholder="寫下你的留言..." 
                    class="flex-1 bg-transparent border-none px-3 py-2 text-sm focus:outline-none resize-none h-10 max-h-32 min-h-[40px] font-medium text-gray-700 block"
                    @keydown.enter.exact.prevent="addMessage"
                  ></textarea>
                  <button @click="addMessage" class="bg-sb-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-400 transition-colors shadow-sm text-sm shrink-0 mb-0.5">
                    送出
                  </button>
                </div>
                <div class="text-[10px] text-gray-400 text-right px-2">按 Enter 直接送出，Shift + Enter 換行</div>
              </div>
            </div>
            <!-- 結束暫時隱藏的留言板區塊 -->
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
          <EventLogView v-if="activeTab === 'eventLog'" :user="user" :is-unlocked="isLetterUnlocked" 
            :password-input="passwordInput"
            @update:password-input="passwordInput = $event"
            :letter-error="letterError"
            @unlock="handleLetterUnlock"
          />
        </div>
      </div>

      <div class="text-center py-12 text-white font-bold opacity-80 text-sm">
        <span>準備好去抓水母了嗎？ 🪼</span>
      </div>

      <BackgroundEffects />
    </div>
  `,
};
