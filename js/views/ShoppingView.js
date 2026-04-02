import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ShoppingBag, MapPin, Sort, Plus, CheckSquare, Edit, Trash, Image as ImageIcon, X } from '../components/Icons.js';
import { 
  db, appId, collection, addDoc, doc, updateDoc,
  deleteDoc, onSnapshot, auth, signInWithPopup, googleProvider,
  recordEvent
} from '../firebase.js';
import { compressImage } from '../utils.js';

export default {
  props: {
    user: { type: Object, default: null }
  },
  components: {
    ShoppingBag, MapPin, Sort, Plus, CheckSquare, Edit, Trash, ImageIcon, X
  },
  setup(props) {
    const accessDenied = ref(false);
    const items = ref([]);
    const name = ref("");
    const location = ref("");
    const price = ref("");
    const imageFile = ref(null);
    const previewUrl = ref(null);
    const fileInputRef = ref(null);
    
    const uploading = ref(false);
    const editingId = ref(null);
    const showModal = ref(false);
    const sortType = ref("date_desc");
    
    // Locations
    const locations = ref([]);
    const newLocation = ref("");
    const showLocationManager = ref(false);
    
    // Tabs & Filter
    const activeShoppingTab = ref("unpurchased");
    const filterLocation = ref("");
    
    let itemsUnsubscribe = null;
    let locationsUnsubscribe = null;

    const handleLogin = async () => {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (error) {
        console.error("Login failed:", error);
      }
    };

    const setupListeners = () => {
      if (!props.user) {
        if (itemsUnsubscribe) { itemsUnsubscribe(); itemsUnsubscribe = null; }
        if (locationsUnsubscribe) { locationsUnsubscribe(); locationsUnsubscribe = null; }
        items.value = [];
        locations.value = [];
        return;
      }
      
      const locCol = collection(db, "artifacts", appId, "public", "data", "shopping_locations");
      locationsUnsubscribe = onSnapshot(locCol, (snapshot) => {
        accessDenied.value = false;
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loaded.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        locations.value = loaded;
      }, err => {
        console.error("Loc err:", err);
        if (err.code === 'permission-denied') {
          accessDenied.value = true;
        }
      });
      
      const itemsCol = collection(db, "artifacts", appId, "public", "data", "shopping_items");
      itemsUnsubscribe = onSnapshot(itemsCol, (snapshot) => {
        accessDenied.value = false;
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        items.value = loaded;
      }, err => {
        console.error("Items err:", err);
        if (err.code === 'permission-denied') {
          accessDenied.value = true;
        }
      });
    };

    watch(() => props.user, () => {
      setupListeners();
    });

    onMounted(() => {
      setupListeners();
    });

    onUnmounted(() => {
      if (itemsUnsubscribe) itemsUnsubscribe();
      if (locationsUnsubscribe) locationsUnsubscribe();
    });

    const sortedItems = computed(() => {
      let result = [...items.value];
      if (filterLocation.value) {
        result = result.filter(item => item.location === filterLocation.value);
      }
      return result.sort((a, b) => {
        switch (sortType.value) {
          case "price_desc": return (b.price || 0) - (a.price || 0);
          case "price_asc":  return (a.price || 0) - (b.price || 0);
          case "date_asc":   return (a.createdAt || 0) - (b.createdAt || 0);
          case "date_desc":
          default:           return (b.createdAt || 0) - (a.createdAt || 0);
        }
      });
    });

    const unpurchasedItems = computed(() => sortedItems.value.filter(i => !i.bought));
    const purchasedItems = computed(() => sortedItems.value.filter(i => i.bought));

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          previewUrl.value = reader.result;
        };
        reader.readAsDataURL(file);
        imageFile.value = file;
      }
    };

    const handleAddLocation = async () => {
      if (!newLocation.value.trim()) return;
      if (!props.user) {
        alert("請先登入才能新增購買地點！"); return;
      }
      try {
        const locCol = collection(db, "artifacts", appId, "public", "data", "shopping_locations");
        await addDoc(locCol, {
          name: newLocation.value.trim(),
          createdAt: Date.now(),
          author: props.user.displayName,
          uid: props.user.uid,
        });
        recordEvent(props.user, "add_shopping_location", { info: newLocation.value.trim() });
        newLocation.value = "";
      } catch (e) {
        console.error("Add location failed:", e);
        alert("新增地點失敗: " + e.message);
      }
    };

    const handleDeleteLocation = async (id) => {
      if (!confirm("確定要刪除這個購買地點嗎？")) return;
      try {
        const locName = locations.value.find(l => l.id === id)?.name || id;
        const locRef = doc(db, "artifacts", appId, "public", "data", "shopping_locations", id);
        await deleteDoc(locRef);
        recordEvent(props.user, "delete_shopping_location", { info: locName });
      } catch (e) {
        alert("刪除地點失敗: " + e.message);
      }
    };

    const handleAddNew = () => {
      editingId.value = null;
      name.value = "";
      location.value = "";
      price.value = "";
      previewUrl.value = null;
      imageFile.value = null;
      if (fileInputRef.value) fileInputRef.value.value = "";
      showModal.value = true;
    };

    const handleEditClick = (item) => {
      editingId.value = item.id;
      name.value = item.name;
      location.value = item.location || "";
      price.value = item.price || "";
      previewUrl.value = item.image || null;
      imageFile.value = null;
      showModal.value = true;
    };

    const handleCloseModal = () => {
      showModal.value = false;
      editingId.value = null;
      name.value = "";
      location.value = "";
      price.value = "";
      previewUrl.value = null;
      imageFile.value = null;
      if (fileInputRef.value) fileInputRef.value.value = "";
    };

    const handleSaveItem = async () => {
      if (!name.value.trim()) return;
      if (!props.user) { alert("請先登入才能操作購物項目！"); return; }

      uploading.value = true;
      try {
        let imageBase64 = null;
        if (imageFile.value) {
          imageBase64 = await compressImage(imageFile.value);
        }

        const updateData = {
          name: name.value,
          location: location.value,
          price: price.value ? Number(price.value) : 0,
        };

        if (editingId.value) {
          const itemRef = doc(db, "artifacts", appId, "public", "data", "shopping_items", editingId.value);
          if (imageBase64) updateData.image = imageBase64;
          await updateDoc(itemRef, updateData);
          recordEvent(props.user, "edit_shopping_item", { info: updateData.name });
        } else {
          const itemsCol = collection(db, "artifacts", appId, "public", "data", "shopping_items");
          updateData.image = imageBase64;
          updateData.bought = false;
          updateData.createdAt = Date.now();
          updateData.author = props.user.displayName;
          updateData.uid = props.user.uid;
          await addDoc(itemsCol, updateData);
          recordEvent(props.user, "add_shopping_item", { info: updateData.name });
        }

        handleCloseModal();
      } catch (e) {
        console.error("Save failed", e);
        if (e.code === "permission-denied") {
          alert("權限不足！");
        } else if (e.code === "resource-exhausted" || e.message.includes("size")) {
          alert("圖片太大了，即使壓縮後仍超過限制，請換張小一點的圖！");
        } else {
          alert("操作失敗: " + e.message);
        }
      } finally {
        uploading.value = false;
      }
    };

    const toggleItem = async (id, currentStatus) => {
      try {
        const itemName = items.value.find(i => i.id === id)?.name || id;
        const itemRef = doc(db, "artifacts", appId, "public", "data", "shopping_items", id);
        await updateDoc(itemRef, { bought: !currentStatus });
        recordEvent(props.user, "toggle_shopping_item", { info: itemName, status: (!currentStatus ? '已買' : '未買') });
      } catch (e) { console.error(e); }
    };

    const deleteItem = async (id) => {
      if (!confirm("確定要刪除這個項目嗎？")) return;
      try {
        const itemName = items.value.find(i => i.id === id)?.name || id;
        const itemRef = doc(db, "artifacts", appId, "public", "data", "shopping_items", id);
        await deleteDoc(itemRef);
        recordEvent(props.user, "delete_shopping_item", { info: itemName });
      } catch (e) { console.error(e); }
    };

    const formatDate = (timestamp) => {
      if (!timestamp) return "";
      return new Date(timestamp).toLocaleString("zh-TW", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false
      });
    };

    return {
      accessDenied, items, sortedItems, unpurchasedItems, purchasedItems,
      name, location, price, newLocation, locations,
      filterLocation, sortType, activeShoppingTab,
      showModal, showLocationManager, uploading, editingId,
      previewUrl, imageFile, fileInputRef,
      handleLogin, handleAddLocation, handleDeleteLocation,
      handleAddNew, handleEditClick, handleCloseModal, handleSaveItem,
      toggleItem, deleteItem, handleFileChange, formatDate
    };
  },
  template: `
    <div class="max-w-3xl mx-auto px-4">
      <div class="bg-white rounded-[40px] shadow-cartoon border-4 border-white overflow-hidden">
        <div class="bg-sb-purple p-6 border-b-4 border-white flex justify-between items-center">
          <h3 class="font-black text-white text-xl tracking-wider flex items-center">
            <span class="bg-white/20 p-2 rounded-xl mr-3"><ShoppingBag class="w-6 h-6" /></span>
            <span>購物清單</span>
          </h3>
        </div>

        <div v-if="!user" class="p-12 text-center text-gray-400 font-bold bg-gray-50">
          <div class="mb-4 text-6xl">🔒</div>
          <p>請先登入 Google 帳號</p>
          <p class="text-sm opacity-70 mt-2 mb-4">才能新增與查看購物願望清單！</p>
          <button @click="handleLogin" class="bg-white text-sb-purple px-4 py-2 rounded-full font-bold text-sm shadow-sm border-2 border-gray-100 hover:bg-gray-50 transition-colors">
            立即登入
          </button>
        </div>

        <div v-else-if="accessDenied" class="p-12 text-center text-gray-400 font-bold bg-gray-50">
          <div class="mb-4 text-6xl">🔒</div>
          <p class="text-sb-red">權限不足</p>
          <p class="text-sm opacity-70 mt-2">非管理員權限，無法查看與編輯內容喔！</p>
        </div>

        <div v-else class="p-6">
          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <button @click="handleAddNew" class="flex-1 py-3 rounded-2xl border-4 border-dashed border-sb-purple/30 text-sb-purple font-black text-lg hover:bg-purple-50 hover:border-sb-purple transition-all flex items-center justify-center gap-2">
              <Plus class="w-6 h-6" />
              <span>新增購物願望</span>
            </button>

            <div class="flex flex-col sm:flex-row gap-2">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><MapPin class="w-5 h-5" /></div>
                <select v-model="filterLocation" class="pl-10 pr-8 py-3 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-600 focus:outline-none focus:border-sb-purple hover:border-gray-300 appearance-none h-full w-full sm:w-auto cursor-pointer">
                  <option value="">全部地點</option>
                  <option v-for="loc in locations" :key="loc.id" :value="loc.name">{{ loc.name }}</option>
                </select>
              </div>

              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Sort class="w-5 h-5" /></div>
                <select v-model="sortType" class="pl-10 pr-8 py-3 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-600 focus:outline-none focus:border-sb-purple hover:border-gray-300 appearance-none h-full w-full sm:w-auto cursor-pointer">
                  <option value="date_desc">依新增時間新到舊</option>
                  <option value="date_asc">依新增時間舊到新</option>
                  <option value="price_desc">依金額大到小</option>
                  <option value="price_asc">依金額小到大</option>
                </select>
              </div>
            </div>
          </div>

          <div class="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button @click="activeShoppingTab = 'unpurchased'" :class="['flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2', activeShoppingTab === 'unpurchased' ? 'bg-white text-sb-purple shadow-sm' : 'text-gray-400 hover:text-gray-600']">
              <ShoppingBag class="w-4 h-4" />
              <span>未購買 ({{ unpurchasedItems.length }})</span>
            </button>
            <button @click="activeShoppingTab = 'purchased'" :class="['flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2', activeShoppingTab === 'purchased' ? 'bg-white text-sb-purple shadow-sm' : 'text-gray-400 hover:text-gray-600']">
              <CheckSquare class="w-4 h-4" />
              <span>已購買 ({{ purchasedItems.length }})</span>
            </button>
          </div>

          <div class="space-y-4">
            <div v-if="items.length === 0" class="text-center text-gray-400 py-8 font-bold">
              <span>還沒有想買的東西嗎？快點新增！ 🛍️</span>
            </div>

            <!-- 未購買區塊 -->
            <div v-show="activeShoppingTab === 'unpurchased'" class="space-y-4">
              <div v-if="unpurchasedItems.length === 0 && items.length > 0" class="text-center text-gray-400 py-8 font-bold">
                <span>太棒了！所有東西都買齊了 🎉</span>
              </div>
              <div v-for="item in unpurchasedItems" :key="item.id" class="relative flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border-2 transition-all bg-white border-sb-purple/20 hover:border-sb-purple">
                <div v-if="item.image" class="w-full sm:w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-100 shrink-0 bg-gray-100 flex items-center justify-center">
                  <img :src="item.image" :alt="item.name" class="max-w-full max-h-full object-contain" />
                </div>
                <div class="flex-1 flex flex-col justify-between">
                  <div>
                    <div class="flex justify-between items-start">
                      <h4 class="text-lg font-black text-gray-800">{{ item.name }}</h4>
                      <span v-if="item.author" class="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md font-bold">by {{ item.author }}</span>
                    </div>
                    <div class="flex flex-col gap-1 mt-1">
                      <div v-if="item.location" class="flex items-center text-sm text-gray-500 font-bold">
                        <MapPin class="w-4 h-4 mr-1" />
                        <span>{{ item.location }}</span>
                      </div>
                      <div v-if="item.price > 0" class="flex items-center text-sm text-sb-plankton font-bold">
                        <span class="mr-1">¥</span>
                        <span>{{ item.price.toLocaleString() }}</span>
                      </div>
                      <div v-if="item.createdAt" class="text-xs text-gray-400 font-bold mt-0.5">
                        建立時間：{{ formatDate(item.createdAt) }}
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-between items-end mt-4 sm:mt-0 gap-2">
                    <button @click="toggleItem(item.id, item.bought)" class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm border-2 transition-all bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200">
                      <CheckSquare class="w-4 h-4" />
                      <span>標記已買</span>
                    </button>
                    <div class="flex items-center gap-1">
                      <button @click="handleEditClick(item)" class="p-2 rounded-lg transition-colors text-gray-400 hover:text-sb-blue hover:bg-blue-50" title="編輯">
                        <Edit class="w-5 h-5" />
                      </button>
                      <button @click="deleteItem(item.id)" class="text-gray-300 hover:text-sb-red p-2 rounded-lg hover:bg-red-50 transition-colors" title="刪除">
                        <Trash class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 已購買區塊 -->
            <div v-show="activeShoppingTab === 'purchased'" class="space-y-4">
              <div v-if="purchasedItems.length === 0 && items.length > 0" class="text-center text-gray-400 py-8 font-bold">
                <span>還沒有購買任何東西 🛒</span>
              </div>
              <div v-for="item in purchasedItems" :key="item.id" class="relative flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border-2 transition-all bg-gray-50 border-gray-100 opacity-70">
                <div v-if="item.image" class="w-full sm:w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-100 shrink-0 bg-gray-100 flex items-center justify-center">
                  <img :src="item.image" :alt="item.name" class="max-w-full max-h-full object-contain grayscale" />
                </div>
                <div class="flex-1 flex flex-col justify-between">
                  <div>
                    <div class="flex justify-between items-start">
                      <h4 class="text-lg font-black text-gray-400 line-through">{{ item.name }}</h4>
                      <span v-if="item.author" class="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md font-bold">by {{ item.author }}</span>
                    </div>
                    <div class="flex flex-col gap-1 mt-1">
                      <div v-if="item.location" class="flex items-center text-sm text-gray-400 font-bold">
                        <MapPin class="w-4 h-4 mr-1" />
                        <span>{{ item.location }}</span>
                      </div>
                      <div v-if="item.price > 0" class="flex items-center text-sm text-gray-400 font-bold">
                        <span class="mr-1">¥</span>
                        <span>{{ item.price.toLocaleString() }}</span>
                      </div>
                      <div v-if="item.createdAt" class="text-xs text-gray-400 font-bold mt-0.5">
                        建立時間：{{ formatDate(item.createdAt) }}
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-between items-end mt-4 sm:mt-0 gap-2">
                    <button @click="toggleItem(item.id, item.bought)" class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm border-2 transition-all bg-green-100 text-green-600 border-green-200">
                      <CheckSquare class="w-4 h-4" />
                      <span>已購買</span>
                    </button>
                    <div class="flex items-center gap-1">
                      <button @click="handleEditClick(item)" class="p-2 rounded-lg transition-colors text-gray-400 hover:text-sb-blue hover:bg-blue-50" title="編輯">
                        <Edit class="w-5 h-5" />
                      </button>
                      <button @click="deleteItem(item.id)" class="text-gray-300 hover:text-sb-red p-2 rounded-lg hover:bg-red-50 transition-colors" title="刪除">
                        <Trash class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="handleCloseModal"></div>
        <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
          <div class="bg-sb-purple p-4 flex justify-between items-center shrink-0">
            <h3 class="font-black text-white text-lg flex items-center">
               <template v-if="editingId"><Edit class="w-5 h-5 mr-2" /><span>編輯項目</span></template>
               <template v-else><Plus class="w-5 h-5 mr-2" /><span>新增項目</span></template>
            </h3>
            <button @click="handleCloseModal" class="text-white hover:bg-white/20 p-2 rounded-full transition-colors"><X class="w-5 h-5" /></button>
          </div>
          
          <div class="p-6 overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="col-span-1 md:col-span-2">
                <label class="block text-xs font-bold text-gray-400 mb-1 ml-1">商品名稱</label>
                <input type="text" v-model="name" placeholder="例如：沖繩黑糖、風獅爺" class="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2 font-bold text-gray-700 focus:outline-none focus:border-sb-purple" />
              </div>
              <div class="col-span-1">
                <div class="flex justify-between items-center mb-1 ml-1">
                  <label class="block text-xs font-bold text-gray-400">購買地點 (選填)</label>
                  <button type="button" @click="showLocationManager = true" class="text-xs font-bold text-sb-purple hover:text-purple-400 transition-colors">管理地點</button>
                </div>
                <select v-model="location" class="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2 font-bold text-gray-700 focus:outline-none focus:border-sb-purple appearance-none cursor-pointer">
                  <option value="">請選擇購買地點</option>
                  <option v-for="loc in locations" :key="loc.id" :value="loc.name">{{ loc.name }}</option>
                </select>
              </div>
              <div class="col-span-1">
                <label class="block text-xs font-bold text-gray-400 mb-1 ml-1">預估金額 (選填)</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
                  <input type="number" v-model="price" placeholder="0" class="w-full bg-white border-2 border-gray-200 rounded-xl pl-8 pr-4 py-2 font-bold text-gray-700 focus:outline-none focus:border-sb-purple" />
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <div class="flex-1">
                  <label for="modal-image-upload" class="flex items-center justify-center gap-2 w-full bg-white border-2 border-dashed border-sb-purple/50 text-sb-purple py-3 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors">
                    <ImageIcon class="w-5 h-5" />
                    <span class="font-bold text-sm">{{ imageFile ? '已選擇新圖片' : (editingId && previewUrl ? '更換現有圖片' : '上傳參考圖片') }}</span>
                  </label>
                  <input id="modal-image-upload" type="file" accept="image/*" ref="fileInputRef" @change="handleFileChange" class="hidden" />
                </div>
              </div>

              <div v-if="previewUrl" class="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center">
                <img :src="previewUrl" class="max-w-full max-h-full object-contain" alt="Preview" />
                <button @click="previewUrl = null; imageFile = null; if (fileInputRef) fileInputRef.value = '';" class="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors" title="移除圖片">
                  <X class="w-4 h-4" />
                </button>
              </div>

              <button @click="handleSaveItem" :disabled="uploading || !name.trim()" :class="['w-full py-3 rounded-xl font-bold border-2 border-white shadow-sm flex items-center justify-center gap-2 text-white transition-colors mt-2', (uploading || !name.trim()) ? 'bg-gray-300 cursor-not-allowed' : 'bg-sb-purple hover:bg-purple-400']">
                <span v-if="uploading">處理中...</span>
                <template v-else>
                  <CheckSquare v-if="editingId" class="w-5 h-5" /><Plus v-else class="w-5 h-5" />
                  <span>{{ editingId ? '儲存變更' : '新增項目' }}</span>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Location Manager -->
      <div v-if="showLocationManager" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="showLocationManager = false"></div>
        <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-fade-in flex flex-col max-h-[80vh]">
          <div class="bg-sb-blue p-4 flex justify-between items-center shrink-0">
            <h3 class="font-black text-white text-lg flex items-center">
              <MapPin class="w-5 h-5 mr-2" /><span>管理購買地點</span>
            </h3>
            <button @click="showLocationManager = false" class="text-white hover:bg-white/20 p-2 rounded-full transition-colors"><X class="w-5 h-5" /></button>
          </div>
          
          <div class="p-6 overflow-y-auto">
            <div class="flex gap-2 mb-4">
              <input type="text" v-model="newLocation" @keyup.enter="handleAddLocation" placeholder="輸入新的購買地點..." class="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2 font-bold text-gray-700 focus:outline-none focus:border-sb-blue" />
              <button @click="handleAddLocation" class="bg-sb-blue text-white px-4 rounded-xl font-bold border-2 border-white shadow-sm hover:bg-blue-500 transition-colors"><Plus class="w-5 h-5" /></button>
            </div>
            <div class="space-y-2">
              <div v-if="locations.length === 0" class="text-center text-gray-400 py-8 font-bold">
                <div class="text-4xl mb-2">📍</div><span>尚未新增任何購買地點</span>
              </div>
              <div v-for="loc in locations" :key="loc.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border-2 border-gray-100 hover:border-sb-blue transition-colors">
                <div class="flex items-center gap-2">
                  <MapPin class="w-4 h-4 text-sb-blue" />
                  <span class="font-bold text-gray-700">{{ loc.name }}</span>
                </div>
                <button @click="handleDeleteLocation(loc.id)" class="text-gray-300 hover:text-sb-red p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="刪除"><Trash class="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
