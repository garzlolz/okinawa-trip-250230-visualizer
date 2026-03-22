import { Plane, Hotel, ArrowRight, Clock, MapPin, Info } from '../components/Icons.js';

export default {
  props: {
    flights: { type: Array, required: true },
    hotels: { type: Array, required: true }
  },
  components: {
    Plane, Hotel, ArrowRight, Clock, MapPin, Info
  },
  template: `
    <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
      <div class="bg-white rounded-[40px] shadow-cartoon border-4 border-white overflow-hidden relative">
        <div class="absolute top-0 right-0 p-6 opacity-10 rotate-12">
          <Plane class="w-24 h-24" />
        </div>
        <div class="bg-sb-blue p-6 border-b-4 border-white flex items-center">
          <div class="bg-white p-3 rounded-full shadow-md mr-4 text-sb-blue">
            <Plane class="w-6 h-6" />
          </div>
          <h3 class="font-black text-white text-xl tracking-wider">
            <span>航班資訊</span>
          </h3>
        </div>
        <div class="p-6 space-y-6">
          <div v-for="(flight, idx) in flights" :key="idx" class="bg-blue-50/50 p-5 rounded-3xl border-2 border-blue-100 hover:border-sb-blue transition-colors">
            <div class="flex justify-between items-center mb-4">
              <span class="text-xs font-black text-white bg-sb-blue px-3 py-1 rounded-full uppercase">
                <span>{{ flight.type }}</span>
              </span>
              <span class="font-mono font-black text-2xl text-sb-blue">
                <span>{{ flight.code }}</span>
              </span>
            </div>
            <div class="flex items-center justify-between text-gray-700 my-4">
              <div class="text-center w-1/3">
                <div class="text-3xl font-black">
                  <span>{{ flight.from }}</span>
                </div>
                <div class="text-xs font-bold text-gray-400 mt-1 bg-white px-2 py-0.5 rounded-full inline-block">
                  <span>出發</span>
                </div>
              </div>
              <div class="flex-1 flex justify-center text-sb-blue/30">
                <ArrowRight class="w-8 h-8" />
              </div>
              <div class="text-center w-1/3">
                <div class="text-3xl font-black">
                  <span>{{ flight.to }}</span>
                </div>
                <div class="text-xs font-bold text-gray-400 mt-1 bg-white px-2 py-0.5 rounded-full inline-block">
                  <span>抵達</span>
                </div>
              </div>
            </div>
            <div class="flex justify-between text-sm font-bold text-gray-500 pt-4 border-t-2 border-blue-100 border-dashed">
              <span class="flex items-center">
                <Clock class="w-4 h-4 mr-1" />
                <span class="font-mono">
                  <span>{{ flight.time }}</span>
                </span>
              </span>
              <span class="bg-white px-3 py-1 rounded-full border border-blue-100 text-sb-blue">
                <span>座位: </span>
                <span>{{ flight.seat }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-[40px] shadow-cartoon border-4 border-white overflow-hidden relative">
        <div class="absolute top-0 right-0 p-6 opacity-10 rotate-12">
          <Hotel class="w-24 h-24" />
        </div>
        <div class="bg-sb-pink p-6 border-b-4 border-white flex items-center">
          <div class="bg-white p-3 rounded-full shadow-md mr-4 text-sb-pink">
            <Hotel class="w-6 h-6" />
          </div>
          <h3 class="font-black text-white text-xl tracking-wider">
            <span>住宿安排</span>
          </h3>
        </div>
        <div class="p-6 space-y-4">
          <div v-for="(hotel, idx) in hotels" :key="idx" class="group p-5 rounded-3xl border-2 border-transparent hover:bg-orange-50 hover:border-orange-100 transition-all">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-bold text-white bg-sb-pink px-3 py-1 rounded-full">
                <span>{{ hotel.date }}</span>
              </span>
              <span class="font-mono text-lg font-black text-sb-brown">
                <span>¥</span>
                <span>{{ hotel.price }}</span>
              </span>
            </div>
            <h4 class="font-black text-gray-800 text-lg mb-2 group-hover:text-sb-pink transition-colors">
              <span>{{ hotel.name }}</span>
            </h4>
            <div class="flex flex-col gap-2 text-sm font-bold text-gray-500">
              <div class="flex items-center">
                <span class="mr-2 text-gray-300">
                  <MapPin class="w-4 h-4" />
                </span>
                <span>{{ hotel.area }}</span>
              </div>
              <div v-if="hotel.note" class="flex items-center text-xs text-gray-400 bg-gray-50 p-2 rounded-xl border border-gray-100">
                <span class="mr-2">
                  <Info class="w-3 h-3" />
                </span>
                <span>{{ hotel.note }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
