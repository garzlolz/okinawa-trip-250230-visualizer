import { ref, watch, onUnmounted } from 'vue';
import { 
  db, 
  storage,
  appId, 
  collection, 
  addDoc,
  deleteDoc,
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from '../firebase.js';

export default {
  props: {
    user: { type: Object, default: null }
  },
  setup(props) {
    const albums = ref([]);
    const accessDenied = ref(false);
    let unsubscribe = null;
    
    // Upload state
    const description = ref("");
    const selectedFiles = ref([]);
    const isUploading = ref(false);
    const uploadProgress = ref(0);

    const setupListeners = () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (!props.user) return;

      const albumsCol = collection(db, "artifacts", appId, "public", "data", "albums");
      const q = query(albumsCol, orderBy("timestamp", "desc"));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        accessDenied.value = false;
        albums.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }, err => {
        console.error("Albums error:", err);
        if (err.code === 'permission-denied') {
          accessDenied.value = true;
        }
      });
    };

    watch(() => props.user, () => {
      setupListeners();
    });

    if (props.user) {
      setupListeners();
    }

    onUnmounted(() => {
      if (unsubscribe) unsubscribe();
    });

    const handleFileChange = (e) => {
      selectedFiles.value = Array.from(e.target.files);
    };

    const handleUpload = async () => {
      if (!props.user) return;
      if (selectedFiles.value.length === 0) return;
      
      isUploading.value = true;
      let totalFiles = selectedFiles.value.length;
      let completedFiles = 0;

      try {
        const uploads = selectedFiles.value.map(async (file) => {
          const timestamp = Date.now();
          const path = `albums/${appId}/${timestamp}_${file.name}`;
          const mRef = storageRef(storage, path);
          
          const uploadTask = uploadBytesResumable(mRef, file);
          
          return new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                // Here we might track progress per file, but to keep it simple we track average or just count
              },
              (error) => reject(error),
              async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                
                // Add to firestore
                const albumsCol = collection(db, "artifacts", appId, "public", "data", "albums");
                await addDoc(albumsCol, {
                  url: url,
                  storagePath: path,
                  author: props.user.displayName,
                  uid: props.user.uid,
                  description: description.value,
                  timestamp: timestamp
                });

                completedFiles++;
                uploadProgress.value = Math.round((completedFiles / totalFiles) * 100);
                resolve();
              }
            );
          });
        });

        await Promise.all(uploads);
        
        // Reset
        selectedFiles.value = [];
        description.value = "";
        uploadProgress.value = 0;
        document.getElementById('album-file-input').value = "";
      } catch (e) {
        console.error("Upload failed", e);
        if (e.code === "permission-denied") {
          alert("權限不足！");
        } else {
          alert("上傳失敗：" + e.message);
        }
      } finally {
        isUploading.value = false;
      }
    };

    const handleDelete = async (albumItem) => {
      if (!props.user || albumItem.uid !== props.user.uid) return;
      if (!confirm("確定要刪除這張照片嗎？")) return;

      try {
        // Delete from Storage
        if (albumItem.storagePath) {
          const sRef = storageRef(storage, albumItem.storagePath);
          await deleteObject(sRef);
        }
        
        // Delete from Firestore
        await deleteDoc(doc(db, "artifacts", appId, "public", "data", "albums", albumItem.id));
      } catch (e) {
        console.error("Delete failed", e);
        alert("刪除失敗：" + e.message);
      }
    };

    const formatDate = (timestamp) => {
      const d = new Date(timestamp);
      return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return {
      user: props.user,
      accessDenied,
      albums,
      description,
      selectedFiles,
      isUploading,
      uploadProgress,
      handleFileChange,
      handleUpload,
      handleDelete,
      formatDate
    };
  },
  template: `
    <div class="px-4 pb-12">
      <div v-if="!user" class="p-12 text-center text-gray-400 font-bold bg-white rounded-3xl shadow-cartoon border-4 border-gray-100">
        <p>請先由右上角登入 Google 帳號，再觀看相簿內容 📸</p>
      </div>

      <div v-else-if="accessDenied" class="p-12 text-center text-gray-400 font-bold bg-white rounded-3xl shadow-cartoon border-4 border-gray-100">
        <div class="mb-4 text-6xl">🔒</div>
        <p class="text-sb-red">權限不足，無法瀏覽或上傳相簿</p>
      </div>

      <div v-else class="space-y-6">
        <!-- 上傳區塊 -->
        <div class="bg-white rounded-3xl p-6 shadow-cartoon border-4 border-gray-100">
          <h2 class="text-xl font-bold text-sb-blue mb-4 flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            新增照片
          </h2>
          <div class="space-y-4">
            <input 
              type="file" 
              id="album-file-input"
              multiple 
              accept="image/*"
              @change="handleFileChange"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sb-blue file:text-white hover:file:bg-blue-400 cursor-pointer"
            >
            <input 
              type="text" 
              v-model="description" 
              placeholder="輸入這批照片的共同描述（選填）..."
              class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-sb-blue focus:outline-none"
            >
            <button 
              @click="handleUpload" 
              :disabled="selectedFiles.length === 0 || isUploading"
              class="w-full px-4 py-3 bg-sb-yellow text-sb-brown rounded-xl font-bold flex justify-center items-center shadow-cartoon-hover hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent"
            >
              <span v-if="isUploading">上傳中... {{ uploadProgress }}%</span>
              <span v-else>上傳 {{ selectedFiles.length > 0 ? selectedFiles.length + ' 張照片' : '' }}</span>
            </button>
          </div>
        </div>

        <!-- 照片牆 -->
        <div v-if="albums.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div v-for="item in albums" :key="item.id" class="bg-white rounded-2xl overflow-hidden shadow-cartoon border-4 border-gray-100 flex flex-col group">
            <div class="aspect-square bg-gray-100 relative">
              <img :src="item.url" class="w-full h-full object-cover" alt="Album photo">
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
              <div>
                <p v-if="item.description" class="text-gray-700 font-medium mb-2">{{ item.description }}</p>
                <div class="text-xs text-gray-400 flex justify-between items-center mt-2">
                  <span class="font-bold text-sb-blue">{{ item.author }}</span>
                  <span>{{ formatDate(item.timestamp) }}</span>
                </div>
              </div>
              <div v-if="user && item.uid === user.uid" class="mt-4 flex justify-end">
                <button 
                  @click="handleDelete(item)"
                  class="text-xs text-red-400 hover:text-red-600 font-bold px-3 py-1 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center text-gray-400 py-12 bg-white/50 rounded-3xl border-2 border-dashed border-gray-300">
          <div class="text-4xl mb-2">📸</div>
          <p>還沒有照片，來新增第一張吧！</p>
        </div>
      </div>
    </div>
  `
};
