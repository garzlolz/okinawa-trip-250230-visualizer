import { ref, watch, onMounted, onUnmounted } from 'vue';
import { CheckSquare, Plus, Trash } from '../components/Icons.js';
import { 
  db, appId, collection, addDoc, doc, updateDoc,
  deleteDoc, onSnapshot, auth, signInWithPopup, googleProvider 
} from '../firebase.js';

export default {
  props: {
    user: { type: Object, default: null }
  },
  components: { CheckSquare, Plus, Trash },
  setup(props) {
    const todos = ref([]);
    const input = ref("");
    let unsubscribe = null;

    const handleLogin = async () => {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (error) {
        console.error("Login failed:", error);
      }
    };

    const setupListener = () => {
      if (!props.user) {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        todos.value = [];
        return;
      }
      const todosCol = collection(db, "artifacts", appId, "public", "data", "todos");
      unsubscribe = onSnapshot(todosCol, (snapshot) => {
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loaded.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        todos.value = loaded;
      }, (err) => {
        console.error("Fetch todos error:", err);
      });
    };

    watch(() => props.user, () => {
      setupListener();
    });

    onMounted(() => {
      setupListener();
    });

    onUnmounted(() => {
      if (unsubscribe) unsubscribe();
    });

    const addTodo = async () => {
      if (!input.value.trim()) return;
      if (!props.user) {
        alert("請先登入才能新增項目！");
        return;
      }
      try {
        const todosCol = collection(db, "artifacts", appId, "public", "data", "todos");
        await addDoc(todosCol, {
          text: input.value,
          done: false,
          createdAt: Date.now(),
          author: props.user.displayName,
          uid: props.user.uid,
        });
        input.value = "";
      } catch (e) {
        console.error("Add failed", e);
      }
    };

    const toggleTodo = async (id, currentStatus) => {
      try {
        const todoRef = doc(db, "artifacts", appId, "public", "data", "todos", id);
        await updateDoc(todoRef, { done: !currentStatus });
      } catch (e) {
        console.error(e);
      }
    };

    const deleteTodo = async (id) => {
      try {
        const todoRef = doc(db, "artifacts", appId, "public", "data", "todos", id);
        await deleteDoc(todoRef);
      } catch (e) {
        console.error(e);
      }
    };

    return {
      todos, input, handleLogin, addTodo, toggleTodo, deleteTodo
    };
  },
  template: `
    <div class="max-w-2xl mx-auto px-4">
      <div class="bg-white rounded-[40px] shadow-cartoon border-4 border-white overflow-hidden">
        <div class="bg-sb-teal p-6 border-b-4 border-white flex justify-between items-center">
          <h3 class="font-black text-white text-xl tracking-wider flex items-center">
            <span class="bg-white/20 p-2 rounded-xl mr-3"><CheckSquare class="w-6 h-6" /></span>
            <span>行前準備清單</span>
          </h3>
        </div>

        <div v-if="!user" class="p-12 text-center text-gray-400 font-bold bg-gray-50">
          <div class="mb-4 text-6xl">🔒</div>
          <p>請先登入 Google 帳號</p>
          <p class="text-sm opacity-70 mt-2 mb-4">才能查看與編輯共同清單喔！</p>
          <button @click="handleLogin" class="bg-white text-sb-teal px-4 py-2 rounded-full font-bold text-sm shadow-sm border-2 border-gray-100 hover:bg-gray-50 transition-colors">
            立即登入
          </button>
        </div>

        <div v-else class="p-6">
          <div class="flex gap-2 mb-6">
            <input type="text" v-model="input" @keyup.enter="addTodo" placeholder="新增待辦事項..." class="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:border-sb-teal focus:ring-2 focus:ring-sb-teal/20" />
            <button @click="addTodo" class="bg-sb-teal text-white px-4 rounded-xl font-bold border-2 border-white shadow-sm hover:bg-teal-500 transition-colors">
              <Plus class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-3">
            <div v-if="todos.length === 0" class="text-center text-gray-400 py-8 font-bold">
              <span>清單目前是空的 ✨</span>
            </div>
            <div v-for="todo in todos" :key="todo.id" :class="['flex items-center justify-between p-4 rounded-2xl border-2 transition-all', todo.done ? 'bg-gray-50 border-gray-100' : 'bg-white border-sb-blue/20 hover:border-sb-blue']">
              <div class="flex items-center gap-3 flex-1 cursor-pointer" @click="toggleTodo(todo.id, todo.done)">
                <div :class="['w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors', todo.done ? 'bg-sb-teal border-sb-teal text-white' : 'border-gray-300 bg-white']">
                  <CheckSquare v-if="todo.done" class="w-4 h-4" />
                </div>
                <div class="flex flex-col">
                  <span :class="['font-bold text-lg transition-all', todo.done ? 'text-gray-400 line-through' : 'text-gray-700']">{{ todo.text }}</span>
                  <span v-if="todo.author" class="text-[10px] text-gray-400 font-bold">by {{ todo.author }}</span>
                </div>
              </div>
              <button @click="deleteTodo(todo.id)" class="text-gray-400 hover:text-sb-red p-2 rounded-lg hover:bg-red-50 transition-colors">
                <Trash class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
