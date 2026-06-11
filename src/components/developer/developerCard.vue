<template>
	<div class="bg-white p-6 rounded-[15px] shadow-lg  w-full hover:shadow-[0_10px_15px_rgba(2,5,5.1,0.3)] transition-shadow">

		<!-- Profile -->
		<div class="flex items-center gap-4 mb-4 ">

			<img :src="dev.image_url || placeholder" class="w-16 h-16 rounded-full object-cover"/>
			<div>
				<h2 class="font-bold text-lg">{{ dev.name }}</h2>
				<span class="bg-[#41BE0126] text-[#41BE01] text-xs font-semibold px-2 py-1 rounded">Active</span>
			</div>
		</div>

		<!-- Contact info -->
		<div class="grid mt-10 break-all text-[clamp(1rem,1vw,1.5rem)] grid-cols-1 md:grid-cols-2 px-1 gap-2 mb-4 text-gray-700">
		<div class="flex items-center gap-2"> <PhoneIcon /> {{ dev.phone }}</div>
		<div class="flex items-center gap-2"> <MailIcon /> {{ dev.email }}</div>
		<div class="flex items-center gap-2"> <MapPinIcon /> {{ dev.location }}</div>
		<div class="flex items-start gap-2">
			<div v-html="dev.hours" class="leading-tight">
			</div>
		</div>
		</div>

		<!-- Recent Projects -->
		<div class="mb-4">
		<p class="font-semibold text-sm mb-1"></p>
		<div class="flex gap-2 flex-wrap">
			<!-- <span v-for="(project, i) in developer.projects" :key="i" class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">{{ project }}
			</span> -->
		</div>
		</div>

		<!-- buttons -->
		<div class="flex gap-2 items-end justify-end">
			<button class="text-[clamp(0.75rem,2vw,1rem)] md:h-9 md:w-27 h-max-[36px] w-max-[108px]  border border-[#B4AFAF] rounded-[5px] px-4 py-2 hover:bg-gray-100 flex items-center gap-2 justify-center" >
				Edit
			</button>
			<button class="text-[clamp(0.75rem,2vw,1rem)] w-max-[121px] md:h-9 md:w-30.25 bg-maurealty-blue text-white rounded-[5px] px-4 py-2 hover:bg-[#045fa3] flex items-center gap-2 justify-center">
				Contact
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { type Developer } from '@/assets/classes/developers';
import placeholder from '@/assets/images/default_placeholder.png'
import { PhoneIcon, MailIcon, MapPinIcon } from 'lucide-vue-next';

const props = defineProps<{ dev: Developer }>()

console.log("Dev_ID: " + props.dev.dev_ID + "\nImg_Url: " + props.dev.image_url + "\nName: " + props.dev.name + "\nPhone: " + props.dev.phone + "\nEmail: " + props.dev.email + "\nLocation: " + props.dev.location + "\nHours: " + props.dev.hours);
</script>