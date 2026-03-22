import { Wallet } from '../components/Icons.js';

export default {
  props: {
    budget: { type: Array, required: true }
  },
  components: { Wallet },
  computed: {
    total() {
      return this.budget.reduce((sum, item) => sum + item.twd, 0);
    }
  },
  template: `
    <div class="max-w-4xl mx-auto px-4">
      <div class="bg-white rounded-[40px] shadow-cartoon border-4 border-white overflow-hidden">
        <div class="bg-sb-plankton p-6 border-b-4 border-white flex justify-between items-center">
          <h3 class="font-black text-white text-xl tracking-wider flex items-center">
            <span class="bg-white/20 p-2 rounded-xl mr-3">
              <Wallet class="w-6 h-6" />
            </span>
            <span>預估費用</span>
          </h3>
          <div class="text-white/80 text-sm font-bold bg-black/20 px-4 py-2 rounded-full">
            <span>蟹老闆會很開心 🦀</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-gray-400 text-xs font-black uppercase tracking-wider border-b-2 border-gray-100">
                <th class="px-8 py-5">
                  <span>項目</span>
                </th>
                <th class="px-8 py-5 text-right">
                  <span>金額 (TWD)</span>
                </th>
                <th class="px-8 py-5 pl-8">
                  <span>備註</span>
                </th>
              </tr>
            </thead>
            <tbody class="text-sm font-bold text-gray-600 divide-y-2 divide-gray-50/50">
              <tr v-for="(item, idx) in budget" :key="idx" class="hover:bg-green-50 transition-colors">
                <td class="px-8 py-5 text-gray-800">
                  <span>{{ item.item }}</span>
                </td>
                <td class="px-8 py-5 text-right font-mono font-black text-sb-plankton text-base">
                  <span>{{ item.twd.toLocaleString() }}</span>
                </td>
                <td class="px-8 py-5 pl-8 text-gray-400 text-xs">
                  <span>{{ item.note }}</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-green-50 border-t-4 border-green-100">
                <td class="px-8 py-6 font-black text-xl text-gray-800">
                  <span>總計預估</span>
                </td>
                <td class="px-8 py-6 text-right font-mono text-3xl font-black text-sb-plankton">
                  <span>{{ total.toLocaleString() }}</span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `
};
